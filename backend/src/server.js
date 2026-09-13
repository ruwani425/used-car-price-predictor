const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const config = require("./config/config");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

// Import route modules
const predictionRoutes = require("./routes/predictionRoutes");
const metadataRoutes = require("./routes/metadataRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const historyRoutes = require("./routes/historyRoutes");
const currencyRoutes = require("./routes/currencyRoutes");
const healthRoutes = require("./routes/healthRoutes");
const { startCurrencyCron } = require("./jobs/currencyCron");

const app = express();

// Latency & Response-Time Tracking Middleware
app.use((req, res, next) => {
  const start = Date.now();
  const originalEnd = res.end;
  res.end = function (...args) {
    const duration = Date.now() - start;
    if (!res.headersSent) {
      res.setHeader("X-Response-Time", `${duration}ms`);
    }
    return originalEnd.apply(this, args);
  };
  next();
});

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

// Request Currency Header Resolver (x-currency-code, x-currency, currency)
const { currencyMiddleware } = require("./middleware/currencyMiddleware");
app.use(currencyMiddleware);

// API Routes
app.use("/api/predict", predictionRoutes);
app.use("/api/metadata", metadataRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/metrics", analyticsRoutes); // Alias
app.use("/api/history", historyRoutes);
app.use("/api/currencies", currencyRoutes);
app.use("/api/health", healthRoutes);
app.use("/health", healthRoutes);

// Root greeting endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    name: "Used Car Price Predictor Backend Gateway",
    version: "1.0.0",
    description: "REST API Gateway interfacing React frontend and Python FastAPI ML microservice",
    docs: {
      predict: "POST /api/predict (supports ?currency=USD or body.target_currency)",
      metadata: "GET /api/metadata",
      analytics: "GET /api/analytics",
      currencies: "GET /api/currencies",
      history: "GET /api/history (?brand=TOYOTA&limit=10&min_price=10&max_price=150)",
      health: "GET /api/health",
    },
    supported_currencies: ["LKR", "USD", "EUR", "GBP", "JPY"],
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
    console.log(`Node.js Express Gateway running on port ${config.port}`);
    console.log(`Connected ML Service: ${config.mlServiceUrl}`);
    console.log(`Health endpoint: http://localhost:${config.port}/api/health`);
    console.log(`Currencies endpoint: http://localhost:${config.port}/api/currencies`);
    console.log(`History endpoint: http://localhost:${config.port}/api/history`);
    console.log("==================================================");

    // Start background 3-hour currency sync cron job
    startCurrencyCron();
  });

  process.on("SIGTERM", () => {
    console.log("Received SIGTERM, shutting down gracefully...");
    server.close(() => {
      process.exit(0);
    });
  });
}

module.exports = app;
