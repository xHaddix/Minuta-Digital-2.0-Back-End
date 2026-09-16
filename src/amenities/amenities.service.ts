import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AmenitiesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(residentialComplexId: string) {
    return this.prisma.amenityBooking.findMany({
      where: {
        amenity: {
          residentialComplexId,
        },
      },
      orderBy: { bookingDate: 'asc' },
      select: {
        id: true,
        bookingDate: true,
        startTime: true,
        endTime: true,
        status: true,
        amenity: {
          select: {
            id: true,
            name: true,
            requiresApproval: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async create(
    residentialComplexId: string,
    data: {
      userId: string;
      amenityId: string;
      bookingDate: string;
      startTime: Date;
      endTime: Date;
    },
  ) {
    // 1. Validar que la amenidad existe y pertenece al conjunto del usuario
    const amenity = await this.prisma.amenity.findFirst({
      where: {
        id: data.amenityId,
        residentialComplexId,
        status: 1, // Activa
      },
    });

    if (!amenity) {
      throw new NotFoundException(
        'La amenidad no existe o no pertenece a este conjunto residencial',
      );
    }

    // 2. Prevenir traslape de horarios (Overlapping Check)
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (start >= end) {
      throw new BadRequestException(
        'La hora de inicio debe ser anterior a la hora de finalización',
      );
    }

    const overlapCount = await this.prisma.amenityBooking.count({
      where: {
        amenityId: data.amenityId,
        status: { in: ['PENDING', 'APPROVED'] },
        AND: [{ startTime: { lt: end } }, { endTime: { gt: start } }],
      },
    });

    if (overlapCount > 0) {
      throw new ConflictException(
        'La amenidad ya se encuentra reservada en el rango de horario seleccionado',
      );
    }

    // 3. Crear reserva isolada
    return this.prisma.amenityBooking.create({
      data: {
        amenityId: data.amenityId,
        userId: data.userId,
        bookingDate: new Date(data.bookingDate),
        startTime: start,
        endTime: end,
        status: amenity.requiresApproval ? 'PENDING' : 'APPROVED',
      },
    });
  }

  async updateStatus(id: string, residentialComplexId: string, status: string) {
    // Verificar propiedad multi-tenant antes de actualizar
    const booking = await this.prisma.amenityBooking.findFirst({
      where: {
        id,
        amenity: {
          residentialComplexId,
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Reserva no encontrada en el conjunto residencial activo');
    }

    return this.prisma.amenityBooking.update({
      where: { id },
      data: { status },
    });
  }
}
