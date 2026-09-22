import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService, Prisma } from '../prisma/prisma.service';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { RoleCode } from '../common/constants/role.constants';
import { CreateResidentialComplexDto } from './dto/create-residential-complex.dto';
import { UpdateResidentialComplexDto } from './dto/update-residential-complex.dto';

@Injectable()
export class ResidentialComplexesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(requester: JwtPayload) {
    if (requester.roleCode !== RoleCode.DEV && requester.roleCode !== RoleCode.ORG_ADMIN) {
      throw new ForbiddenException(
        'Solo un desarrollador o administrador de organización puede listar conjuntos',
      );
    }

    const where: Prisma.ResidentialComplexWhereInput =
      requester.roleCode === RoleCode.ORG_ADMIN && requester.organizationId
        ? { organizationId: requester.organizationId }
        : {};

    return this.prisma.residentialComplex.findMany({
      where: { ...where, status: 1 },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        organizationId: true,
        contactEmail: true,
        contactPhone: true,
        status: true,
        planCode: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(requester: JwtPayload, id: string) {
    if (requester.roleCode !== RoleCode.DEV && requester.roleCode !== RoleCode.ORG_ADMIN) {
      throw new ForbiddenException('No tiene permisos para consultar conjuntos residenciales');
    }

    const complex = await this.prisma.residentialComplex.findFirst({
      where: { id, status: 1 },
      select: {
        id: true,
        name: true,
        slug: true,
        organizationId: true,
        urlLogo: true,
        contactEmail: true,
        contactPhone: true,
        status: true,
        planCode: true,
        createdAt: true,
        updatedAt: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!complex) throw new NotFoundException('Conjunto residencial no encontrado o inactivo');

    if (
      requester.roleCode === RoleCode.ORG_ADMIN &&
      requester.organizationId &&
      complex.organizationId !== requester.organizationId
    ) {
      throw new ForbiddenException('Solo puedes consultar conjuntos de tu propia organización');
    }

    return complex;
  }

  async create(dto: CreateResidentialComplexDto, requester?: JwtPayload) {
    const organizationId =
      requester?.roleCode === RoleCode.ORG_ADMIN ? requester.organizationId : dto.organizationId;

    if (requester?.roleCode === RoleCode.ORG_ADMIN) {
      if (!requester.organizationId) {
        throw new ForbiddenException(
          'El administrador de organización no tiene una organización asignada',
        );
      }

      if (dto.organizationId && dto.organizationId !== requester.organizationId) {
        throw new ForbiddenException('Solo puedes crear conjuntos para tu propia organización');
      }
    }

    if (!organizationId) {
      throw new BadRequestException('organizationId es obligatorio para el rol indicado');
    }

    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!organization) {
      throw new NotFoundException('La organización indicada no existe');
    }

    const duplicateSlug = await this.prisma.residentialComplex.findUnique({
      where: { slug: dto.slug },
    });
    if (duplicateSlug) {
      throw new BadRequestException('Ya existe un conjunto residencial con ese slug');
    }

    const duplicateContact = await this.prisma.residentialComplex.findFirst({
      where: { contactEmail: dto.contactEmail },
    });

    if (duplicateContact) {
      throw new BadRequestException('Ya existe un conjunto residencial con ese correo de contacto');
    }

    const urlLogo = dto.urlLogo ?? dto.url ?? null;

    return this.prisma.residentialComplex.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        organizationId,
        urlLogo,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        planCode: dto.planCode ?? 'BASIC',
        status: 1,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        organizationId: true,
        contactEmail: true,
        contactPhone: true,
        status: true,
        planCode: true,
        createdAt: true,
      },
    });
  }

