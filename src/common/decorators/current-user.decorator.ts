import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * Decorador de parámetro para inyectar el usuario autenticado (decodificado
 * del JWT) directamente en los handlers de los controladores.
 *
 * Ejemplo:
 *   findAll(@CurrentUser() user: JwtPayload) { ... }
 *   findAll(@CurrentUser('residentialComplexId') residentialComplexId: string) { ... }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: JwtPayload = request.user;
    return data ? user[data] : user;
  },
);
