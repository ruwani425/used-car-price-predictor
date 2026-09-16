# Enterprise Used Car Price Valuation & Market Intelligence Platform

An end-to-end, production-grade Machine Learning and Web Application system designed specifically for the **Sri Lankan Automobile Market**. Built for the **GDSE Machine Learning Module Assignment**, this platform bridges advanced machine learning regression techniques with a high-performance modern 3-tier microservices architecture.

> **Live Cloud Deployment**: [http://ec2-13-251-129-76.ap-southeast-1.compute.amazonaws.com](http://ec2-13-251-129-76.ap-southeast-1.compute.amazonaws.com)  
> **Direct Public IP**: [http://13.251.129.76](http://13.251.129.76)  
> **AWS Region**: `ap-southeast-1 (Singapore)`  
> **Hosting Architecture**: AWS EC2 (`t2.micro` / `t3.micro`), NGINX Reverse Proxy, Upstash Cloud Redis Cache, Python FastAPI & Node.js Express Gateway.

---

## Key Features

- **Accurate Real-time Valuation**: Instant market price estimation based on vehicle brand, model, edition, transmission, mileage, engine capacity, condition, and luxury options.
- **7 Advanced Feature Engineering Pipelines**: Robust data preprocessing, IQR outlier clipping, log-transformed target modeling ($\log(1 + y)$), frequency encoding, and luxury scoring.
- **3-Model Benchmark Suite**: Linear Regression (baseline), Random Forest (bagging), and Gradient Boosting (boosting champion) evaluated with 5-fold Cross-Validation.
- **Interactive 5-Year Depreciation Forecasting**: Dynamic residual value curve forecasting vehicle depreciation over 5 years.
- **Live Multi-Currency Conversion Engine**: Real-time price conversion across LKR (Lakhs & Total), USD, EUR, GBP, and JPY backed by official Open Exchange Rates API.
- **Upstash Cloud Redis Caching & 3-Hour Cron Engine**: High-performance caching with automated background synchronization to optimize API quotas.
- **Side-by-Side Car Comparison**: Compare two car configurations simultaneously to evaluate valuation and value-retention.
- **Minimalist Blue & White SaaS UI**: Clean, light-themed responsive interface built with React 19 and Material-UI.
- **Historical Prediction Log**: Persistent, searchable history drawer with instant re-calculation.

---

## ML Model Performance & Leaderboard

The models were evaluated on 9,770 cleaned Sri Lankan vehicle records using 5-Fold Cross-Validation and a held-out test split (80/20):

| Model | Role | 5-Fold CV $R^2$ | Test $R^2$ | Test RMSE (Lakhs) | Test MAE (Lakhs) | Test MAPE (%) | Training Time |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Gradient Boosting** | Boosting Champion | **0.9063 ± 0.005** | **0.7001** | **26.69** | 7.90 | 14.75% | 40.89s |
| **Random Forest** | Bagging | 0.9026 ± 0.004 | 0.6908 | 27.10 | **7.14** | **13.85%** | 11.08s |
| **Linear Regression** | Baseline | 0.8742 ± 0.009 | 0.5588 | 32.37 | 9.60 | 18.49% | 1.23s |

> **Selected Champion Model**: **Gradient Boosting Regressor** (`car_price_model.pkl`), achieving the lowest RMSE of **26.69 Lakhs** and highest Cross-Validation $R^2$ of **0.9063**. Linear Regression is the interpretable baseline; Random Forest is the bagging ensemble (best MAPE).

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **ML Microservice** | Python 3.10+, FastAPI, Uvicorn, Scikit-Learn, Pandas, NumPy, Joblib |
| **Backend Gateway** | Node.js, Express.js, Axios, CORS, Dotenv, ioredis, node-cron |
| **Cloud Cache** | Upstash Serverless Cloud Redis (TLS / `rediss://`) |
| **External APIs** | Open Exchange Rates API (Official Live Rates) |
| **Frontend Client** | React 19, Vite, Material UI (MUI v6), SVG Data Visualizations |
| **Architecture** | Microservices REST API, 3-Tier Separation of Concerns |

---

## 🔑 External Services Setup Guide

### 1. How to Setup Upstash Cloud Redis

Upstash provides a fully managed, serverless Cloud Redis instance with SSL/TLS encryption.

1. **Sign Up / Login**: Visit [console.upstash.com](https://console.upstash.com/) and log in with your GitHub or Google account.
2. **Create Database**:
   - Click **"Create Database"**.
   - **Name**: `car-price-predictor-redis`
   - **Type**: Regional
   - **Region**: `ap-southeast-1` (Singapore) or nearest to your region.
   - **Eviction**: Enable `Evict keys when memory limit is reached`.
   - Click **"Create"**.
3. **Copy Connection URL**:
   - In the database dashboard, scroll down to the **"REST API" / "Node.js (ioredis)"** section.
   - Select the **"ioredis"** tab or copy the **`REDIS_URL`** connection string (format: `rediss://default:<password>@<host>.upstash.io:6379`).
4. **Configure in Project**:
   - Open `backend/.env` and paste your Redis connection string:
     ```env
     REDIS_URL=rediss://default:your_password@your-endpoint.upstash.io:6379
     ```
5. **Verify Data via Web**:
   - Open the **"Data Browser"** tab in Upstash Console to view stored cache keys (`currency:rates`, `currency:exchange_rates:latest`) and live TTL countdown timers.

---

### 2. How to Get an Open Exchange Rates App ID

Open Exchange Rates provides official foreign exchange rates for converting LKR to USD, EUR, GBP, and JPY.

1. **Sign Up**: Visit [openexchangerates.org/signup/free](https://openexchangerates.org/signup/free) and create a free developer account (includes 1,000 free API requests per month).
2. **Obtain App ID**:
   - After signing in, go to the **"App IDs"** section in your dashboard: [openexchangerates.org/account/app-ids](https://openexchangerates.org/account/app-ids).
   - Copy your 32-character **App ID** (e.g., `your_open_exchange_app_id_here`).
3. **Configure in Project**:
   - Open `backend/.env` and add your App ID:
     ```env
     OPEN_EXCHANGE_APP_ID=your_open_exchange_app_id_here
     ```
4. **Quota Efficiency Guaranteed**:
   - Thanks to the **3-hour Redis caching strategy** (`0 */3 * * *`), our backend makes **only 8 API requests per day** ($8 \times 30 = 240 \text{ requests/month}$), using only 24% of the monthly 1,000 free quota while allowing unlimited frontend currency conversions.

---

## Running the 3 Projects Separately (Step-by-Step)

To run the complete system, open **3 separate terminal windows** (one for each microservice layer):

```
┌───────────────────────────┐    ┌───────────────────────────┐    ┌───────────────────────────┐
│   Terminal 1: ML Service  │    │   Terminal 2: Backend     │    │   Terminal 3: Frontend    │
│   FastAPI (Port 8000)     │ ── │   Express.js (Port 5000)  │ ── │   React + Vite (Port 5173)│
└───────────────────────────┘    └───────────────────────────┘    └───────────────────────────┘
```

---

### Terminal 1: ML Microservice (`ml-service/`)

1. Navigate to the `ml-service` directory:
   ```powershell
   cd ml-service
   ```
2. Create and activate a Python virtual environment:
   ```powershell
   # Windows PowerShell:
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # macOS / Linux:
   # python3 -m venv venv
   # source venv/bin/activate
   ```
3. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
4. Start the FastAPI ML microservice:
   ```powershell
   uvicorn app:app --host 127.0.0.1 --port 8000 --reload
   ```
5. **Verification URLs**:
   - Health Check: [http://localhost:8000/health](http://localhost:8000/health)
   - Interactive Swagger API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Terminal 2: Backend API Gateway (`backend/`)

1. Open a new terminal window and navigate to `backend`:
   ```powershell
   cd backend
   ```
2. Create your `.env` configuration file:
   ```env
   PORT=5000
   ML_SERVICE_URL=http://localhost:8000
   REDIS_URL=rediss://default:your_password@your-endpoint.upstash.io:6379
   OPEN_EXCHANGE_APP_ID=your_open_exchange_app_id_here
   ```
3. Install Node.js dependencies:
   ```powershell
   npm install
   ```
4. Start the Node.js Express server with auto-reload:
   ```powershell
   npm run dev
   ```
5. **Verification URLs**:
   - Gateway Health Endpoint: [http://localhost:5000/api/health](http://localhost:5000/api/health)
   - Live Redis Currencies Endpoint: [http://localhost:5000/api/currencies](http://localhost:5000/api/currencies)
   - Vehicle Taxonomy Metadata: [http://localhost:5000/api/metadata](http://localhost:5000/api/metadata)

---

### Terminal 3: Frontend Web Client (`frontend/`)

1. Open a new terminal window and navigate to `frontend`:
   ```powershell
   cd frontend
   ```
2. Install React dependencies:
   ```powershell
   npm install
   ```
3. Start the Vite development server:
   ```powershell
   npm run dev
   ```
4. **Access the Web Application**:
   - Open your browser and navigate to: **[http://localhost:5173](http://localhost:5173)**

---

## 👥 Team & 12-Step Implementation Plan Breakdown

| Step | Implementation Phase & Task Description | Assigned Member | Student Name | Student ID | Batch |
| :---: | :--- | :---: | :--- | :---: | :---: |
| **Step 01** | **Data Cleaning & Feature Engineering Pipeline** (`ml-service/`)<br>• Deduplicate dataset rows and clean data anomalies.<br>• Implement 7 feature engineering techniques (Car Age, Mileage/Year, Luxury Score, rare model grouping, log transformation, IQR outlier clipping).<br>• Construct reusable Scikit-Learn preprocessing pipeline. | **Member 01** | W. Himadi Yenushka De Silva | `241711081` | GDSE 71 |
| **Step 02** | **Multi-Model Training, Hyperparameter Tuning & Export** (`ml-service/`)<br>• Train and benchmark 3 regression algorithms (Linear Regression baseline, Random Forest bagging, Gradient Boosting champion).<br>• Compute $R^2$, RMSE, MAE, MAPE via 5-Fold Cross-Validation.<br>• Export serialized artifacts (`car_price_model.pkl`, `metrics.json`, `metadata.json`). | **Member 02** | E.V. Ruwani Ranthika | `241722021` | GDSE 72 |
| **Step 03** | **Python FastAPI ML Microservice Development** (`ml-service/`)<br>• Build high-performance FastAPI microservice (`app.py`).<br>• Expose `POST /api/ml/predict`, `GET /api/ml/metadata`, and `GET /api/ml/metrics`.<br>• Perform unit testing and interactive Swagger docs on port `8000`. | **Member 01** | W. Himadi Yenushka De Silva | `241711081` | GDSE 71 |
| **Step 04** | **Express.js Backend REST API Gateway Setup** (`backend/`)<br>• Initialize Node.js Express server architecture (server, routes, controllers).<br>• Implement request payload validation middleware.<br>• Build Axios ML proxy client forwarding requests to FastAPI (`:8000`). | **Member 02** | E.V. Ruwani Ranthika | `241722021` | GDSE 72 |
| **Step 05** | **Multi-Currency Engine & Prediction History System** (`backend/`)<br>• Implement base conversion engine and data models.<br>• Enrich valuation response with converted prices and formatting.<br>• Implement persistent prediction history retrieval endpoint (`GET /api/history`). | **Member 01** | W. Himadi Yenushka De Silva | `241711081` | GDSE 71 |
| **Step 06** | **Frontend Core Setup & Cascading Valuation Form** (`frontend/`)<br>• Setup React 19 + Vite environment and Material UI theme.<br>• Build responsive Navbar and navigation layout.<br>• Create dynamic cascading Brand $\rightarrow$ Model dropdown form and option toggles. | **Member 02** | E.V. Ruwani Ranthika | `241722021` | GDSE 72 |
| **Step 07** | **Live Prediction Result Card & Depreciation Chart** (`frontend/`)<br>• Build `PriceResultCard.jsx` with animated price counter and confidence bounds.<br>• Build `DepreciationChart.jsx` (5-year forecasted compound residual value curve).<br>• Implement active currency selector toggle. | **Member 01** | W. Himadi Yenushka De Silva | `241711081` | GDSE 71 |
| **Step 08** | **Model Analytics Dashboard & Car Comparison Tool** (`frontend/`)<br>• Build `CarComparison.jsx` (side-by-side vehicle valuation comparator).<br>• Build recent prediction history slide-out drawer.<br>• Design comparative price delta metrics. | **Member 02** | E.V. Ruwani Ranthika | `241722021` | GDSE 72 |
| **Step 09** | **End-to-End System Integration & Robustness Testing** (Full-Stack)<br>• Validate complete 3-tier workflow across ports 8000, 5000, and 5173.<br>• Test edge cases (extreme mileage, rare models, invalid inputs) and configure error boundaries.<br>• Verify CORS policies, environment variables, and network latency. | **Member 01** | W. Himadi Yenushka De Silva | `241711081` | GDSE 71 |
| **Step 10** | **Final Documentation, Assignment Submission & Viva Prep** (`docs/`)<br>• Complete system architecture documentation, Mermaid diagrams, and run guides.<br>• Compile academic report sections (dataset profile, feature engineering, model benchmark tables).<br>• Prepare Viva Voce defense points and demonstration scripts. | **Member 02** | E.V. Ruwani Ranthika | `241722021` | GDSE 72 |
| **Step 11** | **Enterprise Cloud Redis Caching & Live Open Exchange Rates Integration** (`backend/` & `frontend/`)<br>• Connect official **Open Exchange Rates API** (`app_id`) for dynamic USD, EUR, GBP, and JPY exchange rate resolution.<br>• Integrate **Upstash Serverless Cloud Redis** (`rediss://`) with 3-hour cache TTL (`currency:rates`, `currency:exchange_rates:latest`).<br>• Implement automated **3-hour background cron worker** (`0 */3 * * *`) ensuring quota efficiency (240 requests/month).<br>• Implement Express `currencyMiddleware.js` for dynamic `x-currency-code` header resolution.<br>• Overhaul frontend into a balanced **2-column Minimalist SaaS Dashboard** with Material-UI Grid v2 responsiveness. | **Member 02** | **E.V. Ruwani Ranthika** | **`241722021`** | **GDSE 72** |
| **Step 12** | **Production Cloud Deployment on AWS EC2 & NGINX Reverse Proxy** (`devops/` & `cloud`)<br>• Provision and configure **AWS EC2 (Ubuntu 24.04 LTS)** in `ap-southeast-1 (Singapore)`.<br>• Configure 2GB virtual swap memory optimization for resource reliability on free-tier compute.<br>• Setup **NGINX Reverse Proxy** for Port 80 unified routing across React static build and Node.js `/api` endpoints.<br>• Configure **PM2 Process Manager** for 24/7 background execution, process monitoring, and auto-restart of Python FastAPI (`ml-service`) and Express Gateway (`backend-gateway`).<br>• Deploy live public application at `http://ec2-13-251-129-76.ap-southeast-1.compute.amazonaws.com`. | **Member 02** | **E.V. Ruwani Ranthika** | **`241722021`** | **GDSE 72** |

---

## 📡 REST API Quick Reference

| Method | Endpoint | Description | Layer |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Gateway & ML microservice health status | Gateway (5000) |
| `GET` | `/api/metadata` | Brand taxonomy, model lists, and available cities | Gateway (5000) |
| `GET` | `/api/currencies` | Live cached exchange rates & currency pair matrix | Gateway / Redis |
| `POST` | `/api/predict` | Real-time vehicle market price prediction | Gateway $\rightarrow$ ML (8000) |
| `GET` | `/api/history` | Historical vehicle valuation logs | Gateway (5000) |
| `GET` | `/health` | Direct ML service liveness probe | ML Service (8000) |
| `GET` | `/docs` | Interactive Swagger OpenAPI documentation | ML Service (8000) |

---

## 📄 License & Academic Integrity

Developed for the **Graduate Diploma in Software Engineering (GDSE)** Machine Learning Module. All rights reserved.
