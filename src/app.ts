import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { config } from "@/config";
import Database from "@/config/database";
import logger from "@/utils/logger";
import routes from "@/routes";
import { errorHandler, notFound } from "@/middleware/error";
import { WebSocketService } from "@/services/websocket.service";

class Application {
  private app: express.Application;
  private server: any;
  private wsService: WebSocketService | null = null;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    this.app.use(helmet());

    this.app.use(
      cors({
        origin: true, // Aceita qualquer origem
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      })
    );

    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 500,
      message: "Too many requests from this IP, please try again later.",
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use("/api/", limiter);

    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });
      next();
    });
  }

  private setupRoutes(): void {
    this.app.use("/api", routes);

    this.app.get("/", (req, res) => {
      res.json({
        message: "Call Service API",
        version: "1.0.0",
        status: "running",
        timestamp: new Date().toISOString(),
      });
    });

    this.app.get("/favicon.ico", (req, res) => {
      res.status(204).end();
    });
  }

  private setupErrorHandling(): void {
    this.app.use(notFound);

    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      await Database.connect();

      this.server = createServer(this.app);

      this.wsService = new WebSocketService(this.server);

      this.server.listen(config.port, "0.0.0.0", () => {
        logger.info(`Server running on port ${config.port} (all interfaces)`);
        logger.info(`Local: http://localhost:${config.port}`);
        logger.info(`Network: http://0.0.0.0:${config.port}`);
        logger.info(
          `WebSocket server running on ws://0.0.0.0:${config.port}/ws/device-status`
        );
        logger.info(`Environment: ${config.nodeEnv}`);
      });

      process.on("SIGTERM", this.shutdown.bind(this));
      process.on("SIGINT", this.shutdown.bind(this));
    } catch (error) {
      logger.error("Failed to start server:", error);
      process.exit(1);
    }
  }

  private async shutdown(): Promise<void> {
    logger.info("Shutting down server...");

    try {
      if (this.wsService) {
        this.wsService.close();
      }

      if (this.server) {
        this.server.close();
      }

      await Database.disconnect();

      logger.info("Server shutdown complete");
      process.exit(0);
    } catch (error) {
      logger.error("Error during shutdown:", error);
      process.exit(1);
    }
  }
}

export default Application;
