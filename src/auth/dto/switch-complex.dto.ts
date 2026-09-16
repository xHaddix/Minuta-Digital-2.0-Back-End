import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class SwitchComplexDto {
  @ApiProperty({
    description: 'ID del conjunto residencial al cual se desea ingresar',
    example: 'd9b2b687-3520-4e31-8f5f-9e7d9c66f2a1',
  })
  @IsUUID('4', { message: 'El residentialComplexId debe ser un UUID v4 válido' })
  @IsNotEmpty({ message: 'El residentialComplexId es obligatorio' })
  residentialComplexId!: string;
}
