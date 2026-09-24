import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateApartmentDto {
  @ApiPropertyOptional({
    description: 'Etiqueta legacy visible de la unidad',
    example: 'Torre 2 Apto 504',
  })
  @IsString()
  @IsOptional()
  unitNumber?: string;

  @ApiPropertyOptional({ description: 'Número o nombre de la torre', example: '2' })
  @IsString()
  @IsOptional()
  tower?: string;

  @ApiPropertyOptional({ description: 'Número del apartamento o unidad', example: '504' })
  @IsString()
  @IsOptional()
  apartmentNumber?: string;

  @ApiPropertyOptional({
    description: 'Tipo de unidad',
    example: 'APARTMENT',
    default: 'APARTMENT',
  })
  @IsString()
  @IsOptional()
  unitType?: string;

  @ApiPropertyOptional({ description: 'Estado de la unidad: 1 activa, 0 inactiva', example: 1 })
  @IsInt()
  @Min(0)
  @Max(1)
  @IsOptional()
  status?: number;
}
