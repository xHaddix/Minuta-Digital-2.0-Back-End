import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
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
}
