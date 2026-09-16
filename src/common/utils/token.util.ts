import { randomBytes, createHash } from 'crypto';

/**
 * Genera un token aleatorio, único y criptográficamente seguro (256 bits),
 * codificado en hexadecimal, para ser enviado al usuario (por ejemplo, en
 * un enlace de activación de cuenta o recuperación de contraseña).
 */
export function generateSecureToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Calcula el hash SHA-256 de un token en texto plano. Solo el hash se
 * persiste en base de datos; el valor plano únicamente se envía al usuario
 * por correo y nunca se almacena, evitando su exposición ante una eventual
 * fuga de la base de datos.
 */
export function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}
