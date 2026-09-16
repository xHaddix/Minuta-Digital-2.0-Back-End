import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UpdateMarketplacePostStatusDto {
  @ApiProperty({
    description: 'Nuevo estado de la publicación',
    example: 'SOLD',
    enum: ['ACTIVE', 'SOLD', 'INACTIVE'],
  })
  @IsString()
  @IsIn(['ACTIVE', 'SOLD', 'INACTIVE'], { message: 'El estado debe ser ACTIVE, SOLD o INACTIVE' })
  @IsNotEmpty({ message: 'El estado es obligatorio' })
  status!: string;
}
