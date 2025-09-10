import { PrismaClient } from "@prisma/client";
import logger from "@/utils/logger";

class Database {
  private static instance: PrismaClient;

  public static getInstance(): PrismaClient {
    if (!Database.instance) {
      Database.instance = new PrismaClient({
        log: [
          {
            emit: "event",
            level: "query",
          },
          {
            emit: "stdout",
            level: "error",
          },
          {
            emit: "stdout",
            level: "info",
          },
          {
            emit: "stdout",
            level: "warn",
          },
        ],
      });

      if (process.env.NODE_ENV === "development") {
        (Database.instance as any).$on("query", (e: any) => {
          logger.debug("Database Query:", {
            query: e.query,
            params: e.params,
            duration: `${e.duration}ms`,
          });
        });
      }
    }

    return Database.instance;
  }

  public static async connect(): Promise<void> {
    try {
      await Database.getInstance().$connect();
      logger.info("Database connected successfully");
    } catch (error) {
      logger.error("Database connection failed:", error);
      throw error;
    }
  }

  public static async disconnect(): Promise<void> {
    try {
      await Database.getInstance().$disconnect();
      logger.info("Database disconnected successfully");
    } catch (error) {
      logger.error("Database disconnection failed:", error);
      throw error;
    }
  }
}

export default Database;
