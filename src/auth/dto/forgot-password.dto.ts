import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'usuario@conjuntolospinos.com' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty()
  email!: string;
}
