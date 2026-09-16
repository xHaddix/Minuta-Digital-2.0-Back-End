import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UpdateBookingStatusDto {
  @ApiProperty({
    description: 'Nuevo estado de la reserva',
    example: 'APPROVED',
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
  })
  @IsString()
  @IsIn(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'], { message: 'Estado no permitido' })
  @IsNotEmpty()
  status!: string;
}
