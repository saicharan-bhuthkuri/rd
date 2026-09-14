const fs = require('fs');
const path = require('path');
const { createClient } = require('@libsql/client');
require('dotenv').config();

const tursoUrl = process.env.TURSO_URL;
const tursoToken = process.env.TURSO_TOKEN;

if (!tursoUrl || !tursoToken) {
  console.error("CRITICAL: TURSO_URL and TURSO_TOKEN must be configured in .env file.");
  process.exit(1);
}

const db = createClient({
  url: tursoUrl,
  authToken: tursoToken,
});

async function run() {
  try {
    // 1. Load CERTIFICATE_TEMPLATE.pptx
    const participationPath = path.join(__dirname, '../CERTIFICATE_TEMPLATE.pptx');
    if (!fs.existsSync(participationPath)) {
      throw new Error(`File not found: ${participationPath}`);
    }
    console.log(`Reading ${participationPath}...`);
    const participationData = fs.readFileSync(participationPath);
    const participationBase64 = participationData.toString('base64');

    // 2. Load CERTIFICATE_TEMPLATE - APPRECIATION.pptx
    const appreciationPath = path.join(__dirname, '../CERTIFICATE_TEMPLATE - APPRECIATION.pptx');
    if (!fs.existsSync(appreciationPath)) {
      throw new Error(`File not found: ${appreciationPath}`);
    }
    console.log(`Reading ${appreciationPath}...`);
    const appreciationData = fs.readFileSync(appreciationPath);
    const appreciationBase64 = appreciationData.toString('base64');

    console.log("Connecting to database and updating templates table...");

    // Save certificate_participation
    await db.execute({
      sql: `INSERT OR REPLACE INTO templates (name, filename, data_base64, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
      args: ["certificate_participation", "CERTIFICATE_TEMPLATE.pptx", participationBase64]
    });
    console.log("Successfully updated template 'certificate_participation'.");

    // Save legacy certificate
    await db.execute({
      sql: `INSERT OR REPLACE INTO templates (name, filename, data_base64, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
      args: ["certificate", "CERTIFICATE_TEMPLATE.pptx", participationBase64]
    });
    console.log("Successfully updated template 'certificate'.");

    // Save certificate_appreciation
    await db.execute({
      sql: `INSERT OR REPLACE INTO templates (name, filename, data_base64, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
      args: ["certificate_appreciation", "CERTIFICATE_TEMPLATE - APPRECIATION.pptx", appreciationBase64]
    });
    console.log("Successfully updated template 'certificate_appreciation'.");

    // 3. Load CERTIFICATE_TEMPLATE - hackathon.pptx
    const hackathonPath = path.join(__dirname, 'CERTIFICATE_TEMPLATE - hackathon.pptx');
    if (fs.existsSync(hackathonPath)) {
      console.log(`Reading ${hackathonPath}...`);
      const hackathonData = fs.readFileSync(hackathonPath);
      const hackathonBase64 = hackathonData.toString('base64');
      await db.execute({
        sql: `INSERT OR REPLACE INTO templates (name, filename, data_base64, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        args: ["certificate_hackathon", "CERTIFICATE_TEMPLATE - hackathon.pptx", hackathonBase64]
      });
      console.log("Successfully updated template 'certificate_hackathon'.");
    } else {
      console.warn(`Warning: Hackathon template not found at ${hackathonPath}`);
    }

    // 4. Load CERTIFICATE_TEMPLATE - Recognition .pptx
    const recognitionPath = fs.existsSync(path.join(__dirname, '../CERTIFICATE_TEMPLATE - Recognition .pptx'))
      ? path.join(__dirname, '../CERTIFICATE_TEMPLATE - Recognition .pptx')
      : path.join(__dirname, 'CERTIFICATE_TEMPLATE - Recognition .pptx');
    if (fs.existsSync(recognitionPath)) {
      console.log(`Reading ${recognitionPath}...`);
      const recognitionData = fs.readFileSync(recognitionPath);
      const recognitionBase64 = recognitionData.toString('base64');
      await db.execute({
        sql: `INSERT OR REPLACE INTO templates (name, filename, data_base64, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        args: ["certificate_recognition", "CERTIFICATE_TEMPLATE - Recognition .pptx", recognitionBase64]
      });
      console.log("Successfully updated template 'certificate_recognition'.");
    } else {
      console.warn(`Warning: Recognition template not found at ${recognitionPath}`);
    }

    console.log("All templates updated successfully!");
  } catch (error) {
    console.error("Failed to update database templates:", error);
  } finally {
    // libSQL client does not block exit
  }
}

run();
