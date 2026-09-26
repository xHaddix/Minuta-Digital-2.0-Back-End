import {
  BadRequestException,
  Body,
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { StorageService } from './storage.service';
import { UploadFileDto } from './dto/upload-file.dto';

@ApiTags('Storage')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @Roles('ROLE_DEV', 'ROLE_ORG_ADMIN', 'ROLE_COMPLEX_ADMIN', 'ROLE_SECURITY', 'ROLE_RESIDENT')
  @ApiOperation({
    summary: 'Sube un archivo aislado bajo el conjunto residencial activo',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'module'],
      properties: {
        file: { type: 'string', format: 'binary' },
        module: {
          type: 'string',
          enum: ['correspondence', 'pqrs', 'marketplace', 'amenities', 'visitors', 'general'],
          example: 'general',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // Máximo 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp|pdf)$/ }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Body() body: UploadFileDto,
    @CurrentUser('residentialComplexId') residentialComplexId: string,
  ) {
    if (!residentialComplexId) {
      throw new BadRequestException(
        'Debe seleccionar un conjunto residencial activo para subir archivos',
      );
    }

    return this.storageService.uploadFile({
      tenantId: residentialComplexId, // S3 key: {residentialComplexId}/{module}/{uuid}-{fileName}
      module: body.module,
      fileName: file.originalname,
      body: file.buffer,
      contentType: file.mimetype,
    });
  }
}
