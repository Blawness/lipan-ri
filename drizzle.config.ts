import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Migrations need a direct connection: pgBouncer's transaction pooling
    // does not support the session-level state DDL relies on.
    url: (process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL)!,
  },
});
