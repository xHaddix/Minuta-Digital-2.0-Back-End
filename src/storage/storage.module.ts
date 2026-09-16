import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';

/**
 * Módulo global de almacenamiento (S3/MinIO). Se marca como @Global() ya
 * que StorageService es consumido transversalmente por casi todos los
 * módulos de dominio (correspondencia, PQRS, parqueaderos, marketplace...).
 */
@Global()
@Module({
  controllers: [StorageController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
