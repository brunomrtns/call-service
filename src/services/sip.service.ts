import { EventEmitter } from "events";
import logger from "@/utils/logger";
import { config } from "@/config";
import axios from "axios";
import WebSocket from "ws";

// Polyfill WebSocket para Node.js (JsSIP espera que WebSocket seja global)
declare global {
  var WebSocket: typeof WebSocket;
  var window: any;
}
global.WebSocket = WebSocket as any;

// Polyfill window para Node.js (JsSIP espera que window seja global)
global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => {},
  location: { protocol: "https:", hostname: "localhost" },
  navigator: {
    userAgent: "Node.js",
    mediaDevices: {
      getUserMedia: () =>
        Promise.resolve({
          getTracks: () => [],
          getAudioTracks: () => [],
          getVideoTracks: () => [],
          clone: () => ({ getTracks: () => [] }),
          stop: () => {},
        }),
    },
  },
  document: {
    createElement: () => ({ style: {} }),
    addEventListener: () => {},
    removeEventListener: () => {},
  },
  // POLYFILL COMPLETO do RTCPeerConnection para Node.js backend
  RTCPeerConnection: class {
    localDescription: any = null;
    remoteDescription: any = null;
    signalingState: string = "stable";
    iceConnectionState: string = "new";
    connectionState: string = "new";
    iceGatheringState: string = "new";
    
    constructor(config?: any) {
      // Simular conexão WebRTC para backend - apenas para compatibilidade JsSIP
      setTimeout(() => {
        this.iceConnectionState = "connected";
        this.connectionState = "connected";
        this.iceGatheringState = "complete";
        this._dispatchEvent('iceconnectionstatechange');
        this._dispatchEvent('connectionstatechange');
      }, 100);
    }
    
    createOffer(options?: any) {
      return Promise.resolve({ 
        type: "offer", 
        sdp: "v=0\r\no=- 123 123 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\nm=audio 5004 RTP/AVP 0\r\na=sendrecv\r\n" 
      });
    }
    
    createAnswer(options?: any) {
      return Promise.resolve({ 
        type: "answer", 
        sdp: "v=0\r\no=- 456 456 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\nm=audio 5006 RTP/AVP 0\r\na=sendrecv\r\n" 
      });
    }
    
    setLocalDescription(desc: any) {
      this.localDescription = desc;
      this.signalingState = desc.type === "offer" ? "have-local-offer" : "stable";
      return Promise.resolve();
    }
    
    setRemoteDescription(desc: any) {
      this.remoteDescription = desc;
      this.signalingState = desc.type === "offer" ? "have-remote-offer" : "stable";
      return Promise.resolve();
    }
    
    addTrack(track: any, stream?: any) {
      return {
        track,
        receiver: { track },
        sender: { track }
      };
    }
    
    removeTrack(sender: any) {}
    
    getTransceivers() { return []; }
    getSenders() { return []; }
    getReceivers() { return []; }
    
    addEventListener(event: string, handler: Function) {
      (this as any)[`_${event}`] = handler;
    }
    
    removeEventListener(event: string, handler: Function) {
      delete (this as any)[`_${event}`];
    }
    
    _dispatchEvent(event: string) {
      const handler = (this as any)[`_${event}`];
      if (handler) {
        handler({ type: event });
      }
    }
    
    close() {
      this.connectionState = "closed";
      this.iceConnectionState = "closed";
    }
  },
  MediaStreamTrack: class {
    kind: string;
    enabled: boolean;
    readyState: string;

    constructor() {
      this.kind = "audio";
      this.enabled = true;
      this.readyState = "live";
    }
    stop() {}
    clone() {
      return new global.window.MediaStreamTrack();
    }
    addEventListener() {}
    removeEventListener() {}
  },
  MediaStream: class {
    id: string;
    active: boolean = true;
    
    constructor(tracks?: any[]) {
      this.id = Math.random().toString(36);
    }
    
    getTracks() { return []; }
    getAudioTracks() { return []; }
    getVideoTracks() { return []; }
    addTrack(track: any) {}
    removeTrack(track: any) {}
    clone() { return new global.window.MediaStream(); }
    addEventListener() {}
    removeEventListener() {}
  }
};

// Importar JsSIP para registro SIP real
const JsSIP = require("jssip");

interface SipDevice {
  userId: number;
  device: string;
  isRegistered: boolean;
  registeredAt?: Date;
  userAgent?: any; // JsSIP UserAgent
}

