import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ResidentsService } from './residents.service';
import { CreateResidentDto } from './dto/create-resident.dto';

@ApiTags('Residents')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('residents')
export class ResidentsController {
  constructor(private readonly residentsService: ResidentsService) {}

  @Get()
  @Roles('ROLE_DEV', 'ROLE_ORG_ADMIN', 'ROLE_COMPLEX_ADMIN', 'ROLE_SECURITY')
  @ApiOperation({
    summary: 'Lista los residentes del conjunto residencial activo',
  })
  findAll(@CurrentUser('residentialComplexId') residentialComplexId: string) {
    if (!residentialComplexId) {
      throw new BadRequestException(
        'Debe seleccionar un conjunto residencial activo para consultar residentes',
      );
    }
    return this.residentsService.findAll(residentialComplexId);
  }

  @Get(':id')
  @Roles('ROLE_DEV', 'ROLE_ORG_ADMIN', 'ROLE_COMPLEX_ADMIN', 'ROLE_SECURITY')
  @ApiOperation({ summary: 'Obtiene el detalle de un residente por ID' })
  findOne(
    @CurrentUser('residentialComplexId') residentialComplexId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    if (!residentialComplexId) {
      throw new BadRequestException('Debe seleccionar un conjunto residencial activo');
    }
    return this.residentsService.findOne(residentialComplexId, id);
  }

  @Post()
  @Roles('ROLE_DEV', 'ROLE_ORG_ADMIN', 'ROLE_COMPLEX_ADMIN')
  @ApiOperation({ summary: 'Registra un nuevo residente en el conjunto' })
  create(
    @CurrentUser('residentialComplexId') residentialComplexId: string,
    @Body() dto: CreateResidentDto,
  ) {
    if (!residentialComplexId) {
      throw new BadRequestException(
        'Debe seleccionar un conjunto residencial activo para registrar un residente',
      );
    }
    return this.residentsService.create(residentialComplexId, dto);
  }
}
