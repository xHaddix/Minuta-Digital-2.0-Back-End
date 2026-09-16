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
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { MarketplaceService } from './marketplace.service';
import { CreateMarketplacePostDto } from './dto/create-marketplace-post.dto';
import { UpdateMarketplacePostStatusDto } from './dto/update-marketplace-post-status.dto';

@ApiTags('Marketplace')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get()
  @Roles('ROLE_DEV', 'ROLE_ORG_ADMIN', 'ROLE_COMPLEX_ADMIN', 'ROLE_SECURITY', 'ROLE_RESIDENT')
  @ApiOperation({
    summary: 'Lista las publicaciones activas del mercado interno del conjunto residencial activo',
  })
  findAll(@CurrentUser('residentialComplexId') residentialComplexId: string) {
    if (!residentialComplexId) {
      throw new BadRequestException(
        'Debe seleccionar un conjunto residencial activo para consultar el mercado interno',
      );
    }
    return this.marketplaceService.findAll(residentialComplexId);
  }

  @Post()
  @Roles('ROLE_DEV', 'ROLE_ORG_ADMIN', 'ROLE_COMPLEX_ADMIN', 'ROLE_RESIDENT')
  @ApiOperation({ summary: 'Crea una publicación en el mercado interno del conjunto' })
  create(
    @CurrentUser('residentialComplexId') residentialComplexId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateMarketplacePostDto,
  ) {
    if (!residentialComplexId) {
      throw new BadRequestException(
        'Debe seleccionar un conjunto residencial activo para crear una publicación',
      );
    }
    return this.marketplaceService.create(residentialComplexId, userId, dto);
  }

  @Patch(':id/status')
  @Roles('ROLE_DEV', 'ROLE_ORG_ADMIN', 'ROLE_COMPLEX_ADMIN', 'ROLE_RESIDENT')
  @ApiOperation({ summary: 'Actualiza el estado de una publicación (ACTIVE, SOLD, INACTIVE)' })
  updateStatus(
    @CurrentUser('residentialComplexId') residentialComplexId: string,
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMarketplacePostStatusDto,
  ) {
    if (!residentialComplexId) {
      throw new BadRequestException(
        'Debe seleccionar un conjunto residencial activo para modificar la publicación',
      );
    }
    return this.marketplaceService.updateStatus(
      residentialComplexId,
      id,
      user.sub,
      user.roleCode,
      dto.status,
    );
  }
}
