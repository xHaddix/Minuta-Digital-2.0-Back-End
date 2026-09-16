import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { RoleCode } from '../common/constants/role.constants';
import { UsersService } from './users.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { InviteUserResponseDto } from './dto/invite-user-response.dto';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(RoleCode.DEV, RoleCode.ORG_ADMIN, RoleCode.COMPLEX_ADMIN, RoleCode.SECURITY)
  @ApiOperation({
    summary: 'Lista los usuarios dentro del alcance jerárquico del solicitante',
    description:
      'ROLE_DEV ve todos los usuarios; ROLE_ORG_ADMIN ve los de su organización; ' +
      'los roles de conjunto ven solo los de su propio conjunto residencial.',
  })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.usersService.findAll(user);
  }

  @Get(':id')
  @Roles(RoleCode.DEV, RoleCode.ORG_ADMIN, RoleCode.COMPLEX_ADMIN, RoleCode.SECURITY)
  @ApiOperation({ summary: 'Obtiene un usuario por id (dentro del alcance del solicitante)' })
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
      'valida automáticamente según el rol asignado; ver UserHierarchyService.',
  })
  inviteUser(
    @CurrentUser() requester: JwtPayload,
    @Body() dto: InviteUserDto,
  ): Promise<InviteUserResponseDto> {
    return this.usersService.inviteUser(dto, requester);
  }
}
