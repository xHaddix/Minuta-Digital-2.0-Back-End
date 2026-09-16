import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UpdatePqrsStatusDto {
  @ApiProperty({
    description: 'Nuevo estado del ticket PQRS',
    example: 'IN_PROGRESS',
    enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
  })
  @IsString()
  @IsIn(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'], {
    message: 'El estado debe ser OPEN, IN_PROGRESS, RESOLVED o CLOSED',
  })
  @IsNotEmpty({ message: 'El estado es obligatorio' })
  status!: string;
}
