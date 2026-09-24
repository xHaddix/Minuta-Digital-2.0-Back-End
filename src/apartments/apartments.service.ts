import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApartmentDto } from './dto/create-apartment.dto';
import { UpdateApartmentDto } from './dto/update-apartment.dto';

@Injectable()
export class ApartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene la lista de apartamentos acotados por el token JWT (Zero-Trust Scoping).
   */
  async findAll(requester: any, includeInactive = false) {
    const complexId = requester?.residentialComplexId;

    if (!complexId && requester?.roleCode !== 'ROLE_DEV') {
      throw new ForbiddenException('Se requiere un conjunto residencial activo en la sesión.');
    }

    const apartments = await this.prisma.apartment.findMany({
      where: {
        ...(complexId ? { residentialComplexId: complexId } : {}),
        ...(includeInactive ? {} : { status: 1 }),
      },
      select: {
        id: true,
        residentialComplexId: true,
        tower: true,
        unitNumber: true,
        unitType: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { residents: true },
        },
      },
      orderBy: [{ tower: 'asc' }, { unitNumber: 'asc' }],
    });

    return apartments.map((apartment) => {
      const residentCount = apartment._count.residents;
      return {
        id: apartment.id,
        residentialComplexId: apartment.residentialComplexId,
        tower: apartment.tower,
        unitNumber: apartment.unitNumber,
        unitType: apartment.unitType,
        status: apartment.status,
        createdAt: apartment.createdAt,
        updatedAt: apartment.updatedAt,
        residentCount,
        available: apartment.status === 1 && residentCount === 0,
      };
    });
  }

  async create(requester: any, dto: CreateApartmentDto) {
    const complexId = requester?.residentialComplexId;
    if (!complexId) {
      throw new ForbiddenException('No se ha especificado un conjunto en la sesión.');
    }

    const unitNumber = this.resolveUnitNumber(dto);

    try {
      return await this.prisma.apartment.create({
        data: {
          residentialComplexId: complexId,
          unitNumber,
          tower: dto.tower?.trim() || null,
          unitType: dto.unitType?.trim() || 'APARTMENT',
          status: dto.status ?? 1,
        },
        select: {
          id: true,
          tower: true,
          unitNumber: true,
          unitType: true,
          status: true,
        },
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('La unidad ya existe en este conjunto residencial');
      }
      throw error;
    }
  }

  async update(requester: any, id: string, dto: UpdateApartmentDto) {
    const complexId = requester?.residentialComplexId;
    const existing = await this.prisma.apartment.findFirst({
      where: { id, ...(complexId ? { residentialComplexId: complexId } : {}) },
    });

    if (!existing) {
      throw new NotFoundException('Apartamento no encontrado en el conjunto activo');
    }

    try {
      const nextTower = dto.tower === undefined ? existing.tower : dto.tower.trim() || null;
      const nextUnitNumber =
        dto.unitNumber === undefined ? existing.unitNumber : dto.unitNumber.trim();

      return await this.prisma.apartment.update({
        where: { id },
        data: {
          unitNumber: nextUnitNumber,
          tower: nextTower,
          ...(dto.unitType === undefined ? {} : { unitType: dto.unitType.trim() }),
          ...(dto.status === undefined ? {} : { status: dto.status }),
        },
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('La unidad ya existe en este conjunto residencial');
      }
      throw error;
    }
  }

  async remove(requester: any, id: string) {
    const complexId = requester?.residentialComplexId;
    const existing = await this.prisma.apartment.findFirst({
      where: { id, ...(complexId ? { residentialComplexId: complexId } : {}) },
    });

    if (!existing) {
      throw new NotFoundException('Apartamento no encontrado en el conjunto activo');
    }

    return this.prisma.apartment.update({
      where: { id },
      data: { status: 0 },
      select: { id: true, unitNumber: true, status: true },
    });
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as any).code === 'P2002'
    );
  }

  private resolveUnitNumber(dto: CreateApartmentDto): string {
    const unitNumber = dto.unitNumber?.trim();
    if (unitNumber) return unitNumber;

    if (!dto.tower?.trim()) {
      throw new BadRequestException('Debe indicar un número de unidad o una torre');
    }
    return `Torre ${dto.tower.trim()}`;
  }
}
