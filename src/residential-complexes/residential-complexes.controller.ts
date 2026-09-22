import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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
  @Roles(RoleCode.DEV, RoleCode.ORG_ADMIN)
  @ApiOperation({ summary: 'Lista los conjuntos residenciales visibles para el solicitante' })
  findAll(@CurrentUser() requester: JwtPayload) {
    return this.residentialComplexesService.findAll(requester);
  }

  @Get(':id')
  @Roles(RoleCode.DEV, RoleCode.ORG_ADMIN)
  @ApiOperation({ summary: 'Obtiene un conjunto residencial por ID' })
  findOne(@CurrentUser() requester: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.residentialComplexesService.findOne(requester, id);
  }

  @Get(':id/users')
  @Roles(RoleCode.DEV, RoleCode.ORG_ADMIN)
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
  @ApiOperation({ summary: 'Elimina un conjunto residencial' })
  remove(@CurrentUser() requester: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.residentialComplexesService.remove(id, requester);
  }
}
