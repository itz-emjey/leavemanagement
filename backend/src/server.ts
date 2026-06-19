import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app';
import config from './config/constants';
import { testConnection } from './config/database';
import { logger } from './utils/logger';
import { initCronJobs } from './utils/cron';

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: config.frontendUrl,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Store io instance for use in controllers
app.set('io', io);

io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  // Join a room based on user ID for targeted notifications
  socket.on('join', (userId: number) => {
    socket.join(`user:${userId}`);
    logger.info(`Socket ${socket.id} joined room user:${userId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

const startServer = async () => {
  try {
    await testConnection();
    logger.info('Database synced successfully.');
  } catch (error) {
    logger.warn('Database connection failed. Server will start without DB:', { error: String(error) });
  }

  // Initialize scheduled cron jobs
  initCronJobs();

  server.listen(config.port, () => {
    logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
    logger.info(`CORS origin: ${config.frontendUrl}`);
  });
};

startServer();

// ── Graceful Shutdown ────────────────────────────────────
// Handle SIGTERM (Docker stop, Kubernetes pod termination)
// Handle SIGINT (Ctrl+C in terminal)

function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close((err) => {
    if (err) {
      logger.error('Error during server close:', { error: err.message });
      process.exit(1);
    }

    logger.info('HTTP server closed. Exiting process.');
    process.exit(0);
  });

  // Force shutdown after 10 seconds if graceful shutdown hangs
  setTimeout(() => {
    logger.warn('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { io };

