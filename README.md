# 🚗 Enterprise Used Car Price Valuation & Market Intelligence Platform

An end-to-end, production-grade Machine Learning and Web Application system designed specifically for the **Sri Lankan Automobile Market**. Built for the **GDSE Machine Learning Module Assignment**, this platform bridges advanced machine learning regression techniques with a high-performance modern 3-tier microservices architecture.

---

## 🌟 Key Features

- **Accurate Real-time Valuation**: Instant market price estimation based on vehicle brand, model, edition, transmission, mileage, engine capacity, condition, and luxury options.
- **7 Advanced Feature Engineering Pipelines**: Robust data preprocessing, IQR outlier clipping, log-transformed target modeling ($\log(1 + y)$), frequency encoding, and luxury scoring.
- **5-Model Benchmark Suite**: Rigorous evaluation across Linear Regression, Ridge, Decision Tree, Random Forest, and Gradient Boosting with 5-fold Cross-Validation.
- **Interactive 5-Year Depreciation Forecasting**: Dynamic residual value curve forecasting vehicle depreciation over 5 years.
- **Live Multi-Currency Conversion Engine**: Real-time price conversion across LKR (Lakhs & Total), USD, EUR, GBP, and JPY backed by official Open Exchange Rates API.
- **Upstash Cloud Redis Caching & 3-Hour Cron Engine**: High-performance caching with automated background synchronization to optimize API quotas.
- **Side-by-Side Car Comparison**: Compare two car configurations simultaneously to evaluate valuation and value-retention.
- **Minimalist Blue & White SaaS UI**: Clean, light-themed responsive interface built with React 19 and Material-UI.
- **Historical Prediction Log**: Persistent, searchable history drawer with instant re-calculation.

---

## 🏛️ System Architecture

The platform is architected as an enterprise 3-tier microservices system:

```mermaid
graph TD
    subgraph ClientTier ["Frontend (Vite + React 19 + MUI Modern SaaS)"]
        UI["React Single Page Application (:5173)"]
        Form["Vehicle Specification Form"]
        Card["Fair Market Valuation Display"]
        Chart["5-Year Depreciation Forecast Curve"]
        Compare["Car Comparison Matrix"]
        Hist["Valuation History Drawer"]
    end

    subgraph GatewayTier ["Backend Gateway (Node.js + Express.js :5000)"]
        GW["Express REST API Gateway"]
        Val["Payload Validation Middleware"]
        Curr["Multi-Currency Engine (currencyService.js)"]
        Cron["3-Hour Cron Sync Job (node-cron)"]
        Redis["Upstash Cloud Redis Cache (3h TTL)"]
        OpenEx["Open Exchange Rates API"]
        Client["Axios ML Client Proxy"]
    end

    subgraph MLServiceTier ["ML Microservice (Python + FastAPI + Scikit-Learn :8000)"]
        API["FastAPI REST Microservice"]
        Pipeline["Inference Preprocessing Pipeline"]
        Model["Gradient Boosting Regressor (.pkl)"]
        Metadata["Model Metadata & Taxonomy Registry"]
        Metrics["Evaluation Metrics & Benchmarks"]
    end

    UI -->|REST API Requests| GW
    GW -->|POST /api/predict| Val
    Val -->|Validated Payload| Client
    Client -->|Internal HTTP Proxy| API
    API --> Pipeline
    Pipeline --> Model
    Model -->|Predicted Log Price| Pipeline
    Pipeline -->|Inverse Exp Transform| API
    API -->|Prediction Result LKR Lakhs| Client
    Client --> Curr
    Curr <-->|Read / Write Cached Rates| Redis
    Cron -->|Fetch Every 3 Hours| OpenEx
    OpenEx -->|Live Exchange JSON| Cron
    Cron -->|Set TTL Cache| Redis
    Curr --> Hist
    Hist -->|Enriched Multi-Currency JSON| UI
```

---

