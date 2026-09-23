import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService, Prisma } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { UserHierarchyService } from './user-hierarchy.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { InviteUserResponseDto } from './dto/invite-user-response.dto';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { generateSecureToken, hashToken } from '../common/utils/token.util';
import { RoleCode } from '../common/constants/role.constants';
import {
  ACTIVATION_TOKEN_TTL_HOURS,
  UserStatus,
  UserTokenStatus,
  UserTokenType,
} from '../common/constants/user-token.constants';

const USER_PUBLIC_SELECT = {
  id: true,
  email: true,
  name: true,
  phone: true,
  status: true,
  organizationId: true,
  residentialComplexId: true,
  documentNumber: true,
  createdAt: true,
  role: {
    select: { id: true, code: true, name: true },
  },
  documentType: {
    select: { id: true, code: true, description: true },
  },
} as const;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly userHierarchy: UserHierarchyService,
  ) {}

  /**
   * Obtiene la lista de usuarios acotada estrictamente por el ámbito (scope) del solicitante.
   */
  findAll(requester: JwtPayload) {
    return this.prisma.user.findMany({
      where: this.scopeWhereClause(requester),
      select: USER_PUBLIC_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Obtiene un usuario específico garantizando el aislamiento de ámbito multi-tenant.
   */
  async findOne(requester: JwtPayload, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, ...this.scopeWhereClause(requester) },
      select: USER_PUBLIC_SELECT,
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  /**
   * Ejecuta el flujo transaccional de invitación de usuario.
   * - Registra el usuario en estado PENDING y su token hasheado dentro de una transacción de BD.
   * - Envía el correo electrónico de activación.
   * - En caso de fallo en el proveedor de correo, realiza una eliminación compensatoria del usuario
   *   para evitar registros "fantasma" y bloqueos por duplicidad de email en intentos posteriores.
   */
  async inviteUser(dto: InviteUserDto, requester: JwtPayload): Promise<InviteUserResponseDto> {
    const rawToken = generateSecureToken();
    const cleanEmail = dto.email.toLowerCase().trim();

    // 1. Transacción de Persistencia en Base de Datos
    const newUser = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const hierarchy = await this.userHierarchy.resolve(
        {
          roleId: dto.roleId,
          organizationId: dto.organizationId,
          residentialComplexId: dto.residentialComplexId,
        },
        tx,
      );

      this.userHierarchy.assertRequesterCanAssign(requester, hierarchy);

      const existingUser = await tx.user.findUnique({
        where: { email: cleanEmail },
      });

      if (existingUser) {
        throw new ConflictException('Ya existe un usuario registrado con ese correo electrónico');
      }

      const user = await tx.user.create({
        data: {
          email: cleanEmail,
          name: dto.name.trim(),
          phone: dto.phone?.trim(),
          roleId: hierarchy.roleId,
          organizationId: hierarchy.organizationId,
          residentialComplexId: hierarchy.residentialComplexId,
          documentTypeId: dto.documentTypeId,
          documentNumber: dto.documentNumber?.trim(),
          password: null,
          status: UserStatus.PENDING,
        },
      });

      const expiresAt = new Date(Date.now() + ACTIVATION_TOKEN_TTL_HOURS * 60 * 60 * 1000);

      await tx.userToken.create({
        data: {
          userId: user.id,
          token: hashToken(rawToken),
          type: UserTokenType.ACTIVATION,
          expiresAt,
          status: UserTokenStatus.ACTIVE,
        },
      });

      return user;
    });

    // 2. Envío de Correo Electrónico con Manejo Explicito de Excepciones
    try {
      await this.mailService.sendActivationEmail({
        to: newUser.email,
        name: newUser.name,
        rawToken,
        expiresInHours: ACTIVATION_TOKEN_TTL_HOURS,
      });
    } catch (mailError) {
      this.logger.error(
        `Fallo al enviar correo de activación a "${newUser.email}". Eliminando registro ID ${newUser.id} para mantener consistencia.`,
        mailError instanceof Error ? mailError.stack : mailError,
      );

      // Eliminación compensatoria (Rollback explícito del efecto secundario)
      await this.prisma.user.delete({
        where: { id: newUser.id },
      });

      throw new BadRequestException(
        `No se pudo entregar el correo de activación a "${newUser.email}". Verifique que la dirección de correo exista y esté correctamente escrita.`,
      );
    }

    return {
      message: 'Usuario invitado exitosamente. Se envió un correo con el enlace de activación.',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        status: newUser.status,
      },
    };
  }

  /**
   * Construye el filtro WHERE blindado que acota las consultas al alcance (scope) del solicitante.
   */
  private scopeWhereClause(requester: JwtPayload): Prisma.UserWhereInput {
    if (requester.roleCode === RoleCode.DEV) {
      return {};
    }

    if (requester.roleCode === RoleCode.ORG_ADMIN) {
      if (!requester.organizationId) {
        throw new ForbiddenException('El usuario administrador no tiene una organización asignada');
      }
      return { organizationId: requester.organizationId };
    }

    // Roles operativos (COMPLEX_ADMIN, SECURITY, RESIDENT)
    if (!requester.residentialComplexId) {
      throw new ForbiddenException('Debe seleccionar un conjunto residencial activo');
    }

    return { residentialComplexId: requester.residentialComplexId };
  }
}
