import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService, Prisma } from '../prisma/prisma.service';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { COMPLEX_SCOPED_ROLES, RoleCode } from '../common/constants/role.constants';

const ACTIVE_STATUS = 1;

export interface AssignHierarchyInput {
  roleId: string;
  organizationId?: string | null;
  residentialComplexId?: string | null;
}

export interface ResolvedUserHierarchy {
  roleId: string;
  roleCode: string;
  organizationId: string | null;
  residentialComplexId: string | null;
}

@Injectable()
export class UserHierarchyService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(
    input: AssignHierarchyInput,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<ResolvedUserHierarchy> {
    const role = await tx.role.findUnique({ where: { id: input.roleId } });

    if (!role || role.status !== ACTIVE_STATUS) {
      throw new BadRequestException('El rol especificado no existe o está inactivo');
    }

    if (role.code === RoleCode.DEV) {
      return this.resolveDev(role, input);
    }

    if (role.code === RoleCode.ORG_ADMIN) {
      return this.resolveOrgAdmin(role, input, tx);
    }

    if (COMPLEX_SCOPED_ROLES.includes(role.code as RoleCode)) {
      return this.resolveComplexScoped(role, input, tx);
    }

    throw new BadRequestException(
      `El rol "${role.code}" no tiene una regla de asignación de jerarquía soportada`,
    );
  }

  private resolveDev(
    role: { id: string; code: string },
    input: AssignHierarchyInput,
  ): ResolvedUserHierarchy {
    if (input.organizationId || input.residentialComplexId) {
      throw new BadRequestException(
        'Un usuario ROLE_DEV es de alcance global: no debe recibir organizationId ni residentialComplexId',
      );
    }

    return {
      roleId: role.id,
      roleCode: role.code,
      organizationId: null,
      residentialComplexId: null,
    };
  }

  private async resolveOrgAdmin(
    role: { id: string; code: string },
    input: AssignHierarchyInput,
    tx: Prisma.TransactionClient,
  ): Promise<ResolvedUserHierarchy> {
    if (!input.organizationId) {
      throw new BadRequestException('organizationId es obligatorio para un usuario ROLE_ORG_ADMIN');
    }

    if (input.residentialComplexId) {
      throw new BadRequestException(
        'Un usuario ROLE_ORG_ADMIN no pertenece a un conjunto específico: no envíe residentialComplexId',
      );
    }

    const organization = await tx.organization.findUnique({
      where: { id: input.organizationId },
    });

    if (!organization) {
      throw new NotFoundException('La organización indicada no existe');
    }
    if (organization.status !== ACTIVE_STATUS) {
      throw new BadRequestException('La organización indicada no está activa');
    }

    return {
      roleId: role.id,
      roleCode: role.code,
      organizationId: organization.id,
      residentialComplexId: null,
    };
  }

  private async resolveComplexScoped(
    role: { id: string; code: string },
    input: AssignHierarchyInput,
    tx: Prisma.TransactionClient,
  ): Promise<ResolvedUserHierarchy> {
    if (!input.residentialComplexId) {
      throw new BadRequestException(
        `residentialComplexId es obligatorio para un usuario con rol "${role.code}"`,
      );
    }

    if (input.organizationId) {
      throw new BadRequestException(
        'organizationId se asigna automáticamente a partir del conjunto residencial: no lo envíe manualmente',
      );
    }

    const complex = await tx.residentialComplex.findUnique({
      where: { id: input.residentialComplexId },
    });

    if (!complex) {
      throw new NotFoundException('El conjunto residencial indicado no existe');
    }
    if (complex.status !== ACTIVE_STATUS) {
      throw new BadRequestException('El conjunto residencial indicado no está activo');
    }

    return {
      roleId: role.id,
      roleCode: role.code,
      organizationId: complex.organizationId,
      residentialComplexId: complex.id,
    };
  }

  assertRequesterCanAssign(requester: JwtPayload, target: ResolvedUserHierarchy): void {
    switch (requester.roleCode) {
      case RoleCode.DEV:
        return;

      case RoleCode.ORG_ADMIN: {
        if (target.roleCode === RoleCode.DEV) {
          throw new ForbiddenException('No tienes permisos para crear usuarios ROLE_DEV');
        }
        if (target.organizationId !== requester.organizationId) {
          throw new ForbiddenException(
            'Solo puedes crear usuarios dentro de tu propia organización',
          );
        }
        return;
      }

      case RoleCode.COMPLEX_ADMIN: {
        const allowedTargets: readonly RoleCode[] = [RoleCode.SECURITY, RoleCode.RESIDENT];
        if (!allowedTargets.includes(target.roleCode as RoleCode)) {
          throw new ForbiddenException(
            'Un administrador de conjunto solo puede crear usuarios de Vigilancia o Residentes',
          );
        }
        if (target.residentialComplexId !== requester.residentialComplexId) {
          throw new ForbiddenException(
            'Solo puedes crear usuarios dentro de tu propio conjunto residencial',
          );
        }
        return;
      }

      default:
        throw new ForbiddenException('No tienes permisos para crear usuarios');
    }
  }
}
