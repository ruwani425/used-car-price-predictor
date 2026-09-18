# Backend API Gateway

Node.js Express API gateway that handles validation, proxies requests to the ML microservice, and manages currency rates with Upstash Redis cache.

---

## Features

- **ML Service Proxy**: Validates and routes prediction requests to FastAPI.
- **Currency Caching**: Caches exchange rates (USD, EUR, GBP, JPY) in Upstash Redis.
- **Scheduled Sync**: Uses `node-cron` to refresh rates every 3 hours from Open Exchange Rates API.
- **Prediction History**: In-memory historical prediction store with filtering.

---

## Setup & Run

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables (`.env`)
```env
PORT=5000
ML_SERVICE_URL=http://localhost:8000
REDIS_URL=rediss://default:your_password@your-endpoint.upstash.io:6379
OPEN_EXCHANGE_APP_ID=your_open_exchange_app_id
```

### 3. Start Server
```bash
# Development (with nodemon)
npm run dev

# Production
npm start
```

---

## API Endpoints

- `GET /api/health` - Check health of Gateway & ML service
- `GET /api/metadata` - Get vehicle taxonomy (brands, models, towns)
- `GET /api/currencies` - Get currency exchange rates
- `POST /api/predict` - Vehicle valuation prediction
- `GET /api/history` - Get recent predictions
