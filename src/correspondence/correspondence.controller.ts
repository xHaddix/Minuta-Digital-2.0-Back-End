import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CorrespondenceService } from './correspondence.service';
import { CreateCorrespondenceDto } from './dto/create-correspondence.dto';

@ApiTags('Correspondence')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('correspondence')
export class CorrespondenceController {
  constructor(private readonly correspondenceService: CorrespondenceService) {}

  @Get()
  @Roles('ROLE_DEV', 'ROLE_ORG_ADMIN', 'ROLE_COMPLEX_ADMIN', 'ROLE_SECURITY', 'ROLE_RESIDENT')
  @ApiOperation({ summary: 'Lista la correspondencia del conjunto residencial activo' })
  findAll(@CurrentUser('residentialComplexId') residentialComplexId: string) {
    if (!residentialComplexId) {
      throw new BadRequestException(
        'Debe seleccionar un conjunto residencial activo para consultar la correspondencia',
      );
    }
    return this.correspondenceService.findAll(residentialComplexId);
  }

  @Get(':id')
  @Roles('ROLE_DEV', 'ROLE_ORG_ADMIN', 'ROLE_COMPLEX_ADMIN', 'ROLE_SECURITY', 'ROLE_RESIDENT')
  @ApiOperation({ summary: 'Obtiene el detalle de una correspondencia' })
  findOne(
    @CurrentUser('residentialComplexId') residentialComplexId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    if (!residentialComplexId) {
      throw new BadRequestException('Debe seleccionar un conjunto residencial activo');
    }
    return this.correspondenceService.findOne(residentialComplexId, id);
  }

  @Post()
  @Roles('ROLE_DEV', 'ROLE_ORG_ADMIN', 'ROLE_COMPLEX_ADMIN', 'ROLE_SECURITY')
  @ApiOperation({ summary: 'Registra la llegada de un paquete/correspondencia con foto opcional' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo'))
  create(
    @CurrentUser('residentialComplexId') residentialComplexId: string,
    @Body() dto: CreateCorrespondenceDto,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    if (!residentialComplexId) {
      throw new BadRequestException(
        'Debe seleccionar un conjunto residencial activo para registrar correspondencia',
      );
    }
    return this.correspondenceService.create(residentialComplexId, dto, photo);
  }

  @Patch(':id/deliver')
  @Roles('ROLE_DEV', 'ROLE_ORG_ADMIN', 'ROLE_COMPLEX_ADMIN', 'ROLE_SECURITY')
  @ApiOperation({ summary: 'Marca una correspondencia como entregada al residente' })
  markAsDelivered(
    @CurrentUser('residentialComplexId') residentialComplexId: string,
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    if (!residentialComplexId) {
      throw new BadRequestException(
        'Debe seleccionar un conjunto residencial activo para actualizar entregas',
      );
    }
    return this.correspondenceService.markAsDelivered(residentialComplexId, id, userId);
  }
}
