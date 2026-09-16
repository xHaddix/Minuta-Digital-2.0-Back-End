import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class WhatsappWebhookDto {
  @ApiProperty({
    description: 'Identificador del objeto de WhatsApp',
    example: 'whatsapp_business_account',
  })
  @IsString()
  @IsNotEmpty({ message: 'El objeto de WhatsApp es obligatorio' })
  object!: string;

  @ApiProperty({ description: 'Estructura con las entradas recibidas desde Meta' })
  @IsObject()
  @IsNotEmpty({ message: 'El cuerpo de la entrada es obligatorio' })
  entry!: Record<string, any>;
}
