import { ApiProperty } from '@nestjs/swagger';

class AuthUserDto {
  @ApiProperty() id!: string;
  @ApiProperty() email!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ description: 'Código del rol (tabla roles.code)' }) roleCode!: string;
  @ApiProperty({ description: 'Nombre legible del rol' }) roleName!: string;
  @ApiProperty({ nullable: true }) organizationId!: string | null;
  @ApiProperty({ nullable: true }) residentialComplexId!: string | null;
}

export class AuthResponseDto {
  @ApiProperty() accessToken!: string;
  @ApiProperty({ type: AuthUserDto }) user!: AuthUserDto;
}
