import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const BCRYPT_SALT_ROUNDS = 12;
const UserStatus = { INACTIVE: 0, ACTIVE: 1, PENDING: 2 };

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL no está configurada en las variables de entorno');
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('Iniciando el proceso de seeding en la base de datos central...');

  // 1. Matriz de Roles del Sistema RBAC
  const roles = [
    {
      code: 'ROLE_DEV',
      name: 'Desarrollador / Super Admin',
      description: 'Acceso global y control total de la plataforma SaaS.',
    },
    {
      code: 'ROLE_ORG_ADMIN',
      name: 'Administrador de Organización',
      description: 'Administra la constructora u organización y sus conjuntos asignados.',
    },
    {
      code: 'ROLE_COMPLEX_ADMIN',
      name: 'Administrador de Conjunto',
      description: 'Administra un conjunto residencial específico.',
    },
    {
      code: 'ROLE_SECURITY',
      name: 'Guarda de Seguridad / Vigilancia',
      description: 'Gestiona ingresos de visitantes, paquetería y minuta de control.',
    },
    {
      code: 'ROLE_RESIDENT',
      name: 'Residente / Propietario',
      description: 'Acceso a la app de residentes: reservas, PQRS, paquetería y marketplace.',
    },
  ];

  const createdRoles: Record<string, any> = {};

  for (const roleData of roles) {
    const role = await prisma.role.upsert({
      where: { code: roleData.code },
      update: { name: roleData.name, description: roleData.description },
      create: roleData,
    });
    createdRoles[roleData.code] = role;
  }

  // 2. Catálogo Maestro de Permisos (Recurso:Acción)
  const permissionsData = [
    // Módulo: Usuarios
    { code: 'users:read', description: 'Listar y ver detalles de usuarios', module: 'users' },
    {
      code: 'users:create',
      description: 'Registrar residentes o guardas de seguridad',
      module: 'users',
    },
    { code: 'users:update', description: 'Editar información de usuarios', module: 'users' },
    { code: 'users:delete', description: 'Inactivar o eliminar usuarios', module: 'users' },

    // Módulo: Visitantes
    {
      code: 'visitors:read',
      description: 'Consultar historial e ingresos de visitantes',
      module: 'visitors',
    },
    {
      code: 'visitors:create',
      description: 'Registrar ingreso de visitantes en portería',
      module: 'visitors',
    },
    {
      code: 'visitors:authorize',
      description: 'Pre-autorizar visitas o generar QR',
      module: 'visitors',
    },
    { code: 'visitors:check_out', description: 'Marcar salida de visitantes', module: 'visitors' },

    // Módulo: Correspondencia
    {
      code: 'correspondence:read',
      description: 'Listar paquetes registrados en portería',
      module: 'correspondence',
    },
    {
      code: 'correspondence:read_own',
      description: 'Ver notificaciones de paquetes propios',
      module: 'correspondence',
    },
    {
      code: 'correspondence:create',
      description: 'Registrar llegada de paquetería',
      module: 'correspondence',
    },
    {
      code: 'correspondence:deliver',
      description: 'Confirmar entrega de paquete al residente',
      module: 'correspondence',
    },

    // Módulo: Zonas Comunes / Amenities
    {
      code: 'amenities:read',
      description: 'Consultar zonas comunes y horarios',
      module: 'amenities',
    },
    {
      code: 'amenities:manage',
      description: 'Crear y editar áreas comunes y aforos',
      module: 'amenities',
    },
    { code: 'amenities:book', description: 'Crear solicitudes de reserva', module: 'amenities' },
    { code: 'amenities:approve', description: 'Aprobar o rechazar reservas', module: 'amenities' },
    {
      code: 'amenities:verify',
      description: 'Verificar reservas activas en portería',
      module: 'amenities',
    },

    // Módulo: PQRS
    { code: 'pqrs:read_own', description: 'Ver estado de PQRS propias', module: 'pqrs' },
    { code: 'pqrs:read_all', description: 'Ver todas las PQRS del conjunto', module: 'pqrs' },
    { code: 'pqrs:create', description: 'Radicar una nueva PQRS', module: 'pqrs' },
    { code: 'pqrs:respond', description: 'Responder y gestionar PQRS', module: 'pqrs' },
    { code: 'pqrs:close', description: 'Cerrar o archivar PQRS', module: 'pqrs' },

    // Módulo: Minuta Digital
    {
      code: 'events:read',
      description: 'Leer la minuta de novedades en portería',
      module: 'events',
    },
    {
      code: 'events:create',
      description: 'Registrar novedades e incidentes en minuta',
      module: 'events',
    },

    // Módulo: Marketplace
    {
      code: 'marketplace:read',
      description: 'Ver anuncios clasificados de la comunidad',
      module: 'marketplace',
    },
    {
      code: 'marketplace:create',
      description: 'Publicar producto o servicio',
      module: 'marketplace',
    },
    {
      code: 'marketplace:manage_own',
      description: 'Editar o eliminar publicaciones propias',
      module: 'marketplace',
    },
    {
      code: 'marketplace:moderate',
      description: 'Dar de baja avisos inadecuados',
      module: 'marketplace',
    },

    // Módulo: Administración Multi-Tenant / SaaS
    {
      code: 'complexes:manage',
      description: 'Administrar conjuntos residenciales',
      module: 'complexes',
    },
    {
      code: 'organizations:manage',
      description: 'Administrar organizaciones y suscripciones',
      module: 'organizations',
    },
  ];

  const createdPermissions: Record<string, any> = {};

  for (const permData of permissionsData) {
    const permission = await prisma.permission.upsert({
      where: { code: permData.code },
      update: { description: permData.description, module: permData.module },
      create: { ...permData, status: 1 },
    });
    createdPermissions[permData.code] = permission;
  }

  // 3. Asignación de Permisos por Rol (Tabla Pivot role_permissions)
  const rolePermissionMapping: Record<string, string[]> = {
    ROLE_SECURITY: [
      'visitors:read',
      'visitors:create',
      'visitors:check_out',
      'correspondence:read',
      'correspondence:create',
      'correspondence:deliver',
      'amenities:verify',
      'events:read',
      'events:create',
    ],
    ROLE_COMPLEX_ADMIN: [
      'users:read',
      'users:create',
      'users:update',
      'users:delete',
      'visitors:read',
      'correspondence:read',
      'amenities:read',
      'amenities:manage',
      'amenities:approve',
      'pqrs:read_all',
      'pqrs:respond',
      'pqrs:close',
      'events:read',
      'marketplace:read',
      'marketplace:moderate',
    ],
    ROLE_RESIDENT: [
      'visitors:authorize',
      'correspondence:read_own',
      'amenities:read',
      'amenities:book',
      'pqrs:read_own',
      'pqrs:create',
      'marketplace:read',
      'marketplace:create',
      'marketplace:manage_own',
    ],
    ROLE_ORG_ADMIN: ['complexes:manage', 'users:read', 'users:create', 'users:update'],
    ROLE_DEV: Object.keys(createdPermissions), // ROLE_DEV obtiene TODOS los permisos
  };

  for (const [roleCode, permCodes] of Object.entries(rolePermissionMapping)) {
    const role = createdRoles[roleCode];
    if (!role) continue;

    for (const permCode of permCodes) {
      const permission = createdPermissions[permCode];
      if (!permission) continue;

      // Se usa la clave compuesta única roleId_permissionId definida en Prisma
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
          status: 1,
        },
      });
    }
  }

  // 4. Organización Demo
  const organization = await prisma.organization.upsert({
    where: { identification: '900000000-1' },
    update: {},
    create: {
      name: 'Constructora Demo S.A.S.',
      identification: '900000000-1',
      contactEmail: 'contacto@demo.minutadigital.com',
    },
  });

  // 5. Conjunto Residencial Demo
  const complex = await prisma.residentialComplex.upsert({
    where: { slug: 'conjunto-demo' },
    update: {},
    create: {
      organizationId: organization.id,
      name: 'Conjunto Residencial Demo',
      slug: 'conjunto-demo',
      contactEmail: 'admin@demo.minutadigital.com',
    },
  });

  // 6. Usuario Administrador Demo
  const hashedPassword = await bcrypt.hash('Admin123!', BCRYPT_SALT_ROUNDS);

  await prisma.user.upsert({
    where: { email: 'admindev@demo.minutadigital.com' },
    update: {},
    create: {
      email: 'admindev@demo.minutadigital.com',
      password: hashedPassword,
      name: 'Administrador dEV',
      roleId: createdRoles['ROLE_DEV'].id,
      organizationId: organization.id,
      residentialComplexId: complex.id,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@demo.minutadigital.com' },
    update: {
      roleId: createdRoles['ROLE_ORG_ADMIN'].id,
      organizationId: organization.id,
      residentialComplexId: complex.id,
    },
    create: {
      email: 'admin@demo.minutadigital.com',
      password: hashedPassword,
      name: 'Administrador Demo',
      roleId: createdRoles['ROLE_ORG_ADMIN'].id,
      organizationId: organization.id,
      residentialComplexId: complex.id,
      status: UserStatus.ACTIVE,
    },
  });

  // 7. Catálogo de Tipos de Documento
  const documentTypes = [
    { code: 'CC', description: 'Cédula de ciudadanía' },
    { code: 'CE', description: 'Cédula de extranjería' },
    { code: 'PP', description: 'Pasaporte' },
    { code: 'NIT', description: 'Número de Identificación Tributaria' },
  ];

  for (const doc of documentTypes) {
    await prisma.documentType.upsert({
      where: { code: doc.code },
      update: {},
      create: doc,
    });
  }

  console.log(
    'Seed completado con éxito: Se sembraron roles, permisos, pivotes role_permissions y datos demo.',
  );

  await prisma.$disconnect();
  await pool.end();
}

main().catch(async (error) => {
  console.error('Error durante la ejecución del seed:', error);
  process.exit(1);
});
