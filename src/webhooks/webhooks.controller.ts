import { Body, Controller, Headers, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { PaymentWebhookDto } from './dto/payment-webhook.dto';
import { WhatsappWebhookDto } from './dto/whatsapp-webhook.dto';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('payments/:provider')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recibe eventos de pasarelas de pago (cuotas de administración, etc.)' })
  async handlePaymentWebhook(
    @Param('provider') provider: string,
    @Body() dto: PaymentWebhookDto,
    @Headers('x-signature') signature: string,
  ) {
    return this.webhooksService.handlePaymentWebhook(provider, dto, signature);
  }

  @Post('whatsapp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recibe eventos entrantes de la API de WhatsApp Business' })
  async handleWhatsappWebhook(
    @Body() dto: WhatsappWebhookDto,
    @Headers('x-hub-signature-256') signature: string,
  ) {
    return this.webhooksService.handleWhatsappWebhook(dto, signature);
  }
}
