import axios, { AxiosInstance } from "axios";
import WebSocket from "ws";
import { config } from "@/config";
import logger from "@/utils/logger";
import { AsteriskCallEvent, CallRequest, TransferRequest } from "@/types";
import { EventEmitter } from "events";

export class AsteriskService extends EventEmitter {
  private httpClient: AxiosInstance;
  private wsConnection: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000;

  constructor() {
    super();
    this.httpClient = axios.create({
      baseURL: `http://${config.asterisk.host}:${config.asterisk.ariPort}/asterisk/ari`,
      auth: {
        username: config.asterisk.ariUser,
        password: config.asterisk.ariPass,
      },
      timeout: 10000,
    });

    this.setupWebSocket();
  }

  private setupWebSocket(): void {
    const wsUrl = `ws://${config.asterisk.host}:${config.asterisk.ariPort}/asterisk/ari/events?api_key=${config.asterisk.ariUser}:${config.asterisk.ariPass}&app=call_service`;
    const wsAuth = Buffer.from(
      `${config.asterisk.ariUser}:${config.asterisk.ariPass}`
    ).toString("base64");

    try {
      this.wsConnection = new WebSocket(wsUrl, {
        headers: {
          Authorization: `Basic ${wsAuth}`,
        },
      });

      this.wsConnection.on("open", () => {
        logger.info("WebSocket connection to Asterisk ARI established");
        this.reconnectAttempts = 0;
        this.emit("connected");
      });

      this.wsConnection.on("message", (data: WebSocket.Data) => {
        try {
          const event: AsteriskCallEvent = JSON.parse(data.toString());
          logger.debug("Received Asterisk event:", event);
          this.handleAsteriskEvent(event);
        } catch (error) {
          logger.error("Error parsing Asterisk event:", error);
        }
      });

      this.wsConnection.on("close", () => {
        logger.warn("WebSocket connection to Asterisk ARI closed");
        this.emit("disconnected");
        this.reconnect();
      });

      this.wsConnection.on("error", (error) => {
        logger.error("WebSocket connection error:", error);
        this.emit("error", error);
      });
    } catch (error) {
      logger.error("Error setting up WebSocket connection:", error);
      this.reconnect();
    }
  }

  private reconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error("Max reconnection attempts reached. Giving up.");
      return;
    }

    this.reconnectAttempts++;
    logger.info(
      `Attempting to reconnect to Asterisk ARI (attempt ${this.reconnectAttempts})`
    );

    setTimeout(() => {
      this.setupWebSocket();
    }, this.reconnectDelay);
  }

  private handleAsteriskEvent(event: AsteriskCallEvent): void {
    switch (event.type) {
      case "StasisStart":
        this.emit("call_initiated", event);
        break;
      case "ChannelStateChange":
        this.handleChannelStateChange(event);
        break;
      case "StasisEnd":
        this.emit("call_ended", event);
        break;
      default:
        logger.debug("Unhandled Asterisk event:", event.type);
    }
  }

  private handleChannelStateChange(event: AsteriskCallEvent): void {
    if (!event.channel) return;

    switch (event.channel.state) {
      case "Ringing":
        this.emit("call_ringing", event);
        break;
      case "Up":
        this.emit("call_answered", event);
        break;
      default:
        logger.debug("Unhandled channel state:", event.channel.state);
    }
  }

  public async makeCall(callRequest: CallRequest): Promise<string> {
    try {
      const { callerDevice, calleeDevice } = callRequest;

      const response = await this.httpClient.post("/channels", {
        endpoint: `PJSIP/${calleeDevice}`,
        extension: callerDevice,
        context: "default",
        priority: 1,
        app: "call-service",
      });

      const channelId = response.data.id;
      logger.info(
        `Call initiated from ${callerDevice} to ${calleeDevice}, channel: ${channelId}`
      );

      return channelId;
    } catch (error) {
      logger.error("Error making call:", error);
      throw new Error("Failed to initiate call");
    }
  }

  public async answerCall(channelId: string): Promise<void> {
    try {
      await this.httpClient.post(`/channels/${channelId}/answer`);
      logger.info(`Call answered for channel: ${channelId}`);
    } catch (error) {
      logger.error("Error answering call:", error);
      throw new Error("Failed to answer call");
    }
  }

  public async hangupCall(channelId: string): Promise<void> {
    try {
      await this.httpClient.delete(`/channels/${channelId}`);
      logger.info(`Call hung up for channel: ${channelId}`);
    } catch (error) {
      logger.error("Error hanging up call:", error);
      throw new Error("Failed to hang up call");
    }
  }

  public async transferCall(transferRequest: TransferRequest): Promise<void> {
    try {
      const { callId, targetDevice, transferType = "blind" } = transferRequest;

      if (transferType === "blind") {
        await this.httpClient.post(`/channels/${callId}/redirect`, {
          endpoint: `PJSIP/${targetDevice}`,
        });
      } else {
        // Attended transfer implementation
        await this.httpClient.post(`/bridges`, {
          type: "mixing",
        });
      }

      logger.info(`Call transferred: ${callId} to ${targetDevice}`);
    } catch (error) {
      logger.error("Error transferring call:", error);
      throw new Error("Failed to transfer call");
    }
  }

  public async getChannelInfo(channelId: string): Promise<any> {
    try {
      const response = await this.httpClient.get(`/channels/${channelId}`);
      return response.data;
    } catch (error) {
      logger.error("Error getting channel info:", error);
      throw new Error("Failed to get channel information");
    }
  }

  public async getActiveCalls(): Promise<any[]> {
    try {
      const response = await this.httpClient.get("/channels");
      return response.data;
    } catch (error) {
      logger.error("Error getting active calls:", error);
      throw new Error("Failed to get active calls");
    }
  }

  public isConnected(): boolean {
    return this.wsConnection?.readyState === WebSocket.OPEN;
  }

  public disconnect(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
  }
}

export default new AsteriskService();
