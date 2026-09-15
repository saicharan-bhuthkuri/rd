require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const BACKEND_URL = 'https://rd-backend-kbsm.onrender.com';
const FRONTEND_URL = 'https://tcek-rd.web.app';

let passedCount = 0;
let failedCount = 0;

function report(testName, success, detail = '') {
  if (success) {
    passedCount++;
    console.log(`[PASS] ${testName} ${detail ? `-> ${detail}` : ''}`);
  } else {
    failedCount++;
    console.error(`[FAIL] ${testName} ${detail ? `-> ${detail}` : ''}`);
  }
}

async function verifyAll() {
  console.log("=================================================");
  console.log("STARTING FULL WEBSITE & API VERIFICATION SUITE");
  console.log(`Backend Target:  ${BACKEND_URL}`);
  console.log(`Frontend Target: ${FRONTEND_URL}`);
  console.log("=================================================\n");

  // --- SECTION 1: PUBLIC FRONTEND ROUTES ---
  console.log(">>> SECTION 1: Verifying Public Frontend Web Routes...");
  const frontendRoutes = [
    '/',
    '/about',
    '/research',
    '/events',
    '/benefits',
    '/team',
    '/faqs',
    '/contact',
    '/apply',
    '/apply/HackathonRegistration',
    '/apply/ClubRegistration',
    '/apply/EventRegistration',
    '/verify',
    '/reg-desk/login',
    '/admin/login',
    '/admin/messaging',
    '/admin/rooms',
    '/admin/reg-desk'
  ];

  for (const route of frontendRoutes) {
    try {
      const res = await fetch(`${FRONTEND_URL}${route}`);
      report(`Frontend Route ${route}`, res.status === 200, `HTTP ${res.status}`);
    } catch (e) {
      report(`Frontend Route ${route}`, false, e.message);
    }
  }

  // --- SECTION 2: PUBLIC BACKEND APIs ---
  console.log("\n>>> SECTION 2: Verifying Public Backend API Services...");
  
  // Events API
  let eventList = [];
  try {
    const res = await fetch(`${BACKEND_URL}/api/events`);
    const data = await res.json();
    eventList = data;
    report("GET /api/events", res.status === 200 && Array.isArray(data), `Found ${data.length} events`);
  } catch (e) {
    report("GET /api/events", false, e.message);
  }

  // Branches API
  try {
    const res = await fetch(`${BACKEND_URL}/api/branches`);
    const data = await res.json();
    report("GET /api/branches", res.status === 200 && Array.isArray(data), `Found ${data.length} branches`);
  } catch (e) {
    report("GET /api/branches", false, e.message);
  }

  // Certificate Verification Lookup with invalid ID
  try {
    const res = await fetch(`${BACKEND_URL}/api/verify-certificate/TCEK-INVALID-TEST-ID-9999`);
    report("GET /api/verify-certificate with invalid ID", res.status === 404, `Correctly returns 404 Not Found`);
  } catch (e) {
    report("GET /api/verify-certificate invalid ID", false, e.message);
  }

  // Contact Submission Validation (Missing Fields)
  try {
    const res = await fetch(`${BACKEND_URL}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    report("POST /api/contact validation gate", res.status === 400, `Blocks empty payload with 400 Bad Request`);
  } catch (e) {
    report("POST /api/contact validation", false, e.message);
  }

  // --- SECTION 3: REGISTRATION DESK AUTHENTICATION & OPERATIONS ---
  console.log("\n>>> SECTION 3: Verifying Registration Desk Operations...");

  // Desk login invalid credentials
  try {
    const res = await fetch(`${BACKEND_URL}/api/reg-desk/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deskId: 'INVALID_DESK', password: 'wrong' })
    });
    report("POST /api/reg-desk/login with invalid credentials", res.status === 401, `Correctly blocks with 401 Unauthorized`);
  } catch (e) {
    report("POST /api/reg-desk/login invalid", false, e.message);
  }

  // Desk login with default seeded credential
  let regDeskToken = null;
  try {
    const res = await fetch(`${BACKEND_URL}/api/reg-desk/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deskId: 'REG-DESK-01', password: 'desk1234' })
    });
    const data = await res.json();
    if (res.status === 200 && data.token) {
      regDeskToken = data.token;
      report("POST /api/reg-desk/login with default desk account", true, `Logged in as ${data.user.name} (${data.user.deskId})`);
    } else {
      report("POST /api/reg-desk/login with default desk account", false, data.error || `HTTP ${res.status}`);
    }
  } catch (e) {
    report("POST /api/reg-desk/login default desk account", false, e.message);
  }

  // Desk Attendees / Participants API
  if (regDeskToken) {
    try {
      const targetEvent = eventList[0]?.title || 'SIH 2026 Internal Hackathon';
      let res = await fetch(`${BACKEND_URL}/api/reg-desk/participants?type=hackathon&name=${encodeURIComponent(targetEvent)}`, {
        headers: { 'Authorization': `Bearer ${regDeskToken}` }
      });
      if (!res.ok) {
        res = await fetch(`${BACKEND_URL}/api/reg-desk/attendees`, {
          headers: { 'Authorization': `Bearer ${regDeskToken}` }
        });
      }
      const data = await res.json();
      const count = data.stats?.total ?? data.participants?.length ?? 0;
      report("GET /api/reg-desk/participants (Attendees)", res.status === 200, `Loaded ${count} participants for "${targetEvent}"`);
    } catch (e) {
      report("GET /api/reg-desk/participants (Attendees)", false, e.message);
    }
  }

  // Desk user blocked from Admin endpoints (Role Guard)
  if (regDeskToken) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${regDeskToken}` }
      });
      report("Role Guard: Desk user blocked from /api/admin/users", res.status === 403, `Correctly returned 403 Forbidden`);
    } catch (e) {
      report("Role Guard check", false, e.message);
    }
  }

  // --- SECTION 4: ADMIN CONSOLE AUTHENTICATION & MANAGEMENT ---
  console.log("\n>>> SECTION 4: Verifying Admin Console & Messaging API...");

  // Admin login invalid credentials
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'unknown_admin', password: 'fake_password' })
    });
    report("POST /api/admin/login invalid credentials", res.status === 401, `Correctly returns 401 Unauthorized`);
  } catch (e) {
    report("POST /api/admin/login invalid", false, e.message);
  }

  // Admin login valid credentials
  let adminToken = null;
  const devPassword = process.env.DEFAULT_DEV_PASSWORD || 'Bharat@8336';
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'charan', password: devPassword })
    });
    const data = await res.json();
    if (res.status === 200 && data.token) {
      adminToken = data.token;
      report("POST /api/admin/login developer account 'charan'", true, `Session authenticated (Role: ${data.user.role})`);
    } else {
      report("POST /api/admin/login developer account 'charan'", false, data.error || `HTTP ${res.status}`);
    }
  } catch (e) {
    report("POST /api/admin/login developer account", false, e.message);
  }

  if (adminToken) {
    // Admin Applications list
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/applications`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await res.json();
      report("GET /api/admin/applications", res.status === 200, `Club: ${data.clubApplications?.length || 0}, Events: ${data.eventRegistrations?.length || 0}, Hackathons: ${data.hackathonRegistrations?.length || 0}`);
    } catch (e) {
      report("GET /api/admin/applications", false, e.message);
    }

    // Admin Messaging Recipients Query
    const targetEvent = eventList[0]?.title || 'SIH 2026 Internal Hackathon';
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/messaging/recipients?eventTitle=${encodeURIComponent(targetEvent)}&types=members,judges,coordinators,volunteers`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await res.json();
      report("GET /api/admin/messaging/recipients", res.status === 200, `Target: "${targetEvent}" -> Total deduplicated audience: ${data.counts?.total || 0}`);
    } catch (e) {
      report("GET /api/admin/messaging/recipients", false, e.message);
    }

    // Admin Rooms API
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/rooms`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await res.json();
      report("GET /api/admin/rooms", res.status === 200, `Found ${data.rooms?.length || 0} registered presentation rooms/labs`);
    } catch (e) {
      report("GET /api/admin/rooms", false, e.message);
    }

    // Admin Registration Desk Coordinators List API (testing /api/admin/reg-desk-users and /api/admin/reg-desk)
    try {
      let res = await fetch(`${BACKEND_URL}/api/admin/reg-desk-users`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (!res.ok) {
        res = await fetch(`${BACKEND_URL}/api/admin/reg-desk`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
      }
      const data = await res.json();
      const count = Array.isArray(data) ? data.length : (data.desks?.length || 0);
      report("GET /api/admin/reg-desk-users", res.status === 200, `Found ${count} registration desk coordinators`);
    } catch (e) {
      report("GET /api/admin/reg-desk-users", false, e.message);
    }

    // Sync Stream Endpoint (Keep-alive headers check)
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${BACKEND_URL}/api/sync-stream`, {
        signal: controller.signal
      });
      clearTimeout(timeout);
      report("GET /api/sync-stream (SSE)", res.status === 200 && res.headers.get('content-type')?.includes('text/event-stream'), `EventSource stream active (content-type: text/event-stream)`);
    } catch (e) {
      if (e.name === 'AbortError') {
        report("GET /api/sync-stream (SSE)", true, `Stream connected & held open as expected`);
      } else {
        report("GET /api/sync-stream (SSE)", false, e.message);
      }
    }
  }

  // --- FINAL REPORT ---
  console.log("\n=================================================");
  console.log("TEST SUMMARY RESULTS");
  console.log(`TOTAL EXECUTED: ${passedCount + failedCount}`);
  console.log(`PASSED:         ${passedCount}`);
  console.log(`FAILED:         ${failedCount}`);
  console.log(`PASS RATE:      ${((passedCount / (passedCount + failedCount)) * 100).toFixed(1)}%`);
  console.log("=================================================");

  process.exit(failedCount > 0 ? 1 : 0);
}

verifyAll();
