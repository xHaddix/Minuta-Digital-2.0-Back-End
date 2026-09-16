import type { JwtService } from '@nestjs/jwt';
import {
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import bcrypt = require('bcrypt');
import { AuthService } from './auth.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { MailService } from '../mail/mail.service';
import { hashToken } from '../common/utils/token.util';
import {
  UserStatus,
  UserTokenStatus,
  UserTokenType,
} from '../common/constants/user-token.constants';

describe('AuthService (QA funcional)', () => {
  let service: AuthService;
  let prisma: {
    user: { findUnique: jest.Mock; update: jest.Mock };
    userToken: {
      findUnique: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      create: jest.Mock;
    };
    residentialComplex: { findUnique: jest.Mock; findFirst: jest.Mock };
    $transaction: jest.Mock;
  };
  let jwtService: { signAsync: jest.Mock };
  let mailService: { sendPasswordResetEmail: jest.Mock };

  const NOW = new Date('2026-01-01T00:00:00.000Z');

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(NOW);

    prisma = {
      user: { findUnique: jest.fn(), update: jest.fn() },
      userToken: {
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        create: jest.fn(),
      },
      residentialComplex: { findUnique: jest.fn(), findFirst: jest.fn() },
      // Por defecto, ejecuta el callback pasándole el mismo mock de prisma como `tx`
      $transaction: jest.fn(async (arg: unknown) => {
        if (typeof arg === 'function') {
          return arg(prisma as any);
        }
        // arg es un array de promesas (Promise.all style)
        return Promise.all(arg as Promise<unknown>[]);
      }),
    };

    jwtService = { signAsync: jest.fn().mockResolvedValue('signed.jwt.token') };
    mailService = { sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined) };

    // Se instancia el servicio directamente (sin contenedor DI de Nest) para
    // aislar por completo la lógica de negocio bajo prueba.
    service = new AuthService(
      prisma as unknown as PrismaService,
      jwtService as unknown as JwtService,
      mailService as unknown as MailService,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  // ==========================================================================
  // LOGIN
  // ==========================================================================
  describe('login()', () => {
    const dto = { email: 'admin@conjuntolospinos.com', password: 'S3cur3P@ss!' };

    it('debe autenticar exitosamente a un usuario ACTIVO con credenciales correctas', async () => {
      const hashed = await bcrypt.hash(dto.password, 4);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: dto.email,
        password: hashed,
        name: 'Admin',
        status: UserStatus.ACTIVE,
        organizationId: 'org-1',
        residentialComplexId: 'complex-1',
        role: { code: 'ROLE_ORG_ADMIN', name: 'Administrador de Organización' },
      });

      const result = await service.login(dto as any);

      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.user).toEqual({
        id: 'user-1',
        email: dto.email,
        name: 'Admin',
        roleCode: 'ROLE_ORG_ADMIN',
        roleName: 'Administrador de Organización',
        organizationId: 'org-1',
        residentialComplexId: 'complex-1',
      });
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 'user-1',
        email: dto.email,
        roleCode: 'ROLE_ORG_ADMIN',
        organizationId: 'org-1',
        residentialComplexId: 'complex-1',
      });
    });

    it('debe rechazar con 401 si el usuario no existe (sin revelar la causa)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(dto as any)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(dto as any)).rejects.toThrow('Credenciales inválidas');
    });

    it('debe rechazar con 401 si la contraseña es incorrecta', async () => {
      const hashed = await bcrypt.hash('OtraPassword123!', 4);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: dto.email,
        password: hashed,
        status: UserStatus.ACTIVE,
        role: { code: 'ROLE_RESIDENT', name: 'Residente' },
      });

      await expect(service.login(dto as any)).rejects.toThrow(UnauthorizedException);
    });

    it('debe rechazar con 401 si el usuario está PENDING (no ha activado su cuenta)', async () => {
      const hashed = await bcrypt.hash(dto.password, 4);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: dto.email,
        password: hashed,
        status: UserStatus.PENDING,
        role: { code: 'ROLE_RESIDENT', name: 'Residente' },
      });

      await expect(service.login(dto as any)).rejects.toThrow(UnauthorizedException);
    });

    it('debe rechazar con 401 si el usuario está INACTIVE', async () => {
      const hashed = await bcrypt.hash(dto.password, 4);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: dto.email,
        password: hashed,
        status: UserStatus.INACTIVE,
        role: { code: 'ROLE_RESIDENT', name: 'Residente' },
      });

      await expect(service.login(dto as any)).rejects.toThrow(UnauthorizedException);
    });

    it('debe rechazar con 401 si el usuario no tiene password establecido (invitado sin activar)', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: dto.email,
        password: null,
        status: UserStatus.ACTIVE,
        role: { code: 'ROLE_RESIDENT', name: 'Residente' },
      });

      await expect(service.login(dto as any)).rejects.toThrow(UnauthorizedException);
    });

    it('debe comparar contra un hash dummy cuando el usuario no existe (mitigación de timing attack)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const compareSpy = jest.spyOn(bcrypt, 'compare');

      await expect(service.login(dto as any)).rejects.toThrow(UnauthorizedException);

      expect(compareSpy).toHaveBeenCalledWith(
        dto.password,
        '$2b$12$flaROR3Vme54ElLTD1S/GOyg/4NzjEy2EftyS4YJnDjI388aSx4bG',
      );
      compareSpy.mockRestore();
    });
  });

  // ==========================================================================
  // SWITCH COMPLEX
  // ==========================================================================
  describe('switchComplex()', () => {
    const dto = { residentialComplexId: 'complex-2' };

    it('ROLE_DEV puede conmutar a cualquier conjunto existente', async () => {
      const currentUser = {
        sub: 'user-dev',
        email: 'dev@minutadigital.com',
        roleCode: 'ROLE_DEV',
        organizationId: null,
        residentialComplexId: null,
      };
      prisma.residentialComplex.findUnique.mockResolvedValue({
        id: 'complex-2',
        organizationId: 'org-99',
      });

      const result = await service.switchComplex(currentUser as any, dto as any);

      expect(result).toEqual({ accessToken: 'signed.jwt.token' });
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        ...currentUser,
        organizationId: 'org-99',
        residentialComplexId: 'complex-2',
      });
    });

    it('ROLE_DEV recibe 404 si el conjunto no existe', async () => {
      const currentUser = {
        sub: 'user-dev',
        email: 'dev@minutadigital.com',
        roleCode: 'ROLE_DEV',
        organizationId: null,
        residentialComplexId: null,
      };
      prisma.residentialComplex.findUnique.mockResolvedValue(null);

      await expect(service.switchComplex(currentUser as any, dto as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('ROLE_ORG_ADMIN puede conmutar a un conjunto que pertenece a su organización', async () => {
      const currentUser = {
        sub: 'user-admin',
        email: 'admin@org.com',
        roleCode: 'ROLE_ORG_ADMIN',
        organizationId: 'org-1',
        residentialComplexId: null,
      };
      prisma.residentialComplex.findFirst.mockResolvedValue({
        id: 'complex-2',
        organizationId: 'org-1',
      });

      const result = await service.switchComplex(currentUser as any, dto as any);

      expect(result).toEqual({ accessToken: 'signed.jwt.token' });
      expect(prisma.residentialComplex.findFirst).toHaveBeenCalledWith({
        where: { id: 'complex-2', organizationId: 'org-1' },
      });
    });

    it('ROLE_ORG_ADMIN recibe 403 si el conjunto no pertenece a su organización', async () => {
      const currentUser = {
        sub: 'user-admin',
        email: 'admin@org.com',
        roleCode: 'ROLE_ORG_ADMIN',
        organizationId: 'org-1',
        residentialComplexId: null,
      };
      prisma.residentialComplex.findFirst.mockResolvedValue(null);

      await expect(service.switchComplex(currentUser as any, dto as any)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('ROLE_ORG_ADMIN sin organizationId recibe 403 (usuario mal configurado)', async () => {
      const currentUser = {
        sub: 'user-admin',
        email: 'admin@org.com',
        roleCode: 'ROLE_ORG_ADMIN',
        organizationId: null,
        residentialComplexId: null,
      };

      await expect(service.switchComplex(currentUser as any, dto as any)).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.residentialComplex.findFirst).not.toHaveBeenCalled();
    });

    it('otros roles (ej. ROLE_RESIDENT) reciben 403 al intentar conmutar', async () => {
      const currentUser = {
        sub: 'user-res',
        email: 'res@correo.com',
        roleCode: 'ROLE_RESIDENT',
        organizationId: 'org-1',
        residentialComplexId: 'complex-1',
      };

      await expect(service.switchComplex(currentUser as any, dto as any)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ==========================================================================
  // ACTIVATE ACCOUNT
  // ==========================================================================
  describe('activateAccount()', () => {
    const dto = { token: 'raw-activation-token', password: 'N3wP@ssword!' };

    it('debe activar la cuenta correctamente con un token válido y usuario PENDING', async () => {
      const userToken = {
        id: 'token-1',
        userId: 'user-1',
        type: UserTokenType.ACTIVATION,
        status: UserTokenStatus.ACTIVE,
        expiresAt: new Date(NOW.getTime() + 60_000),
        user: { id: 'user-1', status: UserStatus.PENDING },
      };
      prisma.userToken.findUnique.mockResolvedValue(userToken);
      prisma.user.update.mockResolvedValue({
        id: 'user-1',
        email: 'nuevo@correo.com',
        name: 'Nuevo Usuario',
        status: UserStatus.ACTIVE,
      });
      prisma.userToken.update.mockResolvedValue({});

      const result = await service.activateAccount(dto as any);

      expect(result.message).toContain('activada exitosamente');
      expect(result.user).toEqual({
        id: 'user-1',
        email: 'nuevo@correo.com',
        name: 'Nuevo Usuario',
        status: UserStatus.ACTIVE,
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { password: expect.any(String), status: UserStatus.ACTIVE },
      });
      expect(prisma.userToken.update).toHaveBeenCalledWith({
        where: { id: 'token-1' },
        data: { status: UserTokenStatus.USED_OR_REVOKED },
      });
    });

    it('debe buscar el token por su hash SHA-256, nunca en texto plano', async () => {
      prisma.userToken.findUnique.mockResolvedValue(null);

      await expect(service.activateAccount(dto as any)).rejects.toThrow(BadRequestException);

      expect(prisma.userToken.findUnique).toHaveBeenCalledWith({
        where: { token: hashToken(dto.token) },
        include: { user: true },
      });
    });

    it('debe rechazar con 400 si el token no existe', async () => {
      prisma.userToken.findUnique.mockResolvedValue(null);

      await expect(service.activateAccount(dto as any)).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar con 400 si el token es de tipo distinto (ej. PASSWORD_RESET)', async () => {
      prisma.userToken.findUnique.mockResolvedValue({
        id: 'token-1',
        userId: 'user-1',
        type: UserTokenType.PASSWORD_RESET,
        status: UserTokenStatus.ACTIVE,
        expiresAt: new Date(NOW.getTime() + 60_000),
        user: { id: 'user-1', status: UserStatus.PENDING },
      });

      await expect(service.activateAccount(dto as any)).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar con 400 si el token ya fue usado/revocado', async () => {
      prisma.userToken.findUnique.mockResolvedValue({
        id: 'token-1',
        userId: 'user-1',
        type: UserTokenType.ACTIVATION,
        status: UserTokenStatus.USED_OR_REVOKED,
        expiresAt: new Date(NOW.getTime() + 60_000),
        user: { id: 'user-1', status: UserStatus.PENDING },
      });

      await expect(service.activateAccount(dto as any)).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar con 400 si el token ya expiró', async () => {
      prisma.userToken.findUnique.mockResolvedValue({
        id: 'token-1',
        userId: 'user-1',
        type: UserTokenType.ACTIVATION,
        status: UserTokenStatus.ACTIVE,
        expiresAt: new Date(NOW.getTime() - 1_000), // expiró hace 1s
        user: { id: 'user-1', status: UserStatus.PENDING },
      });

      await expect(service.activateAccount(dto as any)).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar con 400 si el usuario asociado ya no está PENDING (ej. ya activo)', async () => {
      prisma.userToken.findUnique.mockResolvedValue({
        id: 'token-1',
        userId: 'user-1',
        type: UserTokenType.ACTIVATION,
        status: UserTokenStatus.ACTIVE,
        expiresAt: new Date(NOW.getTime() + 60_000),
        user: { id: 'user-1', status: UserStatus.ACTIVE },
      });

      await expect(service.activateAccount(dto as any)).rejects.toThrow(BadRequestException);
    });
  });

  // ==========================================================================
  // FORGOT PASSWORD
  // ==========================================================================
  describe('forgotPassword()', () => {
    const dto = { email: 'usuario@correo.com' };
    const genericMessage =
      'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.';

    it('debe crear un token y enviar el correo si el usuario existe y está ACTIVO', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: dto.email,
        name: 'Usuario Test',
        status: UserStatus.ACTIVE,
      });

      const result = await service.forgotPassword(dto as any);

      expect(result.message).toBe(genericMessage);
      expect(prisma.userToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          type: UserTokenType.PASSWORD_RESET,
          status: UserTokenStatus.ACTIVE,
        },
        data: { status: UserTokenStatus.USED_OR_REVOKED },
      });
      expect(prisma.userToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          type: UserTokenType.PASSWORD_RESET,
          status: UserTokenStatus.ACTIVE,
        }),
      });
      expect(mailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        expect.objectContaining({ to: dto.email, name: 'Usuario Test' }),
      );
    });

    it('debe responder con el mensaje genérico aunque el correo no exista (anti-enumeración)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword(dto as any);

      expect(result.message).toBe(genericMessage);
      expect(prisma.userToken.create).not.toHaveBeenCalled();
      expect(mailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('debe responder con el mensaje genérico si el usuario existe pero no está ACTIVO', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: dto.email,
        status: UserStatus.PENDING,
      });

      const result = await service.forgotPassword(dto as any);

      expect(result.message).toBe(genericMessage);
      expect(prisma.userToken.create).not.toHaveBeenCalled();
    });

    it('no debe fallar el flujo aunque el envío de correo lance una excepción (se loguea el error)', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: dto.email,
        name: 'Usuario Test',
        status: UserStatus.ACTIVE,
      });
      mailService.sendPasswordResetEmail.mockRejectedValue(new Error('SMTP caído'));

      const result = await service.forgotPassword(dto as any);

      expect(result.message).toBe(genericMessage);
    });

    it('debe invalidar tokens PASSWORD_RESET activos previos antes de crear uno nuevo', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: dto.email,
        name: 'Usuario Test',
        status: UserStatus.ACTIVE,
      });

      await service.forgotPassword(dto as any);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      const transactionArg = prisma.$transaction.mock.calls[0][0];
      expect(Array.isArray(transactionArg)).toBe(true);
      expect(transactionArg).toHaveLength(2);
      expect(prisma.userToken.updateMany).toHaveBeenCalled();
      expect(prisma.userToken.create).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // RESET PASSWORD
  // ==========================================================================
  describe('resetPassword()', () => {
    const dto = { token: 'raw-reset-token', password: 'N3wP@ssword!' };

    it('debe restablecer la contraseña con un token válido', async () => {
      prisma.userToken.findUnique.mockResolvedValue({
        id: 'token-1',
        userId: 'user-1',
        type: UserTokenType.PASSWORD_RESET,
        status: UserTokenStatus.ACTIVE,
        expiresAt: new Date(NOW.getTime() + 60_000),
        user: { id: 'user-1', status: UserStatus.ACTIVE },
      });

      const result = await service.resetPassword(dto as any);

      expect(result.message).toContain('actualizada exitosamente');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { password: expect.any(String), status: UserStatus.ACTIVE },
      });
      expect(prisma.userToken.update).toHaveBeenCalledWith({
        where: { id: 'token-1' },
        data: { status: UserTokenStatus.USED_OR_REVOKED },
      });
    });

    it('debe rechazar con 400 si el token no existe', async () => {
      prisma.userToken.findUnique.mockResolvedValue(null);

      await expect(service.resetPassword(dto as any)).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar con 400 si el token ya expiró', async () => {
      prisma.userToken.findUnique.mockResolvedValue({
        id: 'token-1',
        userId: 'user-1',
        type: UserTokenType.PASSWORD_RESET,
        status: UserTokenStatus.ACTIVE,
        expiresAt: new Date(NOW.getTime() - 1_000),
        user: { id: 'user-1', status: UserStatus.ACTIVE },
      });

      await expect(service.resetPassword(dto as any)).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar con 400 si el token ya fue usado/revocado', async () => {
      prisma.userToken.findUnique.mockResolvedValue({
        id: 'token-1',
        userId: 'user-1',
        type: UserTokenType.PASSWORD_RESET,
        status: UserTokenStatus.USED_OR_REVOKED,
        expiresAt: new Date(NOW.getTime() + 60_000),
        user: { id: 'user-1', status: UserStatus.ACTIVE },
      });

      await expect(service.resetPassword(dto as any)).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar con 400 si el usuario asociado está INACTIVE', async () => {
      prisma.userToken.findUnique.mockResolvedValue({
        id: 'token-1',
        userId: 'user-1',
        type: UserTokenType.PASSWORD_RESET,
        status: UserTokenStatus.ACTIVE,
        expiresAt: new Date(NOW.getTime() + 60_000),
        user: { id: 'user-1', status: UserStatus.INACTIVE },
      });

      await expect(service.resetPassword(dto as any)).rejects.toThrow(BadRequestException);
    });

    it('permite restablecer contraseña de un usuario PENDING (activa la cuenta de paso)', async () => {
      prisma.userToken.findUnique.mockResolvedValue({
        id: 'token-1',
        userId: 'user-1',
        type: UserTokenType.PASSWORD_RESET,
        status: UserTokenStatus.ACTIVE,
        expiresAt: new Date(NOW.getTime() + 60_000),
        user: { id: 'user-1', status: UserStatus.PENDING },
      });

      const result = await service.resetPassword(dto as any);

      expect(result.message).toContain('actualizada exitosamente');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { password: expect.any(String), status: UserStatus.ACTIVE },
      });
    });

    it('debe rechazar con 400 si se reutiliza un token de ACTIVATION en vez de PASSWORD_RESET', async () => {
      prisma.userToken.findUnique.mockResolvedValue({
        id: 'token-1',
        userId: 'user-1',
        type: UserTokenType.ACTIVATION,
        status: UserTokenStatus.ACTIVE,
        expiresAt: new Date(NOW.getTime() + 60_000),
        user: { id: 'user-1', status: UserStatus.ACTIVE },
      });

      await expect(service.resetPassword(dto as any)).rejects.toThrow(BadRequestException);
    });
  });
});