## 📊 ML Model Performance & Leaderboard

The models were evaluated on 9,770 cleaned Sri Lankan vehicle records using 5-Fold Cross-Validation and a held-out test split (80/20):

| Model | 5-Fold CV $R^2$ | Test $R^2$ | Test RMSE (Lakhs) | Test MAE (Lakhs) | Test MAPE (%) | Training Time |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Gradient Boosting** ⭐ | **0.9063 ± 0.005** | **0.7001** | **26.69** | **7.90** | **14.75%** | 39.41s |
| **Random Forest** | 0.9026 ± 0.004 | 0.6908 | 27.10 | 7.14 | **13.85%** | 4.78s |
| **Decision Tree** | 0.8619 ± 0.006 | 0.6782 | 27.65 | 8.09 | 16.81% | 0.33s |
| **Linear Regression** | 0.8742 ± 0.009 | 0.5588 | 32.37 | 9.60 | 18.49% | 1.11s |
| **Ridge Regression** | 0.8739 ± 0.009 | 0.5583 | 32.39 | 9.61 | 18.48% | 1.25s |

> **Selected Champion Model**: **Gradient Boosting Regressor** (`car_price_model.pkl`), achieving the lowest RMSE of **26.69 Lakhs** and highest Cross-Validation $R^2$ of **0.9063**.

---

## 🛠️ Technology Stack

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
     REDIS_URL=rediss://default:gQAAAAAAAmP2AAIgcDI0MWJmNDNlNTAxNGU0NzJkODA2MzNkYzlhMzE1MGIyOQ@knowing-bird-156662.upstash.io:6379
     ```
5. **Verify Data via Web**:
   - Open the **"Data Browser"** tab in Upstash Console to view stored cache keys (`currency:rates`, `currency:exchange_rates:latest`) and live TTL countdown timers.

---

### 2. How to Get an Open Exchange Rates App ID

Open Exchange Rates provides official foreign exchange rates for converting LKR to USD, EUR, GBP, and JPY.

1. **Sign Up**: Visit [openexchangerates.org/signup/free](https://openexchangerates.org/signup/free) and create a free developer account (includes 1,000 free API requests per month).
2. **Obtain App ID**:
   - After signing in, go to the **"App IDs"** section in your dashboard: [openexchangerates.org/account/app-ids](https://openexchangerates.org/account/app-ids).
   - Copy your 32-character **App ID** (e.g., `cda30b7d944b4f71b8a861df1d899384`).
3. **Configure in Project**:
   - Open `backend/.env` and add your App ID:
     ```env
     OPEN_EXCHANGE_APP_ID=cda30b7d944b4f71b8a861df1d899384
     ```
4. **Quota Efficiency Guaranteed**:
   - Thanks to the **3-hour Redis caching strategy** (`0 */3 * * *`), our backend makes **only 8 API requests per day** ($8 \times 30 = 240 \text{ requests/month}$), using only 24% of the monthly 1,000 free quota while allowing unlimited frontend currency conversions.

---

## 🚀 Running the 3 Projects Separately (Step-by-Step)

To run the complete system, open **3 separate terminal windows** (one for each microservice layer):

```
┌───────────────────────────┐    ┌───────────────────────────┐    ┌───────────────────────────┐
│   Terminal 1: ML Service  │    │   Terminal 2: Backend     │    │   Terminal 3: Frontend    │
│   FastAPI (Port 8000)     │ ── │   Express.js (Port 5000)  │ ── │   React + Vite (Port 5173)│
└───────────────────────────┘    └───────────────────────────┘    └───────────────────────────┘
```

---

### 🖥️ Terminal 1: ML Microservice (`ml-service/`)

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

### 🖥️ Terminal 2: Backend API Gateway (`backend/`)

1. Open a new terminal window and navigate to `backend`:
   ```powershell
   cd backend
   ```
2. Create your `.env` configuration file:
   ```env
   PORT=5000
   ML_SERVICE_URL=http://localhost:8000
   REDIS_URL=rediss://default:gQAAAAAAAmP2AAIgcDI0MWJmNDNlNTAxNGU0NzJkODA2MzNkYzlhMzE1MGIyOQ@knowing-bird-156662.upstash.io:6379
   OPEN_EXCHANGE_APP_ID=cda30b7d944b4f71b8a861df1d899384
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

