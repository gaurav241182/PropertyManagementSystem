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

export async function seedPlatformAdmin() {
  const client = await pool.connect();
  try {
    const existing = await client.query(
      `SELECT id FROM platform_users WHERE role = 'super_admin' LIMIT 1`
    );
    if (existing.rows.length === 0) {
      await client.query(
        `INSERT INTO platform_users (name, email, password, role, status) VALUES ($1, $2, $3, $4, $5)`,
        ["Platform Admin", "admin@yellowberry.com", "Admin@2026", "super_admin", "Active"]
      );
      console.log("Seed: Created default platform admin (admin@yellowberry.com)");
    }
  } finally {
    client.release();
  }
}

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

    await migrateBranchesFromJson(client);
  } finally {
    client.release();
  }
}

async function migrateBranchesFromJson(client: pg.PoolClient) {
  const tableCheck = await client.query(
    `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'branches') AS exists`
  );
  if (!tableCheck.rows[0]?.exists) return;

  const hotelColCheck = await client.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'hotels' AND column_name = 'branches'`
  );
  if (hotelColCheck.rows.length === 0) return;

  const hotels = await client.query(`SELECT id, branches FROM hotels WHERE branches IS NOT NULL`);
  let migratedCount = 0;

  for (const hotel of hotels.rows) {
    let branchesArr: any[] = [];
    try {
      const parsed = typeof hotel.branches === 'string' ? JSON.parse(hotel.branches) : hotel.branches;
      if (Array.isArray(parsed)) branchesArr = parsed;
    } catch { continue; }

    for (const br of branchesArr) {
      if (!br.name) continue;
      const existing = await client.query(
        `SELECT id FROM branches WHERE hotel_id = $1 AND name = $2`,
        [hotel.id, br.name]
      );
      if (existing.rows.length === 0) {
        await client.query(
          `INSERT INTO branches (hotel_id, name, city, address) VALUES ($1, $2, $3, $4)`,
          [hotel.id, br.name, br.city || '', br.address || '']
        );
        migratedCount++;
      }
    }
  }

  if (migratedCount > 0) {
    console.log(`Migration: Migrated ${migratedCount} branches from hotels.branches JSON to branches table`);
  }
}
