import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ path: '/ws' })
export class RidesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private clients = new Map<number, { ws: WebSocket; role: string }>();

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: WebSocket, req: any) {
    // Authentication via query param or message
    console.log('New WS connection attempt');
  }

  handleDisconnect(client: WebSocket) {
    this.clients.forEach((value, key) => {
      if (value.ws === client) {
        this.clients.delete(key);
        console.log(`User ${key} disconnected from WS`);
      }
    });
  }

  @SubscribeMessage('AUTH')
  handleAuth(client: WebSocket, payload: { token: string }) {
    try {
      const decoded = this.jwtService.verify(payload.token);
      this.clients.set(decoded.sub, { ws: client, role: decoded.role });
      console.log(`User ${decoded.sub} authenticated on WS as ${decoded.role}`);
      return { status: 'OK' };
    } catch (e) {
      client.close();
    }
  }

  @SubscribeMessage('JOIN_RIDE')
  handleJoinRide(client: WebSocket, payload: { rideId: number }) {
    // In a real app, we would verify the user's access to this ride
    // For simplicity, we just track which ride the client is interested in
    const userId = this.getUserId(client);
    if (userId) {
      console.log(`User ${userId} joined room for ride ${payload.rideId}`);
      // Store room membership in a way we can use for broadcasting
      // In 'ws' library, we don't have built-in rooms like Socket.io
      // We'll manage it manually
      (client as any).rideId = payload.rideId;
      return { status: 'JOINED', rideId: payload.rideId };
    }
  }

  @SubscribeMessage('LOCATION_UPDATE')
  handleLocationUpdate(client: WebSocket, payload: { lat: number; lng: number; rideId?: number }) {
    const userId = this.getUserId(client);
    if (userId) {
      // Broadcast to anyone interested in this specific ride
      const rideId = payload.rideId || (client as any).rideId;
      
      this.broadcastToRide(rideId, {
        type: 'DRIVER_LOCATION',
        driverId: userId,
        lat: payload.lat,
        lng: payload.lng,
        timestamp: Date.now()
      });

      // Also broadcast to all passengers for general "nearby drivers" view (optional)
      if (!rideId) {
        this.broadcastToRole('PASSENGER', {
          type: 'NEARBY_DRIVER_LOCATION',
          driverId: userId,
          lat: payload.lat,
          lng: payload.lng
        });
      }
    }
  }

  private getUserId(client: WebSocket): number | null {
    let userId: number | null = null;
    this.clients.forEach((v, k) => { if (v.ws === client) userId = k; });
    return userId;
  }

  broadcastToRide(rideId: number, message: any) {
    if (!rideId) return;
    const payload = JSON.stringify(message);
    this.server.clients.forEach((client: any) => {
      if (client.readyState === WebSocket.OPEN && client.rideId === rideId) {
        client.send(payload);
      }
    });
  }

  broadcastToRole(role: string, message: any) {
    const payload = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.role === role && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(payload);
      }
    });
  }

  sendToUser(userId: number, message: any) {
    const client = this.clients.get(userId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }
}
