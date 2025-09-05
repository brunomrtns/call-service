import { Server, Socket } from "socket.io";
import { createServer } from "http";
import jwt from "jsonwebtoken";
import { config } from "@/config";
import logger from "@/utils/logger";
import { AuthPayload, SocketCallEvent } from "@/types";

export class SocketService {
  private io: Server;
  private connectedUsers: Map<number, Socket> = new Map();

  constructor(httpServer: any) {
    this.io = new Server(httpServer, {
      cors: {
        origin: config.corsOrigins,
        methods: ["GET", "POST"],
      },
    });

    this.setupAuthentication();
    this.setupConnectionHandlers();
  }

  private setupAuthentication(): void {
    this.io.use((socket: Socket, next) => {
      try {
        const token = socket.handshake.auth.token;

        if (!token) {
          return next(new Error("Authentication error: No token provided"));
        }

        const decoded = jwt.verify(token, config.jwt.secret) as AuthPayload;
        (socket as any).user = decoded;
        next();
      } catch (error) {
        logger.error("Socket authentication error:", error);
        next(new Error("Authentication error: Invalid token"));
      }
    });
  }

  private setupConnectionHandlers(): void {
    this.io.on("connection", (socket: Socket) => {
      const user = (socket as any).user as AuthPayload;
      logger.info(
        `User connected via socket: ${user.username} (${user.userId})`
      );

      // Store user connection
      this.connectedUsers.set(user.userId, socket);

      // Handle user events
      this.handleUserEvents(socket, user);

      // Handle disconnection
      socket.on("disconnect", () => {
        logger.info(`User disconnected: ${user.username} (${user.userId})`);
        this.connectedUsers.delete(user.userId);
      });
    });
  }

  private handleUserEvents(socket: Socket, user: AuthPayload): void {
    // Handle call-related events
    socket.on("join_call", (data: { callId: string }) => {
      socket.join(`call_${data.callId}`);
      logger.info(`User ${user.username} joined call: ${data.callId}`);
    });

    socket.on("leave_call", (data: { callId: string }) => {
      socket.leave(`call_${data.callId}`);
      logger.info(`User ${user.username} left call: ${data.callId}`);
    });

    // Handle status updates
    socket.on("update_status", (data: { status: string }) => {
      this.broadcastToUser(user.userId, "status_updated", {
        userId: user.userId,
        username: user.username,
        status: data.status,
      });
    });

    // Handle typing indicators for chat/notes
    socket.on("typing", (data: { callId: string; isTyping: boolean }) => {
      socket.to(`call_${data.callId}`).emit("user_typing", {
        userId: user.userId,
        username: user.username,
        isTyping: data.isTyping,
      });
    });
  }

  public broadcastToUser(userId: number, event: string, data: any): void {
    const userSocket = this.connectedUsers.get(userId);
    if (userSocket) {
      userSocket.emit(event, data);
    }
  }

  public broadcastToCall(callId: string, event: string, data: any): void {
    this.io.to(`call_${callId}`).emit(event, data);
  }

  public broadcastToAll(event: string, data: any): void {
    this.io.emit(event, data);
  }

  public notifyCallEvent(event: SocketCallEvent): void {
    logger.info("Broadcasting call event:", event);

    switch (event.type) {
      case "call_initiated":
        this.broadcastToCall(event.callId, "call_initiated", event.data);
        break;
      case "call_ringing":
        this.broadcastToCall(event.callId, "call_ringing", event.data);
        break;
      case "call_answered":
        this.broadcastToCall(event.callId, "call_answered", event.data);
        break;
      case "call_ended":
        this.broadcastToCall(event.callId, "call_ended", event.data);
        break;
      case "call_transferred":
        this.broadcastToCall(event.callId, "call_transferred", event.data);
        break;
      default:
        logger.warn("Unknown call event type:", event.type);
    }
  }

  public getUsersOnline(): number {
    return this.connectedUsers.size;
  }

  public isUserOnline(userId: number): boolean {
    return this.connectedUsers.has(userId);
  }

  public getOnlineUsers(): AuthPayload[] {
    const users: AuthPayload[] = [];
    this.connectedUsers.forEach((socket) => {
      const user = (socket as any).user as AuthPayload;
      users.push(user);
    });
    return users;
  }

  public disconnect(): void {
    this.io.close();
  }
}

let socketService: SocketService | null = null;

export const initializeSocket = (httpServer: any): SocketService => {
  if (!socketService) {
    socketService = new SocketService(httpServer);
  }
  return socketService;
};

export const getSocketService = (): SocketService | null => {
  return socketService;
};

export default { initializeSocket, getSocketService };
