require("dotenv").config();

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  mlServiceUrl: process.env.ML_SERVICE_URL || "http://localhost:8000",
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(",") : ["http://localhost:5173", "http://localhost:3000", "*"],
};

module.exports = config;
