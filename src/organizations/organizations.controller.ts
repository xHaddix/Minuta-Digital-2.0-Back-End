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
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { RoleCode } from '../common/constants/role.constants';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@ApiTags('Organizations')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  @Roles(RoleCode.DEV, RoleCode.ORG_ADMIN)
  @ApiOperation({ summary: 'Lista las organizaciones visibles para el solicitante' })
  findAll(@CurrentUser() requester: JwtPayload) {
    return this.organizationsService.findAll(requester);
  }

  @Get(':id')
  @Roles(RoleCode.DEV, RoleCode.ORG_ADMIN)
  @ApiOperation({ summary: 'Obtiene una organización por ID' })
  findOne(@CurrentUser() requester: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.findOne(requester, id);
  }

  @Get(':id/users')
  @Roles(RoleCode.DEV, RoleCode.ORG_ADMIN)
  @ApiOperation({ summary: 'Lista los usuarios pertenecientes a una organización' })
  getUsersByOrganization(
    @CurrentUser() requester: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.organizationsService.getUsersByOrganization(id, requester);
  }

  @Post()
  @Roles(RoleCode.DEV, RoleCode.ORG_ADMIN)
  @ApiOperation({ summary: 'Crea una nueva organización' })
  create(@CurrentUser() requester: JwtPayload, @Body() dto: CreateOrganizationDto) {
    return this.organizationsService.create(dto, requester);
  }

  @Patch(':id')
  @Roles(RoleCode.DEV, RoleCode.ORG_ADMIN)
  @ApiOperation({ summary: 'Actualiza una organización' })
  update(
    @CurrentUser() requester: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(id, dto, requester);
  }

  @Post(':id/logo')
  @Roles(RoleCode.DEV, RoleCode.ORG_ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  uploadLogo(
    @CurrentUser() requester: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(png|jpeg|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.organizationsService.uploadLogo(id, file, requester);
  }

  @Delete(':id')
  @Roles(RoleCode.DEV)
  @ApiOperation({ summary: 'Elimina una organización' })
  remove(@CurrentUser() requester: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.remove(id, requester);
  }
}
