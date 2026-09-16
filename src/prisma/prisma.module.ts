import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Módulo global que expone el acceso unificado a la base de datos de Minuta Digital
 * utilizando el cliente de Prisma generado con Driver Adapters.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
