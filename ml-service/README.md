# Machine Learning Microservice

FastAPI Python microservice for used car price prediction, feature engineering pipelines, and depreciation calculations.

---

## Features

- **Gradient Boosting Model**: Serves real-time price predictions using trained model (`car_price_model.pkl`).
- **Feature Engineering Pipeline**: Handles derived features (Car Age, Mileage/Year, Luxury Score), One-Hot Encoding, and Log-transformed target mapping.
- **5-Year Depreciation Calculation**: Forecasts annual depreciation based on vehicle age and brand retention.
- **Taxonomy API**: Provides Sri Lankan car brands, models, and locations.

---

## Setup & Run

### 1. Create Virtual Environment
```powershell
# Windows PowerShell
python -m venv venv
.\venv\Scripts\Activate.ps1

# Linux / macOS
# python3 -m venv venv
# source venv/bin/activate
```

### 2. Install Dependencies
```powershell
pip install -r requirements.txt
```

### 3. Model Training (Optional)
```powershell
python clean_dataset.py
python feature_engineering.py
python train.py
```

### 4. Run FastAPI Server
```powershell
uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```

---

## API Endpoints

- `GET /health` - Service health status
- `POST /api/ml/predict` - Real-time price prediction
- `GET /api/ml/metadata` - Unique brands, models, and features taxonomy
- `GET /api/ml/metrics` - Model evaluation metrics
- `GET /docs` - Interactive Swagger API documentation
