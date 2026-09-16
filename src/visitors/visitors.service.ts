import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { RegisterVisitorEntryDto } from './dto/register-visitor-entry.dto';

@Injectable()
export class VisitorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  findAll(residentialComplexId: string) {
    return this.prisma.visitor.findMany({
      where: { residentialComplexId },
      orderBy: { entryTime: 'desc' },
      select: {
        id: true,
        fullName: true,
        documentNumber: true,
        unitTarget: true,
        entryTime: true,
        exitTime: true,
        authorizerUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async registerEntry(residentialComplexId: string, dto: RegisterVisitorEntryDto) {
    // Si se envía authorizerUserId, validar que el usuario exista
    if (dto.authorizerUserId) {
      const authorizer = await this.prisma.user.findFirst({
        where: { id: dto.authorizerUserId, residentialComplexId },
      });
      if (!authorizer) {
        throw new NotFoundException(
          'El usuario autorizador no pertenece a este conjunto residencial',
        );
      }
    }

    const visitor = await this.prisma.visitor.create({
      data: {
        residentialComplexId,
        fullName: dto.fullName,
        documentNumber: dto.documentNumber,
        unitTarget: dto.unitTarget,
        authorizerUserId: dto.authorizerUserId,
      },
      select: {
        id: true,
        fullName: true,
        documentNumber: true,
        unitTarget: true,
        entryTime: true,
      },
    });

    this.notificationsGateway.emitVisitorEntry(residentialComplexId, visitor);

    return visitor;
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

    return this.prisma.visitor.update({
      where: { id },
      data: { exitTime: new Date() },
      select: {
        id: true,
        fullName: true,
        unitTarget: true,
        entryTime: true,
        exitTime: true,
      },
    });
  }
}
