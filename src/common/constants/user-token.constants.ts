/**
 * Constantes compartidas para el ciclo de vida de usuarios y tokens
 * (invitación/activación de cuenta, recuperación de contraseña).
 */
export enum UserStatus {
  INACTIVE = 0,
  ACTIVE = 1,
  PENDING = 2,
}

export enum UserTokenStatus {
  USED_OR_REVOKED = 0,
  ACTIVE = 1,
}

export enum UserTokenType {
  ACTIVATION = 'ACTIVATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
}

export const ACTIVATION_TOKEN_TTL_HOURS = 24;
export const PASSWORD_RESET_TOKEN_TTL_HOURS = 1;

export const BCRYPT_SALT_ROUNDS = 12;
