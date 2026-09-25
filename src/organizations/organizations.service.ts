import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { RoleCode } from '../common/constants/role.constants';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async uploadLogo(id: string, file: Express.Multer.File, requester: JwtPayload) {
    const organization = await this.prisma.organization.findFirst({ where: { id, status: 1 } });
    if (!organization) throw new NotFoundException('Organización no encontrada o inactiva');
    if (requester.roleCode !== RoleCode.DEV && requester.roleCode !== RoleCode.ORG_ADMIN) {
      throw new ForbiddenException('No tiene permisos para actualizar organizaciones');
    }
    if (requester.roleCode === RoleCode.ORG_ADMIN && organization.id !== requester.organizationId) {
      throw new ForbiddenException('Solo puedes actualizar tu propia organización');
    }
    const asset = await this.storage.uploadOrganizationLogo(id, file.buffer, file.mimetype);
    return this.prisma.organization.update({
      where: { id },
      data: { urlLogo: asset.url },
      select: { id: true, urlLogo: true },
    });
  }

  findAll(requester: JwtPayload) {
    if (requester.roleCode !== RoleCode.DEV && requester.roleCode !== RoleCode.ORG_ADMIN) {
      throw new ForbiddenException(
        'Solo un desarrollador o administrador de organización puede listar organizaciones',
      );
    }

    return this.prisma.organization.findMany({
      where: { status: 1 },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        urlLogo: true,
        identification: true,
        contactEmail: true,
        contactPhone: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(requester: JwtPayload, id: string) {
    if (requester.roleCode !== RoleCode.DEV && requester.roleCode !== RoleCode.ORG_ADMIN) {
      throw new ForbiddenException('No tiene permisos para consultar organizaciones');
    }

    const organization = await this.prisma.organization.findFirst({
      where: { id, status: 1 },
      select: {
        id: true,
        name: true,
        urlLogo: true,
        documentTypeId: true,
        identification: true,
        contactEmail: true,
        contactPhone: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        complexes: {
          where: { status: 1 },
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organización no encontrada o inactiva');
    }

    if (
      requester.roleCode === RoleCode.ORG_ADMIN &&
      requester.organizationId &&
      organization.id !== requester.organizationId
    ) {
      throw new ForbiddenException('Solo puedes consultar tu propia organización');
    }

    return organization;
  }

  async create(dto: CreateOrganizationDto, requester?: JwtPayload) {
    if (requester?.roleCode === RoleCode.ORG_ADMIN && requester.organizationId) {
      throw new ForbiddenException(
        'Un administrador de organización no puede crear otra organización',
      );
    }

    const existing = await this.prisma.organization.findFirst({
      where: {
        OR: [{ contactEmail: dto.contactEmail }, { identification: dto.identification ?? null }],
      },
    });

    if (existing) {
      throw new BadRequestException(
        'Ya existe una organización con ese correo de contacto o identificación',
      );
    }

    const urlLogo = dto.urlLogo ?? dto.url ?? null;

    return this.prisma.organization.create({
      data: {
        name: dto.name,
        urlLogo,
        documentTypeId: dto.documentTypeId,
        identification: dto.identification,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        status: 1,
      },
      select: {
        id: true,
        name: true,
        urlLogo: true,
        identification: true,
        contactEmail: true,
        contactPhone: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async update(id: string, dto: UpdateOrganizationDto, requester: JwtPayload) {
    if (requester.roleCode !== RoleCode.DEV && requester.roleCode !== RoleCode.ORG_ADMIN) {
      throw new ForbiddenException('No tiene permisos para actualizar organizaciones');
    }

    const organization = await this.prisma.organization.findFirst({
      where: { id, status: 1 },
    });
    if (!organization) {
      throw new NotFoundException('Organización no encontrada o inactiva');
    }

    if (
      requester.roleCode === RoleCode.ORG_ADMIN &&
      requester.organizationId &&
      organization.id !== requester.organizationId
    ) {
      throw new ForbiddenException('Solo puedes actualizar tu propia organización');
    }

    if (dto.contactEmail && dto.contactEmail !== organization.contactEmail) {
      const duplicate = await this.prisma.organization.findFirst({
        where: { contactEmail: dto.contactEmail },
      });

      if (duplicate && duplicate.id !== id) {
        throw new BadRequestException('Ya existe otra organización con ese correo de contacto');
      }
    }

    if (dto.identification && dto.identification !== organization.identification) {
      const duplicate = await this.prisma.organization.findUnique({
        where: { identification: dto.identification },
      });

      if (duplicate && duplicate.id !== id) {
        throw new BadRequestException('Ya existe otra organización con esa identificación');
      }
    }

    const urlLogo = dto.urlLogo ?? dto.url ?? undefined;

    return this.prisma.organization.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(urlLogo !== undefined && { urlLogo }),
        ...(dto.documentTypeId !== undefined && { documentTypeId: dto.documentTypeId }),
        ...(dto.identification !== undefined && { identification: dto.identification }),
        ...(dto.contactEmail !== undefined && { contactEmail: dto.contactEmail }),
        ...(dto.contactPhone !== undefined && { contactPhone: dto.contactPhone }),
      },
      select: {
        id: true,
        name: true,
        urlLogo: true,
        identification: true,
        contactEmail: true,
        contactPhone: true,
        status: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string, requester: JwtPayload) {
    if (requester.roleCode !== RoleCode.DEV && requester.roleCode !== RoleCode.ORG_ADMIN) {
      throw new ForbiddenException('No tiene permisos para eliminar organizaciones');
    }

    const organization = await this.prisma.organization.findFirst({
      where: { id, status: 1 },
    });
    if (!organization) {
      throw new NotFoundException('Organización no encontrada o inactiva');
    }

    if (
      requester.roleCode === RoleCode.ORG_ADMIN &&
      requester.organizationId &&
      organization.id !== requester.organizationId
    ) {
      throw new ForbiddenException('Solo puedes eliminar tu propia organización');
    }

    await this.prisma.organization.update({
      where: { id },
      data: { status: 0 },
    });

    return { message: 'Organización desactivada correctamente', id };
  }

  async getUsersByOrganization(id: string, requester: JwtPayload) {
    if (requester.roleCode !== RoleCode.DEV && requester.roleCode !== RoleCode.ORG_ADMIN) {
      throw new ForbiddenException('No tiene permisos para consultar usuarios de la organización');
    }

    if (
      requester.roleCode === RoleCode.ORG_ADMIN &&
      requester.organizationId &&
      requester.organizationId !== id
    ) {
      throw new ForbiddenException('Solo puedes consultar usuarios de tu propia organización');
    }

    const organization = await this.prisma.organization.findFirst({
      where: { id, status: 1 },
    });
    if (!organization) {
      throw new NotFoundException('Organización no encontrada o inactiva');
    }

    return this.prisma.user.findMany({
      where: { organizationId: id, status: 1 },
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
