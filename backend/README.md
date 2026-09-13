# 🛡️ Backend API Gateway & Currency Service

The Node.js and Express.js API Gateway that orchestrates requests between the Frontend client, ML microservice, Cloud Redis cache, and Open Exchange Rates API.

---

## 🌟 Key Responsibilities

- **REST API Gateway**: Exposes secure REST endpoints for vehicle predictions, metadata taxonomy, and historical logs.
- **Upstash Cloud Redis Caching**: Caches official live foreign exchange rates with a 3-hour TTL.
- **Automated Cron Sync**: `node-cron` background worker running every 3 hours (`0 */3 * * *`) to fetch fresh rates from Open Exchange Rates API.
- **Header Currency Resolution**: Custom middleware (`x-currency-code`) to dynamically inject currency conversions.
- **ML Proxy Client**: Validates client payloads and forwards inference requests to the Python FastAPI microservice (`:8000`).

---

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Cache Engine**: ioredis (Upstash TLS `rediss://`)
- **Cron Engine**: node-cron
- **HTTP Client**: Axios
- **Utilities**: CORS, Dotenv, Morgan

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the `backend` root:
```env
PORT=5000
ML_SERVICE_URL=http://localhost:8000
REDIS_URL=rediss://default:your_password@your-endpoint.upstash.io:6379
OPEN_EXCHANGE_APP_ID=your_open_exchange_app_id_here
```

### 3. Run Server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

### 4. API Endpoints
- Health Check: `GET http://localhost:5000/api/health`
- Currencies: `GET http://localhost:5000/api/currencies`
- Metadata: `GET http://localhost:5000/api/metadata`
- Valuation Predict: `POST http://localhost:5000/api/predict`
- History: `GET http://localhost:5000/api/history`
