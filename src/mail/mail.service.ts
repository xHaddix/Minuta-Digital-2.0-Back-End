import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { buildActivationEmailHtml } from './templates/activation-email.template';
import { buildPasswordResetEmailHtml } from './templates/password-reset-email.template';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

export interface SendActivationEmailParams {
  to: string;
  name: string;
  rawToken: string;
  expiresInHours?: number;
}

export interface SendPasswordResetEmailParams {
  to: string;
  name: string;
  rawToken: string;
  expiresInMinutes?: number;
}

/**
 * Servicio de correo genérico y reutilizable, basado en Nodemailer.
 *
 * En entorno local se conecta a Mailpit (SMTP sin autenticación, sin TLS),
 * lo cual permite probar el envío de correos sin depender de un proveedor
 * externo. La configuración se lee exclusivamente de variables de entorno
 * a través de ConfigService, por lo que en producción basta con apuntar
 * SMTP_HOST/SMTP_PORT a un proveedor real (SendGrid, SES, etc.).
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly mailFrom: string;
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.mailFrom = this.configService.get<string>(
      'app.mail.from',
      'Minuta Digital <no-reply@minutadigital.local>',
    );
    this.frontendUrl = this.configService.getOrThrow<string>('app.mail.frontendUrl');

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('app.mail.host', 'localhost'),
      port: this.configService.get<number>('app.mail.port', 1025),
      secure: this.configService.get<boolean>('app.mail.secure', false),
      // Fuerza la conexión por IPv4 para solucionar el error ENETUNREACH en Render
      family: 4,
      // Mailpit no requiere autenticación en local; en producción se puede
      // habilitar completando SMTP_USER/SMTP_PASS.
      auth: this.configService.get<string>('app.mail.user')
        ? {
            user: this.configService.get<string>('app.mail.user'),
            pass: this.configService.get<string>('app.mail.pass'),
          }
        : undefined,
    } as nodemailer.TransportOptions);
  }

  /**
   * Envía un correo genérico en formato HTML. Los errores de envío se
   * registran pero NUNCA deben interrumpir el flujo de negocio que los
   * origina (p. ej. la creación de un usuario no debe fallar solo porque
   * el correo de invitación no pudo enviarse).
   */
  async sendMail({ to, subject, html }: SendMailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.mailFrom,
        to,
        subject,
        html,
      });
      this.logger.log(`Correo enviado a ${to}: "${subject}"`);
    } catch (error) {
      this.logger.error(
        `Error enviando correo a ${to}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Construye el enlace de activación y envía el correo de invitación
   * utilizando la plantilla HTML estilizada.
   */
  async sendActivationEmail({
    to,
    name,
    rawToken,
    expiresInHours = 24,
  }: SendActivationEmailParams): Promise<void> {
    const activationUrl = `${this.frontendUrl}/auth/activate?token=${rawToken}`;

    const html = buildActivationEmailHtml({
      name,
      activationUrl,
      expiresInHours,
    });

    await this.sendMail({
      to,
      subject: 'Activa tu cuenta en Minuta Digital',
      html,
    });
  }

  /**
   * Construye el enlace de recuperación de contraseña y envía el correo
   * utilizando la plantilla HTML estilizada. El TTL es intencionalmente
   * corto (por defecto 60 minutos) dado que es un flujo sensible de
   * seguridad iniciado por el propio usuario.
   */
  async sendPasswordResetEmail({
    to,
    name,
    rawToken,
    expiresInMinutes = 60,
  }: SendPasswordResetEmailParams): Promise<void> {
    const resetUrl = `${this.frontendUrl}/auth/reset-password?token=${rawToken}`;

    const html = buildPasswordResetEmailHtml({
      name,
      resetUrl,
      expiresInMinutes,
    });

    await this.sendMail({
      to,
      subject: 'Recupera tu contraseña en Minuta Digital',
      html,
    });
  }
}
