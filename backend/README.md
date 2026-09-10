# ⚙️ Car Valuation Backend REST API

An intermediate RESTful API gateway built with **Node.js** and **Express.js**. It receives requests from the frontend client, validates input payloads, forwards prediction tasks to the Python ML Microservice, and returns formatted responses.

---

## 🛠️ Tech Stack

* **Runtime:** [Node.js](https://nodejs.org/) (v18+)
* **Framework:** [Express.js](https://expressjs.com/) (v5)
* **HTTP Client:** [Axios](https://axios-http.com/)
* **CORS Middleware:** `cors`
* **Configuration:** `dotenv`
* **Development Reload:** `nodemon`

---

## 📦 Installed Packages

```bash
# Production dependencies
npm install express axios cors dotenv

# Development dependencies
npm install -D nodemon
```

---

## 📂 Project Structure

```text
backend/
├── src/
│   ├── controllers/
│   │   └── predictController.js   # Validation & ML Service forwarding logic
│   ├── routes/
│   │   └── predictRoute.js        # API route definitions (/predict)
│   └── server.js                  # Express application setup & entry point
├── .env                           # Environment variables
├── .env.example                   # Environment configuration template
├── package.json                   # Scripts & dependencies
└── README.md                      # Backend documentation (this file)
```

---

## ⚙️ Local Setup & Run

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables Configuration
Create a `.env` file in the root of `backend/` (or copy from `.env.example`):
```env
PORT=5000
ML_SERVICE_URL=http://localhost:8000
```

### 4. Run the Server
```bash
# Development mode with Nodemon (auto reload on file changes)
npm run dev

# Production mode
npm start
```
The server will start on: **`http://localhost:5000`**

---

## 📡 API Endpoints

### 1. Health Check
* **Method:** `GET`
* **Route:** `/health`
* **Description:** Check if the backend API service is running.
* **Response (200 OK):**
```json
{
  "status": "Backend API is running healthy"
}
```

---

### 2. Predict Vehicle Price
* **Method:** `POST`
* **Route:** `/api/predict`
* **Description:** Validates car parameters and requests prediction from the ML service.
* **Headers:** `Content-Type: application/json`

#### Request Body:
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
  "estimated_price": 18000.00
}
```

#### Error Responses:
* **400 Bad Request:** (Missing required fields)
  ```json
  {
    "error": "All fields are required"
  }
  ```
* **502 Bad Gateway:** (ML Microservice unreachable or threw an error)
  ```json
  {
    "error": "Failed to fetch prediction from ML service"
  }
  ```

---

## 🧪 Testing with cURL / PowerShell

### Test Health Check:
```bash
# cURL
curl http://localhost:5000/health

# PowerShell
Invoke-RestMethod -Uri "http://localhost:5000/health" -Method Get
```

### Test Price Prediction:
```bash
# cURL
curl -X POST http://localhost:5000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"brand":"Toyota","year":2018,"mileage":65000,"fuel_type":"Petrol","transmission":"Automatic"}'

# PowerShell
Invoke-RestMethod -Uri "http://localhost:5000/api/predict" `
  -Method Post `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{"brand":"Toyota","year":2018,"mileage":65000,"fuel_type":"Petrol","transmission":"Automatic"}'
```
