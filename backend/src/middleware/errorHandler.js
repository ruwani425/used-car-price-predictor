/**
 * Centralized error handler middleware.
 */

const errorHandler = (err, req, res, next) => {
  console.error(`[SERVER ERROR] ${req.method} ${req.originalUrl}:`, err.message || err);

  const statusCode = err.status || err.statusCode || 500;
  const isDev = process.env.NODE_ENV !== "production";

  res.status(statusCode).json({
    status: "error",
    error_type: err.name || "ServerError",
    message: err.message || "An unexpected internal server error occurred.",
    ...(isDev && { stack: err.stack }),
  });
};

const notFoundHandler = (req, res) => {
  res.status(404).json({
    status: "error",
    error_type: "NotFoundError",
    message: `Endpoint ${req.method} ${req.originalUrl} does not exist.`,
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
