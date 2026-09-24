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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { VisitorsService } from './visitors.service';
import { RegisterVisitorEntryDto } from './dto/register-visitor-entry.dto';

@ApiTags('Visitors')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('visitors')
export class VisitorsController {
  constructor(private readonly visitorsService: VisitorsService) {}

  @Get()
  @RequirePermissions('visitors:read')
  @ApiOperation({ summary: 'Lista la minuta de ingresos de visitantes del conjunto activo' })
  findAll(@CurrentUser('residentialComplexId') residentialComplexId: string) {
    if (!residentialComplexId) {
      throw new BadRequestException(
        'Debe seleccionar un conjunto residencial activo para consultar la minuta',
      );
    }
    return this.visitorsService.findAll(residentialComplexId);
  }

  @Post()
  @RequirePermissions('visitors:create')
  @ApiOperation({ summary: 'Registra el ingreso de un visitante en portería' })
  registerEntry(@CurrentUser() requester: JwtPayload, @Body() dto: RegisterVisitorEntryDto) {
    if (!requester.residentialComplexId) {
      throw new BadRequestException(
        'Debe seleccionar un conjunto residencial activo para registrar la entrada',
      );
    }
    return this.visitorsService.registerEntry(requester.residentialComplexId, requester.sub, dto);
  }

  @Patch(':id/exit')
  @RequirePermissions('visitors:check_out')
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
