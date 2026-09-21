import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
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

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend;
  private readonly mailFrom: string;
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.mailFrom = this.configService.get<string>(
      'app.mail.from',
      'Minuta Digital <onboarding@resend.dev>', // Usa onboarding@resend.dev para pruebas
    );
    this.frontendUrl = this.configService.getOrThrow<string>('app.mail.frontendUrl');

    // Configura RESEND_API_KEY en tus variables de entorno de Render
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
  }

  async sendMail({ to, subject, html }: SendMailOptions): Promise<void> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.mailFrom,
        to: [to],
        subject,
        html,
      });

      if (error) {
        throw new Error(error.message);
      }

      this.logger.log(`Correo enviado a ${to}: "${subject}" (ID: ${data?.id})`);
    } catch (error) {
      this.logger.error(
        `Error enviando correo a ${to}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  async sendActivationEmail({
    to,
    name,
    rawToken,
    expiresInHours = 24,
  }: SendActivationEmailParams): Promise<void> {
    const activationUrl = `${this.frontendUrl}/auth/activate?token=${rawToken}`;
    const html = buildActivationEmailHtml({ name, activationUrl, expiresInHours });

    await this.sendMail({
      to,
      subject: 'Activa tu cuenta en Minuta Digital',
      html,
    });
  }

  async sendPasswordResetEmail({
    to,
    name,
    rawToken,
    expiresInMinutes = 60,
  }: SendPasswordResetEmailParams): Promise<void> {
    const resetUrl = `${this.frontendUrl}/auth/reset-password?token=${rawToken}`;
    const html = buildPasswordResetEmailHtml({ name, resetUrl, expiresInMinutes });

    await this.sendMail({
      to,
      subject: 'Recupera tu contraseña en Minuta Digital',
      html,
    });
  }
}
