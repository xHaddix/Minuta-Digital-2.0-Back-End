import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { StorageModuleKey } from '../storage.types';

export class UploadFileDto {
  @ApiProperty({
    description: 'Módulo de destino para clasificar el archivo en el bucket S3',
    example: 'correspondence',
    enum: ['correspondence', 'pqrs', 'marketplace', 'amenities', 'visitors', 'general'],
  })
  @IsString()
  @IsIn(['correspondence', 'pqrs', 'marketplace', 'amenities', 'visitors', 'general'], {
    message: 'El módulo especificado no es válido',
  })
  @IsNotEmpty({ message: 'El módulo es obligatorio' })
  module!: StorageModuleKey;
}
