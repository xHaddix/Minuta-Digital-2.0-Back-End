import {
  BadRequestException,
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
import { RoleCode } from '../common/constants/role.constants';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { ApartmentsService } from './apartments.service';
import { CreateApartmentDto } from './dto/create-apartment.dto';
import { UpdateApartmentDto } from './dto/update-apartment.dto';

@ApiTags('Apartments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('apartments')
export class ApartmentsController {
  constructor(private readonly apartmentsService: ApartmentsService) {}

  @Get()
  @Roles(RoleCode.DEV, RoleCode.ORG_ADMIN, RoleCode.COMPLEX_ADMIN, RoleCode.SECURITY)
  @ApiOperation({ summary: 'Lista las unidades activas del conjunto actual' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  findAll(
    @CurrentUser() requester: JwtPayload,
    @Query('includeInactive') includeInactive?: string,
  ) {
    this.validateComplexContext(requester);
    return this.apartmentsService.findAll(requester, includeInactive === 'true');
  }

  @Post()
  @Roles(RoleCode.DEV, RoleCode.ORG_ADMIN, RoleCode.COMPLEX_ADMIN)
  @ApiOperation({ summary: 'Crea una unidad en el conjunto actual' })
  create(@CurrentUser() requester: JwtPayload, @Body() dto: CreateApartmentDto) {
    this.validateComplexContext(requester);
    return this.apartmentsService.create(requester, dto);
  }

  @Patch(':id')
  @Roles(RoleCode.DEV, RoleCode.ORG_ADMIN, RoleCode.COMPLEX_ADMIN)
  @ApiOperation({ summary: 'Edita una unidad del conjunto actual' })
  update(
    @CurrentUser() requester: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateApartmentDto,
  ) {
    this.validateComplexContext(requester);
    return this.apartmentsService.update(requester, id, dto);
  }

  @Delete(':id')
  @Roles(RoleCode.DEV, RoleCode.ORG_ADMIN, RoleCode.COMPLEX_ADMIN)
  @ApiOperation({ summary: 'Desactiva una unidad del conjunto actual' })
  remove(@CurrentUser() requester: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    this.validateComplexContext(requester);
    return this.apartmentsService.remove(requester, id);
  }

  /**
   * Valida que el JWT del usuario contenga un contexto de conjunto residencial activo.
   */
  private validateComplexContext(requester: JwtPayload): void {
    if (!requester.residentialComplexId && requester.roleCode !== RoleCode.DEV) {
      throw new BadRequestException('Debe seleccionar un conjunto residencial activo');
    }
  }
}
