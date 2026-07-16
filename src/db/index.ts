import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

const pool = new Pool({
  connectionString,
  // pg defaults this to 0 (wait forever). Neon's scale-to-zero wake is ~500ms,
  // so 10s is ample headroom while still failing fast if a connect stalls.
  connectionTimeoutMillis: 10_000,
  // Idle sockets must not outlive the Fluid instance that owns them: Neon tears
  // down a scaled-to-zero compute underneath them. attachDatabasePool reads this
  // to keep the instance alive long enough to drain the pool before suspension.
  idleTimeoutMillis: 10_000,
});

attachDatabasePool(pool);

export const db = drizzle({ client: pool, schema });
