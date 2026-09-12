const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const config = require("./config/config");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

// Import route modules
const predictionRoutes = require("./routes/predictionRoutes");
const metadataRoutes = require("./routes/metadataRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const healthRoutes = require("./routes/healthRoutes");
const { getPredictionHistory } = require("./controllers/predictionController");

const app = express();

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow all origins for dev/testing or match config
      callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (config.nodeEnv !== "test") {
  app.use(morgan("dev"));
}

// API Routes
app.use("/api/predict", predictionRoutes);
app.use("/api/metadata", metadataRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/metrics", analyticsRoutes); // Alias
app.use("/api/history", getPredictionHistory);
app.use("/api/health", healthRoutes);
app.use("/health", healthRoutes);

// Root greeting endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    name: "Used Car Price Predictor Backend Gateway",
    version: "1.0.0",
    description: "Enterprise REST API Gateway interfacing React UI and Python FastAPI ML Microservice",
    docs: {
      predict: "POST /api/predict",
      metadata: "GET /api/metadata",
      analytics: "GET /api/analytics",
      history: "GET /api/history",
      health: "GET /api/health",
    },
    ml_service_target: config.mlServiceUrl,
  });
});

// 404 and Global Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start server if executed directly
if (require.main === module) {
  const server = app.listen(config.port, () => {
    console.log("==================================================");
    console.log(`🚀 Node.js Express Gateway running on port ${config.port}`);
    console.log(`🔗 Connected ML Service: ${config.mlServiceUrl}`);
    console.log(`🌐 Health endpoint: http://localhost:${config.port}/api/health`);
    console.log("==================================================");
  });

  process.on("SIGTERM", () => {
    console.log("Received SIGTERM, shutting down gracefully...");
    server.close(() => {
      process.exit(0);
    });
  });
}

module.exports = app;
