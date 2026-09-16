/**
 * Política de contraseña fuerte, compartida por todos los DTOs que permiten
 * a un usuario establecer/cambiar su contraseña (activación de cuenta,
 * recuperación de contraseña, cambio de contraseña, etc.).
 *
 * Exige:
 *  - Al menos una letra minúscula
 *  - Al menos una letra mayúscula
 *  - Al menos un dígito
 *  - Al menos un carácter especial
 * La longitud mínima/máxima se valida por separado con @MinLength/@MaxLength.
 */
export const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

export const STRONG_PASSWORD_MESSAGE =
  'La contraseña debe incluir al menos una mayúscula, una minúscula, un número y un carácter especial';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;
