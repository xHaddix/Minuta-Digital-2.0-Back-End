import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AmenitiesService } from './amenities.service';
import { CreateAmenityBookingDto } from './dto/create-amenity-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

@ApiTags('Amenities')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('amenities')
export class AmenitiesController {
  constructor(private readonly amenitiesService: AmenitiesService) {}

  @Get('bookings')
  @Roles('ROLE_DEV', 'ROLE_ORG_ADMIN', 'ROLE_COMPLEX_ADMIN', 'ROLE_SECURITY', 'ROLE_RESIDENT')
  @ApiOperation({ summary: 'Lista las reservas de zonas comunes del conjunto activo' })
  findAll(@CurrentUser('residentialComplexId') residentialComplexId: string) {
    if (!residentialComplexId) {
      throw new BadRequestException(
        'Debe seleccionar un conjunto residencial activo para consultar reservas',
      );
    }
    return this.amenitiesService.findAll(residentialComplexId);
  }

  @Post('bookings')
  @Roles('ROLE_DEV', 'ROLE_ORG_ADMIN', 'ROLE_COMPLEX_ADMIN', 'ROLE_RESIDENT')
  @ApiOperation({ summary: 'Crea una reserva de amenidad' })
  create(
    @CurrentUser('residentialComplexId') residentialComplexId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateAmenityBookingDto,
  ) {
    if (!residentialComplexId) {
      throw new BadRequestException(
        'Debe seleccionar un conjunto residencial activo para realizar una reserva',
      );
    }
    return this.amenitiesService.create(residentialComplexId, {
      ...dto,
      userId,
    });
  }

  @Patch('bookings/:id/status')
  @Roles('ROLE_DEV', 'ROLE_ORG_ADMIN', 'ROLE_COMPLEX_ADMIN')
  @ApiOperation({ summary: 'Actualiza el estado de una reserva (Aprobar/Rechazar)' })
  updateStatus(
    @CurrentUser('residentialComplexId') residentialComplexId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    if (!residentialComplexId) {
      throw new BadRequestException(
        'Debe seleccionar un conjunto residencial activo para modificar el estado',
      );
    }
    return this.amenitiesService.updateStatus(id, residentialComplexId, dto.status);
  }
}
