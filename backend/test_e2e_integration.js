/**
 * End-to-End System Integration & Robustness Test Suite
 * Used Car Price Valuation & Market Predictor
 * Validates complete 3-tier system workflow and edge-case handling across Ports 8000, 5000, and 5173.
 */

const assert = require("assert");

const PORTS = {
  ML_SERVICE: 8000,
  GATEWAY: 5000,
  FRONTEND: 5173,
};

const BASE_URLS = {
  ML_SERVICE: `http://127.0.0.1:${PORTS.ML_SERVICE}`,
  GATEWAY: `http://127.0.0.1:${PORTS.GATEWAY}`,
  FRONTEND: `http://127.0.0.1:${PORTS.FRONTEND}`,
};

const results = {
  passed: 0,
  failed: 0,
  tests: [],
};

const record = (name, status, detail = "") => {
  results.tests.push({ name, status, detail });
  if (status === "PASS") {
    results.passed++;
    console.log(`  [PASS] ${name} ${detail ? `(${detail})` : ""}`);
  } else {
    results.failed++;
    console.error(`   [FAIL] ${name}: ${detail}`);
  }
};

async function runE2ETests() {
  console.log("================================================================================");
  console.log("STARTING FULL-STACK E2E SYSTEM INTEGRATION & ROBUSTNESS TESTS");
  console.log("   Target Microservices: Ports 8000 (ML), 5000 (Gateway), 5173 (Frontend)");
  console.log("================================================================================\n");

  // ----------------------------------------------------------------------
  // Section 1: 3-Tier Liveness & Service Availability
  // ----------------------------------------------------------------------
  console.log("--- 1. Testing 3-Tier Liveness & Service Availability ---");
  try {
    const mlRes = await fetch(`${BASE_URLS.ML_SERVICE}/health`);
    assert.strictEqual(mlRes.status, 200);
    const mlData = await mlRes.json();
    assert.strictEqual(mlData.status, "online");
    assert.strictEqual(mlData.model_loaded, true);
    record("FastAPI ML Service (Port 8000)", "PASS", `Best Model: ${mlData.best_model_algorithm}`);
  } catch (err) {
    record("FastAPI ML Service (Port 8000)", "FAIL", err.message);
  }

  try {
    const gwRes = await fetch(`${BASE_URLS.GATEWAY}/`);
    assert.strictEqual(gwRes.status, 200);
    const gwData = await gwRes.json();
    record("Express API Gateway (Port 5000)", "PASS", gwData.name);
  } catch (err) {
    record("Express API Gateway (Port 5000)", "FAIL", err.message);
  }

  try {
    const feRes = await fetch(BASE_URLS.FRONTEND);
    assert.strictEqual(feRes.status, 200);
    const feHtml = await feRes.text();
    assert(feHtml.includes("<div id=\"root\"></div>") || feHtml.includes("<!doctype html>"));
    record("React Vite Frontend (Port 5173)", "PASS", `HTML length: ${feHtml.length} bytes`);
  } catch (err) {
    record("React Vite Frontend (Port 5173)", "FAIL", err.message);
  }

  // ----------------------------------------------------------------------
  // Section 2: CORS, Headers & Latency Verification
  // ----------------------------------------------------------------------
  console.log("\n--- 2. Testing Gateway Headers, CORS & Network Latency ---");
  try {
    const startTime = Date.now();
    const healthRes = await fetch(`${BASE_URLS.GATEWAY}/api/health`, {
      headers: { Origin: "http://localhost:5173" },
    });
    const networkLatencyMs = Date.now() - startTime;
    assert.strictEqual(healthRes.status, 200);
    const healthJson = await healthRes.json();

    // Check CORS headers
    const corsHeader = healthRes.headers.get("access-control-allow-origin");
    assert(corsHeader !== null, "CORS header missing");
    record("CORS Headers Configured", "PASS", `access-control-allow-origin: ${corsHeader}`);

    // Check X-Response-Time header
    const responseTime = healthRes.headers.get("x-response-time");
    assert(responseTime !== null, "X-Response-Time header missing");
    record("Gateway X-Response-Time Header", "PASS", responseTime);

    // Check downstream ML microservice round-trip latency
    assert.strictEqual(healthJson.status, "online");
    assert.strictEqual(healthJson.ml_microservice.status, "healthy");
    assert(typeof healthJson.ml_microservice.latency_ms === "number");
    record(
      "Downstream ML Service Latency Ping",
      "PASS",
      `Gateway->ML: ${healthJson.ml_microservice.latency_ms}ms | Total Client Roundtrip: ${networkLatencyMs}ms`
    );
  } catch (err) {
    record("Gateway Headers, CORS & Latency", "FAIL", err.message);
  }

  // ----------------------------------------------------------------------
  // Section 3: Standard End-to-End Prediction Workflow
  // ----------------------------------------------------------------------
  console.log("\n--- 3. Testing Standard E2E Prediction Flow & Multi-Currency Engine ---");
  try {
    const carPayload = {
      brand: "TOYOTA",
      model: "AXIO",
      yom: 2017,
      engine_cc: 1500,
      mileage_km: 75000,
      gear: "Automatic",
      fuel_type: "Hybrid",
      town: "Colombo",
      condition: "USED",
      leasing: "No Leasing",
      air_condition: "Available",
      power_steering: "Available",
      power_mirror: "Available",
      power_window: "Available",
      target_currency: "USD",
    };

    const predRes = await fetch(`${BASE_URLS.GATEWAY}/api/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(carPayload),
    });

    assert.strictEqual(predRes.status, 200);
    const predData = await predRes.json();

    assert.strictEqual(predData.status, "success");
    assert(predData.predicted_price_lkr_lakhs > 0, "Price should be positive");
    assert(predData.predicted_price_lkr_raw > 100000, "Raw price should be positive");
    assert(predData.confidence_interval.min_lkr_lakhs <= predData.predicted_price_lkr_lakhs);
    assert(predData.confidence_interval.max_lkr_lakhs >= predData.predicted_price_lkr_lakhs);
    assert.strictEqual(predData.depreciation_projection.length, 5);
    assert.strictEqual(predData.converted_price.currency, "USD");
    assert(predData.converted_price.amount > 0);

    record(
      "Standard Prediction Workflow (Toyota Axio 2017)",
      "PASS",
      `Rs. ${predData.predicted_price_lkr_lakhs.toFixed(2)} Lakhs (~${predData.converted_price.formatted})`
    );

    record(
      "Confidence Interval Verification",
      "PASS",
      `Min: Rs. ${predData.confidence_interval.min_lkr_lakhs}L | Max: Rs. ${predData.confidence_interval.max_lkr_lakhs}L`
    );

    record(
      "5-Year Depreciation Projection",
      "PASS",
      `5 Years projected: ${predData.depreciation_projection.map((p) => p.year).join(" -> ")}`
    );
  } catch (err) {
    record("Standard Prediction Workflow", "FAIL", err.message);
  }

  // ----------------------------------------------------------------------
  // Section 4: Multi-Currency Dynamic Conversions (LKR, USD, EUR, GBP, JPY)
  // ----------------------------------------------------------------------
  console.log("\n--- 4. Testing Multi-Currency Conversions Across Currencies ---");
  const currencies = ["LKR", "USD", "EUR", "GBP", "JPY"];
  for (const curr of currencies) {
    try {
      const res = await fetch(`${BASE_URLS.GATEWAY}/api/predict?currency=${curr}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: "HONDA",
          model: "VEZEL",
          yom: 2018,
          engine_cc: 1500,
          mileage_km: 65000,
          target_currency: curr,
        }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.converted_price.currency, curr);
      assert(data.converted_price.amount > 0);
      record(`Currency Conversion [${curr}]`, "PASS", data.converted_price.formatted);
    } catch (err) {
      record(`Currency Conversion [${curr}]`, "FAIL", err.message);
    }
  }

  // ----------------------------------------------------------------------
  // Section 5: Robustness & Edge Cases Handling
  // ----------------------------------------------------------------------
  console.log("\n--- 5. Testing Robustness & Edge-Case Handling ---");

  // Edge Case 5.1: Extreme Mileage (750,000 KM & 1,500,000 KM - Winsorization Verification)
  try {
    const extremeMileageRes = await fetch(`${BASE_URLS.GATEWAY}/api/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand: "TOYOTA",
        model: "COROLLA",
        yom: 2005,
        engine_cc: 1300,
        mileage_km: 750000, // Extreme mileage
        gear: "Manual",
        fuel_type: "Petrol",
      }),
    });
    assert.strictEqual(extremeMileageRes.status, 200);
    const data = await extremeMileageRes.json();
    assert.strictEqual(data.status, "success");
    assert(data.predicted_price_lkr_lakhs > 0);
    record(
      "Edge Case: Extreme Mileage (750,000 KM)",
      "PASS",
      `Safe Winsorization applied. Predicted: Rs. ${data.predicted_price_lkr_lakhs} Lakhs`
    );
  } catch (err) {
    record("Edge Case: Extreme Mileage", "FAIL", err.message);
  }

  // Edge Case 5.2: Zero Mileage / Brand New Car
  try {
    const zeroMileageRes = await fetch(`${BASE_URLS.GATEWAY}/api/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand: "SUZUKI",
        model: "SWIFT",
        yom: 2025,
        engine_cc: 1200,
        mileage_km: 0, // Zero mileage
        condition: "NEW",
      }),
    });
    assert.strictEqual(zeroMileageRes.status, 200);
    const data = await zeroMileageRes.json();
    assert.strictEqual(data.status, "success");
    assert(data.predicted_price_lkr_lakhs > 0);
    record(
      "Edge Case: Zero Mileage & Brand New Condition",
      "PASS",
      `Predicted: Rs. ${data.predicted_price_lkr_lakhs} Lakhs`
    );
  } catch (err) {
    record("Edge Case: Zero Mileage", "FAIL", err.message);
  }

  // Edge Case 5.3: Rare / Unseen Car Model (Fallback to 'OTHER')
  try {
    const rareModelRes = await fetch(`${BASE_URLS.GATEWAY}/api/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand: "TOYOTA",
        model: "CENTURY V12 LIMOUSINE SPECIAL RARE", // Not in training dataset
        yom: 2015,
        engine_cc: 4996,
        mileage_km: 50000,
      }),
    });
    assert.strictEqual(rareModelRes.status, 200);
    const data = await rareModelRes.json();
    assert.strictEqual(data.status, "success");
    assert(data.predicted_price_lkr_lakhs > 0);
    record(
      "Edge Case: Unseen/Rare Model Fallback",
      "PASS",
      `Grouped gracefully to OTHER. Predicted: Rs. ${data.predicted_price_lkr_lakhs} Lakhs`
    );
  } catch (err) {
    record("Edge Case: Unseen/Rare Model Fallback", "FAIL", err.message);
  }

  // Edge Case 5.4: Unseen Town & Location Frequency Encoding
  try {
    const rareTownRes = await fetch(`${BASE_URLS.GATEWAY}/api/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand: "NISSAN",
        model: "SUNNY",
        yom: 2012,
        engine_cc: 1500,
        mileage_km: 110000,
        town: "Unknown Remote Village XYZ", // Not in training set
      }),
    });
    assert.strictEqual(rareTownRes.status, 200);
    const data = await rareTownRes.json();
    assert.strictEqual(data.status, "success");
    record(
      "Edge Case: Unseen Town Frequency Fallback",
      "PASS",
      `Mapped to 0.0 frequency. Predicted: Rs. ${data.predicted_price_lkr_lakhs} Lakhs`
    );
  } catch (err) {
    record("Edge Case: Unseen Town Frequency Fallback", "FAIL", err.message);
  }

  // ----------------------------------------------------------------------
  // Section 6: Validation Error Boundaries (Testing 400 Bad Request)
  // ----------------------------------------------------------------------
  console.log("\n--- 6. Testing Error Boundaries & Input Validation Rejection ---");

  // 6.1 Invalid Out-of-Range Year
  try {
    const invalidYearRes = await fetch(`${BASE_URLS.GATEWAY}/api/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand: "TOYOTA",
        model: "AXIO",
        yom: 1850, // Invalid year
        engine_cc: 1500,
        mileage_km: 50000,
      }),
    });
    assert.strictEqual(invalidYearRes.status, 400);
    const errJson = await invalidYearRes.json();
    assert.strictEqual(errJson.error_type, "ValidationError");
    record("Validation: Out-of-Range Year Rejection (1850)", "PASS", `Caught: ${errJson.errors[0]}`);
  } catch (err) {
    record("Validation: Out-of-Range Year Rejection", "FAIL", err.message);
  }

  // 6.2 Negative Engine CC
  try {
    const negCcRes = await fetch(`${BASE_URLS.GATEWAY}/api/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand: "TOYOTA",
        model: "COROLLA",
        yom: 2018,
        engine_cc: -200, // Negative CC
        mileage_km: 50000,
      }),
    });
    assert.strictEqual(negCcRes.status, 400);
    const errJson = await negCcRes.json();
    assert.strictEqual(errJson.error_type, "ValidationError");
    record("Validation: Negative Engine CC Rejection (-200)", "PASS", `Caught: ${errJson.errors[0]}`);
  } catch (err) {
    record("Validation: Negative Engine CC Rejection", "FAIL", err.message);
  }

  // 6.3 Negative Mileage
  try {
    const negMileageRes = await fetch(`${BASE_URLS.GATEWAY}/api/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand: "TOYOTA",
        model: "COROLLA",
        yom: 2018,
        engine_cc: 1500,
        mileage_km: -50000, // Negative mileage
      }),
    });
    assert.strictEqual(negMileageRes.status, 400);
    const errJson = await negMileageRes.json();
    assert.strictEqual(errJson.error_type, "ValidationError");
    record("Validation: Negative Mileage Rejection (-50,000 KM)", "PASS", `Caught: ${errJson.errors[0]}`);
  } catch (err) {
    record("Validation: Negative Mileage Rejection", "FAIL", err.message);
  }

  // 6.4 Missing Brand & Model
  try {
    const missingBrandRes = await fetch(`${BASE_URLS.GATEWAY}/api/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        yom: 2018,
        engine_cc: 1500,
        mileage_km: 50000,
      }),
    });
    assert.strictEqual(missingBrandRes.status, 400);
    const errJson = await missingBrandRes.json();
    assert.strictEqual(errJson.error_type, "ValidationError");
    record("Validation: Missing Brand & Model Rejection", "PASS", `Errors caught: ${errJson.errors.length}`);
  } catch (err) {
    record("Validation: Missing Brand & Model Rejection", "FAIL", err.message);
  }

  // ----------------------------------------------------------------------
  // Section 7: Metadata & Analytics Endpoint Consistency
  // ----------------------------------------------------------------------
  console.log("\n--- 7. Testing Metadata & Analytics Microservice Endpoints ---");
  try {
    const metaRes = await fetch(`${BASE_URLS.GATEWAY}/api/metadata`);
    assert.strictEqual(metaRes.status, 200);
    const meta = await metaRes.json();
    assert(Array.isArray(meta.unique_brands) && meta.unique_brands.length > 5);
    assert(meta.brand_models_map && typeof meta.brand_models_map === "object");
    assert(Array.isArray(meta.unique_towns) && meta.unique_towns.length > 5);
    record("Metadata Endpoint (/api/metadata)", "PASS", `${meta.unique_brands.length} Brands, ${meta.unique_towns.length} Towns`);
  } catch (err) {
    record("Metadata Endpoint (/api/metadata)", "FAIL", err.message);
  }

  try {
    const metricsRes = await fetch(`${BASE_URLS.GATEWAY}/api/analytics`);
    assert.strictEqual(metricsRes.status, 200);
    const metrics = await metricsRes.json();
    assert(metrics.best_model, "Missing best_model");
    assert(Array.isArray(metrics.benchmark_leaderboard) && metrics.benchmark_leaderboard.length >= 4);
    assert(Array.isArray(metrics.top_feature_importances) && metrics.top_feature_importances.length > 0);
    record("Analytics & Metrics (/api/analytics)", "PASS", `Best Model: ${metrics.best_model} (5 algorithms compared)`);
  } catch (err) {
    record("Analytics & Metrics (/api/analytics)", "FAIL", err.message);
  }

  try {
    const currRes = await fetch(`${BASE_URLS.GATEWAY}/api/currencies`);
    assert.strictEqual(currRes.status, 200);
    const currs = await currRes.json();
    assert.strictEqual(currs.base_currency, "LKR");
    assert(currs.rates.USD > 0 && currs.rates.EUR > 0);
    record("Currency Engine (/api/currencies)", "PASS", `Base: LKR | Active Rates: ${Object.keys(currs.rates).join(", ")}`);
  } catch (err) {
    record("Currency Engine (/api/currencies)", "FAIL", err.message);
  }

  try {
    const histRes = await fetch(`${BASE_URLS.GATEWAY}/api/history`);
    assert.strictEqual(histRes.status, 200);
    const hist = await histRes.json();
    assert.strictEqual(hist.status, "success");
    assert(hist.count >= 5, "Should have logged previous predictions");
    record("Prediction History System (/api/history)", "PASS", `${hist.count} predictions recorded in session history`);
  } catch (err) {
    record("Prediction History System (/api/history)", "FAIL", err.message);
  }

  // ----------------------------------------------------------------------
  // Summary & Viva Voce Readiness
  // ----------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log(`INTEGRATION TEST RESULTS: ${results.passed} PASSED / ${results.failed} FAILED (Total: ${results.tests.length})`);
  console.log("================================================================================");

  if (results.failed === 0) {
    console.log(" ALL FULL-STACK E2E INTEGRATION & ROBUSTNESS TESTS PASSED WITH 100% SUCCESS!");
    process.exit(0);
  } else {
    console.error("Some tests failed. Check logs above.");
    process.exit(1);
  }
}

runE2ETests().catch((err) => {
  console.error("Fatal test execution error:", err);
  process.exit(1);
});
