# 🚗 Smart Car Valuation & Price Prediction System

An end-to-end Machine Learning-powered Full-Stack Web Application designed to predict used car market values based on real-world vehicle specifications.

---

## 📌 Project Overview
This project addresses price asymmetry and valuation challenges in the second-hand automotive market. By leveraging machine learning algorithms, modern backend API orchestration, and a responsive web interface, the system provides accurate vehicle valuation based on parameters such as brand, manufacture year, mileage, transmission type, and fuel type.

---

## 🏗️ System Architecture
The application follows a decoupled 3-tier microservices architecture:

```text
┌──────────────────────────────────────────────────────────┐
│             React + Material UI Frontend                 │
│                 (Port: 5173 - Vite)                      │
└────────────────────────────┬─────────────────────────────┘
                             │
                             │ HTTP POST (/api/predict)
                             ▼
┌──────────────────────────────────────────────────────────┐
│              Express.js REST API Backend                 │
│                 (Port: 5000 - Node.js)                   │
└────────────────────────────┬─────────────────────────────┘
                             │
                             │ Internal HTTP POST (/predict)
                             ▼
┌──────────────────────────────────────────────────────────┐
│            FastAPI ML Prediction Microservice            │
│                 (Port: 8000 - Python)                    │
└────────────────────────────┬─────────────────────────────┘
                             │
                             │ Loads Model (.pkl)
                             ▼
┌──────────────────────────────────────────────────────────┐
│          Trained Machine Learning Model Pipeline         │
└──────────────────────────────────────────────────────────┘
```

* **Frontend:** Interactive SPA built with React 19, Vite, and Material UI (MUI).
* **Backend REST API:** Node.js & Express server handling validation, CORS, error handling, and routing.
* **ML Prediction Service:** Python FastAPI service serving the serialized Scikit-learn model.

---

## 📂 Repository Structure

```text
used-car-price-predictor/
├── backend/                  # Node.js + Express REST API
│   ├── src/
│   │   ├── controllers/      # Route controllers (predictController.js)
│   │   ├── routes/           # API routes (predictRoute.js)
│   │   └── server.js         # Express app entry point
│   ├── .env.example          # Environment variables template
│   ├── package.json          # Node dependencies and scripts
│   └── README.md             # Backend specific documentation
├── frontend/                 # React + Vite Frontend Client
│   ├── src/
│   │   ├── App.jsx           # Main UI Component with valuation form
│   │   ├── main.jsx          # React DOM entry
│   │   └── index.css         # Styling
│   ├── package.json          # Frontend dependencies and scripts
│   └── README.md             # Frontend specific documentation
├── ml-service/               # Python FastAPI ML Microservice
│   ├── models/               # Saved model binaries (.pkl)
│   ├── app.py                # FastAPI application & endpoints
│   ├── train_dummy.py        # Model training script
│   ├── requirements.txt      # Python dependencies
│   └── README.md             # ML Service specific documentation
└── README.md                 # Root documentation (this file)
```

---

## 📊 Dataset & Feature Engineering Specifications

* **Dataset Source:** Kaggle (Vehicle Dataset from CarDekho)
* **Target Variable:** `Selling_Price`

### Key Feature Engineering Techniques:
1. **Feature Creation:** Derived `Car_Age` ($2026 - \text{Year}$) to account for market depreciation.
2. **Missing Value Imputation:** Handled missing numerical values using median imputation.
3. **Outlier Treatment:** Applied IQR capping to mitigate extreme mileage outliers.
4. **Categorical Feature Encoding:** Applied One-Hot Encoding (`drop='first'`) to nominal attributes (`Fuel_Type`, `Transmission`).
5. **Feature Scaling:** Standardized numerical attributes using `StandardScaler`.
6. **Feature Selection:** Removed redundant attributes (`Seller_Type`, `Owner`, `Car_Name`).

---

## 🚀 Quick Start Guide (Run All Services)

### Prerequisites
* **Node.js:** v18.0.0 or higher
* **Python:** v3.10 or higher
* **Git**

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/ruwani425/used-car-price-predictor.git
cd used-car-price-predictor
```

---

### Step 2: Start the ML Prediction Service (Terminal 1)
```bash
cd ml-service

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
venv\Scripts\activate
# Windows (CMD):
venv\Scripts\activate.bat
# macOS / Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Train / Generate Model (if models/car_price_model.pkl does not exist)
python train_dummy.py

# Start FastAPI server
uvicorn app:app --port 8000 --reload
```
> 📍 **ML Service will run on:** `http://localhost:8000`  
> 📖 **API Docs (Swagger UI):** `http://localhost:8000/docs`

---

### Step 3: Start the Backend API (Terminal 2)
```bash
cd backend

# Install dependencies
npm install

# (Optional) Verify .env file
# PORT=5000
# ML_SERVICE_URL=http://localhost:8000

# Start server with Nodemon (Development Mode)
npm run dev
```
> 📍 **Backend API will run on:** `http://localhost:5000`  
> 🩺 **Health Check:** `http://localhost:5000/health`

---

### Step 4: Start the Frontend Client (Terminal 3)
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
> 📍 **Frontend Web App will run on:** `http://localhost:5173`

---

## 🧪 Testing the Complete Pipeline

1. Open your browser and navigate to **`http://localhost:5173`**.
2. Enter vehicle details:
   * **Brand:** `Toyota`
   * **Manufacture Year:** `2018`
   * **Mileage (km):** `65000`
   * **Fuel Type:** `Petrol`
   * **Transmission:** `Automatic`
3. Click **"Calculate Valuation"**.
4. The frontend sends a request to Express (`http://localhost:5000/api/predict`), which forwards the payload to FastAPI (`http://localhost:8000/predict`), and returns the predicted market value on the UI.

---

## 👥 Team & Individual Contributions

| Member Name | Student ID | Primary Responsibilities |
| :--- | :--- | :--- |
| **Member 1** | `ST00001` | Dataset Preprocessing, EDA, and Feature Engineering Pipeline |
| **Member 2** | `ST00002` | ML Model Training, Evaluation, and Pipeline Serialization |
| **Member 3** | `ST00003` | Python FastAPI Microservice & Express Backend REST API |
| **Member 4** | `ST00004` | React + Material UI Frontend UI & API Integration |