import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  STRONG_PASSWORD_MESSAGE,
  STRONG_PASSWORD_REGEX,
} from '../../common/validators/strong-password.policy';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token de recuperación recibido en el correo (valor plano, sin hashear).',
    example: 'a3f1c9...64chars',
  })
  @IsString()
  @IsNotEmpty({ message: 'El token es obligatorio' })
  token!: string;

  @ApiProperty({
    description:
      'Nueva contraseña de la cuenta. Debe tener mínimo 8 caracteres e incluir al menos ' +
      'una mayúscula, una minúscula, un número y un carácter especial.',
    example: 'N3wP@ssword!',
  })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH, {
    message: `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`,
  })
  @MaxLength(PASSWORD_MAX_LENGTH, {
    message: `La contraseña no puede exceder ${PASSWORD_MAX_LENGTH} caracteres`,
  })
  @Matches(STRONG_PASSWORD_REGEX, { message: STRONG_PASSWORD_MESSAGE })
  password!: string;
}
