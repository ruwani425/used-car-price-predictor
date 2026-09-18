"""
FastAPI Microservice for Used Car Price Predictor.
Exposes REST API endpoints for real-time model inference, metadata taxonomy, and metrics.
"""

import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Set UTF-8 encoding for Windows consoles
if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Initialize FastAPI application
app = FastAPI(
    title="Used Car Price Valuation Service",
    description="FastAPI microservice for used car price estimation and depreciation forecasting.",
    version="1.0.0",
)

# Enable CORS to allow requests from Frontend (Port 5173) and Express Gateway (Port 5000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# File paths for model artifacts and cached JSONs
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
MODEL_PKL_PATH = os.path.join(MODELS_DIR, "car_price_model.pkl")
METADATA_PATH = os.path.join(MODELS_DIR, "metadata.json")
METRICS_PATH = os.path.join(MODELS_DIR, "metrics.json")

# In-memory storage for loaded model and metadata
model_bundle = None
metadata_cache = {}
metrics_cache = {}


def load_artifacts():
    """
    Loads serialized ML model pipeline, metadata, and evaluation metrics from disk into memory.
    """
    global model_bundle, metadata_cache, metrics_cache

    # 1. Load trained Scikit-Learn Model Pipeline
    if os.path.exists(MODEL_PKL_PATH):
        try:
            model_bundle = joblib.load(MODEL_PKL_PATH)
            print(f"[STARTUP] Loaded model bundle successfully. Best model: {model_bundle.get('best_model_name')}")
        except Exception as e:
            print(f"[ERROR] Failed to load model bundle: {e}")
            model_bundle = None
    else:
        print(f"[WARNING] Model file not found at {MODEL_PKL_PATH}")
        model_bundle = None

    # 2. Load Metadata JSON (Dropdown taxonomy)
    if os.path.exists(METADATA_PATH):
        try:
            with open(METADATA_PATH, "r", encoding="utf-8") as f:
                metadata_cache = json.load(f)
            print(f"[STARTUP] Loaded metadata: {len(metadata_cache.get('unique_brands', []))} brands.")
        except Exception as e:
            print(f"[ERROR] Failed to load metadata from {METADATA_PATH}: {e}")
            metadata_cache = {}

    # 3. Load Evaluation Metrics JSON
    if os.path.exists(METRICS_PATH):
        try:
            with open(METRICS_PATH, "r", encoding="utf-8") as f:
                metrics_cache = json.load(f)
            print(f"[STARTUP] Loaded metrics: {len(metrics_cache.get('benchmark_leaderboard', []))} benchmarked models.")
        except Exception as e:
            print(f"[ERROR] Failed to load metrics from {METRICS_PATH}: {e}")
            metrics_cache = {}


# Load artifacts immediately on startup
load_artifacts()


# Pydantic Schemas for Request and Response validation
class CarPredictionRequest(BaseModel):
    brand: str = Field(..., example="TOYOTA")
    model: str = Field(..., example="PREMIO")
    yom: int = Field(..., ge=1950, le=2026, example=2018)
    engine_cc: float = Field(..., gt=0, example=1500)
    gear: str = Field(default="Automatic", example="Automatic")
    fuel_type: str = Field(default="Petrol", example="Petrol")
    mileage_km: float = Field(..., ge=0, example=45000)
    town: str = Field(default="Colombo", example="Colombo")
    condition: str = Field(default="USED", example="USED")
    leasing: str = Field(default="No Leasing", example="No Leasing")
    air_condition: str = Field(default="Available", example="Available")
    power_steering: str = Field(default="Available", example="Available")
    power_mirror: str = Field(default="Available", example="Available")
    power_window: str = Field(default="Available", example="Available")
    target_currency: Optional[str] = Field(default="LKR", example="LKR")


class ConfidenceInterval(BaseModel):
    min_lkr_lakhs: float
    max_lkr_lakhs: float


class DepreciationPoint(BaseModel):
    year: int
    projected_price_lkr: float
    projected_price_lkr_lakhs: float
    projected_price_lkr_raw: int


class PredictionResponse(BaseModel):
    status: str
    predicted_price_lkr_lakhs: float
    predicted_price_lkr_raw: int
    confidence_interval: ConfidenceInterval
    depreciation_projection: List[DepreciationPoint]
    model_used: str
    vehicle_summary: Dict[str, Any]


@app.get("/")
@app.get("/health")
def health_check():
    """
    Health check endpoint: verifies service status and whether models are loaded in memory.
    """
    return {
        "status": "online",
        "service": "Used Car Price Valuation ML Microservice",
        "port": 8000,
        "model_loaded": model_bundle is not None,
        "best_model_algorithm": model_bundle.get("best_model_name") if model_bundle else None,
        "metadata_loaded": bool(metadata_cache),
        "metrics_loaded": bool(metrics_cache),
    }


