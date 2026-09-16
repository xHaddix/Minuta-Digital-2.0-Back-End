import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateAmenityBookingDto {
  @ApiProperty({
    description: 'ID de la amenidad (Salón social, BBQ, etc.)',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID('4', { message: 'El amenityId debe ser un UUID v4 válido' })
  @IsNotEmpty()
  amenityId!: string;

  @ApiProperty({ description: 'Fecha de la reserva (YYYY-MM-DD)', example: '2026-10-15' })
  @IsDateString({}, { message: 'La fecha debe tener un formato ISO8601 válido' })
  @IsNotEmpty()
  bookingDate!: string;

  @ApiProperty({ description: 'Hora de inicio de la reserva', example: '2026-10-15T14:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  startTime!: Date;

  @ApiProperty({
    description: 'Hora de finalización de la reserva',
    example: '2026-10-15T18:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  endTime!: Date;
}
