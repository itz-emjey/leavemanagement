import sequelize from './database';
import '../models/index';
import { logger } from '../utils/logger';
import { runMigrations } from './migrationRunner';

const migrate = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established.');

    // Step 1: Sync model definitions to create/update tables based on Sequelize models
    // Note: This handles new columns and table creation but avoids alter where possible
    await sequelize.sync({ alter: true });
    logger.info('Model-based schema synced successfully.');

    // Step 2: Run SQL-based migration files for composite indexes and custom DDL
    // that cannot be expressed through Sequelize model definitions alone.
    // Migration files are stored in backend/src/migrations/*.sql and are
    // tracked via the _migrations table to ensure each runs exactly once.
    await runMigrations();

    logger.info('All migrations completed successfully.');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', { error: (error as Error).message });
    process.exit(1);
  }
};

migrate();
