import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { RegisterVisitorEntryDto } from './dto/register-visitor-entry.dto';

@Injectable()
export class VisitorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async findAll(residentialComplexId: string) {
    const visitors = await this.prisma.visitor.findMany({
      where: { residentialComplexId },
      orderBy: { entryTime: 'desc' },
      select: {
        id: true,
        fullName: true,
        documentNumber: true,
        documentType: true,
        unitTarget: true,
        entryTime: true,
        exitTime: true,
        createdAt: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return visitors.map((visitor) => ({
      ...visitor,
      status: visitor.exitTime ? 'closed' : 'active',
      authorizerUser: visitor.createdBy,
    }));
  }

  async registerEntry(
    residentialComplexId: string,
    createdById: string,
    dto: RegisterVisitorEntryDto,
  ) {
    const visitor = await this.prisma.visitor.create({
      data: {
        residentialComplexId,
        createdById,
        fullName: dto.fullName,
        documentNumber: dto.documentNumber,
        documentType: dto.documentType,
        unitTarget: dto.unitTarget,
      },
      select: {
        id: true,
        fullName: true,
        documentNumber: true,
        documentType: true,
        unitTarget: true,
        entryTime: true,
        exitTime: true,
        createdAt: true,
      },
    });

    const payload = { ...visitor, status: 'active' as const };
    this.notificationsGateway.emitVisitorUpdated(residentialComplexId, payload);

    return payload;
  }

  async registerExit(residentialComplexId: string, id: string) {
    // Validar existencia y propiedad multi-tenant en el conjunto activo
    const visitor = await this.prisma.visitor.findFirst({
      where: { id, residentialComplexId },
    });

    if (!visitor) {
      throw new NotFoundException('Registro de visitante no encontrado en el conjunto activo');
    }

    if (visitor.exitTime !== null) {
      throw new BadRequestException('El visitante ya registra un horario de salida previo');
    }

    const updatedVisitor = await this.prisma.visitor.update({
      where: { id },
      data: { exitTime: new Date() },
      select: {
        id: true,
        residentialComplexId: true,
        fullName: true,
        documentNumber: true,
        documentType: true,
        unitTarget: true,
        entryTime: true,
        exitTime: true,
        createdAt: true,
      },
    });

    const payload = { ...updatedVisitor, status: 'closed' as const };
    this.notificationsGateway.emitVisitorUpdated(residentialComplexId, payload);

    return payload;
  }
}
