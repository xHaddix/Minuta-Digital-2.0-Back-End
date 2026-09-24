import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateResidentDto } from './dto/create-resident.dto';

@Injectable()
export class ResidentsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(residentialComplexId: string) {
    return this.prisma.resident.findMany({
      where: { residentialComplexId },
      orderBy: { unitNumber: 'asc' },
      select: {
        id: true,
        apartmentId: true,
        unitNumber: true,
        isOwner: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            documentNumber: true,
            status: true,
          },
        },
      },
    });
  }

  async findOne(residentialComplexId: string, id: string) {
    const resident = await this.prisma.resident.findFirst({
      where: { id, residentialComplexId },
      select: {
        id: true,
        apartmentId: true,
        unitNumber: true,
        isOwner: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            documentNumber: true,
            status: true,
          },
        },
      },
    });

    if (!resident) {
      throw new NotFoundException('Residente no encontrado en el conjunto residencial activo');
    }

    return resident;
  }

  async create(residentialComplexId: string, dto: CreateResidentDto) {
    // 1. Validar que el usuario exista y pertenezca a la organización / conjunto
    const user = await this.prisma.user.findFirst({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException('El usuario especificado no existe');
    }

    // 2. Prevenir vinculaciones duplicadas del mismo usuario en el mismo conjunto
    const existingResident = await this.prisma.resident.findFirst({
      where: {
        userId: dto.userId,
        residentialComplexId,
      },
    });

    if (existingResident) {
      throw new ConflictException(
        'El usuario ya se encuentra registrado como residente en este conjunto',
      );
    }

    const apartment = dto.apartmentId
      ? await this.prisma.apartment.findFirst({
          where: { id: dto.apartmentId, residentialComplexId, status: 1 },
        })
      : null;

    if (dto.apartmentId && !apartment) {
      throw new NotFoundException('El apartamento no existe o está inactivo');
    }

    const unitNumber = apartment?.unitNumber ?? dto.unitNumber?.trim();
    if (!unitNumber) {
      throw new BadRequestException('Debe asignar un apartamento o indicar el número de unidad');
    }

    return this.prisma.resident.create({
      data: {
        residentialComplexId,
        userId: dto.userId,
        apartmentId: apartment?.id,
        unitNumber,
        isOwner: dto.isOwner ?? false,
      },
      select: {
        id: true,
        unitNumber: true,
        isOwner: true,
        createdAt: true,
      },
    });
  }

  async unassignApartment(residentialComplexId: string, residentId: string) {
    const resident = await this.prisma.resident.findFirst({
      where: { id: residentId, residentialComplexId },
    });

    if (!resident) {
      throw new NotFoundException('Residente no encontrado en el conjunto activo');
    }

    return this.prisma.resident.update({
      where: { id: residentId },
      data: { apartmentId: null, unitNumber: 'SIN ASIGNAR' },
      select: {
        id: true,
        apartmentId: true,
        unitNumber: true,
        isOwner: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }
  async assignApartment(residentialComplexId: string, residentId: string, apartmentId: string) {
    const resident = await this.prisma.resident.findFirst({
      where: { id: residentId, residentialComplexId },
    });
    if (!resident) {
      throw new NotFoundException('Residente no encontrado en el conjunto activo');
    }

    const apartment = await this.prisma.apartment.findFirst({
      where: { id: apartmentId, residentialComplexId, status: 1 },
    });
    if (!apartment) {
      throw new NotFoundException('El apartamento no existe o está inactivo');
    }

    return this.prisma.resident.update({
      where: { id: residentId },
      data: { apartmentId: apartment.id, unitNumber: apartment.unitNumber },
      select: {
        id: true,
        apartmentId: true,
        unitNumber: true,
        isOwner: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }
}
