import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import { mkdir } from "fs/promises";
import { join } from "path";
import * as schema from "./schema";

const DB_DIR = ".foil";
const DB_FILE = "foil.db";

async function initDb() {
  await mkdir(DB_DIR, { recursive: true });
  const sqlite = new Database(join(DB_DIR, DB_FILE));
  return drizzle(sqlite, { schema });
}

export const db = await initDb();
export { schema };