### 🖥️ Terminal 3: Frontend Web Client (`frontend/`)

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

## 👥 Team & Work Distribution

### Summary of Roles & Responsibilities

| Member | Student Name | Student ID | Batch | Assigned Implementation Scope & Key Contributions |
| :--- | :--- | :---: | :---: | :--- |
| **Member 01** | **W. Himadi Yenushka De Silva** | `241711081` | GDSE 71 | • **Data Preprocessing & Feature Engineering**: 7 mathematical pipeline transformations, IQR outlier clipping, log normalization.<br>• **FastAPI ML Microservice**: REST inference endpoints, Scikit-Learn pipeline integration.<br>• **Depreciation Projection**: 5-Year compound depreciation mathematical forecasting curve.<br>• **Fullstack Integration**: API proxy orchestration and error boundary handlers. |
| **Member 02** | **E.V. Ruwani Ranthika** | `241722021` | GDSE 72 | • **Live Currency Exchange Engine**: Integration of official Open Exchange Rates API (`USD`, `EUR`, `GBP`, `JPY`).<br>• **Cloud Redis Caching & Cron Architecture**: Upstash Redis integration with 3-hour TTL caching and automated `node-cron` background sync.<br>• **Express.js API Gateway**: Middleware pipeline, header currency resolution, and request validation.<br>• **ML Model Benchmarking**: 5-model regression evaluation suite & Champion Gradient Boosting model selection.<br>• **Modern SaaS Frontend UI**: 2-Column responsive dashboard redesign, vehicle comparison tool, and valuation drawer. |

---

### 📋 10-Step Implementation Plan Breakdown

| Step | Phase / Task Description | Assigned Member | Student Name | Student ID |
| :---: | :--- | :---: | :--- | :---: |
| **Step 01** | Dataset Hygiene, Cleaning & 7 Feature Engineering Pipelines | **Member 01** | W. Himadi Yenushka De Silva | `241711081` |
| **Step 02** | Multi-Model Regression Benchmarking, 5-Fold CV & Champion Model Export | **Member 02** | E.V. Ruwani Ranthika | `241722021` |
| **Step 03** | FastAPI ML Microservice, Inference Pipelines & REST Endpoints | **Member 01** | W. Himadi Yenushka De Silva | `241711081` |
| **Step 04** | Node.js / Express.js Gateway, Payload Validation Middleware & ML Proxy | **Member 02** | E.V. Ruwani Ranthika | `241722021` |
| **Step 05** | Live Open Exchange Rates API Integration & Upstash Cloud Redis Caching | **Member 02** | E.V. Ruwani Ranthika | `241722021` |
| **Step 06** | 3-Hour Automated Cron Synchronization Engine & Currency Middleware | **Member 02** | E.V. Ruwani Ranthika | `241722021` |
| **Step 07** | Valuation Result Card & Interactive 5-Year Depreciation Curve Visualization | **Member 01** | W. Himadi Yenushka De Silva | `241711081` |
| **Step 08** | Minimalist Blue & White SaaS 2-Column Dashboard & Side-by-Side Car Comparator | **Member 02** | E.V. Ruwani Ranthika | `241722021` |
| **Step 09** | Fullstack End-to-End Integration, Error Boundaries & Latency Monitoring | **Member 01** | W. Himadi Yenushka De Silva | `241711081` |
| **Step 10** | System Architecture Documentation, Academic Report & Viva Defense Prep | **Member 02** | E.V. Ruwani Ranthika | `241722021` |

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
