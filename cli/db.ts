import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { mkdirSync, existsSync } from 'node:fs';
import * as schema from './schema';

const DB_DIR = join(homedir(), '.ccanalysis');
const DB_PATH = join(DB_DIR, 'data.sqlite');

/**
 * Ensures the .ccanalysis directory exists in the home directory
 */
function ensureDbDirectory(): void {
  if (!existsSync(DB_DIR)) {
    mkdirSync(DB_DIR, { recursive: true });
    console.log(`Created directory: ${DB_DIR}`);
  }
}

/**
 * Initializes and returns the database connection
 */
export function initDb() {
  ensureDbDirectory();

  const sqlite = new Database(DB_PATH);
  const db = drizzle(sqlite, { schema });

  console.log(`Database initialized at: ${DB_PATH}`);

  return db;
}

/**
 * Runs database migrations
 */
export function runMigrations(db: ReturnType<typeof initDb>) {
  try {
    migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

/**
 * Gets the database path
 */
export function getDbPath(): string {
  return DB_PATH;
}
