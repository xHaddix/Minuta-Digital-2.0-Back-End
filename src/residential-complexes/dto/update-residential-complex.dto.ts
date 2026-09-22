import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';

export class UpdateResidentialComplexDto {
  @ApiPropertyOptional({ example: 'Conjunto Los Pinos' })
  @IsOptional()
  @IsString()
  @Length(2, 150, { message: 'El nombre debe tener entre 2 y 150 caracteres' })
  name?: string;

  @ApiPropertyOptional({ example: 'los-pinos' })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'El slug solo puede contener letras minúsculas, números y guiones',
  })
  slug?: string;

  @ApiPropertyOptional({ example: 'info@conjuntolospinos.com' })
  @IsOptional()
  @IsEmail({}, { message: 'El correo de contacto no es válido' })
  contactEmail?: string;

  @ApiPropertyOptional({ example: '+57 300 123 4567' })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({
    description: 'Id de la organización. Se infiere desde el JWT para ROLE_ORG_ADMIN.',
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
