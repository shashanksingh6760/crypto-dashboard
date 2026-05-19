import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:4000';

class SocketService {
  private socket: Socket | null = null;

  connect(): Socket {
    if (this.socket?.connected) return this.socket;

    this.socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      console.log('🔌 WebSocket connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  subscribeToCoin(coinId: string) {
    this.socket?.emit('subscribe:coin', coinId);
  }

  unsubscribeFromCoin(coinId: string) {
    this.socket?.emit('unsubscribe:coin', coinId);
  }

  subscribeToAlerts(userId: string) {
    this.socket?.emit('subscribe:alerts', userId);
  }

  onPriceUpdate(callback: (data: any) => void) {
    this.socket?.on('prices:update', callback);
  }

  onAlertTriggered(callback: (data: any) => void) {
    this.socket?.on('alert:triggered', callback);
  }

  offPriceUpdate(callback?: (data: any) => void) {
    this.socket?.off('prices:update', callback);
  }

  offAlertTriggered(callback?: (data: any) => void) {
    this.socket?.off('alert:triggered', callback);
  }
}

export const socketService = new SocketService();
export default socketService;
