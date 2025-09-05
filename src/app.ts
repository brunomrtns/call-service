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
import { initializeSocket, getSocketService } from "@/services/socket.service";
import asteriskService from "@/services/asterisk.service";

class Application {
  private app: express.Application;
  private server: any;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(compression());

    // CORS configuration
    this.app.use(
      cors({
        origin: config.corsOrigins,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization"],
      })
    );

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: "Too many requests from this IP, please try again later.",
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use("/api/", limiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Logging middleware
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });
      next();
    });
  }

  private setupRoutes(): void {
    // API routes
    this.app.use("/api", routes);

    // Root route
    this.app.get("/", (req, res) => {
      res.json({
        message: "Call Service API",
        version: "1.0.0",
        status: "running",
        timestamp: new Date().toISOString(),
      });
    });
  }

  private setupErrorHandling(): void {
    // Handle 404 errors
    this.app.use(notFound);

    // Global error handler
    this.app.use(errorHandler);
  }

  private setupAsteriskEventHandlers(): void {
    // Handle Asterisk events and broadcast via Socket.IO
    asteriskService.on("call_initiated", (event) => {
      const socketService = getSocketService();
      if (socketService) {
        socketService.notifyCallEvent({
          type: "call_initiated",
          callId: event.channel?.id || "",
          data: event,
        });
      }
    });

    asteriskService.on("call_ringing", (event) => {
      const socketService = getSocketService();
      if (socketService) {
        socketService.notifyCallEvent({
          type: "call_ringing",
          callId: event.channel?.id || "",
          data: event,
        });
      }
    });

    asteriskService.on("call_answered", (event) => {
      const socketService = getSocketService();
      if (socketService) {
        socketService.notifyCallEvent({
          type: "call_answered",
          callId: event.channel?.id || "",
          data: event,
        });
      }
    });

    asteriskService.on("call_ended", (event) => {
      const socketService = getSocketService();
      if (socketService) {
        socketService.notifyCallEvent({
          type: "call_ended",
          callId: event.channel?.id || "",
          data: event,
        });
      }
    });
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await Database.connect();

      // Create HTTP server
      this.server = createServer(this.app);

      // Initialize Socket.IO
      initializeSocket(this.server);

      // Setup Asterisk event handlers
      this.setupAsteriskEventHandlers();

      // Start server
      this.server.listen(config.port, () => {
        logger.info(`Server running on port ${config.port}`);
        logger.info(`Environment: ${config.nodeEnv}`);
        logger.info(`Socket.IO running on port ${config.socketPort}`);
      });

      // Graceful shutdown handling
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
      // Close HTTP server
      if (this.server) {
        this.server.close();
      }

      // Disconnect from Asterisk
      asteriskService.disconnect();

      // Close Socket.IO connections
      const socketService = getSocketService();
      if (socketService) {
        socketService.disconnect();
      }

      // Disconnect from database
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
