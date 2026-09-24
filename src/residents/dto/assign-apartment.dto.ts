import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignApartmentDto {
  @ApiProperty({ description: 'ID del apartamento del catálogo' })
  @IsUUID('4', { message: 'El apartmentId debe ser un UUID v4 válido' })
  apartmentId!: string;
}
