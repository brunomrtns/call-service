import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config();

export const config = {
  // Server Configuration
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",

  // Database Configuration
  databaseUrl: process.env.DATABASE_URL!,

  // CORS Configuration
  corsOrigins: process.env.CORS_ORIGINS?.split(",") || [
    "http://localhost:3000",
  ],

  // Asterisk Configuration
  asterisk: {
    host: process.env.ASTERISK_HOST || "192.168.15.176",
    ariPort: parseInt(process.env.ASTERISK_ARI_PORT || "8088", 10),
    ariUser: process.env.ASTERISK_ARI_USER || "admin",
    ariPass: process.env.ASTERISK_ARI_PASS || "admin",
    sipPort: parseInt(process.env.ASTERISK_SIP_PORT || "5060", 10),
    systemExtension: process.env.SYSTEM_EXTENSION || "3100",
    systemSipPassword: process.env.SYSTEM_SIP_PASSWORD || "Teste123",
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || "your-jwt-secret-key",
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  },

  // Socket.IO Configuration
  socketPort: parseInt(process.env.SOCKET_PORT || "3002", 10),

  // Device Configuration
  device: {
    rangeStart: parseInt(process.env.DEVICE_RANGE_START || "3000", 10),
    rangeEnd: parseInt(process.env.DEVICE_RANGE_END || "3999", 10),
  },

  // Logging Configuration
  logging: {
    level: process.env.DEBUG === "true" ? "debug" : "info",
    dir: path.join(__dirname, "../logs"),
  },
};

// Validate required environment variables
const requiredEnvVars = ["DATABASE_URL", "ASTERISK_HOST", "JWT_SECRET"];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
