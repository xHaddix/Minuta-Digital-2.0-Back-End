import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../storage/storage.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { RoleCode } from '../common/constants/role.constants';
import { UsersService } from './users.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InviteUserResponseDto } from './dto/invite-user-response.dto';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly storageService: StorageService,
  ) {}

  @Post(':id/avatar')
  @Roles(
    RoleCode.DEV,
    RoleCode.ORG_ADMIN,
    RoleCode.COMPLEX_ADMIN,
    RoleCode.SECURITY,
    RoleCode.RESIDENT,
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({ summary: 'Sube el avatar del usuario y guarda su URL de perfil' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @CurrentUser() requester: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(png|jpeg|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const user = await this.usersService.findOne(requester, id);
    if (!user.residentialComplexId)
      throw new BadRequestException('El usuario no pertenece a un conjunto residencial');
    const asset = await this.storageService.uploadUserAvatar(
      user.residentialComplexId,
      id,
      file.buffer,
      file.mimetype,
    );
    return this.usersService.updateProfileImage(requester, id, asset.url);
  }

  @Get()
  @Roles(RoleCode.DEV, RoleCode.ORG_ADMIN, RoleCode.COMPLEX_ADMIN, RoleCode.SECURITY)
  @ApiOperation({
    summary: 'Lista los usuarios dentro del alcance jerárquico del solicitante',
    description:
      'ROLE_DEV ve todos los usuarios; ROLE_ORG_ADMIN ve los de su organización; ' +
      'los roles de conjunto ven solo los de su propio conjunto residencial.',
  })
  @ApiResponse({ status: 200, description: 'Lista de usuarios devuelta exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autenticado (JWT inválido o expirado).' })
  @ApiResponse({ status: 403, description: 'No autorizado para acceder a este ámbito.' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.usersService.findAll(user);
  }

  @Get(':id')
  @Roles(RoleCode.DEV, RoleCode.ORG_ADMIN, RoleCode.COMPLEX_ADMIN, RoleCode.SECURITY)
  @ApiOperation({ summary: 'Obtiene un usuario por id (dentro del alcance del solicitante)' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado.' })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado o fuera del ámbito del solicitante.',
  })
  findOne(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(user, id);
  }

  @Post('invite')
  @Roles(RoleCode.DEV, RoleCode.ORG_ADMIN, RoleCode.COMPLEX_ADMIN)
  @ApiOperation({
    summary: 'Invita a un nuevo usuario (queda en estado Pendiente hasta que active su cuenta)',
    description:
      'Crea el usuario sin contraseña, genera un token de activación de un solo uso ' +
      '(válido por 24 horas) y le envía un correo con el enlace para definir su ' +
      'contraseña. La jerarquía (organizationId/residentialComplexId) se resuelve y ' +
      'valida automáticamente según el rol asignado.',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario invitado exitosamente.',
    type: InviteUserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos o error en el envío del correo.',
  })
  @ApiResponse({ status: 409, description: 'El correo electrónico ya se encuentra registrado.' })
  inviteUser(
    @CurrentUser() requester: JwtPayload,
    @Body() dto: InviteUserDto,
  ): Promise<InviteUserResponseDto> {
    return this.usersService.inviteUser(dto, requester);
  }

  @Patch(':id')
  @Roles(RoleCode.DEV, RoleCode.ORG_ADMIN, RoleCode.COMPLEX_ADMIN)
  @ApiOperation({
    summary: 'Actualiza parcialmente los datos de un usuario',
    description:
      'Permite actualizar nombre, teléfono, rol, tipo/número de documento y estado. ' +
      'Aplica re-evaluación RBAC si se modifica el rol y bloquea la auto-modificación del estado.',
  })
  @ApiResponse({ status: 200, description: 'Usuario actualizado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Intento de cambiar el propio estado o DTO inválido.' })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos jerárquicos para asignar el nuevo rol.',
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado o fuera del alcance.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() requester: JwtPayload,
  ) {
    return this.usersService.update(id, updateUserDto, requester);
  }

  @Delete(':id')
  @Roles(RoleCode.DEV, RoleCode.ORG_ADMIN, RoleCode.COMPLEX_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Elimina o desactiva un usuario según su estado operativo',
    description:
      'Ejecuta Hard Delete si el usuario está en estado PENDING (limpiando tokens de activación). ' +
      'Si el usuario ya estuvo ACTIVO, ejecuta Soft Delete (status = INACTIVE) para preservar la integridad referencial.',
  })
  @ApiResponse({ status: 200, description: 'Usuario eliminado o desactivado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Intento de eliminar la propia cuenta autenticada.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado o fuera del alcance.' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() requester: JwtPayload) {
    return this.usersService.remove(id, requester);
  }
}
