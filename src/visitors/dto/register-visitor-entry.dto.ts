import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterVisitorEntryDto {
  @ApiProperty({ description: 'Nombre completo del visitante', example: 'Carlos Mendoza' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del visitante es obligatorio' })
  fullName!: string;

  @ApiPropertyOptional({ description: 'Número de documento de identidad', example: '1018234901' })
  @IsString()
  @IsOptional()
  documentNumber?: string;

  @ApiPropertyOptional({ description: 'Tipo de documento de identidad', example: 'CC' })
  @IsString()
  @IsOptional()
  documentType?: string;

  @ApiPropertyOptional({
    description: 'Unidad habitacional o destino del visitante (Apto/Casa/Torre)',
    example: 'Torre 1 Apto 302',
  })
  @IsString()
  @IsOptional()
  unitTarget?: string;
}
