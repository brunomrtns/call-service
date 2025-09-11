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
    try {
      if (this.ua) {
        this.ua.stop();
      }

      const socket = new JsSIP.WebSocketInterface(SIP_WS_URI);

      const configuration = {
        sockets: [socket],
        uri: `sip:${user.device}@${SIP_REALM}`,
        password: SIP_PASSWORD_DEFAULT,
        realm: SIP_REALM,
        ha1: "",
        display_name: user.name,
        register: true,
        session_timers: false,
        connection_recovery_min_interval: 2,
        connection_recovery_max_interval: 30,
      };

      this.ua = new JsSIP.UA(configuration);

      this.ua.on("connecting", () => {
        this.callbacks.onStatusChange?.(SIP_STATUS.CONNECTING);
      });

      this.ua.on("connected", () => {
        this.callbacks.onStatusChange?.(SIP_STATUS.CONNECTED);
      });

      this.ua.on("disconnected", () => {
        this.callbacks.onStatusChange?.(SIP_STATUS.DISCONNECTED);
      });

      this.ua.on("newRTCSession", (e: any) => {
        const session = e.session;

        session.on("peerconnection", (ev: any) => {
          const pc = ev.peerconnection;
          pc.addEventListener("addstream", (event: any) => {
            const remoteStream = event.stream;
            // Handle remote audio stream
            console.log("Remote stream added:", remoteStream);
          });
        });

        session.on("ended", () => {
          this.callbacks.onCallEnded?.();
        });

        session.on("failed", () => {
          this.callbacks.onCallFailed?.();
        });

        if (session.direction === "incoming") {
          this.callbacks.onIncomingCall?.(session);
        }
      });

      this.ua.start();
    } catch (error) {
      console.error("SIP connection error:", error);
      this.callbacks.onStatusChange?.(SIP_STATUS.DISCONNECTED);
    }
  }

  disconnect(): void {
    if (this.ua) {
      this.ua.stop();
      this.ua = null;
    }
    this.callbacks.onStatusChange?.(SIP_STATUS.DISCONNECTED);
  }

  call(uri: string, options: any): any {
    if (!this.ua) {
      throw new Error("SIP not connected");
    }

    try {
      const session = this.ua.call(uri, {
        mediaConstraints: options.mediaConstraints,
        pcConfig: options.rtcConfiguration,
      });

      return session;
    } catch (error) {
      console.error("Call failed:", error);
      return null;
    }
  }

  getUA(): JsSIP.UA | null {
    return this.ua;
  }
}

export const sipService = new SipService();
