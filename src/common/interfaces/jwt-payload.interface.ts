import { Request } from 'express';

/**
 * Forma del payload que viaja dentro del JWT y que queda disponible
 * en `req.user` después de pasar por el JwtAuthGuard.
 */
export interface JwtPayload {
  /** ID del usuario autenticado (tabla `users`). */
  sub: string;
  /** Correo del usuario. */
  email: string;
  /** Código del rol (ej: ROLE_DEV, ROLE_ORG_ADMIN, ROLE_COMPLEX_ADMIN, ROLE_SECURITY, ROLE_RESIDENT). */
  roleCode: string;
  /** ID de la organización a la que pertenece el usuario, si aplica. */
  organizationId: string | null;
  /** ID del conjunto residencial al que pertenece el usuario, si aplica. */
  residentialComplexId: string | null;
  iat?: number;
  exp?: number;
}

export interface RequestWithUser extends Request {
  user: JwtPayload;
}
