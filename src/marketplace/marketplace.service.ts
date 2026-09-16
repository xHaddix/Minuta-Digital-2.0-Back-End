import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMarketplacePostDto } from './dto/create-marketplace-post.dto';

@Injectable()
export class MarketplaceService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(residentialComplexId: string) {
    return this.prisma.marketplacePost.findMany({
      where: {
        residentialComplexId,
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        imageUrl: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  create(residentialComplexId: string, userId: string, dto: CreateMarketplacePostDto) {
    return this.prisma.marketplacePost.create({
      data: {
        residentialComplexId,
        userId,
        title: dto.title,
        description: dto.description,
        price: dto.price,
        imageUrl: dto.imageUrl,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        imageUrl: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async updateStatus(
    residentialComplexId: string,
    id: string,
    userId: string,
    userRoleCode: string,
    status: string,
  ) {
    // 1. Validar existencia y pertenecia al conjunto activo
    const post = await this.prisma.marketplacePost.findFirst({
      where: {
        id,
        residentialComplexId,
      },
    });

    if (!post) {
      throw new NotFoundException('Publicación no encontrada en el conjunto activo');
    }

    // 2. Control de acceso granular: Solo el dueño de la publicación o un administrador pueden modificarla
    const isAdmin = ['ROLE_DEV', 'ROLE_ORG_ADMIN', 'ROLE_COMPLEX_ADMIN'].includes(userRoleCode);
    const isOwner = post.userId === userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException(
        'No tiene permisos para modificar el estado de esta publicación',
      );
    }

    return this.prisma.marketplacePost.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        status: true,
        updatedAt: true,
      },
    });
  }
}
