import { PrismaClient } from "@prisma/client";
import logger from "@/utils/logger";

class Database {
  private static instance: PrismaClient;

  public static getInstance(): PrismaClient {
    if (!Database.instance) {
      Database.instance = new PrismaClient({
        log: ['error', 'warn'],
      });
    }

    return Database.instance;
  }

  public static async connect(): Promise<void> {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        await Database.getInstance().$connect();
        logger.info("Database connected successfully");
        return;
      } catch (error) {
        attempt++;
        logger.warn(`Database connection attempt ${attempt}/${maxRetries} failed:`, error);
        
        if (attempt >= maxRetries) {
          logger.error("Database connection failed after all retries:", error);
          throw error;
        }
        
        // Wait before retry (2^attempt seconds)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
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