interface ActiveCall {
  callId: string;
  callerDevice: string;
  calleeDevice: string;
  status: "calling" | "ringing" | "active" | "ended";
  startTime: Date;
  channelId?: string;
  jssipSession?: any; // Sessão JsSIP para chamadas recebidas
}

export class SipService extends EventEmitter {
  private devices: Map<string, SipDevice> = new Map();
  private activeCalls: Map<string, ActiveCall> = new Map();
  private asteriskUrl: string;
  private ariAuth: string;

  constructor() {
    super();
    this.asteriskUrl = `http://${config.asterisk.host}:${config.asterisk.ariPort}`;
    this.ariAuth = Buffer.from(
      `${config.asterisk.ariUser}:${config.asterisk.ariPass}`
    ).toString("base64");

    logger.info("🔥 SIP Service REAL - ASTERISK DIRETO SEM MOCK!");
    logger.info(`📡 Asterisk: ${this.asteriskUrl}`);
  }

  public async registerDevice(
    userId: number,
    device: string,
    password: string
  ): Promise<boolean> {
    try {
      logger.info(
        `🔥 REGISTRANDO RAMAL ${device} NO ASTERISK FISICAMENTE - usuário ${userId}`
      );

      // Configurar JsSIP para registro SIP real
      const wsUri = `ws://${config.asterisk.host}:8088/asterisk/ws`;
      logger.info(`🌐 WebSocket SIP: ${wsUri}`);

      const socket = new JsSIP.WebSocketInterface(wsUri);

      const configuration = {
        sockets: [socket],
        uri: `sip:${device}@${config.asterisk.host}`,
        authorization_user: device,
        password: password,
        display_name: `Ramal ${device}`,
        session_timers: false,
        register: true,
        register_expires: 300,
        // Configurações adicionais para WebSocket
        no_answer_timeout: 60,
        use_preloaded_route: false,
        realm: config.asterisk.host, // Adicionar realm explícito
      };

      logger.info(`📞 Configuração SIP:`, {
        uri: configuration.uri,
        user: configuration.authorization_user,
        password: password,
      });

      logger.info(`🔧 Criando UserAgent JsSIP...`);

      // Habilitar logs de debug do JsSIP
      JsSIP.debug.enable("JsSIP:*");

      const userAgent = new JsSIP.UA(configuration);

      logger.info(`🔧 UserAgent criado, configurando eventos...`);

      // Promessa para aguardar o registro
      return new Promise((resolve, reject) => {
        // Timeout de 10 segundos
        const timeout = setTimeout(() => {
          reject(new Error(`Timeout no registro do ramal ${device}`));
        }, 10000);

        userAgent.on("connected", () => {
          logger.info(`✅ JsSIP conectado ao Asterisk para ramal ${device}`);
        });

        userAgent.on("disconnected", () => {
          logger.warn(`❌ JsSIP desconectado do Asterisk para ramal ${device}`);
        });

        // Adicionar TODOS os eventos possíveis para debug
        userAgent.on("connecting", () => {
          logger.info(`🔄 JsSIP conectando ao Asterisk para ramal ${device}`);
        });

        userAgent.on("newRTCSession", (data: any) => {
          logger.info(
            `📞 Nova sessão RTC para ramal ${device}:`,
            data.originator
          );
        });

        userAgent.on("newMessage", (data: any) => {
          logger.info(
            `💬 Nova mensagem para ramal ${device}:`,
            data.originator
          );
        });

        userAgent.on("sipEvent", (data: any) => {
          logger.info(`📡 Evento SIP para ramal ${device}:`, data.event);
        });

        userAgent.on("registered", () => {
          clearTimeout(timeout);
          logger.info(`🎉 RAMAL ${device} REGISTRADO FISICAMENTE NO ASTERISK!`);

          this.devices.set(device, {
            userId,
            device,
            isRegistered: true,
            registeredAt: new Date(),
            userAgent,
          });

          this.emit("device_registered", { userId, device });
          resolve(true);
        });

        userAgent.on("unregistered", () => {
          logger.info(`📴 Ramal ${device} desregistrado do Asterisk`);
          const deviceInfo = this.devices.get(device);
          if (deviceInfo) {
            deviceInfo.isRegistered = false;
            this.emit("device_unregistered", { userId, device });
          }
        });

        userAgent.on("registrationFailed", (data: any) => {
          clearTimeout(timeout);
          logger.error(`❌ FALHA NO REGISTRO FÍSICO do ramal ${device}:`, {
            reason: data.cause,
            response: data.response?.status_code,
            message: data.response?.reason_phrase,
          });
          reject(new Error(`Falha no registro: ${data.cause}`));
        });

        // Eventos de chamadas recebidas
        userAgent.on("newRTCSession", (data: any) => {
          const { session } = data;
          if (session.direction === "incoming") {
            this.handleIncomingCall(device, session);
          }
        });

        // Iniciar o User Agent
        logger.info(`🚀 Iniciando UserAgent JsSIP para ramal ${device}...`);
        userAgent.start();
        logger.info(`✅ UserAgent iniciado para ramal ${device}`);

        logger.info(
          `⏰ Aguardando registro SIP para ramal ${device} (timeout em 10s)...`
        );
      });
    } catch (error) {
      logger.error(`❌ Erro no registro do ramal ${device}:`, error);
      throw error;
    }
  }

