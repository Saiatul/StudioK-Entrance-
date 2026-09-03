import { Pool } from "pg";

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }

  const isInternal = connectionString.includes("railway.internal");
  const sslEnabled = process.env.DATABASE_SSL
    ? process.env.DATABASE_SSL !== "false"
    : !isInternal;

  return new Pool({
    connectionString,
    ssl: sslEnabled ? { rejectUnauthorized: false } : false,
    max: 10,
  });
}

const globalForDb = globalThis as unknown as { studiokPool?: Pool };

export function getPool(): Pool {
  if (!globalForDb.studiokPool) {
    globalForDb.studiokPool = createPool();
  }

  return globalForDb.studiokPool;
}
