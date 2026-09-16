import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

/**
 * DTO utilizado por un Administrador para invitar/crear un nuevo usuario.
 * El usuario se crea con `status = 2` (Pendiente) y sin contraseña; recibirá
 * un correo con un enlace de activación para definir su propia contraseña.
 *
 * IMPORTANTE: `organizationId` y `residentialComplexId` son OPCIONALES a
 * nivel de DTO porque su exigencia depende del rol (`roleId`) seleccionado;
 * la validación estricta la realiza `UserHierarchyService` en tiempo de
 * ejecución:
 *   - ROLE_DEV           -> ninguno de los dos debe enviarse.
 *   - ROLE_ORG_ADMIN     -> organizationId es obligatorio; residentialComplexId debe omitirse.
 *   - ROLE_COMPLEX_ADMIN / ROLE_SECURITY / ROLE_RESIDENT
 *                        -> residentialComplexId es obligatorio; organizationId
 *                           se deriva automáticamente y NO debe enviarse.
 */
export class InviteUserDto {
  @ApiProperty({ example: 'nuevo.usuario@conjuntolospinos.com' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'Juana Pérez' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name!: string;

  @ApiProperty({
    description: 'Id del rol (tabla Role) que se asignará al nuevo usuario.',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID('4', { message: 'roleId debe ser un UUID válido' })
  @IsNotEmpty()
  roleId!: string;

  @ApiPropertyOptional({ example: '+57 300 123 4567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description:
      'Id de la organización. REQUERIDO únicamente para ROLE_ORG_ADMIN; ' +
      'para roles de conjunto se deriva automáticamente y no debe enviarse.',
  })
  @IsOptional()
  @IsUUID('4')
  organizationId?: string;

  @ApiPropertyOptional({
    description:
      'Id del conjunto residencial. REQUERIDO para ROLE_COMPLEX_ADMIN, ' +
      'ROLE_SECURITY y ROLE_RESIDENT; no aplica para ROLE_DEV/ROLE_ORG_ADMIN.',
  })
  @IsOptional()
  @IsUUID('4')
  residentialComplexId?: string;

  @ApiPropertyOptional({ description: 'Id del tipo de documento (catálogo DocumentType).' })
  @IsOptional()
  @IsUUID('4')
  documentTypeId?: string;

  @ApiPropertyOptional({ example: '1020304050' })
  @IsOptional()
  @IsString()
  documentNumber?: string;
}
