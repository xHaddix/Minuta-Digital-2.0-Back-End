import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DocumentTypesService } from './document-types.service';
import { DocumentTypeResponseDto } from './dto/document-type-response.dto';

@ApiTags('document-types')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('document-types')
export class DocumentTypesController {
  constructor(private readonly documentTypesService: DocumentTypesService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar catálogo de tipos de documento activos',
    description:
      'Retorna la lista de tipos de documento activos en el sistema (CC, CE, NIT, PASSPORT, etc.) para poblar desplegables en formularios.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de tipos de documento obtenida exitosamente.',
    type: [DocumentTypeResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Token JWT ausente o inválido.',
  })
  async findAll(): Promise<DocumentTypeResponseDto[]> {
    return this.documentTypesService.findAll();
  }
}
