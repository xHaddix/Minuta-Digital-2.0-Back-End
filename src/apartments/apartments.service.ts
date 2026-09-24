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
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Injectable()
export class ApartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene la lista de unidades habitacionales acotadas por el token JWT.
   */
  async findAll(requester: JwtPayload, includeInactive = false) {
    const complexId = requester.residentialComplexId;

    if (!complexId && requester.roleCode !== 'ROLE_DEV') {
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

    // Mapeo Presenter: transforma las entidades del ORM al contrato que el Frontend espera
    return apartments.map((apt) => this.mapToResponseDto(apt));
  }

  async create(requester: JwtPayload, dto: CreateApartmentDto) {
    const complexId = requester.residentialComplexId;
    if (!complexId) {
      throw new ForbiddenException('No se ha especificado un conjunto en la sesión.');
    }

    const unitNumber = this.resolveUnitNumber(dto);

    try {
      const created = await this.prisma.apartment.create({
        data: {
          residentialComplexId: complexId,
          unitNumber,
          tower: dto.tower?.trim() || null,
          unitType: dto.unitType?.trim() || 'APARTMENT',
          status: dto.status ?? 1,
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
      });

      return this.mapToResponseDto(created);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('La unidad ya existe en este conjunto residencial');
      }
      throw error;
    }
  }

  async update(requester: JwtPayload, id: string, dto: UpdateApartmentDto) {
    const complexId = requester.residentialComplexId;
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

      const updated = await this.prisma.apartment.update({
        where: { id },
        data: {
          unitNumber: nextUnitNumber,
          tower: nextTower,
          ...(dto.unitType === undefined ? {} : { unitType: dto.unitType.trim() }),
          ...(dto.status === undefined ? {} : { status: dto.status }),
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
      });

      return this.mapToResponseDto(updated);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('La unidad ya existe en este conjunto residencial');
      }
      throw error;
    }
  }

  async remove(requester: JwtPayload, id: string) {
    const complexId = requester.residentialComplexId;
    const existing = await this.prisma.apartment.findFirst({
      where: { id, ...(complexId ? { residentialComplexId: complexId } : {}) },
    });

    if (!existing) {
      throw new NotFoundException('Apartamento no encontrado en el conjunto activo');
    }

    const removed = await this.prisma.apartment.update({
      where: { id },
      data: { status: 0 },
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
    });

    return this.mapToResponseDto(removed);
  }

  /**
   * Transforma el modelo interno de Prisma a la estructura JSON esperada por React.
   */
  private mapToResponseDto(apartment: any) {
    const residentCount = apartment._count?.residents ?? 0;
    const isAvailable = apartment.status === 1 && residentCount === 0;

    // Extrae el número de apartamento limpiando la prefijación de la torre
    let computedApartmentNumber = apartment.unitNumber;
    if (apartment.tower && computedApartmentNumber.includes(`Torre ${apartment.tower}`)) {
      computedApartmentNumber = computedApartmentNumber
        .replace(`Torre ${apartment.tower}`, '')
        .replace(/Apto/i, '')
        .trim();
    }

    return {
      id: apartment.id,
      residentialComplexId: apartment.residentialComplexId,
      tower: apartment.tower ?? '',
      apartmentNumber: computedApartmentNumber, // Mantiene la columna llena en el Frontend
      unitNumber: apartment.unitNumber,
      unitType: apartment.unitType,
      status: apartment.status,
      createdAt: apartment.createdAt,
      updatedAt: apartment.updatedAt,
      residentCount,
      available: isAvailable, // Corrige la insignia de DISPONIBLE vs OCUPADA
    };
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

    if (dto.tower?.trim() && dto.apartmentNumber?.trim()) {
      return `Torre ${dto.tower.trim()} Apto ${dto.apartmentNumber.trim()}`;
    }

    if (dto.apartmentNumber?.trim()) {
      return dto.apartmentNumber.trim();
    }

    throw new BadRequestException('Debe indicar el número de apartamento o la unidad.');
  }
}
