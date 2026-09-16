import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

/**
 * NotificationsGateway
 * ----------------------------------------------------------------------------
 * Canal de notificaciones en tiempo real (correspondencia recibida, ingreso
 * de visitantes, actualizaciones de PQRS, etc).
 *
 * AISLAMIENTO POR TENANT: cada cliente debe unirse a una "room" de Socket.IO
 * nombrada con el `tenantSchema` (ej: room "conjunto_los_pinos") justo después
 * de conectarse, enviando el evento `join-tenant`. Todos los `emit` de eventos
 * de negocio deben dirigirse siempre a `server.to(tenantSchema)` y NUNCA
 * hacer broadcast global, para no filtrar eventos entre distintos tenants.
 */
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('join-tenant')
  handleJoinTenant(
    @MessageBody() data: { tenantSchema: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.tenantSchema);
    this.logger.log(`Socket ${client.id} unido a la room del tenant "${data.tenantSchema}"`);
    return { joined: data.tenantSchema };
  }

  /** Notifica a todos los clientes conectados de un tenant que llegó correspondencia nueva. */
  emitNewCorrespondence(tenantSchema: string, payload: unknown) {
    this.server.to(tenantSchema).emit('correspondence:new', payload);
  }

  /** Notifica el ingreso de un visitante en portería. */
  emitVisitorEntry(tenantSchema: string, payload: unknown) {
    this.server.to(tenantSchema).emit('visitor:entry', payload);
  }

  /** Notifica actualizaciones de estado en tickets PQRS. */
  emitPqrsUpdate(tenantSchema: string, payload: unknown) {
    this.server.to(tenantSchema).emit('pqrs:update', payload);
  }
}
