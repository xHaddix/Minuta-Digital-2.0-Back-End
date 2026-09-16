/**
 * Códigos de rol del sistema (tabla `roles.code`). Se centralizan aquí para
 * evitar "strings mágicos" repetidos en guards, servicios y controladores.
 */
export enum RoleCode {
  DEV = 'ROLE_DEV',
  ORG_ADMIN = 'ROLE_ORG_ADMIN',
  COMPLEX_ADMIN = 'ROLE_COMPLEX_ADMIN',
  SECURITY = 'ROLE_SECURITY',
  RESIDENT = 'ROLE_RESIDENT',
}

/**
 * Roles cuyo alcance está restringido a UN conjunto residencial específico
 * (`residentialComplexId` obligatorio, `organizationId` derivado automáticamente).
 */
export const COMPLEX_SCOPED_ROLES: readonly RoleCode[] = [
  RoleCode.COMPLEX_ADMIN,
  RoleCode.SECURITY,
  RoleCode.RESIDENT,
];
