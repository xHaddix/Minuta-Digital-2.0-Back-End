import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorador para restringir el acceso a un endpoint según el código del rol
 * del usuario (tabla `roles.code`, ej: ROLE_DEV, ROLE_ORG_ADMIN,
 * ROLE_COMPLEX_ADMIN, ROLE_SECURITY, ROLE_RESIDENT). Debe usarse junto al
 * RolesGuard.
 */
export const Roles = (...roleCodes: string[]) => SetMetadata(ROLES_KEY, roleCodes);
