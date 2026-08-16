const { spawn } = require('child_process');
const assert = require('assert');
const path = require('path');

console.log("=== STARTING TRINITY R&D CELL BACKEND TEST SUITE ===");

// Set port to 5001 to prevent conflicts with standard running instances
const testEnv = { ...process.env, PORT: '5001' };
const serverProcess = spawn('node', [path.join(__dirname, 'dist', 'index.js')], { env: testEnv });

let testResults = [];
let serverOutput = '';

serverProcess.stdout.on('data', (data) => {
  serverOutput += data.toString();
  // console.log(`[Server]: ${data.toString().trim()}`);
});

serverProcess.stderr.on('data', (data) => {
  console.error(`[Server Error]: ${data.toString().trim()}`);
});

serverProcess.on('error', (err) => {
  console.error('[Spawn Error]: Failed to start child process:', err);
});

serverProcess.on('exit', (code, signal) => {
  console.log(`[Server Exit]: Process exited with code ${code} and signal ${signal}`);
});

serverProcess.on('close', (code) => {
  console.log(`[Server Close]: Process closed with code ${code}`);
});

function logTest(name, passed, details) {
  testResults.push({ name, passed, details });
  console.log(`[TEST] ${passed ? '✔ PASS' : '❌ FAIL'}: ${name} ${details ? `(${details})` : ''}`);
}

async function runTests() {
  console.log("Waiting 4 seconds for server and Turso database setup to complete...");
  await new Promise(resolve => setTimeout(resolve, 4000));

  // Test 1: Get events
  try {
    const res = await fetch('http://localhost:5001/api/events');
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data));
    logTest("GET /api/events returns 200 OK and list array", true);
  } catch (err) {
    logTest("GET /api/events returns 200 OK and list array", false, err.message);
  }

  // Test 2: Get branches
  try {
    const res = await fetch('http://localhost:5001/api/branches');
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data));
    logTest("GET /api/branches returns 200 OK and list array", true);
  } catch (err) {
    logTest("GET /api/branches returns 200 OK and list array", false, err.message);
  }

  // Test 3: POST login with invalid credentials
  try {
    const res = await fetch('http://localhost:5001/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'nonexistent', password: 'badpassword' })
    });
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.ok(data.error);
    logTest("POST /api/admin/login with invalid credentials returns 401 Unauthorized", true);
  } catch (err) {
    logTest("POST /api/admin/login with invalid credentials returns 401 Unauthorized", false, err.message);
  }

  // Test 4: GET verify invalid certificate ID
  try {
    const res = await fetch('http://localhost:5001/api/verify-certificate/INVALID_CODE_999');
    assert.strictEqual(res.status, 404);
    const data = await res.json();
    assert.ok(data.error || !data.success);
    logTest("GET /api/verify-certificate with invalid ID returns 404 Not Found", true);
  } catch (err) {
    logTest("GET /api/verify-certificate with invalid ID returns 404 Not Found", false, err.message);
  }

  // Test 5: Verify template script exists
  try {
    const fs = require('fs');
    assert.ok(fs.existsSync(path.join(__dirname, 'update_db_templates.js')));
    logTest("Template sync utility update_db_templates.js file exists", true);
  } catch (err) {
    logTest("Template sync utility update_db_templates.js file exists", false, err.message);
  }

  // Cleanup & Shutdown
  console.log("\nTerminating test server child process...");
  serverProcess.kill();

  console.log("\n=== SERVER STDOUT LOGS ===");
  console.log(serverOutput);

  console.log("\n=== TEST SUITE RESULTS SUMMARY ===");
  const total = testResults.length;
  const passed = testResults.filter(r => r.passed).length;
  const failed = total - passed;
  console.log(`Executed: ${total} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    console.error("FAIL: Some tests did not pass.");
    process.exit(1);
  } else {
    console.log("SUCCESS: All execution tests passed successfully.");
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error("Test suite runner crashed:", err);
  serverProcess.kill();
  process.exit(1);
});