  async update(id: string, dto: UpdateResidentialComplexDto, requester: JwtPayload) {
    if (requester.roleCode !== RoleCode.DEV && requester.roleCode !== RoleCode.ORG_ADMIN) {
      throw new ForbiddenException('No tiene permisos para actualizar conjuntos residenciales');
    }

    const complex = await this.prisma.residentialComplex.findFirst({
      where: { id, status: 1 },
    });
    if (!complex) {
      throw new NotFoundException('Conjunto residencial no encontrado o inactivo');
    }

    if (
      requester.roleCode === RoleCode.ORG_ADMIN &&
      requester.organizationId &&
      complex.organizationId !== requester.organizationId
    ) {
      throw new ForbiddenException('Solo puedes actualizar conjuntos de tu propia organización');
    }

    if (requester.roleCode === RoleCode.ORG_ADMIN) {
      if (!requester.organizationId) {
        throw new ForbiddenException(
          'El administrador de organización no tiene una organización asignada',
        );
      }

      if (dto.organizationId && dto.organizationId !== requester.organizationId) {
        throw new ForbiddenException(
          'Solo puedes mover conjuntos dentro de tu propia organización',
        );
      }

      dto.organizationId = requester.organizationId;
    }

    if (dto.organizationId && dto.organizationId !== complex.organizationId) {
      const organization = await this.prisma.organization.findUnique({
        where: { id: dto.organizationId },
      });
      if (!organization) {
        throw new NotFoundException('La organización nueva indicada no existe');
      }
    }

    if (dto.slug && dto.slug !== complex.slug) {
      const duplicateSlug = await this.prisma.residentialComplex.findUnique({
        where: { slug: dto.slug },
      });
      if (duplicateSlug && duplicateSlug.id !== id) {
        throw new BadRequestException('Ya existe un conjunto residencial con ese slug');
      }
    }

    if (dto.contactEmail && dto.contactEmail !== complex.contactEmail) {
      const duplicateContact = await this.prisma.residentialComplex.findFirst({
        where: { contactEmail: dto.contactEmail },
      });
      if (duplicateContact && duplicateContact.id !== id) {
        throw new BadRequestException(
          'Ya existe un conjunto residencial con ese correo de contacto',
        );
      }
    }

    const urlLogo = dto.urlLogo ?? dto.url ?? undefined;

    return this.prisma.residentialComplex.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.slug && { slug: dto.slug }),
        ...(dto.organizationId && { organizationId: dto.organizationId }),
        ...(urlLogo !== undefined && { urlLogo }),
        ...(dto.contactEmail && { contactEmail: dto.contactEmail }),
        ...(dto.contactPhone !== undefined && { contactPhone: dto.contactPhone }),
        ...(dto.planCode && { planCode: dto.planCode }),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        organizationId: true,
        contactEmail: true,
        contactPhone: true,
        status: true,
        planCode: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string, requester: JwtPayload) {
    if (requester.roleCode !== RoleCode.DEV) {
      throw new ForbiddenException('Solo un desarrollador puede eliminar conjuntos residenciales');
    }

    const complex = await this.prisma.residentialComplex.findUnique({ where: { id } });
    if (!complex) {
      throw new NotFoundException('Conjunto residencial no encontrado');
    }

    await this.prisma.residentialComplex.update({
      where: { id },
      data: { status: 0 },
    });
    return { message: 'Conjunto residencial desactivado correctamente', id };
  }

  async getUsersByComplex(id: string, requester: JwtPayload) {
    if (requester.roleCode !== RoleCode.DEV && requester.roleCode !== RoleCode.ORG_ADMIN) {
      throw new ForbiddenException('No tiene permisos para consultar usuarios del conjunto');
    }

    const complex = await this.prisma.residentialComplex.findFirst({
      where: { id, status: 1 },
    });
    if (!complex) {
      throw new NotFoundException('Conjunto residencial no encontrado o inactivo');
    }

    if (
      requester.roleCode === RoleCode.ORG_ADMIN &&
      requester.organizationId &&
      complex.organizationId !== requester.organizationId
    ) {
      throw new ForbiddenException(
        'Solo puedes consultar usuarios de conjuntos de tu propia organización',
      );
    }

    return this.prisma.user.findMany({
      where: { residentialComplexId: id, status: 1 },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        role: { select: { id: true, code: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
