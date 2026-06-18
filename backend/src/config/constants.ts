import dotenv from 'dotenv';
dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export default {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    name: process.env.DB_NAME || 'leave_management',
    user: process.env.DB_USER || 'root',
    password: process.env.NODE_ENV === 'production'
      ? requireEnv('DB_PASSWORD')
      : (process.env.DB_PASSWORD || ''),
  },
  jwt: {
    secret: requireEnv('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '5242880', 10),
    path: process.env.UPLOAD_PATH || 'uploads',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
  },
  session: {
    cookieSecret: process.env.COOKIE_SECRET || requireEnv('JWT_SECRET'),
  },
};
