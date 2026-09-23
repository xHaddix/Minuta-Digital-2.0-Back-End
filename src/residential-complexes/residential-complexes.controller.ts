import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { RoleCode } from '../common/constants/role.constants';
import { ResidentialComplexesService } from './residential-complexes.service';
import { CreateResidentialComplexDto } from './dto/create-residential-complex.dto';
import { UpdateResidentialComplexDto } from './dto/update-residential-complex.dto';

@ApiTags('Residential Complexes')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('residential-complexes')
export class ResidentialComplexesController {
  constructor(private readonly residentialComplexesService: ResidentialComplexesService) {}

  @Get()
  @Roles(
    RoleCode.DEV,
    RoleCode.ORG_ADMIN,
    RoleCode.COMPLEX_ADMIN,
    RoleCode.SECURITY,
    RoleCode.RESIDENT,
  )
  @ApiOperation({
    summary: 'Lista los conjuntos residenciales visibles para el solicitante',
    description:
      'DEV ve todos (o filtra por organizationId opcional); ORG_ADMIN ve los de su organización; ' +
      'COMPLEX_ADMIN, SECURITY y RESIDENT ven únicamente su propio conjunto.',
  })
  @ApiQuery({
    name: 'organizationId',
    required: false,
    type: String,
    description: 'Filtro opcional por ID de organización (aplicable solo para ROLE_DEV)',
  })
  findAll(@CurrentUser() requester: JwtPayload, @Query('organizationId') organizationId?: string) {
    return this.residentialComplexesService.findAll(requester, organizationId);
  }

  @Get(':id')
  @Roles(
    RoleCode.DEV,
    RoleCode.ORG_ADMIN,
    RoleCode.COMPLEX_ADMIN,
    RoleCode.SECURITY,
    RoleCode.RESIDENT,
  )
  @ApiOperation({
    summary: 'Obtiene un conjunto residencial por ID (dentro del scope del usuario)',
  })
  findOne(@CurrentUser() requester: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.residentialComplexesService.findOne(requester, id);
  }

  @Get(':id/users')
  @Roles(RoleCode.DEV, RoleCode.ORG_ADMIN, RoleCode.COMPLEX_ADMIN)
  @ApiOperation({ summary: 'Lista los usuarios asociados a un conjunto residencial' })
  getUsersByComplex(@CurrentUser() requester: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.residentialComplexesService.getUsersByComplex(id, requester);
  }

  @Post()
  @Roles(RoleCode.DEV, RoleCode.ORG_ADMIN)
  @ApiOperation({ summary: 'Crea un nuevo conjunto residencial' })
  create(@CurrentUser() requester: JwtPayload, @Body() dto: CreateResidentialComplexDto) {
    return this.residentialComplexesService.create(dto, requester);
  }

  @Patch(':id')
  @Roles(RoleCode.DEV, RoleCode.ORG_ADMIN)
  @ApiOperation({ summary: 'Actualiza un conjunto residencial' })
  update(
    @CurrentUser() requester: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateResidentialComplexDto,
  ) {
    return this.residentialComplexesService.update(id, dto, requester);
  }

  @Delete(':id')
  @Roles(RoleCode.DEV)
  @ApiOperation({ summary: 'Elimina un conjunto residencial (Soft-delete status = 0)' })
  remove(@CurrentUser() requester: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.residentialComplexesService.remove(id, requester);
  }
}
