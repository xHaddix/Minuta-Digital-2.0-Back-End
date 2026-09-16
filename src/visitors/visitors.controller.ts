import {
  BadRequestException,
  Body,
  Controller,
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
import { VisitorsService } from './visitors.service';
import { RegisterVisitorEntryDto } from './dto/register-visitor-entry.dto';

@ApiTags('Visitors')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('visitors')
export class VisitorsController {
  constructor(private readonly visitorsService: VisitorsService) {}

  @Get()
  @Roles(RoleCode.DEV, RoleCode.ORG_ADMIN, RoleCode.COMPLEX_ADMIN, RoleCode.SECURITY)
  @ApiOperation({ summary: 'Lista la minuta de ingresos de visitantes del conjunto activo' })
  findAll(@CurrentUser('residentialComplexId') residentialComplexId: string) {
    if (!residentialComplexId) {
      throw new BadRequestException(
        'Debe seleccionar un conjunto residencial activo para consultar la minuta',
      );
    }
    return this.visitorsService.findAll(residentialComplexId);
  }

  @Post('entry')
  @Roles(RoleCode.DEV, RoleCode.ORG_ADMIN, RoleCode.COMPLEX_ADMIN, RoleCode.SECURITY)
  @ApiOperation({ summary: 'Registra el ingreso de un visitante en portería' })
  registerEntry(
    @CurrentUser('residentialComplexId') residentialComplexId: string,
    @Body() dto: RegisterVisitorEntryDto,
  ) {
    if (!residentialComplexId) {
      throw new BadRequestException(
        'Debe seleccionar un conjunto residencial activo para registrar la entrada',
      );
    }
    return this.visitorsService.registerEntry(residentialComplexId, dto);
  }

  @Patch(':id/exit')
  @Roles(RoleCode.DEV, RoleCode.ORG_ADMIN, RoleCode.COMPLEX_ADMIN, RoleCode.SECURITY)
  @ApiOperation({ summary: 'Registra la marcación de salida de un visitante' })
  registerExit(
    @CurrentUser('residentialComplexId') residentialComplexId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    if (!residentialComplexId) {
      throw new BadRequestException(
        'Debe seleccionar un conjunto residencial activo para marcar la salida',
      );
    }
    return this.visitorsService.registerExit(residentialComplexId, id);
  }
}
