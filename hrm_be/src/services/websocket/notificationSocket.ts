// websocket/notificationSocket.ts
import { Server, Socket } from "socket.io";
import { createServer } from "http";
import { Express } from "express";

// Interfaces
interface UserConnection {
  socketId: string;
  userId: number;
  connectedAt: Date;
}

interface NotificationData {
  id: number;
  type: string;
  title: string;
  message: string;
  data?: any;
  created_at: string;
}

interface ConnectionEstablishedData {
  message: string;
  userId: number;
  socketId: string;
}

interface PongData {
  timestamp: string;
  serverTime: string;
}

class NotificationWebSocket {
  private io: Server | null = null;
  private userSockets: Map<number, UserConnection> = new Map();
  private readonly connectionTimeout: number = 30000; // 30 seconds

  public initialize(server: ReturnType<typeof createServer>): Server {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupEventHandlers();
    console.log("🔗 WebSocket server initialized");
    return this.io;
  }

  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on("connection", (socket: Socket) => {
      console.log("🔗 New client connected:", socket.id);

      // User authentication and room joining
      socket.on("user_connect", (userId: number) => {
        this.handleUserConnect(socket, userId);
      });

      // Ping-pong for connection health check
      socket.on("ping", () => {
        this.handlePing(socket);
      });

      // Disconnection handling
      socket.on("disconnect", (reason: string) => {
        this.handleDisconnect(socket, reason);
      });

      // Error handling
      socket.on("error", (error: Error) => {
        this.handleError(socket, error);
      });

      // Force disconnect
      socket.on("force_disconnect", () => {
        socket.disconnect(true);
      });
    });
  }

  private handleUserConnect(socket: Socket, userId: number): void {
    // Validate userId
    if (!userId || typeof userId !== "number") {
      socket.emit("connection_error", {
        message: "Invalid user ID",
      });
      return;
    }

    // Store user connection
    this.userSockets.set(userId, {
      socketId: socket.id,
      userId,
      connectedAt: new Date(),
    });

    // Join user-specific room
    socket.join(`user_${userId}`);
    socket.join("authenticated_users");

    console.log(`👤 User ${userId} connected with socket ${socket.id}`);

    // Send connection confirmation
    socket.emit("connection_established", {
      message: "WebSocket connected successfully",
      userId,
      socketId: socket.id,
    } as ConnectionEstablishedData);

    // Notify others in the same user room (for multiple tabs/devices)
    socket.to(`user_${userId}`).emit("user_session_update", {
      type: "new_connection",
      socketId: socket.id,
      timestamp: new Date().toISOString(),
    });
  }

  private handlePing(socket: Socket): void {
    socket.emit("pong", {
      timestamp: new Date().toISOString(),
      serverTime: new Date().toISOString(),
    } as PongData);
  }

  private handleDisconnect(socket: Socket, reason: string): void {
    console.log(`🔴 Client disconnected: ${socket.id}, Reason: ${reason}`);

    // Remove from userSockets
    for (const [userId, connection] of this.userSockets.entries()) {
      if (connection.socketId === socket.id) {
        this.userSockets.delete(userId);
        console.log(`🗑️ Removed user ${userId} from socket mapping`);

        // Notify other sessions
        socket.to(`user_${userId}`).emit("user_session_update", {
          type: "connection_lost",
          socketId: socket.id,
          timestamp: new Date().toISOString(),
        });
        break;
      }
    }
  }

  private handleError(socket: Socket, error: Error): void {
    console.error(`❌ Socket error (${socket.id}):`, error);
    socket.emit("socket_error", {
      message: "Socket connection error",
      error: error.message,
    });
  }

  // Public methods for sending notifications
  public sendRealtimeNotification(
    userId: number,
    notification: NotificationData
  ): boolean {
    if (!this.io) {
      console.error("❌ WebSocket server not initialized");
      return false;
    }

    const userConnection = this.userSockets.get(userId);
    if (userConnection) {
      this.io.to(userConnection.socketId).emit("new_notification", {
        ...notification,
        is_realtime: true,
        received_at: new Date().toISOString(),
      });
      console.log(`📨 Real-time notification sent to user ${userId}`);
      return true;
    } else {
      console.log(`⚠️ User ${userId} is not connected`);
      return false;
    }
  }

  public broadcastToUsers(
    userIds: number[],
    notification: NotificationData
  ): number {
    if (!this.io) {
      console.error("❌ WebSocket server not initialized");
      return 0;
    }

    let sentCount = 0;
    userIds.forEach((userId) => {
      if (this.sendRealtimeNotification(userId, notification)) {
        sentCount++;
      }
    });

    console.log(`📢 Notification sent to ${sentCount}/${userIds.length} users`);
    return sentCount;
  }

  public broadcastToAll(notification: NotificationData): number {
    if (!this.io) {
      console.error("❌ WebSocket server not initialized");
      return 0;
    }

    this.io.emit("new_notification", {
      ...notification,
      is_broadcast: true,
      received_at: new Date().toISOString(),
    });

    const sentCount = this.userSockets.size;
    console.log(`🌐 Broadcast notification sent to ${sentCount} users`);
    return sentCount;
  }

  // Utility methods
  public getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  public getConnectedUsers(): number[] {
    return Array.from(this.userSockets.keys());
  }

  public getUserConnection(userId: number): UserConnection | undefined {
    return this.userSockets.get(userId);
  }

  public disconnectUser(userId: number): boolean {
    const userConnection = this.userSockets.get(userId);
    if (userConnection && this.io) {
      this.io.sockets.sockets.get(userConnection.socketId)?.disconnect(true);
      this.userSockets.delete(userId);
      console.log(`🔌 Forcefully disconnected user ${userId}`);
      return true;
    }
    return false;
  }
}

export const notificationWebSocket = new NotificationWebSocket();
export default NotificationWebSocket;
