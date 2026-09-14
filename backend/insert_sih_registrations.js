const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '.env') });

const tursoUrl = process.env.TURSO_URL;
const tursoToken = process.env.TURSO_TOKEN;

if (!tursoUrl || !tursoToken) {
  console.error("Error: TURSO_URL and TURSO_TOKEN must be configured in backend/.env");
  process.exit(1);
}

const db = createClient({
  url: tursoUrl,
  authToken: tursoToken,
});

async function main() {
  console.log("Connecting to Turso database...");
  
  // Verify database connection
  await db.execute("SELECT 1;");
  console.log("Connected successfully to Turso.");

  const jsonPath = path.join(__dirname, 'sih_final_data.json');
  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const records = JSON.parse(rawData);

  console.log(`Loaded ${records.length} records from sih_final_data.json.`);

  // Fetch existing registrations for SIH 2026 Internal Hackathon
  const existingRes = await db.execute({
    sql: "SELECT id, team_name, leader_email, leader_name FROM hackathon_registrations WHERE hackathon_name = ?",
    args: ["SIH 2026 Internal Hackathon"]
  });

  const existingRows = existingRes.rows;
  console.log(`Found ${existingRows.length} existing record(s) for 'SIH 2026 Internal Hackathon' in db.`);

  let insertedCount = 0;
  let skippedCount = 0;

  for (const record of records) {
    // Check for duplicate by team_name and leader_email
    const isDuplicate = existingRows.some(row => 
      row.team_name.trim().toLowerCase() === record.team_name.trim().toLowerCase() &&
      row.leader_name.trim().toLowerCase() === record.leader_name.trim().toLowerCase()
    );

    if (isDuplicate) {
      console.log(`Skipping duplicate: "${record.team_name}" (Leader: ${record.leader_name})`);
      skippedCount++;
      continue;
    }

    const membersJson = typeof record.members === 'string' 
      ? record.members 
      : JSON.stringify(record.members);

    await db.execute({
      sql: `INSERT INTO hackathon_registrations (
              hackathon_name, team_name, project_title, project_description, problem_statement,
              leader_name, leader_email, leader_phone, leader_role,
              leader_year, leader_branch, leader_institution,
              leader_company, leader_job_title, members, status,
              certificate_sent, certificate_type
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        record.hackathon_name,
        record.team_name,
        record.project_title || '',
        record.project_description || '',
        record.problem_statement || '',
        record.leader_name,
        record.leader_email,
        record.leader_phone,
        record.leader_role || 'Student',
        record.leader_year || null,
        record.leader_branch || null,
        record.leader_institution || 'Trinity College of Engineering and Technology',
        record.leader_company || null,
        record.leader_job_title || null,
        membersJson,
        record.status || 'pending',
        record.certificate_sent || 0,
        record.certificate_type || 'Participation'
      ]
    });

    insertedCount++;
  }

  console.log(`\n--- Ingestion Summary ---`);
  console.log(`Total processed: ${records.length}`);
  console.log(`Successfully inserted: ${insertedCount}`);
  console.log(`Skipped (already exists): ${skippedCount}`);

  // Final verification
  const countRes = await db.execute({
    sql: "SELECT count(*) as total FROM hackathon_registrations WHERE hackathon_name = ?",
    args: ["SIH 2026 Internal Hackathon"]
  });
  console.log(`Total records now in DB for 'SIH 2026 Internal Hackathon': ${countRes.rows[0].total}`);
}

main().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
