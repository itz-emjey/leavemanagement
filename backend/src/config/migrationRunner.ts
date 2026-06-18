import fs from 'fs';
import path from 'path';
import sequelize from './database';
import { logger } from '../utils/logger';

interface MigrationRecord {
  name: string;
  appliedAt: Date;
}

const MIGRATIONS_TABLE = '_migrations';
const MIGRATIONS_DIR = path.resolve(__dirname, '../migrations');

/**
 * Ensures the migrations tracking table exists.
 */
async function ensureMigrationsTable(): Promise<void> {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS \`${MIGRATIONS_TABLE}\` (
      \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
      \`name\` VARCHAR(255) NOT NULL,
      \`appliedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE INDEX \`idx_migration_name\` (\`name\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

/**
 * Returns the list of already-applied migrations from the database.
 */
async function getAppliedMigrations(): Promise<Set<string>> {
  const [rows] = await sequelize.query(
    `SELECT \`name\` FROM \`${MIGRATIONS_TABLE}\` ORDER BY \`name\` ASC`
  );
  return new Set((rows as MigrationRecord[]).map((r) => r.name));
}

/**
 * Returns the list of available migration files sorted by name.
 */
function getAvailableMigrations(): string[] {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    logger.warn(`Migrations directory not found: ${MIGRATIONS_DIR}`);
    return [];
  }

  const files = fs.readdirSync(MIGRATIONS_DIR);
  return files
    .filter((f) => f.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));
}

/**
 * Applies a single migration file.
 */
async function applyMigration(filename: string): Promise<void> {
  const filePath = path.join(MIGRATIONS_DIR, filename);
  const sql = fs.readFileSync(filePath, 'utf-8');

  logger.info(`Applying migration: ${filename}`);

  // Split by semicolons and execute each statement
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    try {
      await sequelize.query(statement);
    } catch (error: unknown) {
      const message = (error as Error).message || String(error);
      // Skip "already exists" errors for indexes that may have been created by Sequelize sync
      if (
        message.includes('already exists') ||
        message.includes('Duplicate key name') ||
        message.includes('Duplicate column name')
      ) {
        logger.warn(`  Skipped (already exists): ${message.split('\n')[0]}`);
      } else {
        throw error;
      }
    }
  }

  // Record the migration
  await sequelize.query(
    `INSERT INTO \`${MIGRATIONS_TABLE}\` (\`name\`) VALUES (?)`,
    { replacements: [filename] }
  );

  logger.info(`Migration applied: ${filename}`);
}

/**
 * Runs all pending migrations in order.
 */
export async function runMigrations(): Promise<void> {
  await ensureMigrationsTable();

  const applied = await getAppliedMigrations();
  const available = getAvailableMigrations();

  if (available.length === 0) {
    logger.info('No migration files found.');
    return;
  }

  const pending = available.filter((f) => !applied.has(f));

  if (pending.length === 0) {
    logger.info('All migrations are already applied.');
    return;
  }

  logger.info(`Found ${pending.length} pending migration(s): ${pending.join(', ')}`);

  for (const filename of pending) {
    await applyMigration(filename);
  }

  logger.info('All migrations applied successfully.');
}

/**
 * Lists the current migration status.
 */
export async function migrationStatus(): Promise<void> {
  await ensureMigrationsTable();

  const applied = await getAppliedMigrations();
  const available = getAvailableMigrations();

  console.log('\n── Migration Status ──\n');

  for (const filename of available) {
    const status = applied.has(filename) ? '✓ APPLIED' : '✗ PENDING';
    console.log(`  ${status}  ${filename}`);
  }

  console.log(`\n  Total: ${available.length} (${applied.size} applied, ${available.length - applied.size} pending)\n`);
}
