import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class PaymentWebhookDto {
  @ApiProperty({
    description: 'Nombre del evento emitido por la pasarela',
    example: 'transaction.updated',
  })
  @IsString()
  @IsNotEmpty({ message: 'El evento es obligatorio' })
  event!: string;

  @ApiProperty({ description: 'Payload con los detalles de la transacción' })
  @IsObject()
  @IsNotEmpty({ message: 'Los datos de la transacción son obligatorios' })
  data!: Record<string, any>;
}
