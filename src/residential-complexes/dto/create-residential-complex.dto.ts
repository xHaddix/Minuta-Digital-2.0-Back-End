import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';

export class CreateResidentialComplexDto {
  @ApiProperty({ example: 'Conjunto Los Pinos' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del conjunto residencial es obligatorio' })
  @Length(2, 150, { message: 'El nombre debe tener entre 2 y 150 caracteres' })
  name!: string;

  @ApiProperty({ example: 'los-pinos' })
  @IsString()
  @IsNotEmpty({ message: 'El slug es obligatorio' })
  @Matches(/^[a-z0-9-]+$/, {
    message: 'El slug solo puede contener letras minúsculas, números y guiones',
  })
  slug!: string;

  @ApiProperty({ example: 'info@conjuntolospinos.com' })
  @IsEmail({}, { message: 'El correo de contacto no es válido' })
  @IsNotEmpty({ message: 'El correo de contacto es obligatorio' })
  contactEmail!: string;

  @ApiPropertyOptional({ example: '+57 300 123 4567' })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({
    description:
      'Id de la organización a la que pertenece el conjunto. Se infiere desde el JWT para ROLE_ORG_ADMIN.',
    example: '8f9f2e7b-...',
  })
  @IsOptional()
  @IsUUID('4', { message: 'organizationId debe ser un UUID válido' })
  organizationId?: string;

  @ApiPropertyOptional({ example: 'https://cdn.minutadigital.com/complex-logo.png' })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional({ example: 'https://cdn.minutadigital.com/complex-logo.png' })
  @IsOptional()
  @IsString()
  urlLogo?: string;

  @ApiPropertyOptional({ example: 'BASIC' })
  @IsOptional()
  @IsString()
  planCode?: string;
}
