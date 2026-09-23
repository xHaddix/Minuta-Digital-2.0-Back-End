import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentTypesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene la lista de tipos de documento activos (status = 1)
   * ordenados alfabéticamente por su código de negocio (CC, CE, NIT, etc.).
   */
  async findAll() {
    return this.prisma.documentType.findMany({
      where: {
        status: 1,
      },
      select: {
        id: true,
        code: true,
        description: true,
      },
      orderBy: {
        code: 'asc',
      },
    });
  }

  /**
   * Busca un tipo de documento activo por su ID (UUID v4).
   */
  async findOne(id: string) {
    const documentType = await this.prisma.documentType.findFirst({
      where: {
        id,
        status: 1,
      },
      select: {
        id: true,
        code: true,
        description: true,
      },
    });

    if (!documentType) {
      throw new NotFoundException('Tipo de documento no encontrado o inactivo');
    }

    return documentType;
  }
}
