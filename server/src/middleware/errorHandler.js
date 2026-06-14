/**
 * Global error-handling middleware.
 * Must have 4 parameters so Express recognises it as an error handler.
 */
const errorHandler = (err, _req, res, _next) => {
  const isDev = process.env.NODE_ENV === 'development';

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[ERROR] ${status} — ${message}`);
  if (isDev && err.stack) console.error(err.stack);

  res.status(status).json({
    success: false,
    message,
    ...(isDev && { stack: err.stack }),
  });
};

module.exports = errorHandler;
