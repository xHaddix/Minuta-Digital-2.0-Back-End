import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUUID,
  IsUrl,
  MinLength,
} from 'class-validator';
import { UserStatus } from '../../common/constants/user-token.constants';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'URL de la imagen de perfil del usuario',
    example: 'https://cdn.example.com/avatar.png',
  })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  imgProfile?: string;

  @ApiPropertyOptional({
    description: 'Nombre completo del usuario',
    example: 'Carlos Alberto Pérez',
    minLength: 2,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({
    description:
      'Número telefónico en formato internacional (Código de país Colombia +57 por defecto)',
    example: '+573001234567',
  })
  @IsOptional()
  @IsPhoneNumber('CO')
  phone?: string;

  @ApiPropertyOptional({
    description: 'UUID del rol que se desea asignar al usuario',
    example: 'a2f7577-5bee-4649-86b1-1231234312132',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  roleId?: string;

  @ApiPropertyOptional({
    description: 'UUID del tipo de documento de identidad',
    example: '9f159dd6-1827-48af-b11a-112758734',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  documentTypeId?: string;

  @ApiPropertyOptional({
    description: 'Número de documento de identidad del usuario',
    example: '1018432901',
  })
  @IsOptional()
  @IsString()
  documentNumber?: string;

  @ApiPropertyOptional({
    description: 'Estado operativo del usuario en el sistema (0: INACTIVE, 1: ACTIVE, 2: PENDING)',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: number;
}
