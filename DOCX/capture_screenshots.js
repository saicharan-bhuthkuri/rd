const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve(__dirname, 'media', 'proof_screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const targets = [
  { name: 'mvp_apply', url: 'https://tcek-rd.web.app/apply' },
  { name: 'mvp_hackathon', url: 'https://tcek-rd.web.app/apply/HackathonRegistration' },
  { name: 'mvp_project_submission', url: 'https://tcek-rd.web.app/apply/ProjectSubmission' },
  { name: 'mvp_reg_desk', url: 'https://tcek-rd.web.app/reg-desk/login' },
  { name: 'mvp_admin_login', url: 'https://tcek-rd.web.app/admin/login' },
  { name: 'mvp_research', url: 'https://tcek-rd.web.app/research' },
  { name: 'mvp_events', url: 'https://tcek-rd.web.app/events' }
];

for (const t of targets) {
  const outFile = path.join(outDir, `${t.name}.png`);
  const tempUserDir = `C:\\temp\\c_${t.name}`;
  console.log(`Capturing ${t.name} from ${t.url}...`);
  const res = spawnSync(chromePath, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    `--user-data-dir=${tempUserDir}`,
    '--window-size=1440,900',
    `--screenshot=${outFile}`,
    t.url
  ], { encoding: 'utf-8', timeout: 30000 });
  
  if (fs.existsSync(outFile)) {
    const stat = fs.statSync(outFile);
    console.log(`[SUCCESS] ${t.name}.png captured (${stat.size} bytes)`);
  } else {
    console.error(`[FAIL] ${t.name}.png failed`, res.stderr);
  }
}
