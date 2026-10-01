import { createApp } from "./app";
import { closePool } from "./db";
import { logger } from "./logger";

const PORT = Number(process.env.PORT ?? 4002);

const app = createApp();
const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, "Search service started");
});

async function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down search service");
  server.close(async () => {
    await closePool();
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
