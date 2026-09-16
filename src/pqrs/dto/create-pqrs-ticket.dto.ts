import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePqrsTicketDto {
  @ApiProperty({
    description: 'Tipo de solicitud (PETITION, COMPLAINT, CLAIM, SUGGESTION)',
    example: 'COMPLAINT',
    enum: ['PETITION', 'COMPLAINT', 'CLAIM', 'SUGGESTION'],
  })
  @IsString()
  @IsIn(['PETITION', 'COMPLAINT', 'CLAIM', 'SUGGESTION'], {
    message: 'El tipo debe ser PETITION, COMPLAINT, CLAIM o SUGGESTION',
  })
  @IsNotEmpty({ message: 'El tipo de ticket es obligatorio' })
  ticketType!: string;

  @ApiProperty({
    description: 'Asunto de la solicitud',
    example: 'Ruidos molestos en horas de la noche',
  })
  @IsString()
  @IsNotEmpty({ message: 'El asunto es obligatorio' })
  subject!: string;

  @ApiProperty({
    description: 'Descripción detallada de la solicitud',
    example: 'El residente de la torre 1 apto 302 realiza eventos con alto volumen.',
  })
  @IsString()
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  description!: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Archivo adjunto de evidencia',
  })
  @IsOptional()
  attachment?: any;
}
