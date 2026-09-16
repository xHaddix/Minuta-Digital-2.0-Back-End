import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

export { Prisma };

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly pool: Pool;

  constructor(private readonly configService: ConfigService) {
    const connectionString = configService.get<string>('DATABASE_URL');

    if (!connectionString) {
      throw new Error('DATABASE_URL no está configurada en las variables de entorno');
    }

    // 1. Crear el pool nativo de conexiones para PostgreSQL
    const pool = new Pool({ connectionString });

    // 2. Crear el Driver Adapter oficial de Prisma 7 para PostgreSQL
    const adapter = new PrismaPg(pool);

    // 3. Pasar el adaptador al constructor de PrismaClient
    super({ adapter });

    this.pool = pool;
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Conexión con PostgreSQL (Prisma 7 Driver Adapter) establecida con éxito');
    } catch (error) {
      this.logger.error('Error al conectar con la base de datos PostgreSQL', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
    this.logger.log('Pool de conexiones a PostgreSQL cerrado de forma segura');
  }
}
