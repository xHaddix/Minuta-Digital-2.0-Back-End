import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';

/**
 * Módulo global e independiente que expone MailService al resto de la
 * aplicación (AuthModule, UsersModule, NotificationsModule, etc.) sin
 * necesidad de reimportarlo explícitamente en cada feature module.
 */
@Global()
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
