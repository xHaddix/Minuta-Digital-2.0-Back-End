import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@conjuntolospinos.com' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'S3cur3P@ssword' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiProperty({ required: false, description: 'Mantener sesion por mas tiempo' })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
