import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { RoleCode } from '../common/constants/role.constants';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene la lista de roles que el usuario solicitante tiene permitido asignar
   * según la matriz de jerarquía RBAC del sistema.
   */
  async findAssignable(requester: JwtPayload) {
    let allowedRoleCodes: RoleCode[] = [];

    switch (requester.roleCode) {
      case RoleCode.DEV:
        allowedRoleCodes = [
          RoleCode.DEV,
          RoleCode.ORG_ADMIN,
          RoleCode.COMPLEX_ADMIN,
          RoleCode.SECURITY,
          RoleCode.RESIDENT,
        ];
        break;
      case RoleCode.ORG_ADMIN:
        allowedRoleCodes = [RoleCode.COMPLEX_ADMIN, RoleCode.SECURITY, RoleCode.RESIDENT];
        break;
      case RoleCode.COMPLEX_ADMIN:
        allowedRoleCodes = [RoleCode.SECURITY, RoleCode.RESIDENT];
        break;
      default:
        allowedRoleCodes = [];
        break;
    }

    if (allowedRoleCodes.length === 0) {
      return [];
    }

    return this.prisma.role.findMany({
      where: {
        code: { in: allowedRoleCodes },
        status: 1,
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
      },
      orderBy: { name: 'asc' },
    });
  }
}
