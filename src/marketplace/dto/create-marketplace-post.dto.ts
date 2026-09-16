import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, Min } from 'class-validator';

export class CreateMarketplacePostDto {
  @ApiProperty({
    description: 'Título de la publicación',
    example: 'Bicicleta de montaña seminueva',
  })
  @IsString()
  @IsNotEmpty({ message: 'El título es obligatorio' })
  title!: string;

  @ApiProperty({
    description: 'Descripción detallada del artículo o servicio',
    example: 'Marco de aluminio, 21 velocidades, excelente estado.',
  })
  @IsString()
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  description!: string;

  @ApiProperty({ description: 'Precio de venta', example: 450000.0 })
  @IsNumber({}, { message: 'El precio debe ser un número válido' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  @IsNotEmpty({ message: 'El precio es obligatorio' })
  price!: number;

  @ApiProperty({
    description: 'URL de la imagen del producto (opcional)',
    example: 'https://s3.amazonaws.com/bucket/img.jpg',
    required: false,
  })
  @IsUrl({}, { message: 'La imagen debe ser una URL válida' })
  @IsOptional()
  imageUrl?: string;
}
