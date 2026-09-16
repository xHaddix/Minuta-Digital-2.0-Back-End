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
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { PqrsService } from './pqrs.service';
import { CreatePqrsTicketDto } from './dto/create-pqrs-ticket.dto';
import { UpdatePqrsStatusDto } from './dto/update-pqrs-status.dto';

@ApiTags('PQRS')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pqrs')
export class PqrsController {
  constructor(private readonly pqrsService: PqrsService) {}

  @Get()
  @Roles('ROLE_DEV', 'ROLE_ORG_ADMIN', 'ROLE_COMPLEX_ADMIN', 'ROLE_SECURITY', 'ROLE_RESIDENT')
  @ApiOperation({ summary: 'Lista los tickets PQRS (Filtrados por rol y conjunto activo)' })
  findAll(@CurrentUser() user: JwtPayload) {
    if (!user.residentialComplexId) {
      throw new BadRequestException(
        'Debe seleccionar un conjunto residencial activo para consultar PQRS',
      );
    }
    return this.pqrsService.findAll(user.residentialComplexId, user.sub, user.roleCode);
  }

  @Get(':id')
  @Roles('ROLE_DEV', 'ROLE_ORG_ADMIN', 'ROLE_COMPLEX_ADMIN', 'ROLE_SECURITY', 'ROLE_RESIDENT')
  @ApiOperation({ summary: 'Obtiene el detalle de un ticket PQRS' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    if (!user.residentialComplexId) {
      throw new BadRequestException('Debe seleccionar un conjunto residencial activo');
    }
    return this.pqrsService.findOne(user.residentialComplexId, id, user.sub, user.roleCode);
  }

  @Post()
  @Roles('ROLE_DEV', 'ROLE_ORG_ADMIN', 'ROLE_COMPLEX_ADMIN', 'ROLE_RESIDENT')
  @ApiOperation({ summary: 'Crea un nuevo ticket PQRS con adjunto opcional' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('attachment'))
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePqrsTicketDto,
    @UploadedFile() attachment?: Express.Multer.File,
  ) {
    if (!user.residentialComplexId) {
      throw new BadRequestException(
        'Debe seleccionar un conjunto residencial activo para crear una PQRS',
      );
    }
    return this.pqrsService.create(user.residentialComplexId, user.sub, dto, attachment);
  }

  @Patch(':id/status')
  @Roles('ROLE_DEV', 'ROLE_ORG_ADMIN', 'ROLE_COMPLEX_ADMIN')
  @ApiOperation({ summary: 'Actualiza el estado de un ticket PQRS (Administración)' })
  updateStatus(
    @CurrentUser('residentialComplexId') residentialComplexId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePqrsStatusDto,
  ) {
    if (!residentialComplexId) {
      throw new BadRequestException(
        'Debe seleccionar un conjunto residencial activo para actualizar el estado',
      );
    }
    return this.pqrsService.updateStatus(residentialComplexId, id, dto.status);
  }
}
