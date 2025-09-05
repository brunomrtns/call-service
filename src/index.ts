import Application from "./app";
import logger from "./utils/logger";

const app = new Application();

app.start().catch((error) => {
  logger.error("Failed to start application:", error);
  process.exit(1);
});