def compute_prediction(car: CarPredictionRequest) -> Dict[str, Any]:
    """
    Core prediction workflow:
    1. Prepares input DataFrame from request payload.
    2. Runs feature engineering and preprocessing transformations.
    3. Runs model inference (in log space) and inverts to Price (Lakhs).
    4. Computes confidence interval and 5-year depreciation forecast.
    """
    if not model_bundle or "preprocessor" not in model_bundle or "model" not in model_bundle:
        raise HTTPException(
            status_code=503,
            detail="ML Model pipeline is not loaded. Please run train.py first.",
        )

    try:
        preprocessor = model_bundle["preprocessor"]
        model = model_bundle["model"]
        best_model_name = model_bundle.get("best_model_name", "Gradient Boosting")

        # 1. Structure vehicle attributes into a single-row DataFrame
        input_data = {
            "brand": car.brand.strip().upper(),
            "model": car.model.strip().upper(),
            "yom": int(car.yom),
            "engine_cc": float(car.engine_cc),
            "gear": car.gear.strip(),
            "fuel_type": car.fuel_type.strip(),
            "mileage_km": float(car.mileage_km),
            "town": car.town.strip(),
            "condition": car.condition.strip(),
            "leasing": car.leasing.strip(),
            "air_condition": car.air_condition.strip(),
            "power_steering": car.power_steering.strip(),
            "power_mirror": car.power_mirror.strip(),
            "power_window": car.power_window.strip(),
        }
        df_input = pd.DataFrame([input_data])

        # 2. Transform raw features using fitted pipeline (Scaling, One-Hot Encoding)
        X_trans = preprocessor.transform(df_input)

        # 3. Predict log-price and invert back to LKR Lakhs: Price = exp(pred) - 1
        pred_log = model.predict(X_trans)
        pred_lakhs = float(np.expm1(pred_log)[0])

        # 4. Set floor at 1.0 Lakh for realistic car prices
        pred_lakhs = max(1.0, round(pred_lakhs, 2))
        raw_lkr = int(round(pred_lakhs * 100000))

        # 5. Calculate Confidence Interval (+/- 5% margin based on model test error)
        min_lakhs = round(max(1.0, pred_lakhs * 0.95), 2)
        max_lakhs = round(pred_lakhs * 1.05, 2)

        # 6. Forecast 5-Year Depreciation Curve (assuming ~7% annual compound depreciation)
        current_year = 2025
        annual_depreciation_rate = 0.07
        depreciation_curve = []

        for i in range(5):
            proj_year = current_year + i
            proj_price = round(pred_lakhs * ((1.0 - annual_depreciation_rate) ** i), 2)
            depreciation_curve.append({
                "year": proj_year,
                "projected_price_lkr": proj_price,
                "projected_price_lkr_lakhs": proj_price,
                "projected_price_lkr_raw": int(round(proj_price * 100000)),
            })

        return {
            "status": "success",
            "predicted_price_lkr_lakhs": pred_lakhs,
            "predicted_price_lkr_raw": raw_lkr,
            "confidence_interval": {
                "min_lkr_lakhs": min_lakhs,
                "max_lkr_lakhs": max_lakhs,
            },
            "depreciation_projection": depreciation_curve,
            "model_used": best_model_name,
            "vehicle_summary": {
                "brand": car.brand,
                "model": car.model,
                "yom": car.yom,
                "engine_cc": car.engine_cc,
                "mileage_km": car.mileage_km,
                "fuel_type": car.fuel_type,
            },
        }
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Inference error while computing vehicle valuation: {str(e)}",
        )


@app.post("/api/ml/predict", response_model=PredictionResponse)
@app.post("/predict", response_model=PredictionResponse)
def predict_car_price(car: CarPredictionRequest):
    """
    POST endpoint for car price prediction.
    """
    return compute_prediction(car)


@app.get("/api/ml/metadata")
@app.get("/metadata")
def get_metadata():
    """
    GET endpoint returning car taxonomy dropdown options (Brands, Models, Towns).
    """
    if not metadata_cache:
        if os.path.exists(METADATA_PATH):
            with open(METADATA_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        raise HTTPException(status_code=404, detail="Metadata not found. Please train models first.")
    return metadata_cache


@app.get("/api/ml/metrics")
@app.get("/metrics")
def get_metrics():
    """
    GET endpoint returning model evaluation benchmark results and accuracy metrics.
    """
    if not metrics_cache:
        if os.path.exists(METRICS_PATH):
            with open(METRICS_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        raise HTTPException(status_code=404, detail="Metrics not found. Please train models first.")
    return metrics_cache


if __name__ == "__main__":
    import uvicorn
    print("Starting ML Microservice on http://localhost:8000...")
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
