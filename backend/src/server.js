const app = require('./app');
const { port, nodeEnv } = require('./config/env');

const server = app.listen(port, () => {
  console.log('='.repeat(50));
  console.log(`🚀 Career Copilot API Server`);
  console.log(`📍 Environment: ${nodeEnv}`);
  console.log(`🌐 Server running on: http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/resume/health`);
  console.log('='.repeat(50));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
