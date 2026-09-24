import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions?.length) return true;

    const request = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const user = request.user;
    if (!user) return false;

    const assignments = await this.prisma.rolePermission.findMany({
      where: {
        status: 1,
        role: { code: user.roleCode, status: 1 },
        permission: {
          status: 1,
          code: { in: requiredPermissions },
        },
      },
      select: { permission: { select: { code: true } } },
    });

    const granted = new Set(assignments.map(({ permission }) => permission.code));
    return requiredPermissions.every((permission) => granted.has(permission));
  }
}
