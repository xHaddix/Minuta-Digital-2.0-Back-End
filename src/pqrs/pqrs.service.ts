/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { CreatePqrsTicketDto } from './dto/create-pqrs-ticket.dto';

@Injectable()
export class PqrsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  findAll(residentialComplexId: string, userId: string, roleCode: string) {
    const isResident = roleCode === 'ROLE_RESIDENT';

    return this.prisma.pqrsTicket.findMany({
      where: {
        residentialComplexId,
        // Scoping estricto: si es residente solo ve sus propios tickets
        ...(isResident ? { userId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        ticketType: true,
        subject: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
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

  async findOne(residentialComplexId: string, id: string, userId: string, roleCode: string) {
    const isResident = roleCode === 'ROLE_RESIDENT';

    const item = await this.prisma.pqrsTicket.findFirst({
      where: {
        id,
        residentialComplexId,
        ...(isResident ? { userId } : {}),
      },
      select: {
        id: true,
        ticketType: true,
        subject: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Ticket PQRS no encontrado en el conjunto activo');
    }

    return item;
  }

  async create(
    residentialComplexId: string,
    userId: string,
    dto: CreatePqrsTicketDto,
    attachment?: Express.Multer.File,
  ) {
    let attachmentUrl: string | undefined;

    if (attachment) {
      const uploadResult = await this.storageService.uploadFile({
        tenantId: residentialComplexId,
        module: 'pqrs',
        fileName: attachment.originalname,
        body: attachment.buffer,
        contentType: attachment.mimetype,
      });
      attachmentUrl = uploadResult.url;
    }

    return this.prisma.pqrsTicket.create({
      data: {
        residentialComplexId,
        userId,
        ticketType: dto.ticketType,
        subject: dto.subject,
        description: dto.description,
        status: 'OPEN',
      },
      select: {
        id: true,
        ticketType: true,
        subject: true,
        description: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async updateStatus(residentialComplexId: string, id: string, status: string) {
    // Validar aislamiento multi-tenant antes de mutar
    const ticket = await this.prisma.pqrsTicket.findFirst({
      where: { id, residentialComplexId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket PQRS no encontrado en el conjunto activo');
    }

    const updated = await this.prisma.pqrsTicket.update({
      where: { id },
      data: { status },
    });

    this.notificationsGateway.emitPqrsUpdate(residentialComplexId, updated);

    return updated;
  }
}
