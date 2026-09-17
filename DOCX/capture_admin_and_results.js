const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve(__dirname, 'media', 'proof_screenshots');

async function getAdminAuth() {
  const res = await fetch('https://rd-backend-kbsm.onrender.com/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'charan', password: 'Bharat@8336' })
  });
  const data = await res.json();
  if (!data.token) throw new Error('Failed to login: ' + JSON.stringify(data));
  return data;
}

async function sendCDP(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1000000);
    const handler = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.id === id) {
          ws.removeEventListener('message', handler);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      } catch (e) {}
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

(async () => {
  console.log('Fetching admin auth credentials...');
  const auth = await getAdminAuth();
  console.log('Authenticated as developer:', auth.user.username);

  const tempDir = `C:\\temp\\cdp_${Date.now()}`;
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    `--user-data-dir=${tempDir}`,
    '--remote-debugging-port=9222',
    '--window-size=1440,900',
    'about:blank'
  ]);

  await sleep(2500);

  console.log('Connecting to Chrome CDP...');
  const vRes = await fetch('http://127.0.0.1:9222/json/version');
  const vData = await vRes.json();
  const wsUrl = vData.webSocketDebuggerUrl;
  console.log('CDP WS URL:', wsUrl);

  const ws = new WebSocket(wsUrl);
  await new Promise((resolve) => ws.addEventListener('open', resolve));
  console.log('Connected to WebSocket!');

  // Create target/page
  const target = await sendCDP(ws, 'Target.createTarget', { url: 'https://tcek-rd.web.app' });
  const pageTargetId = target.targetId;
  const attachRes = await sendCDP(ws, 'Target.attachToTarget', { targetId: pageTargetId, flatten: true });
  const sessionId = attachRes.sessionId;

  async function sendPage(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = Math.floor(Math.random() * 1000000);
      const handler = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.id === id) {
            ws.removeEventListener('message', handler);
            if (msg.error) reject(msg.error);
            else resolve(msg.result);
          }
        } catch (e) {}
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, sessionId, method, params }));
    });
  }

  await sendPage('Page.enable');
  await sendPage('Runtime.enable');
  await sendPage('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  // Navigate to root to set domain localStorage
  await sendPage('Page.navigate', { url: 'https://tcek-rd.web.app' });
  await sleep(3000);

  // Inject localStorage
  const initScript = `
    localStorage.setItem('admin_token', ${JSON.stringify(auth.token)});
    localStorage.setItem('csrf_token', ${JSON.stringify(auth.csrfToken)});
    localStorage.setItem('admin_user', ${JSON.stringify(JSON.stringify(auth.user))});
  `;
  await sendPage('Runtime.evaluate', { expression: initScript });
  console.log('Auth injected into localStorage!');

  const tasks = [
    { name: 'mvp_admin_dashboard', url: 'https://tcek-rd.web.app/admin/dashboard', wait: 6000 },
    { name: 'mvp_admin_hackathons', url: 'https://tcek-rd.web.app/admin/hackathons', wait: 8000 },
    { name: 'mvp_admin_messaging', url: 'https://tcek-rd.web.app/admin/messaging', wait: 4000 },
    { name: 'mvp_admin_rooms', url: 'https://tcek-rd.web.app/admin/rooms', wait: 3000 },
    { name: 'result_verified_cert', url: 'https://tcek-rd.web.app/verify?id=TCEK/RD/HACK/2026-9D76E761', wait: 8000 }
  ];

  for (const t of tasks) {
    console.log(`Navigating to ${t.url}...`);
    await sendPage('Page.navigate', { url: t.url });
    await sleep(t.wait);
    const ss = await sendPage('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(ss.data, 'base64');
    const dest = path.join(outDir, `${t.name}.png`);
    fs.writeFileSync(dest, buffer);
    console.log(`[SUCCESS] Saved ${t.name}.png (${buffer.length} bytes)`);
  }

  ws.close();
  chromeProc.kill();
  console.log('All admin and result screenshots captured successfully!');
  process.exit(0);
})().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
