import { Sequelize } from 'sequelize';
import config from './constants';
import { logger } from '../utils/logger';

const sequelize = config.databaseUrl
  ? new Sequelize(config.databaseUrl, {
      dialect: 'mysql',
      logging: config.nodeEnv === 'development'
        ? (sql: string, timing?: number) => {
            logger.debug('SQL Query', {
              query: sql.substring(0, 500),
              duration: timing ? `${timing}ms` : undefined,
              db: 'remote',
            });
          }
        : false,
    })
  : new Sequelize(config.db.name, config.db.user, config.db.password, {
      host: config.db.host,
      port: config.db.port,
      dialect: 'mysql',
      logging: config.nodeEnv === 'development'
        ? (sql: string, timing?: number) => {
            logger.debug('SQL Query', {
              query: sql.substring(0, 500),
              duration: timing ? `${timing}ms` : undefined,
              db: config.db.name,
            });
          }
        : false,
      define: {
        timestamps: true,
        underscored: false,
      },
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    });

export default sequelize;

export const testConnection = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
  } catch (error) {
    if (config.nodeEnv === 'production') {
      console.error('FATAL: Unable to connect to the database in production:', error);
      process.exit(1);
    }
    console.warn('Unable to connect to the database (non-fatal in dev mode):', error);
    throw error;
  }
};
