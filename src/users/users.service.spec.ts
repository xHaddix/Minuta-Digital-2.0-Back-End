import { UsersService } from './users.service';
import { RoleCode } from '../common/constants/role.constants';

describe('UsersService.update role hierarchy', () => {
  const requester = { sub: 'admin-id', roleCode: RoleCode.DEV } as any;
  const existingUser = {
    id: 'user-id',
    roleId: 'old-role-id',
    organizationId: 'organization-id',
    residentialComplexId: 'complex-id',
    status: 1,
  };

  const setup = (targetRoleCode: RoleCode) => {
    const prisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue(existingUser),
        update: jest.fn().mockResolvedValue({ id: existingUser.id }),
      },
      role: {
        findUnique: jest.fn().mockResolvedValue({ code: targetRoleCode }),
      },
    };
    const userHierarchy = {
      resolve: jest.fn().mockResolvedValue({
        roleCode: targetRoleCode,
        organizationId: targetRoleCode === RoleCode.DEV ? null : 'organization-id',
        residentialComplexId:
          targetRoleCode === RoleCode.DEV || targetRoleCode === RoleCode.ORG_ADMIN
            ? null
            : 'complex-id',
      }),
      assertRequesterCanAssign: jest.fn(),
    };

    return {
      service: new UsersService(prisma as any, {} as any, userHierarchy as any),
      userHierarchy,
      prisma,
    };
  };

  it('does not resend a derived organizationId when changing between complex-scoped roles', async () => {
    const { service, userHierarchy, prisma } = setup(RoleCode.RESIDENT);

    await service.update('user-id', { roleId: 'new-role-id' }, requester);

    expect(userHierarchy.resolve).toHaveBeenCalledWith({
      roleId: 'new-role-id',
      residentialComplexId: 'complex-id',
    });
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          roleId: 'new-role-id',
          organizationId: 'organization-id',
          residentialComplexId: 'complex-id',
        }),
      }),
    );
  });

  it('keeps organizationId and omits residentialComplexId for an organization admin target', async () => {
    const { service, userHierarchy, prisma } = setup(RoleCode.ORG_ADMIN);

    await service.update('user-id', { roleId: 'new-role-id' }, requester);

    expect(userHierarchy.resolve).toHaveBeenCalledWith({
      roleId: 'new-role-id',
      organizationId: 'organization-id',
    });
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          roleId: 'new-role-id',
          organizationId: 'organization-id',
          residentialComplexId: null,
        }),
      }),
    );
  });

  it('omits both hierarchy IDs for a global developer target', async () => {
    const { service, userHierarchy, prisma } = setup(RoleCode.DEV);

    await service.update('user-id', { roleId: 'new-role-id' }, requester);

    expect(userHierarchy.resolve).toHaveBeenCalledWith({
      roleId: 'new-role-id',
    });
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          roleId: 'new-role-id',
          organizationId: null,
          residentialComplexId: null,
        }),
      }),
    );
  });
});
