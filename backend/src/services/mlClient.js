const axios = require("axios");
const config = require("../config/config");

/**
 * Axios client configured for communicating with Python FastAPI ML microservice.
 */
const mlClient = axios.create({
  baseURL: config.mlServiceUrl,
  timeout: 10000, // 10-second timeout
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/**
 * Forwards car prediction payload to ML service.
 */
const predictPrice = async (payload) => {
  try {
    const response = await mlClient.post("/api/ml/predict", payload);
    return response.data;
  } catch (error) {
    if (error.response) {
      const err = new Error(error.response.data?.detail || "ML Service prediction failed.");
      err.status = error.response.status;
      throw err;
    } else if (error.code === "ECONNREFUSED") {
      const err = new Error(
        `ML Microservice is unreachable at ${config.mlServiceUrl}. Please ensure the FastAPI server is running on port 8000.`
      );
      err.status = 503;
      throw err;
    }
    throw error;
  }
};

/**
 * Fetches vehicle dropdown metadata (brands, models, towns, fuels) from ML service.
 */
const getMetadata = async () => {
  try {
    const response = await mlClient.get("/api/ml/metadata");
    return response.data;
  } catch (error) {
    if (error.response) {
      const err = new Error(error.response.data?.detail || "Failed to fetch metadata from ML service.");
      err.status = error.response.status;
      throw err;
    } else if (error.code === "ECONNREFUSED") {
      const err = new Error(
        `ML Microservice is unreachable at ${config.mlServiceUrl}. Please ensure FastAPI is running.`
      );
      err.status = 503;
      throw err;
    }
    throw error;
  }
};

/**
 * Fetches benchmark leaderboard and feature importance analytics from ML service.
 */
const getMetrics = async () => {
  try {
    const response = await mlClient.get("/api/ml/metrics");
    return response.data;
  } catch (error) {
    if (error.response) {
      const err = new Error(error.response.data?.detail || "Failed to fetch metrics from ML service.");
      err.status = error.response.status;
      throw err;
    } else if (error.code === "ECONNREFUSED") {
      const err = new Error(
        `ML Microservice is unreachable at ${config.mlServiceUrl}.`
      );
      err.status = 503;
      throw err;
    }
    throw error;
  }
};

/**
 * Checks health of ML microservice.
 */
const checkHealth = async () => {
  try {
    const response = await mlClient.get("/health");
    return {
      status: "healthy",
      url: config.mlServiceUrl,
      data: response.data,
    };
  } catch (error) {
    return {
      status: "unreachable",
      url: config.mlServiceUrl,
      error: error.message,
    };
  }
};

module.exports = {
  predictPrice,
  getMetadata,
  getMetrics,
  checkHealth,
};
