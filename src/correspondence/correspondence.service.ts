/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { CreateCorrespondenceDto } from './dto/create-correspondence.dto';

@Injectable()
export class CorrespondenceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  findAll(residentialComplexId: string) {
    return this.prisma.correspondence.findMany({
      where: { residentialComplexId },
      orderBy: { receivedAt: 'desc' },
      select: {
        id: true,
        recipientName: true,
        unitNumber: true,
        carrier: true,
        status: true,
        receivedAt: true,
        deliveredAt: true,
        deliveredToUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async findOne(residentialComplexId: string, id: string) {
    const item = await this.prisma.correspondence.findFirst({
      where: { id, residentialComplexId },
      select: {
        id: true,
        recipientName: true,
        unitNumber: true,
        carrier: true,
        status: true,
        receivedAt: true,
        deliveredAt: true,
        deliveredToUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Correspondencia no encontrada en el conjunto activo');
    }

    return item;
  }

  async create(
    residentialComplexId: string,
    dto: CreateCorrespondenceDto,
    photo?: Express.Multer.File,
  ) {
    let photoUrl: string | undefined;

    if (photo) {
      const uploadResult = await this.storageService.uploadFile({
        tenantId: residentialComplexId, // Mapeado al discriminador central
        module: 'correspondence',
        fileName: photo.originalname,
        body: photo.buffer,
        contentType: photo.mimetype,
      });

      photoUrl = uploadResult.url;
    }

    const created = await this.prisma.correspondence.create({
      data: {
        residentialComplexId,
        recipientName: dto.recipientName,
        unitNumber: dto.unitNumber,
        carrier: dto.carrier,
        status: 'PENDING',
      },
    });

    // Notificación en tiempo real emitida al room del conjunto residencial
    this.notificationsGateway.emitNewCorrespondence(residentialComplexId, created);

    return created;
  }

  async markAsDelivered(residentialComplexId: string, id: string, deliveredToUserId: string) {
    // Validar propiedad multi-tenant antes de mutar
    const item = await this.prisma.correspondence.findFirst({
      where: { id, residentialComplexId },
    });

    if (!item) {
      throw new NotFoundException('Correspondencia no encontrada en el conjunto activo');
    }

    if (item.status === 'DELIVERED') {
      throw new BadRequestException('La correspondencia ya ha sido entregada previamente');
    }

    return this.prisma.correspondence.update({
      where: { id },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date(),
        deliveredToUserId,
      },
    });
  }
}
