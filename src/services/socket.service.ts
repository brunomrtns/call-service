import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { config } from "@/config";
import logger from "@/utils/logger";
import { AuthPayload, SocketCallEvent } from "@/types";
import { UserService } from '@/services/user.service';
import { SipService } from '@/services/sip.service';

interface SocketUser extends AuthPayload {
  device?: string;
}

export class SocketService {
  private io: Server;
  private connectedUsers: Map<number, { socket: Socket; user: SocketUser }> = new Map();
  private sipService: SipService;
  private userService = new UserService();

  constructor(httpServer: any) {
    // Debug da importação
    console.log('SipService import:', SipService);
    console.log('typeof SipService:', typeof SipService);
    
    this.sipService = new SipService();
    logger.info('🔥 SIP service REAL (não mock) inicializado com Asterisk!');
    
    this.io = new Server(httpServer, {
      cors: {
        origin: config.corsOrigins,
        methods: ["GET", "POST"],
      },
    });

    this.setupAuthentication();
    this.setupConnectionHandlers();
    this.setupSipEventHandlers();
  }

  private setupAuthentication(): void {
    this.io.use(async (socket: Socket, next) => {
      try {
        logger.info('=== NOVA TENTATIVA DE CONEXÃO SOCKET ===');
        logger.info('Socket handshake auth:', socket.handshake.auth);
        logger.info('Socket handshake query:', socket.handshake.query);
        logger.info('Socket handshake headers:', socket.handshake.headers);
        
        const token = socket.handshake.auth.token;
        logger.info('Token recebido:', token ? `Token presente (${token.substring(0, 20)}...)` : 'Token ausente');

        if (!token) {
          logger.error('❌ Authentication error: No token provided');
          return next(new Error("Authentication error: No token provided"));
        }

        logger.info('🔍 Verificando token JWT...');
        const decoded = jwt.verify(token, config.jwt.secret) as AuthPayload;
        logger.info('✅ Token decodificado:', { userId: decoded.userId, username: decoded.username, type: decoded.type });
        
        // Buscar dados completos do usuário incluindo device
        logger.info('🔍 Buscando dados do usuário no banco...');
        const user = await this.userService.getUserById(decoded.userId);
        if (!user) {
          logger.error('❌ User not found:', decoded.userId);
          return next(new Error("User not found"));
        }

        logger.info('✅ Usuário encontrado:', { id: user.id, name: user.name, device: user.device });

        (socket as any).user = {
          userId: user.id,
          username: user.username,
          type: decoded.type,
          device: user.device,
          name: user.name
        };
        
        logger.info('✅ Socket authentication successful for:', user.username);
        next();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error("❌ Socket authentication error:", error);
        next(new Error(`Authentication error: ${errorMessage}`));
      }
    });
  }

  private setupConnectionHandlers(): void {
    this.io.on("connection", async (socket: Socket) => {
      const user = (socket as any).user as SocketUser;
      logger.info(
        `User connected via socket: ${user.username} (${user.userId}) - Device: ${user.device || 'none'}`
      );

      // Store user connection
      this.connectedUsers.set(user.userId, { socket, user });

      // Registrar dispositivo SIP se o usuário tiver um device
      if (user.device) {
        try {
          await this.sipService.registerDevice(user.userId, user.device, 'Teste123');
          logger.info(`SIP device ${user.device} registered for user ${user.username}`);
        } catch (error) {
          logger.error(`Failed to register SIP device for user ${user.username}:`, error);
        }
      }

      // Emitir lista de usuários online para todos
      this.emitOnlineUsers();

      // Handle user events
      this.handleUserEvents(socket, user);

      // Handle disconnection
      socket.on("disconnect", async () => {
        logger.info(`User disconnected: ${user.username} (${user.userId})`);
        
        // Desregistrar dispositivo SIP
        if (user.device) {
          try {
            await this.sipService.unregisterDevice(user.device);
            logger.info(`SIP device ${user.device} unregistered for user ${user.username}`);
          } catch (error) {
            logger.error(`Failed to unregister SIP device for user ${user.username}:`, error);
          }
        }

        this.connectedUsers.delete(user.userId);
        
        // Emitir lista atualizada de usuários online
        this.emitOnlineUsers();
      });
    });
  }

  private setupSipEventHandlers(): void {
    // Eventos do serviço SIP
    this.sipService.on('device_registered', (data: any) => {
      logger.info(`SIP device registered: ${data.device} for user ${data.userId}`);
      this.io.emit('sip_device_registered', data);
      this.emitOnlineUsers(); // Atualizar lista com status SIP
    });

    this.sipService.on('device_unregistered', (data: any) => {
      logger.info(`SIP device unregistered: ${data.device} for user ${data.userId}`);
      this.io.emit('sip_device_unregistered', data);
      this.emitOnlineUsers(); // Atualizar lista com status SIP
    });

    this.sipService.on('incoming_call', (data: any) => {
      logger.info(`Incoming SIP call: ${data.callId} for device ${data.device}`);
      
      // Encontrar o usuário pelo device e notificar
      const userConnection = this.findConnectionByDevice(data.device);
      if (userConnection) {
        userConnection.socket.emit('incoming_call', {
          callId: data.callId,
          fromDevice: data.device,
          fromUri: data.fromUri
        });
      }
    });

    this.sipService.on('call_ringing', (data: any) => {
      logger.info(`Call ringing: ${data.callId}`);
      this.io.emit('call_ringing', data);
    });

    this.sipService.on('call_answered', (data: any) => {
      logger.info(`Call answered: ${data.callId}`);
      this.io.emit('call_answered', data);
    });

    this.sipService.on('call_ended', (data: any) => {
      logger.info(`Call ended: ${data.callId}`);
      this.io.emit('call_ended', data);
    });
  }

