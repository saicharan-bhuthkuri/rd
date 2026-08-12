const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
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

async function clearDatabase() {
  console.log("Connecting to Turso database...");
  try {
    // 1. Clear event registrations & reset auto-increment
    console.log("Clearing event_registrations table...");
    await db.execute("DELETE FROM event_registrations;");
    await db.execute("DELETE FROM sqlite_sequence WHERE name = 'event_registrations';");
    
    // 2. Clear club applications & reset auto-increment
    console.log("Clearing club_applications table...");
    await db.execute("DELETE FROM club_applications;");
    await db.execute("DELETE FROM sqlite_sequence WHERE name = 'club_applications';");

    // 3. Clear activity logs if any, to keep it completely fresh
    console.log("Clearing activity_logs table...");
    await db.execute("DELETE FROM activity_logs;");
    await db.execute("DELETE FROM sqlite_sequence WHERE name = 'activity_logs';");

    console.log("Database reset complete! All test registrations, certificate IDs, and offer letter IDs have been cleared.");
    process.exit(0);
  } catch (error) {
    console.error("Failed to clear database:", error);
    process.exit(1);
  }
}

clearDatabase();
