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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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
  findAll(@CurrentUser() requester: JwtPayload) {
    return this.withComplex(requester, (complexId) => this.apartmentsService.findAll(complexId));
  }

  @Post()
  @Roles(RoleCode.DEV, RoleCode.ORG_ADMIN, RoleCode.COMPLEX_ADMIN)
  @ApiOperation({ summary: 'Crea una unidad en el conjunto actual' })
  create(@CurrentUser() requester: JwtPayload, @Body() dto: CreateApartmentDto) {
    return this.withComplex(requester, (complexId) =>
      this.apartmentsService.create(complexId, dto),
    );
  }

  @Patch(':id')
  @Roles(RoleCode.DEV, RoleCode.ORG_ADMIN, RoleCode.COMPLEX_ADMIN)
  @ApiOperation({ summary: 'Edita una unidad del conjunto actual' })
  update(
    @CurrentUser() requester: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateApartmentDto,
  ) {
    return this.withComplex(requester, (complexId) =>
      this.apartmentsService.update(complexId, id, dto),
    );
  }

  @Delete(':id')
  @Roles(RoleCode.DEV, RoleCode.ORG_ADMIN, RoleCode.COMPLEX_ADMIN)
  @ApiOperation({ summary: 'Desactiva una unidad del conjunto actual' })
  remove(@CurrentUser() requester: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.withComplex(requester, (complexId) => this.apartmentsService.remove(complexId, id));
  }

  private withComplex<T>(requester: JwtPayload, operation: (complexId: string) => T): T {
    if (!requester.residentialComplexId) {
      throw new BadRequestException('Debe seleccionar un conjunto residencial activo');
    }
    return operation(requester.residentialComplexId);
  }
}
