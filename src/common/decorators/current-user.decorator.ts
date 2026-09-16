import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * Decorador de parámetro para inyectar el usuario autenticado (decodificado
 * del JWT) directamente en los handlers de los controladores.
 *
 * NOTA: `data` se tipa como `string` (no `keyof JwtPayload`) a propósito:
 * varios controladores (amenities, correspondence, marketplace, pqrs,
 * residents, visitors, storage, users) todavía piden campos del payload
 * viejo ("tenantSchema"/"tenantId") que ya no existen tras la migración a
 * pool de esquema compartido. Esos módulos quedan pendientes de una
 * migración propia (usar `organizationId`/`residentialComplexId`); este
 * tipado más laxo solo evita que un problema de esos módulos bloquee la
 * compilación de todo el proyecto.
 *
 * Ejemplo:
 *   findAll(@CurrentUser() user: JwtPayload) { ... }
 *   findAll(@CurrentUser('residentialComplexId') residentialComplexId: string) { ... }
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: JwtPayload = request.user;
    return data ? (user as unknown as Record<string, unknown>)?.[data] : user;
  },
);
