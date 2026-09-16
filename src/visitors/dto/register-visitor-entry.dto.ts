import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class RegisterVisitorEntryDto {
  @ApiProperty({ description: 'Nombre completo del visitante', example: 'Carlos Mendoza' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del visitante es obligatorio' })
  fullName!: string;

  @ApiProperty({ description: 'Número de documento de identidad', example: '1018234901' })
  @IsString()
  @IsNotEmpty({ message: 'El número de documento es obligatorio' })
  documentNumber!: string;

  @ApiProperty({
    description: 'Unidad habitacional o destino del visitante (Apto/Casa/Torre)',
    example: 'Torre 1 Apto 302',
  })
  @IsString()
  @IsNotEmpty({ message: 'La unidad habitacional destino es obligatoria' })
  unitTarget!: string;

  @ApiPropertyOptional({
    description: 'ID del usuario residente que autoriza la visita (opcional)',
    example: 'd9b2b687-3520-4e31-8f5f-9e7d9c66f2a1',
  })
  @IsUUID('4', { message: 'El ID del autorizador debe ser un UUID v4 válido' })
  @IsOptional()
  authorizerUserId?: string;
}
