import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApartmentDto } from './dto/create-apartment.dto';
import { UpdateApartmentDto } from './dto/update-apartment.dto';

@Injectable()
export class ApartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(residentialComplexId: string) {
    return this.prisma.apartment.findMany({
      where: { residentialComplexId, status: 1 },
      orderBy: { unitNumber: 'asc' },
      select: {
        id: true,
        unitNumber: true,
        tower: true,
        apartmentNumber: true,
        unitType: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async create(residentialComplexId: string, dto: CreateApartmentDto) {
    const unitNumber = this.resolveUnitNumber(dto);

    try {
      return await this.prisma.apartment.create({
        data: {
          residentialComplexId,
          unitNumber,
          tower: dto.tower?.trim() || null,
          apartmentNumber: dto.apartmentNumber?.trim() || null,
          unitType: dto.unitType?.trim() || 'APARTMENT',
          status: dto.status ?? 1,
        },
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('La unidad ya existe en este conjunto residencial');
      }
      throw error;
    }
  }

  async update(residentialComplexId: string, id: string, dto: UpdateApartmentDto) {
    const existing = await this.prisma.apartment.findFirst({
      where: { id, residentialComplexId },
    });

    if (!existing) {
      throw new NotFoundException('Apartamento no encontrado en el conjunto activo');
    }

    try {
      const nextTower = dto.tower === undefined ? existing.tower : dto.tower.trim() || null;
      const nextApartmentNumber =
        dto.apartmentNumber === undefined
          ? existing.apartmentNumber
          : dto.apartmentNumber.trim() || null;
      const nextUnitNumber =
        dto.unitNumber === undefined
          ? this.composeUnitNumber(nextTower, nextApartmentNumber, existing.unitNumber)
          : dto.unitNumber.trim();

      return await this.prisma.apartment.update({
        where: { id },
        data: {
          unitNumber: nextUnitNumber,
          tower: nextTower,
          apartmentNumber: nextApartmentNumber,
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

  async remove(residentialComplexId: string, id: string) {
    const existing = await this.prisma.apartment.findFirst({
      where: { id, residentialComplexId },
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
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
  }

  private resolveUnitNumber(dto: CreateApartmentDto): string {
    const unitNumber = dto.unitNumber?.trim();
    if (unitNumber) return unitNumber;

    const composed = this.composeUnitNumber(
      dto.tower?.trim() || null,
      dto.apartmentNumber?.trim() || null,
      '',
    );
    if (!composed) {
      throw new BadRequestException('Debe indicar unitNumber o una torre y número de apartamento');
    }
    return composed;
  }

  private composeUnitNumber(
    tower: string | null,
    apartmentNumber: string | null,
    fallback: string,
  ): string {
    const parts = [tower ? `Torre ${tower}` : '', apartmentNumber ? `Apto ${apartmentNumber}` : '']
      .filter(Boolean)
      .join(' ');
    return parts || fallback;
  }
}
