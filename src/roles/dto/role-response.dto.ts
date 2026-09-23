import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class RoleResponseDto {
  @ApiProperty({
    example: '800cbfd7-a5f1-428e-aae5-b354e8c8ae08',
    description: 'Identificador único (UUID v4) del rol',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    example: 'ROLE_COMPLEX_ADMIN',
    description: 'Código único de negocio inmutable del rol',
  })
  @Expose()
  code!: string;

  @ApiProperty({
    example: 'Administrador de Conjunto',
    description: 'Nombre legible del rol para la interfaz de usuario',
  })
  @Expose()
  name!: string;

  @ApiProperty({
    example: 'Gestión operativa total dentro del conjunto residencial',
    description: 'Descripción detallada de las facultades del rol',
    nullable: true,
  })
  @Expose()
  description!: string | null;
}
