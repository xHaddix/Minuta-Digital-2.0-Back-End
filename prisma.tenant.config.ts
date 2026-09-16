import { defineConfig, env } from 'prisma/config';

/**
 * Config de Prisma CLI para el esquema de TENANT (plantilla aplicada a cada
 * esquema PostgreSQL de conjunto residencial).
 *
 * Para migrar/crear el esquema de un tenant específico, exporta
 * TENANT_DATABASE_URL con el `?schema=<nombre_tenant>` correspondiente antes
 * de ejecutar el comando, ej:
 *
 *   $env:TENANT_DATABASE_URL="postgresql://user:pass@localhost:5432/central_db?schema=demo"
 *   npx prisma migrate dev --config=prisma.tenant.config.ts
 */
export default defineConfig({
  schema: 'prisma/tenant/schema.prisma',
  datasource: {
    url: env('TENANT_DATABASE_URL'),
  },
});
