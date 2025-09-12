import JsSIP from "jssip";
import {
  SIP_STATUS,
  SIP_WS_URI,
  SIP_REALM,
  SIP_PASSWORD_DEFAULT,
  type SIPStatus,
  type User,
} from "../types";

export class SipService {
  private ua: JsSIP.UA | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private isActive = true;
  private currentUser: User | null = null;

  private callbacks: {
    onStatusChange?: (_status: SIPStatus) => void;
    onIncomingCall?: (_session: any) => void;
    onCallEnded?: () => void;
    onCallFailed?: () => void;
  } = {};

  setCallbacks(callbacks: typeof this.callbacks) {
    this.callbacks = callbacks;
  }

  async connect(user: User): Promise<void> {
    this.currentUser = user;
    this.isActive = true;
    this.reconnectAttempts = 0;

    this.createConnection();
  }

  private createConnection(): void {
    if (!this.isActive || !this.currentUser) return;

    try {
      if (this.ua) {
        this.ua.stop();
        this.ua = null;
      }

      console.log(
        "Criando conexão SIP persistente para:",
        this.currentUser.device
      );

      const socket = new JsSIP.WebSocketInterface(SIP_WS_URI);

      const configuration = {
        sockets: [socket],
        uri: `sip:${this.currentUser.device}@${SIP_REALM}`,
        password: SIP_PASSWORD_DEFAULT,
        realm: SIP_REALM,
        ha1: "",
        display_name: this.currentUser.name,
        register: true,
        register_expires: 300, // 5 minutos
        session_timers: false,
        connection_recovery_min_interval: 2,
        connection_recovery_max_interval: 30,
        // Configurações para manter conexão persistente
        no_answer_timeout: 60,
        use_preloaded_route: false,
      };

      this.ua = new JsSIP.UA(configuration);

      this.ua.on("connecting", () => {
        console.log("SIP conectando...");
        this.callbacks.onStatusChange?.(SIP_STATUS.CONNECTING);
      });

      this.ua.on("connected", () => {
        if (this.isActive) {
          console.log("SIP conectado - conexão persistente estabelecida");
          this.callbacks.onStatusChange?.(SIP_STATUS.CONNECTED);
          this.reconnectAttempts = 0;
        }
      });

      this.ua.on("disconnected", () => {
        console.log("SIP desconectado - tentando reconectar...");
        if (this.isActive) {
          this.handleDisconnect();
        }
      });

      this.ua.on("registered", () => {
        if (this.isActive) {
          console.log("SIP registrado - mantendo conexão ativa");
          this.callbacks.onStatusChange?.(SIP_STATUS.CONNECTED);
        }
      });

      this.ua.on("unregistered", () => {
        console.log("SIP não registrado");
        if (this.isActive) {
          this.callbacks.onStatusChange?.(SIP_STATUS.DISCONNECTED);
        }
      });

      this.ua.on("registrationFailed", (e: any) => {
        console.error("Falha no registro SIP:", e);
        if (this.isActive) {
          this.callbacks.onStatusChange?.(SIP_STATUS.DISCONNECTED);
        }
      });

      this.ua.on("newRTCSession", (e: any) => {
        const session = e.session;

        console.log(
          "Nova sessão RTC:",
          session.direction,
          "de/para:",
          session.remote_identity?.uri?.user
        );

        // Configurar tratamento de mídia para TODAS as sessões
        session.on("peerconnection", (ev: any) => {
          console.log(
            "PeerConnection estabelecida para sessão",
            session.direction
          );

          const pc = ev.peerconnection;
          pc.addEventListener("addstream", (event: any) => {
            const remoteStream = event.stream;
            console.log("Stream de áudio remoto adicionado:", remoteStream?.id);
          });

          // Monitorar estado da conexão
          pc.addEventListener("connectionstatechange", () => {
            console.log("Estado da conexão:", pc.connectionState);
          });

          pc.addEventListener("iceconnectionstatechange", () => {
            console.log("Estado ICE:", pc.iceConnectionState);
          });
        });

        session.on("ended", () => {
          console.log("Sessão encerrada");
          this.callbacks.onCallEnded?.();
        });

        session.on("failed", (e: any) => {
          console.log("Sessão falhou:", e.cause);
          this.callbacks.onCallFailed?.();
        });

        // Tratamento específico para chamadas recebidas
        if (session.direction === "incoming" && this.isActive) {
          console.log(
            "Chamada RECEBIDA de:",
            session.remote_identity?.display_name ||
              session.remote_identity?.uri?.user
          );
          this.callbacks.onIncomingCall?.(session);
        }
      });

      this.ua.start();
      console.log("Instância SIP criada - conexão persistente iniciada");
    } catch (error) {
      console.error("Erro ao criar conexão SIP:", error);
      if (this.isActive) {
        this.handleDisconnect();
      }
    }
  }

  private handleDisconnect(): void {
    if (!this.isActive) return;

    console.log("Tratando desconexão SIP...");
    this.callbacks.onStatusChange?.(SIP_STATUS.DISCONNECTED);

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);
      this.reconnectAttempts++;

      console.log(
        `Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts} em ${delay}ms`
      );

      this.reconnectTimeout = setTimeout(() => {
        if (this.isActive) {
          this.createConnection();
        }
      }, delay);
    } else {
      console.error("Limite de tentativas de reconexão SIP atingido");
    }
  }

  disconnect(): void {
    console.log("Desconectando SIP - limpando conexão persistente...");

    this.isActive = false;
    this.currentUser = null;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ua) {
      this.ua.unregister();
      this.ua.stop();
      this.ua = null;
    }

    this.callbacks.onStatusChange?.(SIP_STATUS.DISCONNECTED);
    console.log("Conexão SIP persistente limpa");
  }

  call(
    uri: string,
    options: any,
    onProgress?: () => void,
    onAccepted?: () => void,
    onFailed?: (_cause?: string) => void
  ): any {
    if (!this.ua) {
      throw new Error("SIP not connected");
    }

    try {
      console.log("Iniciando chamada USANDO CONEXÃO PERSISTENTE para:", uri);

      // Usar a instância SIP persistente existente
      const session = this.ua.call(uri, {
        mediaConstraints: options.mediaConstraints,
        pcConfig: options.rtcConfiguration,
      });

      // Configurar event listeners para o ciclo de vida da chamada FEITA
      session.on("progress", () => {
        console.log("Chamada em progresso (tocando)...");
        onProgress?.();
      });

      session.on("accepted", () => {
        console.log("Chamada aceita pelo destinatário");
        onAccepted?.();
      });

      session.on("confirmed", () => {
        console.log("Chamada confirmada com áudio estabelecido");
      });

      session.on("failed", (e: any) => {
        console.log("Chamada falhou:", e.cause);
        onFailed?.(e.cause);
      });

      session.on("ended", () => {
        console.log("Chamada encerrada");
        this.callbacks.onCallEnded?.();
      });

      return session;
    } catch (error) {
      console.error("Call failed:", error);
      onFailed?.("Erro ao iniciar chamada");
      return null;
    }
  }

  getUA(): JsSIP.UA | null {
    return this.ua;
  }
}

export const sipService = new SipService();
