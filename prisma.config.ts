import { defineConfig } from '@prisma/config';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  schema: 'prisma/central/schema.prisma',
  migrations: {
    seed: 'npx tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
