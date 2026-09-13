# 💻 Frontend Web Client (AutoValuate)

The modern, responsive web application for the Used Car Price Valuation Platform. Built with **React 19**, **Vite**, and **Material-UI (MUI v6)** with a clean, minimalist Blue & White SaaS aesthetic.

---

## 🌟 Features

- **Price Calculator**: Interactive vehicle specification input form with instant valuation and confidence margin indicators.
- **5-Year Depreciation Curve**: Dynamic SVG visualization forecasting annual residual value retention.
- **Compare Cars**: Side-by-side comparative valuation engine for two vehicle configurations.
- **Multi-Currency Converter**: Client-side instant conversion across LKR, USD, EUR, GBP, and JPY backed by live exchange rates.
- **Valuation History**: Slide-out drawer with persisted previous calculations and 1-click re-calculation.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + Vite
- **UI Library**: Material-UI (MUI v6) + Emotion
- **HTTP Client**: Axios
- **Charts / Visuals**: Custom Responsive SVG

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the `frontend` root:
```env
VITE_API_BASE_URL=http://localhost:5000
```

### 3. Run Development Server
```bash
npm run dev
```
The app will be available at: **http://localhost:5173**

### 4. Build for Production
```bash
npm run build
```
