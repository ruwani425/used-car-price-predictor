/**
 * Integration tests for the Express API gateway.
 * Tests health check, payload validation, and history endpoints.
 */

const http = require("http");
const app = require("./src/server");

const TEST_PORT = 5099;

const runTests = async () => {
  const server = app.listen(TEST_PORT, async () => {
    console.log(`[TEST SERVER] Running on port ${TEST_PORT}...`);

    try {
      // Test 1: Root Greeting endpoint
      console.log("\n1. Testing GET /...");
      const rootRes = await fetch(`http://localhost:${TEST_PORT}/`);
      const rootJson = await rootRes.json();
      console.log("   [+] Status:", rootRes.status);
      console.log("   [+] Response name:", rootJson.name);
      if (rootRes.status !== 200) throw new Error("Root endpoint failed");

      // Test 2: Validation rejection test (Missing required fields)
      console.log("\n2. Testing POST /api/predict (Invalid input validation test)...");
      const badRes = await fetch(`http://localhost:${TEST_PORT}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: "",
          yom: 1800, // Invalid year
          engine_cc: -50, // Invalid engine
        }),
      });
      const badJson = await badRes.json();
      console.log("   [+] Status:", badRes.status);
      console.log("   [+] Error Type:", badJson.error_type);
      console.log("   [+] Validation Errors Caught:", badJson.errors);
      if (badRes.status !== 400 || badJson.error_type !== "ValidationError") {
        throw new Error("Validation middleware did not catch invalid payload!");
      }

      // Test 3: History endpoint test
      console.log("\n3. Testing GET /api/history...");
      const histRes = await fetch(`http://localhost:${TEST_PORT}/api/history`);
      const histJson = await histRes.json();
      console.log("   [+] Status:", histRes.status);
      console.log("   [+] History status:", histJson.status);
      if (histRes.status !== 200) throw new Error("History endpoint failed");

      console.log("\n==================================================");
      console.log("ALL STEP 4 BACKEND GATEWAY TESTS PASSED SUCCESSFULLY!");
      console.log("==================================================");
    } catch (err) {
      console.error("[-] Test Error:", err);
      process.exitCode = 1;
    } finally {
      server.close();
    }
  });
};

runTests();
