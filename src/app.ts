import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { createServer as createHttpsServer } from "https";
import fs from "fs";
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

    // Configuração de CORS mais permissiva para desenvolvimento
    this.app.use(
      cors({
        origin: (origin, callback) => {
          logger.info(`CORS request from origin: ${origin || "no-origin"}`);

          // Permite qualquer origem em desenvolvimento ou se não há origem (apps móveis)
          if (!origin || config.nodeEnv === "development") {
            logger.info(
              "CORS: Allowing request (development mode or no origin)"
            );
            return callback(null, true);
          }

          // Permite IPs da rede local automaticamente
          const localNetworkRegex =
            /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/;
          if (localNetworkRegex.test(origin)) {
            logger.info(`CORS: Allowing local network request from ${origin}`);
            return callback(null, true);
          }

          // Em produção, verifica as origens configuradas
          const allowedOrigins = config.corsOrigins;
          if (Array.isArray(allowedOrigins)) {
            if (
              allowedOrigins.includes("*") ||
              allowedOrigins.includes(origin)
            ) {
              logger.info(`CORS: Allowing configured origin ${origin}`);
              return callback(null, true);
            }
          } else if (allowedOrigins === "*") {
            logger.info(`CORS: Allowing wildcard origin ${origin}`);
            return callback(null, true);
          }

          logger.warn(`CORS: Blocking request from ${origin}`);
          return callback(new Error("Not allowed by CORS"));
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
        preflightContinue: false,
        optionsSuccessStatus: 200,
      })
    );

    // Middleware adicional para tratar preflight requests
    this.app.options("*", (req, res) => {
      logger.info(
        `Preflight request from ${req.get("Origin")} for ${req.path}`
      );
      res.status(200).end();
    });

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

      // Criar servidor HTTP ou HTTPS baseado na configuração
      if (config.https.enabled) {
        // Ler certificados SSL
        const httpsOptions = {
          key: fs.readFileSync(config.https.keyPath),
          cert: fs.readFileSync(config.https.certPath),
        };
        
        this.server = createHttpsServer(httpsOptions, this.app);
        
        logger.info("HTTPS server configured with SSL certificates");
      } else {
        this.server = createServer(this.app);
        logger.info("HTTP server configured");
      }

      this.wsService = new WebSocketService(this.server);

      const port = config.https.enabled ? config.https.port : config.port;
      const protocol = config.https.enabled ? "https" : "http";
      const wsProtocol = config.https.enabled ? "wss" : "ws";

      this.server.listen(port, "0.0.0.0", () => {
        logger.info(`${protocol.toUpperCase()} server running on port ${port} (all interfaces)`);
        logger.info(`Local: ${protocol}://localhost:${port}`);
        logger.info(`Network: ${protocol}://0.0.0.0:${port}`);
        logger.info(
          `WebSocket server running on ${wsProtocol}://0.0.0.0:${port}/ws/device-status`
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
