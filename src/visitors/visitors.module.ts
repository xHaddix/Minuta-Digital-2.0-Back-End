import { Module } from '@nestjs/common';
import { VisitorsService } from './visitors.service';
import { VisitorsController } from './visitors.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [VisitorsController],
  providers: [VisitorsService],
})
export class VisitorsModule {}
