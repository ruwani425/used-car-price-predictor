# 💻 Car Valuation Frontend Application

A responsive Single Page Application (SPA) built with **React**, **Vite**, and **Material UI (MUI)** to accept vehicle specifications and display predicted market values in real time.

---

## 🛠️ Tech Stack

* **Framework:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
* **UI Component Library:** [Material UI (MUI)](https://mui.com/)
* **Icons:** `@mui/icons-material`
* **Styling Engine:** `@emotion/react`, `@emotion/styled`
* **HTTP Client:** [Axios](https://axios-http.com/)

---

## 📦 Installed Dependencies

```bash
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material axios react react-dom
npm install -D vite @vitejs/plugin-react eslint
```

---

## 📂 Project Structure

```text
frontend/
├── public/                 # Public assets
├── src/
│   ├── assets/             # Images & static assets
│   ├── App.css             # App component styling
│   ├── App.jsx             # Main interactive valuation form component
│   ├── index.css           # Global CSS styles
│   └── main.jsx            # Entry point rendering React DOM with theme
├── index.html              # HTML template
├── package.json            # Dependencies and npm scripts
├── vite.config.js          # Vite configuration
└── README.md               # Frontend documentation (this file)
```

---

## ⚙️ Local Setup & Run

### 1. Navigate to Frontend Directory
```bash
cd frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
The application will launch on: **`http://localhost:5173`**

### 4. Build for Production (Optional)
```bash
# Compile and bundle assets for production
npm run build

# Preview production build locally
npm run preview
```

---

## 🔗 API Integration & Payload Structure

The frontend interacts with the backend Express REST API at `http://localhost:5000/api/predict`.

### Request Payload Sent:
```json
{
  "brand": "Toyota",
  "year": 2018,
  "mileage": 65000,
  "fuel_type": "Petrol",
  "transmission": "Automatic"
}
```

### Response Received:
```json
{
  "success": true,
  "estimated_price": 18000.00
}
```

---

## 🧪 Testing the Frontend UI

1. Ensure the **Backend API** is running on port `5000` and the **ML Service** on port `8000`.
2. Open `http://localhost:5173` in your browser.
3. Complete the form inputs:
   - **Vehicle Brand:** Select from dropdown (e.g., *Toyota, Honda, Nissan, Suzuki, Hyundai, BMW, Mercedes*)
   - **Manufacture Year:** Enter a valid year (e.g., *2018*)
   - **Mileage (km):** Enter positive integer value (e.g., *65000*)
   - **Fuel Type:** Select *Petrol*, *Diesel*, *Hybrid*, or *Electric*
   - **Transmission:** Select *Automatic* or *Manual*
4. Click **"Calculate Valuation"**.
5. The predicted valuation card will appear with the formatted estimated market price.
