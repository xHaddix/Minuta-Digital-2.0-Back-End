import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCorrespondenceDto {
  @ApiProperty({
    description: 'Nombre del destinatario (residente o residente objetivo)',
    example: 'Juan Pérez',
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del destinatario es obligatorio' })
  recipientName!: string;

  @ApiProperty({
    description: 'Número de unidad habitacional (Apto/Casa)',
    example: 'Torre 2 Apto 504',
  })
  @IsString()
  @IsNotEmpty({ message: 'El número de unidad es obligatorio' })
  unitNumber!: string;

  @ApiProperty({
    description: 'Empresa transportadora / Mensajería',
    example: 'Servientrega / Amazon',
  })
  @IsString()
  @IsNotEmpty({ message: 'La empresa transportadora es obligatoria' })
  carrier!: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Foto de evidencia del paquete',
  })
  @IsOptional()
  photo?: any;
}
