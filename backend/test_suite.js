const { spawn } = require('child_process');
const assert = require('assert');
const path = require('path');

console.log("=== STARTING TRINITY R&D CELL BACKEND TEST SUITE ===");

// Set port to 5001 to prevent conflicts with standard running instances
const testEnv = { ...process.env, PORT: '5001', NODE_ENV: 'test' };
const serverProcess = spawn('node', [path.join(__dirname, 'dist', 'index.js')], { env: testEnv });

let testResults = [];
let serverOutput = '';

serverProcess.stdout.on('data', (data) => {
  serverOutput += data.toString();
  console.log(`[Server]: ${data.toString().trim()}`);
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
  console.log("Waiting 45 seconds for server and Turso database setup to complete...");
  await new Promise(resolve => setTimeout(resolve, 45000));

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

  // Test 3.5: POST login with valid credentials
  try {
    const res = await fetch('http://localhost:5001/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'charan', password: process.env.DEFAULT_DEV_PASSWORD || 'Bharat@8336' })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.success);
    logTest("POST /api/admin/login with valid seeded credentials returns 200 OK", true);
  } catch (err) {
    logTest("POST /api/admin/login with valid seeded credentials returns 200 OK", false, err.message);
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

  // Test 6: Verify Certificate ID Obfuscation and Suffix Enforcement
  try {
    const { createClient } = require('@libsql/client');
    require('dotenv').config();
    const dbClient = createClient({
      url: process.env.TURSO_URL,
      authToken: process.env.TURSO_TOKEN
    });

    // 1. Clean up any leftover test data first
    await dbClient.execute({
      sql: "DELETE FROM event_registrations WHERE id = 9999"
    });

    // 2. Insert a mock registration with a suffixed certificate ID
    const mockCertId = "TCEK/RD/2026-TESTOBFUSCATION";
    await dbClient.execute({
      sql: "INSERT INTO event_registrations (id, full_name, pin_number, email, mobile, branch, year_of_study, event_name, certificate_id, certificate_sent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: [9999, 'Test Candidate', '9999', 'test@example.com', '9999999999', 'CSE', 'III', 'Deep Learning Bootcamp: PyTorch Fundamentals', mockCertId, 1]
    });

    // 3. Access certificate verification with the correct suffixed ID
    const goodRes = await fetch(`http://localhost:5001/api/verify-certificate/${encodeURIComponent(mockCertId)}`);
    assert.strictEqual(goodRes.status, 200);
    const goodData = await goodRes.json();
    assert.strictEqual(goodData.success, true);
    assert.strictEqual(goodData.data.fullName, 'Test Candidate');

    // 4. Try to access the certificate by guessing the unsuffixed legacy path (e.g. TCEK/RD/2026/9999)
    const badRes = await fetch('http://localhost:5001/api/verify-certificate/TCEK/RD/2026/9999');
    assert.strictEqual(badRes.status, 404); // Should be blocked and return 404

    // 5. Cleanup the mock database record
    await dbClient.execute({
      sql: "DELETE FROM event_registrations WHERE id = 9999"
    });

    logTest("Certificate ID obfuscation and suffix enforcement works successfully", true);
  } catch (err) {
    // Attempt cleanup in case of failure
    try {
      const { createClient } = require('@libsql/client');
      const dbClient = createClient({
        url: process.env.TURSO_URL,
        authToken: process.env.TURSO_TOKEN
      });
      await dbClient.execute({
        sql: "DELETE FROM event_registrations WHERE id = 9999"
      });
    } catch (e) {}

    logTest("Certificate ID obfuscation and suffix enforcement works successfully", false, err.message);
  }

  // Test 7: Verify Stateful One-Time Password Reset Token Flow
  try {
    const crypto = require('crypto');

    // 1. Trigger the forgot password OTP generation
    const forgotRes = await fetch('http://localhost:5001/api/admin/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'SAICHARANBHUTHKURI8336@GMAIL.COM' })
    });
    assert.strictEqual(forgotRes.status, 200);

    // 2. Wait a moment and parse the OTP from the server output logs
    await new Promise(resolve => setTimeout(resolve, 1500));
    const otpMatch = serverOutput.match(/\[TEST_OTP\]:\s*([^\s\r\n]+)/);
    assert.ok(otpMatch, "Test OTP should be printed in server stdout logs");
    const testOtp = otpMatch[1];

    // 2b. Test wrong OTP is rejected
    const wrongOtpRes = await fetch('http://localhost:5001/api/admin/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'SAICHARANBHUTHKURI8336@GMAIL.COM', otp: '000000' })
    });
    assert.strictEqual(wrongOtpRes.status, 400);

    // 2c. Verify valid OTP to receive resetToken
    const verifyRes = await fetch('http://localhost:5001/api/admin/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'SAICHARANBHUTHKURI8336@GMAIL.COM', otp: testOtp })
    });
    assert.strictEqual(verifyRes.status, 200);
    const verifyData = await verifyRes.json();
    assert.ok(verifyData.resetToken, "Verification must return resetToken");
    const testResetToken = verifyData.resetToken;

    // 3. Perform password reset using resetToken. It should succeed (200 OK)
    const resetRes = await fetch('http://localhost:5001/api/admin/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetToken: testResetToken, newPassword: 'NewSecurePassword@123' })
    });
    assert.strictEqual(resetRes.status, 200);
    const resetData = await resetRes.json();
    assert.strictEqual(resetData.success, true);

    // 4. Try to perform the reset AGAIN using the same token. It should FAIL (400 Bad Request)
    const duplicateResetRes = await fetch('http://localhost:5001/api/admin/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetToken: testResetToken, newPassword: 'AnotherPassword@123' })
    });
    assert.strictEqual(duplicateResetRes.status, 400); // Stateful check blocks reuse!
    const duplicateData = await duplicateResetRes.json();
    assert.ok(duplicateData.error);

    // 5. Restore the default seeded password for subsequent runs/tests (Developer: charan)
    const { createClient } = require('@libsql/client');
    const dbClient = createClient({
      url: process.env.TURSO_URL,
      authToken: process.env.TURSO_TOKEN
    });
    const bcrypt = require('bcryptjs');
    const defaultPassword = process.env.DEFAULT_DEV_PASSWORD || 'Bharat@8336';
    const restoreSalt = crypto.randomBytes(16).toString('hex');
    const restoreHash = await bcrypt.hash(restoreSalt + defaultPassword, 10);
    await dbClient.execute({
      sql: "UPDATE admin_users SET password = ?, salt = ? WHERE username = ?",
      args: [restoreHash, restoreSalt, 'charan']
    });

    logTest("Stateful one-time password reset token flow and reuse blocking works successfully", true);
  } catch (err) {
    // Attempt to restore default password in case of test failure
    try {
      const { createClient } = require('@libsql/client');
      const dbClient = createClient({
        url: process.env.TURSO_URL,
        authToken: process.env.TURSO_TOKEN
      });
      const bcrypt = require('bcryptjs');
      const defaultPassword = process.env.DEFAULT_DEV_PASSWORD || 'Bharat@8336';
      const restoreSalt = require('crypto').randomBytes(16).toString('hex');
      const restoreHash = await bcrypt.hash(restoreSalt + defaultPassword, 10);
      await dbClient.execute({
        sql: "UPDATE admin_users SET password = ?, salt = ? WHERE username = ?",
        args: [restoreHash, restoreSalt, 'charan']
      });
    } catch (e) {}

    logTest("Stateful one-time password reset token flow and reuse blocking works successfully", false, err.message);
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
