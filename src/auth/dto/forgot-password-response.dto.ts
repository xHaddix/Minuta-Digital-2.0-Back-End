import { ApiProperty } from '@nestjs/swagger';

/**
 * Respuesta genérica e idéntica sin importar si el correo existe, está
 * inactivo o no tiene cuenta registrada, para no filtrar información sobre
 * qué correos están dados de alta en el sistema (resistencia a
 * enumeración de usuarios).
 */
export class ForgotPasswordResponseDto {
  @ApiProperty({
    example:
      'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.',
  })
  message!: string;
}
