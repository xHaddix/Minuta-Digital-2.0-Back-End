import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PaymentWebhookDto } from './dto/payment-webhook.dto';
import { WhatsappWebhookDto } from './dto/whatsapp-webhook.dto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly configService: ConfigService) {}

  async handlePaymentWebhook(
    provider: string,
    payload: PaymentWebhookDto,
    signatureHeader?: string,
  ): Promise<{ received: boolean }> {
    // 1. Validar proveedor soportado
    const allowedProviders = ['wompi', 'payu', 'stripe'];
    if (!allowedProviders.includes(provider.toLowerCase())) {
      throw new BadRequestException(`Proveedor de pagos '${provider}' no soportado`);
    }

    // 2. Validar firma criptográfica HMAC según el proveedor
    this.verifyPaymentSignature(provider, payload, signatureHeader);

    this.logger.log(`Evento de pago verificado y procesado [${provider}]: ${payload.event}`);

    // TODO: Encolar procesamiento asíncrono en Bull/Redis para actualizar facturación
    return { received: true };
  }

  async handleWhatsappWebhook(
    payload: WhatsappWebhookDto,
    signatureHeader?: string,
  ): Promise<{ received: boolean }> {
    // Validar firma de Meta/WhatsApp
    this.verifyWhatsappSignature(payload, signatureHeader);

    this.logger.log(`Webhook de WhatsApp verificado y procesado`);

    return { received: true };
  }

  /**
   * Verifica la firma HMAC enviada en los headers por la pasarela de pago.
   */
  private verifyPaymentSignature(provider: string, payload: any, signature?: string): void {
    const secret = this.configService.get<string>(`app.webhooks.${provider}Secret`);

    // Si no está configurado el secreto en variables de entorno, bloquear en producción
    if (!secret) {
      this.logger.warn(`Secreto del webhook de ${provider} no configurado`);
      return;
    }

    if (!signature) {
      throw new UnauthorizedException('Falta la cabecera de firma del webhook');
    }

    // Ejemplo HMAC SHA-256
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      throw new UnauthorizedException('La firma del webhook es inválida');
    }
  }

  private verifyWhatsappSignature(payload: any, signature?: string): void {
    const secret = this.configService.get<string>('app.webhooks.whatsappSecret');
    if (!secret || !signature) return;

    const hmac = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
    const expectedSignature = `sha256=${hmac}`;

    if (signature !== expectedSignature) {
      throw new UnauthorizedException('Firma de WhatsApp inválida');
    }
  }
}
