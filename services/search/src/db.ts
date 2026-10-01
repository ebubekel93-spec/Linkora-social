import { Pool } from "pg";
import { logger } from "./logger";

let _pool: Pool | null = null;

/**
 * Returns the singleton PostgreSQL connection pool.
 * Lazily created on first call using the DATABASE_URL environment variable.
 */
export function getPool(): Pool {
  if (!_pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    _pool = new Pool({ connectionString });
    _pool.on("error", (err) => {
      logger.error({ err }, "Unexpected PostgreSQL pool error");
    });
  }
  return _pool;
}

/**
 * Gracefully closes the singleton pool. Call on process shutdown.
 */
export async function closePool(): Promise<void> {
  if (_pool) {
    await _pool.end();
    _pool = null;
  }
}
