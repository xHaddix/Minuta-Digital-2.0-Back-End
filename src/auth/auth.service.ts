import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ActivateAccountDto } from './dto/activate-account.dto';
import { ActivateAccountResponseDto } from './dto/activate-account-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ForgotPasswordResponseDto } from './dto/forgot-password-response.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResetPasswordResponseDto } from './dto/reset-password-response.dto';
import { SwitchComplexDto } from './dto/switch-complex.dto';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { generateSecureToken, hashToken } from '../common/utils/token.util';
import {
  BCRYPT_SALT_ROUNDS,
  PASSWORD_RESET_TOKEN_TTL_HOURS,
  UserStatus,
  UserTokenStatus,
  UserTokenType,
} from '../common/constants/user-token.constants';

/**
 * Hash bcrypt dummy usado para mantener tiempo de comparación constante en login()
 * cuando el usuario no existe, impidiendo ataques de timing para enumeración de correos.
 */
const DUMMY_BCRYPT_HASH = '$2b$12$flaROR3Vme54ElLTD1S/GOyg/4NzjEy2EftyS4YJnDjI388aSx4bG';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const genericError = 'Credenciales inválidas';

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { role: true },
    });

    const passwordHash = user?.password ?? DUMMY_BCRYPT_HASH;
    const passwordMatches = await bcrypt.compare(dto.password, passwordHash);

    if (!user || user.status !== UserStatus.ACTIVE || !user.password || !passwordMatches) {
      throw new UnauthorizedException(genericError);
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,

      roleCode: user.role.code,
      organizationId: user.organizationId,
      residentialComplexId: user.residentialComplexId,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roleCode: user.role.code,
        roleName: user.role.name,
        organizationId: user.organizationId,
        residentialComplexId: user.residentialComplexId,
      },
    };
  }

  /**
   * Permite a un ROLE_ORG_ADMIN o ROLE_DEV conmutar de conjunto residencial
   * y emitir un nuevo Token de Contexto activo.
   */
  async switchComplex(
    currentUser: JwtPayload,
    dto: SwitchComplexDto,
  ): Promise<{ accessToken: string }> {
    // 1. Si es ROLE_DEV, se permite conmutar a cualquier conjunto existente
    if (currentUser.roleCode === 'ROLE_DEV') {
      const complexExists = await this.prisma.residentialComplex.findUnique({
        where: { id: dto.residentialComplexId },
      });

      if (!complexExists) {
        throw new NotFoundException('El conjunto residencial no existe');
      }

      const newPayload: JwtPayload = {
        ...currentUser,
        organizationId: complexExists.organizationId,
        residentialComplexId: complexExists.id,
      };

      return { accessToken: await this.jwtService.signAsync(newPayload) };
    }

    // 2. Si es ROLE_ORG_ADMIN, se DEBE verificar la pertenencia a su organización
    if (currentUser.roleCode === 'ROLE_ORG_ADMIN') {
      if (!currentUser.organizationId) {
        throw new ForbiddenException('El usuario administrador no tiene una organización asignada');
      }

      const complex = await this.prisma.residentialComplex.findFirst({
        where: {
          id: dto.residentialComplexId,
          organizationId: currentUser.organizationId,
        },
      });

      if (!complex) {
        throw new ForbiddenException(
          'El conjunto residencial no pertenece a su organización o no existe',
        );
      }

      const newPayload: JwtPayload = {
        ...currentUser,
        residentialComplexId: complex.id,
      };

      return { accessToken: await this.jwtService.signAsync(newPayload) };
    }

    throw new ForbiddenException(
      'Su rol asignado no tiene permisos para conmutar de conjunto residencial',
    );
  }

  async activateAccount(dto: ActivateAccountDto): Promise<ActivateAccountResponseDto> {
    const genericError = 'El enlace de activación es inválido o ha expirado';

    const userToken = await this.findUsableToken(dto.token, UserTokenType.ACTIVATION);
    const isUserPending = userToken?.user?.status === UserStatus.PENDING;

    if (!userToken || !isUserPending) {
      throw new BadRequestException(genericError);
    }

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userToken.userId },
        data: {
          password: hashedPassword,
          status: UserStatus.ACTIVE,
        },
      });

      await tx.userToken.update({
        where: { id: userToken.id },
        data: { status: UserTokenStatus.USED_OR_REVOKED },
      });

      return user;
    });

    return {
      message: 'Cuenta activada exitosamente. Ya puedes iniciar sesión.',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        status: updatedUser.status,
      },
    };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<ForgotPasswordResponseDto> {
    const genericResponse: ForgotPasswordResponseDto = {
      message: 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.',
    };

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      return genericResponse;
    }

    const rawToken = generateSecureToken();
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_HOURS * 60 * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.userToken.updateMany({
        where: {
          userId: user.id,
          type: UserTokenType.PASSWORD_RESET,
          status: UserTokenStatus.ACTIVE,
        },
        data: { status: UserTokenStatus.USED_OR_REVOKED },
      }),
      this.prisma.userToken.create({
        data: {
          userId: user.id,
          token: hashToken(rawToken),
          type: UserTokenType.PASSWORD_RESET,
          expiresAt,
          status: UserTokenStatus.ACTIVE,
        },
      }),
    ]);

    try {
      await this.mailService.sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        rawToken,
        expiresInMinutes: PASSWORD_RESET_TOKEN_TTL_HOURS * 60,
      });
    } catch (error) {
      this.logger.error(
        `Error enviando correo de recuperación a ${user.email}: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }

    return genericResponse;
  }

  async resetPassword(dto: ResetPasswordDto): Promise<ResetPasswordResponseDto> {
    const genericError = 'El enlace de recuperación es inválido o ha expirado';

    const userToken = await this.findUsableToken(dto.token, UserTokenType.PASSWORD_RESET);

    if (!userToken || userToken.user.status === UserStatus.INACTIVE) {
      throw new BadRequestException(genericError);
    }

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userToken.userId },
        data: {
          password: hashedPassword,
          status: UserStatus.ACTIVE,
        },
      });

      await tx.userToken.update({
        where: { id: userToken.id },
        data: { status: UserTokenStatus.USED_OR_REVOKED },
      });
    });

    return {
      message: 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión.',
    };
  }

  private async findUsableToken(rawToken: string, type: UserTokenType) {
    const tokenHash = hashToken(rawToken);

    const userToken = await this.prisma.userToken.findUnique({
      where: { token: tokenHash },
      include: { user: true },
    });

    const isUsable =
      !!userToken &&
      userToken.type === type &&
      userToken.status === UserTokenStatus.ACTIVE &&
      userToken.expiresAt.getTime() > Date.now();

    return isUsable ? userToken : null;
  }
}
