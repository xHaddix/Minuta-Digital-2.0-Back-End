import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class DocumentTypeResponseDto {
  @ApiProperty({
    example: '9f159dd6-1827-48af-b11a-11e6fd5ffad4',
    description: 'Identificador único (UUID v4) del tipo de documento',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    example: 'CC',
    description: 'Código de negocio inmutable (CC, CE, NIT, PASSPORT)',
  })
  @Expose()
  code!: string;

  @ApiProperty({
    example: 'Cédula de ciudadanía',
    description: 'Descripción legible del tipo de documento',
    nullable: true,
  })
  @Expose()
  description!: string | null;
}
