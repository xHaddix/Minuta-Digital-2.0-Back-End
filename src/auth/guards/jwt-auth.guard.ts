import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard HTTP que dispara la JwtStrategy ('jwt') registrada con Passport.
 * Úsalo con @UseGuards(JwtAuthGuard) en controladores/endpoints protegidos.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
