const mlClient = require("../services/mlClient");
const config = require("../config/config");

/**
 * Handles GET /api/health
 * Returns status of Node Gateway and downstream Python ML Service.
 */
const handleHealthCheck = async (req, res) => {
  const start = Date.now();
  const mlHealth = await mlClient.checkHealth();
  const mlLatencyMs = Date.now() - start;
  mlHealth.latency_ms = mlLatencyMs;

  const isHealthy = mlHealth.status === "healthy";

  return res.status(200).json({
    status: isHealthy ? "online" : "degraded",
    gateway: {
      service: "used-car-price-predictor-backend",
      version: "1.0.0",
      uptime: process.uptime(),
      port: config.port,
      timestamp: new Date().toISOString(),
    },
    ml_microservice: mlHealth,
  });
};

module.exports = {
  handleHealthCheck,
};
