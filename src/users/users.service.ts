import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService, Prisma } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { UserHierarchyService } from './user-hierarchy.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
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
  imgProfile: true,
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

  async updateProfileImage(requester: JwtPayload, id: string, imgProfile: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, ...this.scopeWhereClause(requester) },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.prisma.user.update({
      where: { id },
      data: { imgProfile },
      select: USER_PUBLIC_SELECT,
    });
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
   * Actualiza la información de un usuario respetando las reglas de jerarquía y scope multi-tenant.
   */
  async update(id: string, dto: UpdateUserDto, requester: JwtPayload) {
    // 1. Buscar usuario garantizando que pertenece al scope del solicitante
    const existingUser = await this.prisma.user.findFirst({
      where: { id, ...this.scopeWhereClause(requester) },
    });

    if (!existingUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // 2. Prevenir auto-modificación de estado que pueda dejar la sesión inhabilitada
    if (requester.sub === id && dto.status !== undefined && dto.status !== existingUser.status) {
      throw new BadRequestException('No puedes cambiar tu propio estado de usuario');
    }

    // 3. Validar jerarquía de asignación si se intenta reasignar el rol
    if (dto.roleId && dto.roleId !== existingUser.roleId) {
      const hierarchy = await this.userHierarchy.resolve({
        roleId: dto.roleId,
        organizationId: existingUser.organizationId,
        residentialComplexId: existingUser.residentialComplexId,
      });

      this.userHierarchy.assertRequesterCanAssign(requester, hierarchy);
    }

    // 4. Actualización atómica del usuario
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name.trim() }),
        ...(dto.phone !== undefined && { phone: dto.phone?.trim() }),
        ...(dto.roleId && { roleId: dto.roleId }),
        ...(dto.documentTypeId !== undefined && { documentTypeId: dto.documentTypeId }),
        ...(dto.documentNumber !== undefined && { documentNumber: dto.documentNumber?.trim() }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
      select: USER_PUBLIC_SELECT,
    });

    return updatedUser;
  }

  /**
   * Aplica borrado definitivo (Hard Delete) si el usuario está PENDING o desactiva (Soft Delete) si ya estuvo activo.
   */
  async remove(id: string, requester: JwtPayload) {
    // 1. Verificar existencia del usuario dentro del scope permitido
    const user = await this.prisma.user.findFirst({
      where: { id, ...this.scopeWhereClause(requester) },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // 2. Prevenir auto-eliminación/desactivación
    if (requester.sub === id) {
      throw new BadRequestException('No puedes eliminar tu propia cuenta de usuario');
    }

    // 3. Estrategia Híbrida según estado operativo del usuario
    if (user.status === UserStatus.PENDING) {
      // Hard Delete atómico: limpia tokens de activación y el usuario sin violar FKs
      await this.prisma.$transaction([
        this.prisma.userToken.deleteMany({ where: { userId: id } }),
        this.prisma.user.delete({ where: { id } }),
      ]);

      return { message: 'Usuario en estado pendiente eliminado exitosamente' };
    }

    // Soft Delete: Desactivación lógica para preservar integridad referencial de minutas e historial
    await this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.INACTIVE },
    });

    return { message: 'Usuario desactivado exitosamente' };
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
