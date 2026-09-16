import { defineConfig, env } from 'prisma/config';

/**
 * Config de Prisma CLI para la base de datos CENTRAL (catálogo de tenants).
 * Usado por: npx prisma migrate/studio --config=prisma.central.config.ts
 */
export default defineConfig({
  schema: 'prisma/central/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
