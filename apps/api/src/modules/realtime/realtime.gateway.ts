import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Logger, UnauthorizedException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { Server, Socket } from "socket.io";
import {
  restaurantRoom,
  tableRoom,
  type SocketEventName,
} from "@qrmenu/types";
import type { JwtPayload } from "../auth/auth.types";

interface ClientHandshakeAuth {
  token?: string;
  // Müşteri tarafı (giriş yapmamış) için QR token
  qrToken?: string;
}

@Injectable()
@WebSocketGateway({
  namespace: "/ws",
  cors: { origin: true, credentials: true },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const auth = (client.handshake.auth ?? {}) as ClientHandshakeAuth;
      if (auth.token) {
        const payload = await this.jwt.verifyAsync<JwtPayload>(auth.token, {
          secret: this.config.getOrThrow<string>("JWT_ACCESS_SECRET"),
        });
        client.data.user = payload;
        if (payload.restaurantId) {
          await client.join(restaurantRoom(payload.tenantId, payload.restaurantId));
        }
      } else if (auth.qrToken) {
        // Müşteri: yalnız o masanın kanalına abone olur (sunucu join'i yapar
        // QR doğrulamasından sonra). Bu skeleton'da, gerçek doğrulama
        // tables modülünde gelir; şimdilik sadece bağlantıya izin veriyoruz.
        client.data.qrToken = auth.qrToken;
      } else {
        throw new UnauthorizedException("Token veya QR yok.");
      }
      this.logger.debug(`socket connected: ${client.id}`);
    } catch (err) {
      this.logger.warn(`socket auth fail: ${(err as Error).message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`socket disconnected: ${client.id}`);
  }

  /** Müşteri masaya bağlanmak ister */
  @SubscribeMessage("join_table")
  async onJoinTable(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tenantId: string; tableId: string }
  ): Promise<{ ok: boolean }> {
    // TODO: tables servisi ile QR token'ı doğrula
    await client.join(tableRoom(data.tenantId, data.tableId));
    return { ok: true };
  }

  /** Type-safe yayın yardımcıları */
  emitToRestaurant(
    tenantId: string,
    restaurantId: string,
    event: SocketEventName,
    payload: unknown
  ): void {
    this.server.to(restaurantRoom(tenantId, restaurantId)).emit(event, payload);
  }

  emitToTable(
    tenantId: string,
    tableId: string,
    event: SocketEventName,
    payload: unknown
  ): void {
    this.server.to(tableRoom(tenantId, tableId)).emit(event, payload);
  }
}
