import { Module } from '@nestjs/common';
import { PqrsService } from './pqrs.service';
import { PqrsController } from './pqrs.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [NotificationsModule, StorageModule],
  controllers: [PqrsController],
  providers: [PqrsService],
})
export class PqrsModule {}
