import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateResidentDto {
  @ApiProperty({
    description: 'ID del usuario asignado como residente (tabla users)',
    example: 'd9b2b687-3520-4e31-8f5f-9e7d9c66f2a1',
  })
  @IsUUID('4', { message: 'El userId debe ser un UUID v4 válido' })
  @IsNotEmpty({ message: 'El userId es obligatorio' })
  userId!: string;

  @ApiProperty({
    description: 'Número de unidad habitacional (Torre, Apto, Casa)',
    example: 'Torre 2 Apto 504',
  })
  @IsString()
  @IsNotEmpty({ message: 'El número de unidad habitacional es obligatorio' })
  unitNumber!: string;

  @ApiPropertyOptional({
    description: 'Indica si el residente es propietario del inmueble',
    example: true,
    default: false,
  })
  @IsBoolean({ message: 'isOwner debe ser un valor booleano' })
  @IsOptional()
  isOwner?: boolean;
}
