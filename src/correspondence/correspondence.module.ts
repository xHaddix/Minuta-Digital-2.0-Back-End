import { Module } from '@nestjs/common';
import { CorrespondenceService } from './correspondence.service';
import { CorrespondenceController } from './correspondence.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [NotificationsModule, StorageModule],
  controllers: [CorrespondenceController],
  providers: [CorrespondenceService],
})
export class CorrespondenceModule {}
