import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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

    return this.prisma.resident.create({
      data: {
        residentialComplexId,
        userId: dto.userId,
        unitNumber: dto.unitNumber,
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
}
