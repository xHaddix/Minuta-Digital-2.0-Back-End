import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { RolesService } from './roles.service';
import { RoleResponseDto } from './dto/role-response.dto';

@ApiTags('Roles')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('assignable')
  @ApiOperation({
    summary: 'Listar roles asignables según el alcance jerárquico del solicitante',
    description:
      'Filtra los roles según la jerarquía RBAC para poblar selectores en formularios de invitación. ' +
      'DEV asigna todos; ORG_ADMIN asigna COMPLEX_ADMIN, SECURITY, RESIDENT; ' +
      'COMPLEX_ADMIN asigna SECURITY y RESIDENT.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de roles asignables obtenida exitosamente.',
    type: [RoleResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Token JWT ausente o inválido.',
  })
  async findAssignable(@CurrentUser() requester: JwtPayload): Promise<RoleResponseDto[]> {
    return this.rolesService.findAssignable(requester);
  }
}
