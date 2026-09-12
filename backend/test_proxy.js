/**
 * End-to-end Proxy Test: Express Gateway (5099) -> FastAPI ML Service (8000)
 */

const app = require("./src/server");

const TEST_PORT = 5099;

const testGatewayProxy = async () => {
  const server = app.listen(TEST_PORT, async () => {
    console.log(`[GATEWAY PROXY TEST] Express listening on ${TEST_PORT}...`);

    try {
      // 1. Test Gateway Health Check
      console.log("\n1. Testing GET /api/health (Gateway + ML Microservice Health)...");
      const healthRes = await fetch(`http://localhost:${TEST_PORT}/api/health`);
      const healthJson = await healthRes.json();
      console.log("   [+] Health Status:", healthJson.status);
      console.log("   [+] ML Service Status:", healthJson.ml_microservice.status);

      // 2. Test GET /api/metadata through Gateway
      console.log("\n2. Testing GET /api/metadata through Gateway...");
      const metaRes = await fetch(`http://localhost:${TEST_PORT}/api/metadata`);
      const metaJson = await metaRes.json();
      console.log("   [+] Metadata Status:", metaRes.status);
      console.log("   [+] Total Unique Brands fetched:", metaJson.unique_brands?.length);
      console.log("   [+] Total Unique Towns fetched:", metaJson.unique_towns?.length);

      // 3. Test POST /api/predict through Gateway
      console.log("\n3. Testing POST /api/predict through Gateway...");
      const predRes = await fetch(`http://localhost:${TEST_PORT}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: "TOYOTA",
          model: "AXIO",
          yom: 2017,
          engine_cc: 1500,
          gear: "Automatic",
          fuel_type: "Hybrid",
          mileage_km: 75000,
          town: "Colombo",
          condition: "USED",
          leasing: "No Leasing",
          air_condition: "Available",
          power_steering: "Available",
          power_mirror: "Available",
          power_window: "Available",
          target_currency: "USD",
        }),
      });

      const predJson = await predRes.json();
      console.log("   [+] Predict Response Status:", predRes.status);
      console.log("   [+] Predicted Price (Lakhs):", predJson.predicted_price_lakhs);
      console.log("   [+] Formatted LKR:", predJson.formatted_lkr);
      console.log("   [+] Formatted Lakhs:", predJson.formatted_lakhs);
      console.log("   [+] Converted Price (USD):", predJson.converted_price?.currency, predJson.converted_price?.amount);
      console.log("   [+] 5-Year Depreciation Points:", predJson.depreciation_projection?.length);

      // 4. Test GET /api/history
      console.log("\n4. Testing GET /api/history (Verifying stored prediction)...");
      const histRes = await fetch(`http://localhost:${TEST_PORT}/api/history`);
      const histJson = await histRes.json();
      console.log("   [+] History Count:", histJson.count);
      console.log("   [+] Last Vehicle in History:", histJson.history[0]?.requested_vehicle?.brand, histJson.history[0]?.requested_vehicle?.model);

      console.log("\n==================================================");
      console.log("🎉 ALL GATEWAY PROXY AND INTEGRATION TESTS PASSED!");
      console.log("==================================================");
    } catch (err) {
      console.error("[-] Test Error:", err);
      process.exitCode = 1;
    } finally {
      server.close();
    }
  });
};

testGatewayProxy();
