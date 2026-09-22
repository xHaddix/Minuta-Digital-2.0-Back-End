import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Conjunto Los Pinos' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la organización es obligatorio' })
  @Length(2, 150, { message: 'El nombre debe tener entre 2 y 150 caracteres' })
  name!: string;

  @ApiPropertyOptional({ example: 'https://cdn.minutadigital.com/logo.png' })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional({ example: 'https://cdn.minutadigital.com/logo.png' })
  @IsOptional()
  @IsString()
  urlLogo?: string;

  @ApiPropertyOptional({ description: 'Id del tipo de documento', example: '1a2b3c4d-...' })
  @IsOptional()
  @IsUUID('4', { message: 'documentTypeId debe ser un UUID válido' })
  documentTypeId?: string;

  @ApiPropertyOptional({ example: '900123456-7' })
  @IsOptional()
  @IsString()
  identification?: string;

  @ApiProperty({ example: 'contacto@conjuntolospinos.com' })
  @IsEmail({}, { message: 'El correo de contacto no es válido' })
  @IsNotEmpty({ message: 'El correo de contacto es obligatorio' })
  contactEmail!: string;

  @ApiPropertyOptional({ example: '+57 300 123 4567' })
  @IsOptional()
  @IsString()
  contactPhone?: string;
}
