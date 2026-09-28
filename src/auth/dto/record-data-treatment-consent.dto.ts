import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RecordDataTreatmentConsentDto {
  @ApiProperty({ example: '2026-09-28-v1' })
  @IsString()
  @IsNotEmpty()
  version!: string;
}
