import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

export async function runMigrations() {
  const client = await pool.connect();
  try {
    const colCheck = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'room_types' AND column_name = 'capacity'`
    );
    if (colCheck.rows.length > 0) {
      await client.query(`ALTER TABLE room_types ADD COLUMN IF NOT EXISTS max_adults integer NOT NULL DEFAULT 2`);
      await client.query(`ALTER TABLE room_types ADD COLUMN IF NOT EXISTS max_children integer NOT NULL DEFAULT 0`);
      await client.query(`UPDATE room_types SET max_adults = capacity WHERE max_adults = 2 AND capacity IS NOT NULL AND capacity != 2`);
      await client.query(`ALTER TABLE room_types DROP COLUMN capacity`);
      console.log("Migration: Migrated room_types.capacity to max_adults/max_children");
    } else {
      await client.query(`ALTER TABLE room_types ADD COLUMN IF NOT EXISTS max_adults integer NOT NULL DEFAULT 2`);
      await client.query(`ALTER TABLE room_types ADD COLUMN IF NOT EXISTS max_children integer NOT NULL DEFAULT 0`);
    }
  } finally {
    client.release();
  }
}
