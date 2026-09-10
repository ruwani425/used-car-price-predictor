# 🧠 Car Valuation ML Prediction Service

A high-performance Python Machine Learning microservice built with **FastAPI**. It handles model serialization, feature preprocessing, and serves real-time car price inference.

---

## 🛠️ Tech Stack

* **Language:** Python 3.10+
* **Web Framework:** [FastAPI](https://fastapi.tiangolo.com/) & [Uvicorn](https://www.uvicorn.org/) (ASGI Server)
* **Data Validation:** [Pydantic v2](https://docs.pydantic.dev/)
* **Machine Learning & Preprocessing:** [Scikit-learn](https://scikit-learn.org/), [Pandas](https://pandas.pydata.org/), [NumPy](https://numpy.org/)
* **Model Serialization:** [Joblib](https://joblib.readthedocs.io/)

---

## 📦 Installed Dependencies (`requirements.txt`)

```text
fastapi
uvicorn
pydantic
scikit-learn
pandas
numpy
joblib
```

To install directly:
```bash
pip install fastapi uvicorn pydantic scikit-learn pandas numpy joblib
```

---

## 📂 Project Structure

```text
ml-service/
├── models/                     # Directory storing serialized models
│   └── car_price_model.pkl    # Trained Scikit-learn model artifact
├── app.py                      # FastAPI application with prediction endpoints
├── train_dummy.py              # Dummy/Sample model training & export script
├── requirements.txt            # Python dependencies
└── README.md                   # ML Service documentation (this file)
```

---

## ⚙️ Local Setup & Run

### 1. Navigate to ML Service Directory
```bash
cd ml-service
```

### 2. Create and Activate Virtual Environment
```bash
# Create virtual environment named 'venv'
python -m venv venv

# Activate on Windows (PowerShell):
venv\Scripts\activate

# Activate on Windows (CMD):
venv\Scripts\activate.bat

# Activate on macOS/Linux:
source venv/bin/activate
```

### 3. Install Required Dependencies
```bash
pip install -r requirements.txt
```

### 4. Train Model & Generate Artifact
Run the training script to generate and save `models/car_price_model.pkl`:
```bash
python train_dummy.py
```
> Output: `Model saved successfully as models/car_price_model.pkl`

### 5. Start the FastAPI Server
```bash
uvicorn app:app --port 8000 --reload
```
The ML prediction service will run at: **`http://localhost:8000`**

---

## 📖 Interactive API Documentation

FastAPI automatically generates interactive API documentation:
* **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
* **ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 📡 API Endpoints

### 1. Health Check
* **Method:** `GET`
* **Route:** `/`
* **Response (200 OK):**
```json
{
  "status": "ML Service is up and running"
}
```

---

### 2. Predict Price
* **Method:** `POST`
* **Route:** `/predict`
* **Headers:** `Content-Type: application/json`

#### Request Schema:
```json
{
  "brand": "Toyota",
  "year": 2018,
  "mileage": 65000,
  "fuel_type": "Petrol",
  "transmission": "Automatic"
}
```

#### Success Response (200 OK):
```json
{
  "success": true,
  "predicted_price": 18000.00
}
```

#### Error Response:
* **500 Internal Server Error:** (Model file not found)
* **400 Bad Request:** (Invalid input values or format error)

---

## 🧪 Testing with cURL / PowerShell

### Test Root / Health:
```bash
# cURL
curl http://localhost:8000/

# PowerShell
Invoke-RestMethod -Uri "http://localhost:8000/" -Method Get
```

### Test Prediction:
```bash
# cURL
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"brand":"Toyota","year":2018,"mileage":65000,"fuel_type":"Petrol","transmission":"Automatic"}'

# PowerShell
Invoke-RestMethod -Uri "http://localhost:8000/predict" `
  -Method Post `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{"brand":"Toyota","year":2018,"mileage":65000,"fuel_type":"Petrol","transmission":"Automatic"}'
```
