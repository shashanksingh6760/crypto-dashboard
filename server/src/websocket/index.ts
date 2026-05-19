import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server;

export function initializeWebSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join room for specific coin updates
    socket.on('subscribe:coin', (coinId: string) => {
      socket.join(`coin:${coinId}`);
      console.log(`📡 ${socket.id} subscribed to ${coinId}`);
    });

    socket.on('unsubscribe:coin', (coinId: string) => {
      socket.leave(`coin:${coinId}`);
    });

    // Join user-specific room for alerts
    socket.on('subscribe:alerts', (userId: string) => {
      socket.join(`user:${userId}`);
      console.log(`🔔 ${socket.id} subscribed to alerts for user ${userId}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`❌ Client disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

// Broadcast price updates to all connected clients
export function broadcastPriceUpdate(data: any) {
  if (io) {
    io.emit('prices:update', data);
  }
}

// Send alert notification to specific user
export function sendAlertNotification(userId: string, alert: any) {
  if (io) {
    io.to(`user:${userId}`).emit('alert:triggered', alert);
  }
}
