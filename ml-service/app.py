from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import numpy as np
import os

app = FastAPI(title="Car Price Prediction Service")

# Load the model
MODEL_PATH = "models/car_price_model.pkl"

if os.path.exists(MODEL_PATH):
    model = joblib.load(MODEL_PATH)
else:
    model = None

# define the backend data format
class CarFeatures(BaseModel):
    brand: str
    year: int
    mileage: float
    fuel_type: str
    transmission: str

@app.get("/")
def health_check():
    return {"status": "ML Service is up and running"}

@app.post("/predict")
def predict_price(car: CarFeatures):
    if not model:
        raise HTTPException(status_code=500, detail="ML Model not found")

    try:
        #for dummy model create input array [Year,Mileage]
        # Apply feature engineering preprocessing here after training on the full dataset.
        input_data = np.array([[car.year, car.mileage]])
        
        # Calculate the prediction.
        prediction = model.predict(input_data)[0]
        
        # Ensure the prediction is not less than zero.
        final_price = max(1000.0, float(prediction))

        return {
            "success": True,
            "predicted_price": round(final_price, 2)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))