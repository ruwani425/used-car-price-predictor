# Used Car Price Predictor (Sri Lanka)

A machine learning web application built to predict used car market prices in Sri Lanka. Developed for the **GDSE Machine Learning Module Assignment** by **Team NeuraCore**.

- **Live Demo**: [http://ec2-13-251-129-76.ap-southeast-1.compute.amazonaws.com](http://ec2-13-251-129-76.ap-southeast-1.compute.amazonaws.com)
- **Deployment**: AWS EC2 (Ubuntu), NGINX Reverse Proxy, PM2

---

## Features

- **Price Prediction**: Estimates vehicle market price based on make, model, year, mileage, transmission, engine capacity, condition, and features.
- **5-Year Depreciation Forecast**: Estimates future vehicle value over 5 years.
- **Multi-Currency Support**: View prices in LKR (Lakhs), USD, EUR, GBP, and JPY using cached live exchange rates.
- **Car Comparison**: Compare two car configurations side-by-side.
- **Prediction History**: View and reload previous predictions.

---

## Tech Stack

- **ML Service**: Python, FastAPI, Scikit-Learn, Pandas, NumPy
- **Backend Gateway**: Node.js, Express.js, Axios, ioredis, node-cron
- **Cache & APIs**: Upstash Redis (Cloud), Open Exchange Rates API
- **Frontend**: React (Vite), Material-UI (MUI)

---

## ML Model Benchmark

Models were trained and evaluated on 9,770 cleaned Sri Lankan vehicle records using 5-Fold Cross-Validation:

| Model | 5-Fold CV R² | Test R² | Test RMSE (Lakhs) | Test MAE (Lakhs) | Test MAPE |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Gradient Boosting (Best)** | **0.906** | **0.700** | **26.69** | 7.90 | 14.75% |
| **Random Forest** | 0.903 | 0.691 | 27.10 | **7.14** | **13.85%** |
| **Linear Regression (Baseline)** | 0.874 | 0.559 | 32.37 | 9.60 | 18.49% |

The **Gradient Boosting Regressor** was selected as the champion model for deployment due to the best overall cross-validation score and lowest RMSE.

---

## Project Setup & Running Locally

The project consists of 3 services. Run each in a separate terminal:

### 1. ML Microservice (`ml-service/`)
```powershell
cd ml-service
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```
- API Docs: `http://localhost:8000/docs`

### 2. Backend Gateway (`backend/`)
```powershell
cd backend
npm install
```
Create a `.env` file in `backend/`:
```env
PORT=5000
ML_SERVICE_URL=http://localhost:8000
REDIS_URL=rediss://default:your_password@your-endpoint.upstash.io:6379
OPEN_EXCHANGE_APP_ID=your_open_exchange_app_id
```
Start server:
```powershell
npm run dev
```

### 3. Frontend Web App (`frontend/`)
```powershell
cd frontend
npm install
npm run dev
```
- Open `http://localhost:5173` in your browser.

---

## Team NeuraCore - Work Distribution

| Step | Phase / Task | Member | Student Name | Student ID | Batch |
| :---: | :--- | :---: | :--- | :---: | :---: |
| **01** | Data Cleaning & Feature Engineering Pipeline | Member 01 | W. Himadi Yenushka De Silva | `241711081` | GDSE 71 |
| **02** | Model Training, Benchmark & Export | Member 02 | E.V. Ruwani Ranthika | `241722021` | GDSE 72 |
| **03** | FastAPI ML Microservice REST Endpoints | Member 01 | W. Himadi Yenushka De Silva | `241711081` | GDSE 71 |
| **04** | Express.js API Gateway & Validation | Member 02 | E.V. Ruwani Ranthika | `241722021` | GDSE 72 |
| **05** | Multi-Currency Engine & History Service | Member 01 | W. Himadi Yenushka De Silva | `241711081` | GDSE 71 |
| **06** | Frontend Setup & Valuation Form UI | Member 02 | E.V. Ruwani Ranthika | `241722021` | GDSE 72 |
| **07** | Result Card & Depreciation Chart UI | Member 01 | W. Himadi Yenushka De Silva | `241711081` | GDSE 71 |
| **08** | Car Comparison Tool & History Drawer | Member 02 | E.V. Ruwani Ranthika | `241722021` | GDSE 72 |
| **09** | End-to-End System Testing & Error Handling | Member 01 | W. Himadi Yenushka De Silva | `241711081` | GDSE 71 |
| **10** | Documentation & Assignment Report | Member 02 | E.V. Ruwani Ranthika | `241722021` | GDSE 72 |
| **11** | Redis Caching & Open Exchange Rates Sync | Member 02 | E.V. Ruwani Ranthika | `241722021` | GDSE 72 |
| **12** | Production Cloud Deployment on AWS EC2 | Member 02 | E.V. Ruwani Ranthika | `241722021` | GDSE 72 |

---

## API Endpoints

| Method | Endpoint | Description | Service |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status | Gateway (5000) |
| `GET` | `/api/metadata` | Brands, models, and city options | Gateway (5000) |
| `GET` | `/api/currencies` | Cached currency exchange rates | Gateway / Redis |
| `POST` | `/api/predict` | Car price prediction | Gateway -> ML (8000) |
| `GET` | `/api/history` | Previous prediction history | Gateway (5000) |
| `GET` | `/docs` | Swagger OpenAPI documentation | ML Service (8000) |

---

## API Testing & Verification (Postman)

### 1. Health Check (`GET /api/health`)
![Health Check](https://github.com/user-attachments/assets/e1d6a5e9-eeab-4d38-9c97-503a496e5439)

### 2. Vehicle Metadata (`GET /api/metadata`)
![Metadata API](https://github.com/user-attachments/assets/7cf6a8b2-a1a5-4a92-b0b1-39f729c87929)

### 3. Currency Rates (`GET /api/currencies`)
![Currency API](https://github.com/user-attachments/assets/7cd1466c-5a1f-481c-958a-926d16858dcf)

### 4. Car Price Prediction (`POST /api/predict`)
![Predict API Request](https://github.com/user-attachments/assets/4880660d-18ef-4a1a-a371-d1b02300b7b0)
![Predict API Response](https://github.com/user-attachments/assets/929a65cf-4f68-4287-bef8-cb0fd3919ea8)

### 5. Prediction History (`GET /api/history`)
![History API](https://github.com/user-attachments/assets/b1860e07-63b3-47df-82e7-1b04fde2fba3)
