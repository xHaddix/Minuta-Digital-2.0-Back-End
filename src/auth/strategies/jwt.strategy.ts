import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

/**
 * JwtStrategy
 * ----------------------------------------------------------------------------
 * Extrae y verifica el JWT en cada petición HTTP entrante. El payload
 * decodificado (que incluye `sub`, `email`, `roleCode`, `organizationId` y
 * `residentialComplexId`) queda disponible en `req.user` mediante el valor de
 * retorno de `validate()`.
 *
 * En la arquitectura de base de datos unificada con columna discriminadora,
 * `req.user.organizationId` y `req.user.residentialComplexId` son consumidos
 * directamente por los servicios de dominio para aplicar scoping en las consultas WHERE.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('app.jwt.secret'),
    });
  }

  /**
   * Método invocado automáticamente por Passport tras verificar la firma y expiración del token.
   * Lo que retorne este método se inyecta directamente en `req.user`.
   */
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (!payload?.sub || !payload?.roleCode) {
      throw new UnauthorizedException('Estructura de token JWT inválida');
    }

    return {
      sub: payload.sub,
      email: payload.email,
      roleCode: payload.roleCode,
      organizationId: payload.organizationId ?? null,
      residentialComplexId: payload.residentialComplexId ?? null,
    };
  }
}
