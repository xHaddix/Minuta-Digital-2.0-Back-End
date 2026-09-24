import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

interface JoinComplexMessage {
  residentialComplexId?: unknown;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/**
 * NotificationsGateway
 * ----------------------------------------------------------------------------
 * Canal de notificaciones en tiempo real (correspondencia recibida, ingreso
 * de visitantes, actualizaciones de PQRS, etc).
 *
 * AISLAMIENTO POR TENANT: cada cliente autenticado se une a una room de
 * Socket.IO nombrada `complex_<residentialComplexId>` usando exclusivamente la
 * claim firmada del JWT. Los eventos de negocio nunca hacen broadcast global.
 */
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: Socket) {
    const user = this.authenticateClient(client);

    if (!user?.residentialComplexId) {
      this.logger.warn(`Socket rechazado por falta de contexto: ${client.id}`);
      client.disconnect(true);
      return;
    }

    client.data.user = user;
    client.join(this.roomForComplex(user.residentialComplexId));
    this.logger.log(
      `Cliente ${client.id} unido a ${this.roomForComplex(user.residentialComplexId)}`,
    );
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('join-tenant')
  handleJoinTenant(@MessageBody() data: JoinComplexMessage, @ConnectedSocket() client: Socket) {
    const user = client.data.user as JwtPayload | undefined;
    const requestedComplexId =
      typeof data?.residentialComplexId === 'string'
        ? data.residentialComplexId
        : user?.residentialComplexId;

    if (!user?.residentialComplexId || requestedComplexId !== user.residentialComplexId) {
      return {
        joined: false,
        error: 'El conjunto residencial no coincide con el contexto del token',
      };
    }

    const room = this.roomForComplex(user.residentialComplexId);
    client.join(room);
    this.logger.log(`Socket ${client.id} unido a la room "${room}"`);
    return { joined: room };
  }

  /** Notifica a todos los clientes del conjunto que llegó correspondencia nueva. */
  emitNewCorrespondence(residentialComplexId: string, payload: unknown) {
    this.server.to(this.roomForComplex(residentialComplexId)).emit('correspondence:new', payload);
  }

  /** Notifica el ingreso de un visitante en portería. */
  emitVisitorEntry(residentialComplexId: string, payload: unknown) {
    this.emitVisitorUpdated(residentialComplexId, payload);
  }

  emitVisitorUpdated(residentialComplexId: string, payload: unknown) {
    this.server.to(this.roomForComplex(residentialComplexId)).emit('visitor_updated', payload);
  }

  /** Notifica actualizaciones de estado en tickets PQRS. */
  emitPqrsUpdate(residentialComplexId: string, payload: unknown) {
    this.server.to(this.roomForComplex(residentialComplexId)).emit('pqrs:update', payload);
  }

  private roomForComplex(residentialComplexId: string): string {
    return `complex_${residentialComplexId}`;
  }

  private authenticateClient(client: Socket): JwtPayload | null {
    const token = this.readToken(client);
    if (!token) return null;

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      if (
        typeof payload.sub !== 'string' ||
        typeof payload.email !== 'string' ||
        typeof payload.roleCode !== 'string' ||
        (payload.residentialComplexId !== null && typeof payload.residentialComplexId !== 'string')
      ) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }

  private readToken(client: Socket): string | null {
    const auth = client.handshake.auth as unknown;
    if (isRecord(auth) && typeof auth.token === 'string') {
      return auth.token.replace(/^Bearer\s+/i, '');
    }

    const authorization = client.handshake.headers.authorization;
    if (typeof authorization === 'string' && /^Bearer\s+/i.test(authorization)) {
      return authorization.replace(/^Bearer\s+/i, '');
    }

    return null;
  }
}
