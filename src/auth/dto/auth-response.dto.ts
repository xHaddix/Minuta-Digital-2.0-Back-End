import { ApiProperty } from '@nestjs/swagger';

class AuthUserDto {
  @ApiProperty() id!: string;
  @ApiProperty() email!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ description: 'URL pública de la imagen de perfil', nullable: true })
  imgProfile!: string | null;
  @ApiProperty({ description: 'Código del rol (tabla roles.code)' }) roleCode!: string;
  @ApiProperty({ description: 'Nombre legible del rol' }) roleName!: string;
  @ApiProperty({ nullable: true }) organizationId!: string | null;
  @ApiProperty({ nullable: true }) residentialComplexId!: string | null;
  @ApiProperty({ nullable: true }) dataTreatmentAcceptedAt!: Date | null;
  @ApiProperty({ nullable: true }) dataTreatmentVersion!: string | null;
}

export class AuthResponseDto {
  @ApiProperty() accessToken!: string;
  @ApiProperty({ type: AuthUserDto }) user!: AuthUserDto;
  @ApiProperty({ type: [String] }) permissions!: string[];
  @ApiProperty({ example: '2026-09-28-v1' }) dataTreatmentPolicyVersion!: string;
}
