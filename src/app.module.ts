import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './storage/storage.module';
import { MailModule } from './mail/mail.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ResidentsModule } from './residents/residents.module';
import { VisitorsModule } from './visitors/visitors.module';
import { CorrespondenceModule } from './correspondence/correspondence.module';
import { AmenitiesModule } from './amenities/amenities.module';
import { PqrsModule } from './pqrs/pqrs.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { ResidentialComplexesModule } from './residential-complexes/residential-complexes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env'],
    }),
    PrismaModule,
    StorageModule,
    MailModule,
    NotificationsModule,
    AuthModule,
    UsersModule,
    ResidentsModule,
    VisitorsModule,
    CorrespondenceModule,
    AmenitiesModule,
    PqrsModule,
    MarketplaceModule,
    WebhooksModule,
    OrganizationsModule,
    ResidentialComplexesModule,
  ],
})
export class AppModule {}
