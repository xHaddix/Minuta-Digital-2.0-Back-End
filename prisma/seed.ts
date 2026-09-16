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

  // 2. Organización Demo
  const organization = await prisma.organization.upsert({
    where: { identification: '900000000-1' },
    update: {},
    create: {
      name: 'Constructora Demo S.A.S.',
      identification: '900000000-1',
      contactEmail: 'contacto@demo.minutadigital.com',
    },
  });

  // 3. Conjunto Residencial Demo
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

  // 4. Usuario Administrador Demo
  const hashedPassword = await bcrypt.hash('Admin123!', BCRYPT_SALT_ROUNDS);

  await prisma.user.upsert({
    where: { email: 'admin@demo.minutadigital.com' },
    update: {},
    create: {
      email: 'admin@demo.minutadigital.com',
      password: hashedPassword,
      name: 'Administrador Demo',
      roleId: createdRoles['ROLE_COMPLEX_ADMIN'].id,
      organizationId: organization.id,
      residentialComplexId: complex.id,
      status: UserStatus.ACTIVE,
    },
  });

  // 5. Catálogo de Tipos de Documento
  const documentTypes = [
    { code: 'CC', description: 'Cédula de ciudadanía' },
    { code: 'CE', description: 'Cédula de extranjería' },
    { code: 'PP', description: 'Pasaporte' },
  ];

  for (const doc of documentTypes) {
    await prisma.documentType.upsert({
      where: { code: doc.code },
      update: {},
      create: doc,
    });
  }

  console.log('Seed completado con éxito: Se sembraron 5 roles y datos demo.');

  await prisma.$disconnect();
  await pool.end();
}

main().catch(async (error) => {
  console.error('Error durante la ejecución del seed:', error);
  process.exit(1);
});
