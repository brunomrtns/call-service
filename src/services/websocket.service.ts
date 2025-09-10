import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import axios from "axios";
import logger from "@/utils/logger";
import userService from "@/services/user.service";

interface DeviceStatus {
  device: string;
  state: string;
  technology: string;
}

interface UserWithSipStatus {
  id: number;
  name: string;
  username: string;
  device: string;
  type: string;
  sipStatus: string;
}

export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();
  private intervalId: NodeJS.Timeout | null = null;
  private lastDeviceStates: Map<string, string> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({
      server,
      path: "/ws/device-status",
    });

    this.wss.on("connection", (ws: WebSocket) => {
      console.log("WebSocket conectado");
      this.clients.add(ws);

      this.sendCurrentStates(ws);

      ws.on("close", () => {
        console.log("WebSocket desconectado");
        this.clients.delete(ws);

        if (this.clients.size === 0) {
          this.stopPolling();
        }
      });

      ws.on("error", (error) => {
        console.error("Erro WebSocket:", error);
        this.clients.delete(ws);
      });

      if (this.clients.size === 1) {
        this.startPolling();
      }
    });
  }

  private async fetchDeviceStates(): Promise<DeviceStatus[]> {
    try {
      const auth = Buffer.from("admin:admin").toString("base64");
      const response = await axios.get(
        "http://192.168.15.176:8088/asterisk/ari/endpoints",
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
          timeout: 5000,
        }
      );

      return response.data
        .filter((ep: any) => ep.technology === "PJSIP")
        .map((ep: any) => ({
          device: (ep.resource || "").split("/")[1] || ep.resource,
          state: (ep.state || "unknown").toLowerCase(),
          technology: ep.technology,
        }));
    } catch (error) {
      logger.error("Error fetching device states:", error);
      return [];
    }
  }

  private async fetchUsersWithSipStatus(): Promise<UserWithSipStatus[]> {
    try {
      const users = await userService.getUsersWithSipStatus();
      return users;
    } catch (error) {
      logger.error("Error fetching users with SIP status:", error);
      return [];
    }
  }

  private async sendCurrentStates(ws?: WebSocket) {
    try {
      const usersWithSip = await this.fetchUsersWithSipStatus();

      const message = JSON.stringify({
        type: "users-with-sip-status",
        data: usersWithSip,
      });

      if (ws) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      } else {
        this.broadcast(message);
      }
    } catch (error) {
      logger.error("Error sending current states:", error);
    }
  }

  private async checkForChanges() {
    try {
      const usersWithSip = await this.fetchUsersWithSipStatus();
      const currentStates = new Map<string, string>();
      let hasChanges = false;

      usersWithSip.forEach(({ device, sipStatus }) => {
        currentStates.set(device, sipStatus);

        if (this.lastDeviceStates.get(device) !== sipStatus) {
          hasChanges = true;
        }
      });

      this.lastDeviceStates.forEach((state, device) => {
        if (!currentStates.has(device)) {
          hasChanges = true;
        }
      });

      if (hasChanges) {
        this.lastDeviceStates = currentStates;

        const message = JSON.stringify({
          type: "users-with-sip-status-update",
          data: usersWithSip,
        });

        this.broadcast(message);
        console.log(
          `WebSocket: Status SIP atualizado para ${usersWithSip.length} usuários`
        );
      }
    } catch (error) {
      logger.error("Error checking for changes:", error);
    }
  }

  private broadcast(message: string) {
    this.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  private startPolling() {
    if (this.intervalId) return;

    console.log("Iniciando monitoramento de dispositivos");
    this.checkForChanges();
    this.intervalId = setInterval(() => {
      this.checkForChanges();
    }, 5000);
  }

  private stopPolling() {
    if (this.intervalId) {
      console.log("Parando monitoramento de dispositivos");
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public close() {
    this.stopPolling();
    this.wss.close();
  }
}
