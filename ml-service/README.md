# 🧠 Machine Learning Microservice (FastAPI)

The Python machine learning microservice responsible for real-time model inference, data preprocessing pipelines, and 5-year depreciation forecasting.

---

## 🌟 Key Responsibilities

- **Model Inference**: Serves predictions using the trained Champion **Gradient Boosting Regressor** (`car_price_model.pkl`).
- **Feature Engineering Pipelines**: Automatically handles domain-derived features (Car Age, Mileage per Year, Luxury Score), One-Hot Encoding, and Log Transformation.
- **5-Year Depreciation Calculation**: Returns annual compound residual value projections.
- **Taxonomy Metadata API**: Serves unique Sri Lankan automobile brands, models, towns, and powertrain options.

---

## 🛠️ Tech Stack

- **Framework**: FastAPI + Uvicorn
- **Data Science**: Scikit-Learn, Pandas, NumPy, Joblib
- **Validation**: Pydantic v2

---

## 🚀 Getting Started

### 1. Setup Virtual Environment
```powershell
# Windows PowerShell:
python -m venv venv
.\venv\Scripts\Activate.ps1

# macOS / Linux:
# python3 -m venv venv
# source venv/bin/activate
```

### 2. Install Dependencies
```powershell
pip install -r requirements.txt
```

### 3. (Optional) Re-train ML Model
```powershell
python clean_dataset.py
python feature_engineering.py
python train.py
```

### 4. Start FastAPI Server
```powershell
uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```

### 5. API Documentation
- Health Check: `GET http://localhost:8000/health`
- Swagger Interactive Docs: `GET http://localhost:8000/docs`
- ReDoc Docs: `GET http://localhost:8000/redoc`
