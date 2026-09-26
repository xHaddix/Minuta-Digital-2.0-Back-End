import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsPhoneNumber, IsString, IsUUID, MinLength } from 'class-validator';

export class UpdateOwnProfileDto {
  @ApiPropertyOptional({ example: 'Carlos Alberto Pérez', minLength: 2 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: '+573001234567', nullable: true })
  @IsOptional()
  @IsPhoneNumber('CO')
  phone?: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  documentTypeId?: string | null;

  @ApiPropertyOptional({ example: '1018432901', nullable: true })
  @IsOptional()
  @IsString()
  documentNumber?: string | null;
}
