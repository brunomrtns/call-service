import dotenv from "dotenv";
import path from "path";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",

  databaseUrl: process.env.DATABASE_URL!,

  corsOrigins: process.env.CORS_ORIGINS?.split(",") || ["*"],

  asterisk: {
    host: process.env.ASTERISK_HOST || "192.168.15.176",
    ariPort: parseInt(process.env.ASTERISK_ARI_PORT || "8088", 10),
    ariUser: process.env.ASTERISK_ARI_USER || "admin",
    ariPass: process.env.ASTERISK_ARI_PASS || "admin",
    sipPort: parseInt(process.env.ASTERISK_SIP_PORT || "5060", 10),
    systemExtension: process.env.SYSTEM_EXTENSION || "3100",
    systemSipPassword: process.env.SYSTEM_SIP_PASSWORD || "Teste123",
  },

  jwt: {
    secret: process.env.JWT_SECRET || "your-jwt-secret-key",
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  },

  socketPort: parseInt(process.env.SOCKET_PORT || "3002", 10),

  device: {
    rangeStart: parseInt(process.env.DEVICE_RANGE_START || "3000", 10),
    rangeEnd: parseInt(process.env.DEVICE_RANGE_END || "3100", 10),
  },

  logging: {
    level: process.env.DEBUG === "true" ? "debug" : "info",
    dir: path.join(__dirname, "../logs"),
  },
};

const requiredEnvVars = ["DATABASE_URL", "ASTERISK_HOST", "JWT_SECRET"];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
