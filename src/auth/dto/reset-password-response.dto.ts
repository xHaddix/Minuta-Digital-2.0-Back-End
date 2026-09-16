import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordResponseDto {
  @ApiProperty({
    example: 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión.',
  })
  message!: string;
}