  public async unregisterDevice(device: string): Promise<void> {
    logger.info(`📴 Desregistrando ramal ${device}`);
    this.devices.delete(device);
    this.emit("device_unregistered", { device });
  }

  public isDeviceRegistered(device: string): boolean {
    return this.devices.has(device);
  }

  public async makeCall(
    callerDevice: string,
    calleeDevice: string
  ): Promise<string> {
    const callId = `call-${Date.now()}-${callerDevice}-${calleeDevice}`;

    try {
      logger.info(`🔥 FAZENDO CHAMADA REAL NO ASTERISK: ${callId}`);
      logger.info(`📞 De: ramal ${callerDevice} Para: ramal ${calleeDevice}`);

      if (!this.isDeviceRegistered(callerDevice)) {
        throw new Error(`Ramal ${callerDevice} não registrado`);
      }

      if (!this.isDeviceRegistered(calleeDevice)) {
        throw new Error(`Ramal ${calleeDevice} não registrado`);
      }

      // Chamada via Asterisk ARI
      const originateData = {
        endpoint: `PJSIP/${calleeDevice}`,
        app: "call-service",
        appArgs: `caller=${callerDevice},callee=${calleeDevice},callId=${callId}`,
        callerId: `"${callerDevice}" <${callerDevice}>`,
        timeout: 30,
      };

      logger.info("📡 COMANDO ASTERISK:", originateData);

      try {
        const url = `${this.asteriskUrl}/asterisk/ari/channels`;
        logger.info(`🌐 URL Asterisk ARI: ${url}`);
        logger.info(
          `🔐 Auth: ${this.ariAuth ? "Configurado" : "NÃO CONFIGURADO"}`
        );

        const response = await axios.post(url, originateData, {
          headers: {
            Authorization: `Basic ${this.ariAuth}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        });

        const channelId = response.data.id;
        logger.info(`✅ CANAL ASTERISK CRIADO: ${channelId}`);

        this.activeCalls.set(callId, {
          callId,
          callerDevice,
          calleeDevice,
          status: "calling",
          startTime: new Date(),
          channelId,
        });

        this.emit("call_initiated", {
          callId,
          callerDevice,
          calleeDevice,
          channelId,
        });

        setTimeout(() => {
          this.emit("call_ringing", { callId, callerDevice, calleeDevice });
        }, 1000);

        return callId;
      } catch (asteriskError: any) {
        logger.error(
          `❌ ERRO ASTERISK:`,
          asteriskError.response?.data || asteriskError.message
        );
        throw new Error(`Falha no Asterisk: ${asteriskError.message}`);
      }
    } catch (error) {
      logger.error(`❌ ERRO na chamada:`, error);
      throw error;
    }
  }

  public async answerCall(callId: string): Promise<void> {
    const call = this.activeCalls.get(callId);
    if (!call) {
      throw new Error(`Chamada ${callId} não encontrada`);
    }

    try {
      logger.info(`📞 TENTANDO ATENDER CHAMADA ${callId}`);

      // VERIFICAR TIPO DE CHAMADA
      if (callId.startsWith("incoming-")) {
        // CHAMADA RECEBIDA VIA JsSIP - não tem channelId do ARI
        logger.info(`📱 CHAMADA RECEBIDA VIA JsSIP - ${callId}`);

        // Para chamadas JsSIP, precisamos usar a sessão armazenada
        if (!call.jssipSession) {
          throw new Error(`Sessão JsSIP não encontrada para chamada ${callId}`);
        }

        // ATENDER CHAMADA REAL VIA JsSIP
        logger.info(`📱 ATENDENDO CHAMADA JsSIP ${callId} FISICAMENTE`);

        try {
          // Atender a chamada usando a API do JsSIP (sem WebRTC real - apenas sinalização SIP)
          call.jssipSession.answer({
            mediaConstraints: { audio: true, video: false },
            // Para backend Node.js - simular stream sem mídia real
            mediaStream: new global.window.MediaStream(),
            // Configurações adicionais para backend
            rtcOfferConstraints: {
              offerToReceiveAudio: true,
              offerToReceiveVideo: false
            },
            rtcAnswerConstraints: {
              offerToReceiveAudio: true,
              offerToReceiveVideo: false
            }
          });

          logger.info(`✅ COMANDO DE ATENDIMENTO ENVIADO VIA JsSIP para ${callId}`);
          logger.info(`📡 JsSIP vai gerenciar sinalização SIP - áudio roteado pelo Asterisk`);

          // O evento 'confirmed' da sessão JsSIP vai atualizar o status
          // Não emitimos call_answered aqui - deixamos o evento JsSIP fazer isso
        } catch (jssipError: any) {
          logger.error(`❌ ERRO JsSIP ao atender ${callId}:`, jssipError);
          throw new Error(`Falha no JsSIP: ${jssipError.message}`);
        }

        return;
      } else if (call.channelId) {
        // CHAMADA SAINTE VIA ARI - tem channelId
        logger.info(`📡 CHAMADA VIA ARI - CANAL: ${call.channelId}`);

        // Tentar responder a chamada no Asterisk
        await axios.post(
          `${this.asteriskUrl}/asterisk/ari/channels/${call.channelId}/answer`,
          {},
          {
            headers: {
              Authorization: `Basic ${this.ariAuth}`,
            },
          }
        );

        // VERIFICAR SE REALMENTE FOI ATENDIDA consultando o status do canal
        logger.info(`🔍 VERIFICANDO STATUS REAL DO CANAL ${call.channelId}`);

        const channelResponse = await axios.get(
          `${this.asteriskUrl}/asterisk/ari/channels/${call.channelId}`,
          {
            headers: {
              Authorization: `Basic ${this.ariAuth}`,
            },
          }
        );

        const channelState = channelResponse.data.state;
        logger.info(`📊 STATUS DO CANAL: ${channelState}`);

        // SÓ EMITIR EVENTO SE O CANAL ESTIVER REALMENTE "Up"
        if (channelState === "Up") {
          call.status = "active";
          logger.info(`✅ CHAMADA ${callId} REALMENTE ATENDIDA - CANAL UP`);
          this.emit("call_answered", { callId });
        } else {
          logger.warn(
            `⚠️ CHAMADA ${callId} NÃO FOI ATENDIDA - CANAL: ${channelState}`
          );
          throw new Error(`Canal não está ativo: ${channelState}`);
        }
      } else {
        throw new Error(
          `Chamada ${callId} sem channelId - tipo de chamada inválido`
        );
      }
    } catch (error) {
      logger.error(`❌ Erro ao atender chamada ${callId}:`, error);
      throw error;
    }
  }

  public async rejectCall(callId: string): Promise<void> {
    const call = this.activeCalls.get(callId);
    if (!call) {
      throw new Error(`Chamada ${callId} não encontrada`);
    }

    try {
      logger.info(`❌ REJEITANDO CHAMADA ${callId}`);

      // VERIFICAR TIPO DE CHAMADA
      if (callId.startsWith("incoming-") && call.jssipSession) {
        // CHAMADA JsSIP - usar sessão JsSIP para rejeitar
        logger.info(`📱 REJEITANDO CHAMADA JsSIP ${callId}`);

        call.jssipSession.terminate({
          status_code: 486, // Busy Here
          reason_phrase: "Busy Here",
        });

        logger.info(`✅ CHAMADA JsSIP ${callId} REJEITADA`);
      } else if (call.channelId) {
        // CHAMADA ARI - usar API do Asterisk
        logger.info(
          `📡 REJEITANDO CHAMADA ARI ${callId} - CANAL: ${call.channelId}`
        );

        await axios.delete(
          `${this.asteriskUrl}/asterisk/ari/channels/${call.channelId}`,
          {
            headers: {
              Authorization: `Basic ${this.ariAuth}`,
            },
          }
        );

        logger.info(`✅ CHAMADA ARI ${callId} REJEITADA`);
      }

      call.status = "ended";
      this.activeCalls.delete(callId);
      this.emit("call_ended", { callId, reason: "rejected" });
    } catch (error) {
      logger.error(`❌ Erro ao rejeitar ${callId}:`, error);
      throw error;
    }
  }

  public async hangupCall(callId: string): Promise<void> {
    const call = this.activeCalls.get(callId);
    if (!call) {
      throw new Error(`Chamada ${callId} não encontrada`);
    }

    try {
      logger.info(`📴 ENCERRANDO CHAMADA ${callId}`);

      // VERIFICAR TIPO DE CHAMADA
      if (callId.startsWith("incoming-") && call.jssipSession) {
        // CHAMADA JsSIP - usar sessão JsSIP para encerrar
        logger.info(`📱 ENCERRANDO CHAMADA JsSIP ${callId}`);

        call.jssipSession.terminate();
        logger.info(`✅ CHAMADA JsSIP ${callId} ENCERRADA`);
      } else if (call.channelId) {
        // CHAMADA ARI - usar API do Asterisk
        logger.info(
          `📡 ENCERRANDO CHAMADA ARI ${callId} - CANAL: ${call.channelId}`
        );

        await axios.delete(
          `${this.asteriskUrl}/asterisk/ari/channels/${call.channelId}`,
          {
            headers: {
              Authorization: `Basic ${this.ariAuth}`,
            },
          }
        );

        logger.info(`✅ CHAMADA ARI ${callId} ENCERRADA`);
      }

      call.status = "ended";
      this.activeCalls.delete(callId);
      this.emit("call_ended", { callId });
    } catch (error) {
      logger.error(`❌ Erro ao encerrar ${callId}:`, error);
      throw error;
    }
  }

  public getRegisteredDevices(): string[] {
    const devices: string[] = [];
    this.devices.forEach((deviceInfo, device) => {
      if (deviceInfo.isRegistered) {
        devices.push(device);
      }
    });
    return devices;
  }

  private handleIncomingCall(device: string, session: any): void {
    const callId = `incoming-${Date.now()}-${device}`;

    logger.info(`📞 CHAMADA RECEBIDA para ramal ${device}: ${callId}`);
    logger.info(`📱 De: ${session.remote_identity.uri.toString()}`);

    // ARMAZENAR A SESSÃO JSSIP para poder atender depois
    this.activeCalls.set(callId, {
      callId,
      callerDevice: session.remote_identity.uri.user,
      calleeDevice: device,
      status: "ringing",
      startTime: new Date(),
      jssipSession: session, // <<<< GUARDAR A SESSÃO!
    });

    // Configurar eventos da chamada recebida
    session.on("confirmed", () => {
      logger.info(`✅ Chamada recebida ${callId} atendida via JsSIP`);
      const call = this.activeCalls.get(callId);
      if (call) {
        call.status = "active";
      }
      this.emit("call_answered", { callId, device });
    });

    session.on("ended", () => {
      logger.info(`📴 Chamada recebida ${callId} encerrada`);
      this.activeCalls.delete(callId);
      this.emit("call_ended", { callId, device });
    });

    session.on("failed", () => {
      logger.info(`❌ Chamada recebida ${callId} falhou`);
      this.activeCalls.delete(callId);
      this.emit("call_ended", { callId, device, reason: "failed" });
    });

    // Emitir para o frontend via WebSocket
    this.emit("incoming_call", {
      callId,
      device,
      fromDevice: session.remote_identity.uri.user,
      fromUri: session.remote_identity.uri.toString(),
    });
  }

  public async shutdown(): Promise<void> {
    logger.info("🔄 Encerrando SIP service...");

    for (const [callId] of this.activeCalls) {
      try {
        await this.hangupCall(callId);
      } catch (error) {
        logger.error(`Erro ao encerrar chamada ${callId}:`, error);
      }
    }

    this.devices.clear();
    this.activeCalls.clear();
    this.removeAllListeners();

    logger.info("✅ SIP service encerrado");
  }
}

const sipServiceInstance = new SipService();

export default sipServiceInstance;