  private handleUserEvents(socket: Socket, user: SocketUser): void {
    // Handle call-related events
    socket.on("join_call", (data: { callId: string }) => {
      socket.join(`call_${data.callId}`);
      logger.info(`User ${user.username} joined call: ${data.callId}`);
    });

    socket.on("leave_call", (data: { callId: string }) => {
      socket.leave(`call_${data.callId}`);
      logger.info(`User ${user.username} left call: ${data.callId}`);
    });

    // Handle SIP call events
    socket.on("call_user", async (data: { targetUserId: number }) => {
      await this.handleCallUser(socket, user, data);
    });

    socket.on("answer_call", async (data: { callId: string }) => {
      await this.handleAnswerCall(socket, user, data);
    });

    socket.on("reject_call", async (data: { callId: string }) => {
      await this.handleRejectCall(socket, user, data);
    });

    socket.on("hangup_call", async (data: { callId: string }) => {
      await this.handleHangupCall(socket, user, data);
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

  private async handleCallUser(socket: Socket, caller: SocketUser, data: { targetUserId: number }): Promise<void> {
    try {
      const targetConnection = this.connectedUsers.get(data.targetUserId);
      if (!targetConnection) {
        socket.emit('call_error', { message: 'Target user is not online' });
        return;
      }

      const target = targetConnection.user;

      if (!caller.device || !target.device) {
        socket.emit('call_error', { message: 'Both users must have SIP devices configured' });
        return;
      }

      // Verificar se os dispositivos estão registrados
      if (!this.sipService.isDeviceRegistered(caller.device) || 
          !this.sipService.isDeviceRegistered(target.device)) {
        socket.emit('call_error', { message: 'SIP devices not registered' });
        return;
      }

      // Iniciar chamada SIP
      const callId = await this.sipService.makeCall(caller.device, target.device);
      
      socket.emit('call_initiated', { 
        callId, 
        targetUser: target.username,
        targetDevice: target.device 
      });

      // Notificar o usuário de destino
      targetConnection.socket.emit('incoming_call', {
        callId,
        callerUser: caller.username,
        callerDevice: caller.device
      });

    } catch (error) {
      logger.error(`Error initiating call:`, error);
      socket.emit('call_error', { message: 'Failed to initiate call' });
    }
  }

  private async handleAnswerCall(socket: Socket, user: SocketUser, data: { callId: string }): Promise<void> {
    try {
      await this.sipService.answerCall(data.callId);
      socket.emit('call_answer_sent', { callId: data.callId });
    } catch (error) {
      logger.error(`Error answering call:`, error);
      socket.emit('call_error', { message: 'Failed to answer call' });
    }
  }

  private async handleRejectCall(socket: Socket, user: SocketUser, data: { callId: string }): Promise<void> {
    try {
      await this.sipService.rejectCall(data.callId);
      socket.emit('call_rejected', { callId: data.callId });
    } catch (error) {
      logger.error(`Error rejecting call:`, error);
      socket.emit('call_error', { message: 'Failed to reject call' });
    }
  }

  private async handleHangupCall(socket: Socket, user: SocketUser, data: { callId: string }): Promise<void> {
    try {
      await this.sipService.hangupCall(data.callId);
      socket.emit('call_hung_up', { callId: data.callId });
    } catch (error) {
      logger.error(`Error hanging up call:`, error);
      socket.emit('call_error', { message: 'Failed to hang up call' });
    }
  }

  private findConnectionByDevice(device: string): { socket: Socket; user: SocketUser } | undefined {
    for (const connection of this.connectedUsers.values()) {
      if (connection.user.device === device) {
        return connection;
      }
    }
    return undefined;
  }

  private emitOnlineUsers(): void {
    const onlineUsers = Array.from(this.connectedUsers.values()).map(({ user }) => ({
      userId: user.userId,
      username: user.username,
      type: user.type,
      device: user.device,
      sipRegistered: user.device ? this.sipService.isDeviceRegistered(user.device) : false
    }));

    this.io.emit('users_online', onlineUsers);
  }

  public broadcastToUser(userId: number, event: string, data: any): void {
    const connection = this.connectedUsers.get(userId);
    if (connection) {
      connection.socket.emit(event, data);
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

  public getOnlineUsers(): SocketUser[] {
    const users: SocketUser[] = [];
    this.connectedUsers.forEach(({ user }) => {
      users.push(user);
    });
    return users;
  }

  public async shutdown(): Promise<void> {
    logger.info('Shutting down Socket service');
    
    // Desregistrar todos os dispositivos SIP
    await this.sipService.shutdown();
    
    // Fechar todas as conexões
    this.io.close();
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
