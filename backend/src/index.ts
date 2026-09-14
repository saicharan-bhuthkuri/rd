import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import { execSync, exec } from 'child_process';
import { promisify } from 'util';
import nodemailer from 'nodemailer';
import PizZip from 'pizzip';
import dns from 'dns';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';

function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}


// Force DNS lookup to prefer IPv4 first. This prevents ENETUNREACH errors on hostings like Render where IPv6 is not routable.
dns.setDefaultResultOrder('ipv4first');

const execPromise = promisify(exec);

// Helper to locate template files across local and docker/production environments
function findTemplateFile(filename: string): string | null {
  const localPath = path.join(process.cwd(), filename);
  if (fs.existsSync(localPath)) return localPath;
  const parentPath = path.join(process.cwd(), '..', filename);
  if (fs.existsSync(parentPath)) return parentPath;
  return null;
}

// Initialize env
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
console.log("R&D Backend API Server v1.0.1 (Docker container) starting...");

// Enable cookie parsing
app.use(cookieParser());

// Enable CORS with credentials support and dynamic origins
const allowedOrigins = [
  'http://localhost:5173',
  'https://tcek-rd.web.app',
  'https://tcek-rd.firebaseapp.com',
  process.env.FRONTEND_URL
].filter(Boolean) as string[];

const isProd = process.env.NODE_ENV === 'production';

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || (!isProd && origin.startsWith('http://localhost:'))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Configure Rate Limiters
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // Limit each IP to 150 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
});

const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests for this resource, please try again after 15 minutes.' }
});

// Apply global rate limiter
app.use(globalLimiter);

// Initialize Turso LibSQL client
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

const JWT_SECRET = process.env.JWT_SECRET || 'rdcell_secret_key_2026';
if (isProd && JWT_SECRET === 'rdcell_secret_key_2026') {
  console.error("\x1b[31m%s\x1b[0m", "CRITICAL SECURITY WARNING: JWT_SECRET is using the default development fallback in a production environment. You MUST configure a secure JWT_SECRET in your environment variables. In-memory values might be vulnerable.");
}

// Request typing for JWT authentication
interface AuthenticatedRequest extends express.Request {
  user?: {
    username: string;
    role: 'developer' | 'superadmin' | 'admin';
  };
}

const authenticateToken = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = req.cookies?.admin_token || (authHeader && authHeader.split(' ')[1]);

  if (!token) {
    return res.status(401).json({ error: "Access token missing." });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token." });
    }

    // CSRF Protection
    const method = req.method.toUpperCase();
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      const tokenSource = req.cookies?.admin_token ? 'cookie' : 'header';
      if (tokenSource === 'cookie') {
        const csrfHeader = req.headers['x-csrf-token'];
        if (!csrfHeader || typeof csrfHeader !== 'string') {
          return res.status(403).json({ error: "CSRF token verification failed: header missing." });
        }
        try {
          const csrfDecoded: any = jwt.verify(csrfHeader, JWT_SECRET);
          if (csrfDecoded.type !== 'csrf' || csrfDecoded.username !== decoded.username) {
            return res.status(403).json({ error: "CSRF token verification failed: invalid payload." });
          }
        } catch (csrfErr) {
          return res.status(403).json({ error: "CSRF token verification failed: validation failed." });
        }
      }
    }

    req.user = decoded;
    next();
  });
};

// Setup DB schema on startup
async function setupDatabase() {
  try {
    console.log("Setting up Turso database tables...");

    // 1. Club Applications Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS club_applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        pin_number TEXT NOT NULL,
        email TEXT NOT NULL,
        mobile TEXT NOT NULL,
        branch TEXT NOT NULL,
        year_of_study TEXT NOT NULL,
        section TEXT,
        interests TEXT NOT NULL,
        skills TEXT NOT NULL,
        reason_to_join TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Event Registrations Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS event_registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        pin_number TEXT NOT NULL,
        email TEXT NOT NULL,
        mobile TEXT NOT NULL,
        branch TEXT NOT NULL,
        year_of_study TEXT NOT NULL,
        section TEXT,
        event_name TEXT NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Contact/Feedback Messages Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Admin Users Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        salt TEXT,
        role TEXT NOT NULL CHECK(role IN ('developer', 'superadmin', 'admin')),
        email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Activity Logs Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Events Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        title TEXT UNIQUE NOT NULL,
        description TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        location TEXT NOT NULL,
        speaker TEXT NOT NULL,
        speaker_bio TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 7. Templates Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS templates (
        name TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        data_base64 TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 8. Branches Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS branches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 9. Hackathon Registrations Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS hackathon_registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hackathon_name TEXT,
        team_name TEXT NOT NULL,
        project_title TEXT NOT NULL,
        project_description TEXT NOT NULL,
        problem_statement TEXT NOT NULL,
        leader_name TEXT NOT NULL,
        leader_email TEXT NOT NULL,
        leader_phone TEXT NOT NULL,
        leader_role TEXT NOT NULL,
        leader_year TEXT,
        leader_branch TEXT,
        leader_institution TEXT,
        leader_company TEXT,
        leader_job_title TEXT,
        members TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        certificate_sent INTEGER DEFAULT 0,
        certificate_type TEXT DEFAULT 'Participation',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 10. Password Reset Tokens Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        token_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        used INTEGER DEFAULT 0
      );
    `);

    // 11. Hackathon Certificates Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS hackathon_certificates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        certificate_id TEXT UNIQUE NOT NULL,
        registration_id INTEGER NOT NULL,
        participant_name TEXT NOT NULL,
        participant_email TEXT NOT NULL,
        participant_phone TEXT,
        role TEXT NOT NULL,
        year TEXT,
        branch TEXT,
        institution TEXT,
        team_name TEXT NOT NULL,
        project_title TEXT NOT NULL,
        hackathon_name TEXT NOT NULL,
        certificate_type TEXT DEFAULT 'Participation',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 12. Recognition Applications Table (Judges, Evaluators & Dignitaries)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS recognition_applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        mobile TEXT NOT NULL,
        designation TEXT NOT NULL,
        organization TEXT NOT NULL,
        event_name TEXT NOT NULL,
        event_date TEXT,
        domain_expertise TEXT,
        experience_years TEXT,
        notes TEXT,
        status TEXT DEFAULT 'pending',
        certificate_sent INTEGER DEFAULT 0,
        certificate_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 13. Volunteer Applications Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS volunteer_applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        pin_number TEXT NOT NULL,
        email TEXT NOT NULL,
        mobile TEXT NOT NULL,
        branch TEXT NOT NULL,
        year_of_study TEXT NOT NULL,
        event_name TEXT,
        volunteer_role TEXT NOT NULL,
        skills TEXT NOT NULL,
        past_experience TEXT,
        availability TEXT,
        notes TEXT,
        status TEXT DEFAULT 'pending',
        certificate_sent INTEGER DEFAULT 0,
        certificate_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Alter table schemas to add status columns if missing
    try {
      await db.execute(`ALTER TABLE club_applications ADD COLUMN status TEXT DEFAULT 'pending';`);
      console.log("Database verification: status column verified/added to club_applications.");
    } catch (e) {
      // Column already exists, ignore
    }

    try {
      await db.execute(`ALTER TABLE hackathon_registrations ADD COLUMN hackathon_name TEXT;`);
      console.log("Database verification: hackathon_name column verified/added to hackathon_registrations.");
    } catch (e) {
      // Column already exists, ignore
    }

    try {
      await db.execute(`ALTER TABLE event_registrations ADD COLUMN status TEXT DEFAULT 'Participation';`);
      console.log("Database verification: status column verified/added to event_registrations.");
    } catch (e) {
      // Column already exists, ignore
    }

    try {
      const legacyUpdate = await db.execute(`
        UPDATE event_registrations 
        SET status = 'Participation' 
        WHERE status IS NULL OR status = 'pending' OR status = 'approved' OR status = 'rejected' OR status = 'participation' OR status = 'participated'
      `);
      if (legacyUpdate.rowsAffected > 0) {
        console.log(`Database migration: Updated ${legacyUpdate.rowsAffected} legacy event registration statuses to 'Participation'.`);
      }
    } catch (e) {
      console.error("Database migration error for event_registrations status:", e);
    }

    try {
      await db.execute(`ALTER TABLE club_applications ADD COLUMN offer_sent INTEGER DEFAULT 0;`);
      console.log("Database verification: offer_sent column verified/added to club_applications.");
    } catch (e) {
      // Column already exists, ignore
    }

    try {
      await db.execute(`ALTER TABLE event_registrations ADD COLUMN certificate_sent INTEGER DEFAULT 0;`);
      console.log("Database verification: certificate_sent column verified/added to event_registrations.");
    } catch (e) {
      // Column already exists, ignore
    }

    try {
      await db.execute(`ALTER TABLE hackathon_registrations ADD COLUMN certificate_sent INTEGER DEFAULT 0;`);
      console.log("Database verification: certificate_sent column verified/added to hackathon_registrations.");
    } catch (e) {
      // Column already exists, ignore
    }

    try {
      await db.execute(`ALTER TABLE hackathon_registrations ADD COLUMN certificate_type TEXT DEFAULT 'Participation';`);
      console.log("Database verification: certificate_type column verified/added to hackathon_registrations.");
    } catch (e) {
      // Column already exists, ignore
    }

    try {
      await db.execute(`ALTER TABLE event_registrations ADD COLUMN certificate_id TEXT;`);
      console.log("Database verification: certificate_id column verified/added to event_registrations.");
    } catch (e) {
      // Column already exists, ignore
    }

    try {
      await db.execute(`ALTER TABLE admin_users ADD COLUMN email TEXT;`);
      console.log("Database verification: email column verified/added to admin_users.");
    } catch (e) {
      // Column already exists, ignore
    }

    try {
      await db.execute(`ALTER TABLE admin_users ADD COLUMN salt TEXT;`);
      console.log("Database verification: salt column verified/added to admin_users.");
    } catch (e) {
      // Column already exists, ignore
    }

    // Initial admin seeding (only executed if explicitly defined via environment variables and accounts do not exist)
    const DEFAULT_DEV_PASSWORD = process.env.DEFAULT_DEV_PASSWORD;
    const DEFAULT_SUPERADMIN_PASSWORD = process.env.DEFAULT_SUPERADMIN_PASSWORD;

    // Seeding Developer: charan
    try {
      const devCheck = await db.execute({
        sql: `SELECT password, salt FROM admin_users WHERE username = ?`,
        args: ['charan']
      });
      if (devCheck.rows.length === 0) {
        if (DEFAULT_DEV_PASSWORD) {
          const devSalt = generateSalt();
          const devPassHash = await bcrypt.hash(devSalt + DEFAULT_DEV_PASSWORD, 10);
          await db.execute({
            sql: `INSERT INTO admin_users (username, password, salt, role, email) VALUES (?, ?, ?, ?, ?)`,
            args: ['charan', devPassHash, devSalt, 'developer', 'SAICHARANBHUTHKURI8336@GMAIL.COM']
          });
          console.log("Seeding: Developer 'charan' created with salt.");
        } else {
          console.log("Seeding: Developer 'charan' does not exist and DEFAULT_DEV_PASSWORD is not set. Skipping automatic creation.");
        }
      } else {
        const user = devCheck.rows[0];
        if ((user.salt === null || user.salt === undefined) && DEFAULT_DEV_PASSWORD) {
          const devSalt = generateSalt();
          const devPassHash = await bcrypt.hash(devSalt + DEFAULT_DEV_PASSWORD, 10);
          await db.execute({
            sql: `UPDATE admin_users SET password = ?, salt = ? WHERE username = ?`,
            args: [devPassHash, devSalt, 'charan']
          });
          console.log("Seeding: Migrated Developer 'charan' to use a unique salt.");
        }
      }
      await db.execute({
        sql: `UPDATE admin_users SET email = ? WHERE username = ?`,
        args: ['SAICHARANBHUTHKURI8336@GMAIL.COM', 'charan']
      });
      console.log("Seeding verification: Developer 'charan' verified/seeded.");
    } catch (e) {
      console.error("Error seeding developer:", e);
    }

    // Seeding Super Admin: akhya
    try {
      const superadminCheck = await db.execute({
        sql: `SELECT password, salt FROM admin_users WHERE username = ?`,
        args: ['akhya']
      });
      if (superadminCheck.rows.length === 0) {
        if (DEFAULT_SUPERADMIN_PASSWORD) {
          const superadminSalt = generateSalt();
          const superadminPassHash = await bcrypt.hash(superadminSalt + DEFAULT_SUPERADMIN_PASSWORD, 10);
          await db.execute({
            sql: `INSERT INTO admin_users (username, password, salt, role, email) VALUES (?, ?, ?, ?, ?)`,
            args: ['akhya', superadminPassHash, superadminSalt, 'superadmin', 'AKHYABAIRI004@GMAIL.COM']
          });
          console.log("Seeding: Super Admin 'akhya' created with salt.");
        } else {
          console.log("Seeding: Super Admin 'akhya' does not exist and DEFAULT_SUPERADMIN_PASSWORD is not set. Skipping automatic creation.");
        }
      } else {
        const user = superadminCheck.rows[0];
        if ((user.salt === null || user.salt === undefined) && DEFAULT_SUPERADMIN_PASSWORD) {
          const superadminSalt = generateSalt();
          const superadminPassHash = await bcrypt.hash(superadminSalt + DEFAULT_SUPERADMIN_PASSWORD, 10);
          await db.execute({
            sql: `UPDATE admin_users SET password = ?, salt = ? WHERE username = ?`,
            args: [superadminPassHash, superadminSalt, 'akhya']
          });
          console.log("Seeding: Migrated Super Admin 'akhya' to use a unique salt.");
        }
      }
      await db.execute({
        sql: `UPDATE admin_users SET email = ? WHERE username = ?`,
        args: ['AKHYABAIRI004@GMAIL.COM', 'akhya']
      });
      console.log("Seeding verification: Super Admin 'akhya' verified/seeded.");
    } catch (e) {
      console.error("Error seeding superadmin:", e);
    }

    // Seed default events if events table is empty
    try {
      const eventsCheck = await db.execute("SELECT count(*) as count FROM events;");
      const count = Number(eventsCheck.rows[0].count);
      if (count === 0) {
        console.log("Seeding default events...");
        const defaultEvents = [
          {
            category: "Workshop",
            title: "Deep Learning Bootcamp: PyTorch Fundamentals",
            description: "An intensive workshop focused on building, training, and optimizing deep neural networks using PyTorch. Designed to bootstrap ML research projects.",
            date: "August 24, 2026",
            time: "10:00 AM - 4:00 PM IST",
            location: "R&D Lab 4A, Computing Block",
            speaker: "Dr. Aravind Swaminathan",
            speaker_bio: "Dr. Swaminathan is a Senior AI Scientist with over 10 publications in CVPR/ICML, specializing in spatial transformers."
          },
          {
            category: "Hackathon",
            title: "R&D AlphaQuest Hackathon",
            description: "Build functional prototypes solving local municipal challenges. Top teams receive direct workspace placement and development funding.",
            date: "September 11-13, 2026",
            time: "48 Hours Continuous",
            location: "Main Innovation Hall & Discord",
            speaker: "Club Committee Panel",
            speaker_bio: "Senior committee members and guest engineering mentors from leading deep tech hardware startups."
          },
          {
            category: "Seminar",
            title: "Zero-Knowledge Proofs in Modern Web Cryptography",
            description: "An exploratory guest lecture detailing the mathematics behind non-interactive zero-knowledge proofs (zk-SNARKs) and web integration layers.",
            date: "September 28, 2026",
            time: "3:00 PM - 5:00 PM IST",
            location: "Seminar Hall C",
            speaker: "Prof. Clara Vance",
            speaker_bio: "Prof. Vance is an associate cryptographer with MIT Labs, researching decentralized public key infrastructures."
          },
          {
            category: "Workshop",
            title: "Edge AI: Deploying TinyML on Microcontrollers",
            description: "Learn how to optimize neural networks to run on memory-constrained systems using TensorFlow Lite Micro APIs.",
            date: "July 12, 2026",
            time: "11:00 AM - 3:00 PM IST",
            location: "IoT & Embedded Labs",
            speaker: "Meera Nair",
            speaker_bio: "Meera leads the hardware systems division at R&D, designing telemetry platforms for autonomous drones."
          },
          {
            category: "Colloquium",
            title: "Quantum Compiler Architectures & Optimization",
            description: "A deep dive into compiling high-level quantum instructions down to pulse-level operations, reducing decoherence effects in NISQ processors.",
            date: "June 30, 2026",
            time: "2:00 PM - 4:30 PM IST",
            location: "Online Seminar",
            speaker: "Dr. Ethan Brooks",
            speaker_bio: "Dr. Brooks develops compiler backends for superconducting hardware topologies."
          }
        ];

        for (const evt of defaultEvents) {
          await db.execute({
            sql: `INSERT OR IGNORE INTO events (category, title, description, date, time, location, speaker, speaker_bio) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [evt.category, evt.title, evt.description, evt.date, evt.time, evt.location, evt.speaker, evt.speaker_bio]
          });
        }
        console.log("Seeding verification: Default events seeded.");
      }
    } catch (e) {
      console.error("Error seeding default events:", e);
    }

    // Seed and sync templates
    try {
      // 1. Offer Letter Template
      const offerPath = findTemplateFile('OFFER LETTER (1).pptx');
      if (offerPath) {
        console.log(`Syncing/updating 'offer_letter' template into database from ${offerPath}...`);
        const fileData = fs.readFileSync(offerPath);
        const base64 = fileData.toString('base64');
        await db.execute({
          sql: "INSERT OR REPLACE INTO templates (name, filename, data_base64) VALUES (?, ?, ?)",
          args: ["offer_letter", "OFFER LETTER (1).pptx", base64]
        });
        console.log("Template 'offer_letter' synced successfully.");
      } else {
        console.warn("Warning: Template 'OFFER LETTER (1).pptx' not found. Skipping sync.");
      }

      // 2. Certificate Templates (Participation and Appreciation)
      // 2a. Default/Participation Certificate
      const certPath = findTemplateFile('CERTIFICATE_TEMPLATE.pptx');
      if (certPath) {
        console.log(`Syncing/updating 'certificate_participation' template into database from ${certPath}...`);
        const fileData = fs.readFileSync(certPath);
        const base64 = fileData.toString('base64');
        await db.execute({
          sql: "INSERT OR REPLACE INTO templates (name, filename, data_base64) VALUES (?, ?, ?)",
          args: ["certificate_participation", "CERTIFICATE_TEMPLATE.pptx", base64]
        });
        console.log("Template 'certificate_participation' synced successfully.");

        // 2b. Legacy Certificate Template (for backward compatibility)
        console.log(`Syncing/updating 'certificate' template into database from ${certPath}...`);
        await db.execute({
          sql: "INSERT OR REPLACE INTO templates (name, filename, data_base64) VALUES (?, ?, ?)",
          args: ["certificate", "CERTIFICATE_TEMPLATE.pptx", base64]
        });
        console.log("Template 'certificate' synced successfully.");
      } else {
        console.warn("Warning: Template 'CERTIFICATE_TEMPLATE.pptx' not found. Skipping sync.");
      }

      // 2c. Appreciation Certificate
      const appreciationPath = findTemplateFile('CERTIFICATE_TEMPLATE - APPRECIATION.pptx');
      if (appreciationPath) {
        console.log(`Syncing/updating 'certificate_appreciation' template into database from ${appreciationPath}...`);
        const fileData = fs.readFileSync(appreciationPath);
        const base64 = fileData.toString('base64');
        await db.execute({
          sql: "INSERT OR REPLACE INTO templates (name, filename, data_base64) VALUES (?, ?, ?)",
          args: ["certificate_appreciation", "CERTIFICATE_TEMPLATE - APPRECIATION.pptx", base64]
        });
        console.log("Template 'certificate_appreciation' synced successfully.");
      } else {
        console.warn("Warning: Template 'CERTIFICATE_TEMPLATE - APPRECIATION.pptx' not found. Skipping sync.");
      }

      // 2d. Hackathon Certificate
      const hackathonCertPath = findTemplateFile('CERTIFICATE_TEMPLATE - hackathon.pptx');
      if (hackathonCertPath) {
        console.log(`Syncing/updating 'certificate_hackathon' template into database from ${hackathonCertPath}...`);
        const fileData = fs.readFileSync(hackathonCertPath);
        const base64 = fileData.toString('base64');
        await db.execute({
          sql: "INSERT OR REPLACE INTO templates (name, filename, data_base64) VALUES (?, ?, ?)",
          args: ["certificate_hackathon", "CERTIFICATE_TEMPLATE - hackathon.pptx", base64]
        });
        console.log("Template 'certificate_hackathon' synced successfully.");
      } else {
        console.warn("Warning: Template 'CERTIFICATE_TEMPLATE - hackathon.pptx' not found. Skipping sync.");
      }

      // 2e. Recognition Certificate (Official Judges, Evaluators & Dignitaries)
      const recognitionCertPath = findTemplateFile('CERTIFICATE_TEMPLATE - Recognition .pptx') || findTemplateFile('CERTIFICATE_TEMPLATE - Recognition.pptx');
      if (recognitionCertPath) {
        console.log(`Syncing/updating 'certificate_recognition' template into database from ${recognitionCertPath}...`);
        const fileData = fs.readFileSync(recognitionCertPath);
        const base64 = fileData.toString('base64');
        await db.execute({
          sql: "INSERT OR REPLACE INTO templates (name, filename, data_base64) VALUES (?, ?, ?)",
          args: ["certificate_recognition", "CERTIFICATE_TEMPLATE - Recognition .pptx", base64]
        });
        console.log("Template 'certificate_recognition' synced successfully.");
      } else {
        console.warn("Warning: Template 'CERTIFICATE_TEMPLATE - Recognition .pptx' not found. Skipping sync.");
      }
    } catch (e: any) {
      console.error("Error seeding/syncing templates:", e.message);
    }

    // Seed default branches if empty
    try {
      const branchCheck = await db.execute("SELECT count(*) as count FROM branches");
      if (Number(branchCheck.rows[0].count) === 0) {
        console.log("Seeding default academic branches into database...");
        const defaultBranches = [
          "Computer Science & Engineering (CSE)",
          "Electronics & Communication Engineering (ECE)",
          "Electrical & Electronics Engineering (EEE)",
          "Mechanical Engineering (ME)",
          "Civil Engineering (CE)",
          "Artificial Intelligence & Machine Learning (AI&ML)"
        ];
        for (const name of defaultBranches) {
          await db.execute({
            sql: "INSERT INTO branches (name) VALUES (?)",
            args: [name]
          });
        }
        console.log("Seeding verification: Default branches seeded successfully.");
      }
    } catch (e: any) {
      console.error("Error seeding default branches:", e.message);
    }

    console.log("Database tables verified successfully.");
  } catch (error) {
    console.error("Database setup failed:", error);
  }
}

// Endpoints

// Real-time synchronization connection pool
const syncClients: any[] = [];

const notifySyncClients = (type: string) => {
  syncClients.forEach(client => {
    client.write(`data: ${JSON.stringify({ type })}\n\n`);
  });
};

// GET /api/sync-stream (SSE sync endpoint)
app.get('/api/sync-stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  syncClients.push(res);

  req.on('close', () => {
    const idx = syncClients.indexOf(res);
    if (idx !== -1) {
      syncClients.splice(idx, 1);
    }
  });
});

// In-memory cache for validated domains
const domainCache = new Map<string, boolean>();

// Pre-seed known common reliable email domains
['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'aol.com', 'protonmail.com', 'zoho.com', 'mail.com', 'tcek.ac.in', 'klu.ac.in'].forEach(d => {
  domainCache.set(d, true);
});

// Real-time Email & Domain Verification endpoint
app.post('/api/verify-email-domain', async (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ valid: false, error: 'Email address is required.' });
  }

  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(trimmed)) {
    return res.status(400).json({ valid: false, error: 'Please enter a valid email address format (e.g., name@domain.com).' });
  }

  const parts = trimmed.split('@');
  const domain = parts[1];

  if (!domain || domain.includes('..') || domain.startsWith('.') || domain.endsWith('.')) {
    return res.status(400).json({ valid: false, error: 'Invalid domain format.' });
  }

  // Check cache first
  if (domainCache.has(domain)) {
    const isDomainValid = domainCache.get(domain)!;
    if (isDomainValid) {
      return res.json({ valid: true, domain, exists: true });
    } else {
      return res.status(400).json({ valid: false, error: `Domain "${domain}" does not exist or has no mail servers configured.` });
    }
  }

  try {
    // Attempt to resolve MX records
    const mxRecords = await dns.promises.resolveMx(domain).catch(() => null);

    if (mxRecords && mxRecords.length > 0) {
      domainCache.set(domain, true);
      return res.json({ valid: true, domain, exists: true });
    }

    // Fallback: check if domain has A/AAAA records (some legacy or internal mail servers)
    const aRecords = await dns.promises.resolve4(domain).catch(() => null);
    if (aRecords && aRecords.length > 0) {
      domainCache.set(domain, true);
      return res.json({ valid: true, domain, exists: true });
    }

    domainCache.set(domain, false);
    return res.status(400).json({ valid: false, error: `The domain "${domain}" does not exist or does not accept emails.` });
  } catch (err: any) {
    return res.status(400).json({ valid: false, error: `Unable to verify email domain "${domain}".` });
  }
});

// 1. Club Membership Application endpoint
app.post('/api/apply/club', sensitiveLimiter, async (req, res) => {
  const {
    fullName,
    pinNumber,
    email,
    mobile,
    branch,
    yearOfStudy,
    section,
    interests,
    skills,
    reasonToJoin
  } = req.body;

  // Simple validation
  if (!fullName || !pinNumber || !email || !mobile || !branch || !yearOfStudy || !interests || !skills || !reasonToJoin) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    const result = await db.execute({
      sql: `INSERT INTO club_applications (full_name, pin_number, email, mobile, branch, year_of_study, section, interests, skills, reason_to_join)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        fullName,
        pinNumber,
        email,
        mobile,
        branch,
        yearOfStudy,
        section || null,
        interests,
        skills,
        reasonToJoin
      ]
    });

    notifySyncClients("REFRESH_APPLICATIONS");
    return res.status(201).json({
      success: true,
      message: "Application recorded successfully.",
      id: Number(result.lastInsertRowid)
    });
  } catch (error: any) {
    console.error("Error inserting club application:", error);
    return res.status(500).json({ error: "Failed to submit membership application.", details: error.message });
  }
});

// 2. Event Registration endpoint
app.post('/api/apply/event', sensitiveLimiter, async (req, res) => {
  const {
    fullName,
    pinNumber,
    email,
    mobile,
    branch,
    yearOfStudy,
    section,
    eventName,
    notes
  } = req.body;

  // Simple validation
  if (!fullName || !pinNumber || !email || !mobile || !branch || !yearOfStudy || !eventName) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    const result = await db.execute({
      sql: `INSERT INTO event_registrations (full_name, pin_number, email, mobile, branch, year_of_study, section, event_name, notes, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Participation')`,
      args: [
        fullName,
        pinNumber,
        email,
        mobile,
        branch,
        yearOfStudy,
        section || null,
        eventName,
        notes || null
      ]
    });

    notifySyncClients("REFRESH_APPLICATIONS");
    return res.status(201).json({
      success: true,
      message: "Event registration recorded successfully.",
      id: Number(result.lastInsertRowid)
    });
  } catch (error: any) {
    console.error("Error inserting event registration:", error);
    return res.status(500).json({ error: "Failed to submit event registration.", details: error.message });
  }
});

// 2.5 Hackathon Registration endpoint
app.post('/api/apply/hackathon', sensitiveLimiter, async (req, res) => {
  const {
    hackathonName,
    teamName,
    projectTitle,
    projectDescription,
    problemStatement,
    leaderName,
    leaderEmail,
    leaderPhone,
    leaderRole,
    leaderYear,
    leaderBranch,
    leaderInstitution,
    leaderCompany,
    leaderJobTitle,
    members
  } = req.body;

  // Simple validation
  if (!teamName ||
      !leaderName || !leaderEmail || !leaderPhone || !leaderRole || !members) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    const result = await db.execute({
      sql: `INSERT INTO hackathon_registrations (
              hackathon_name, team_name, project_title, project_description, problem_statement,
              leader_name, leader_email, leader_phone, leader_role,
              leader_year, leader_branch, leader_institution,
              leader_company, leader_job_title, members, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      args: [
        hackathonName || 'R&D AlphaQuest Hackathon',
        teamName,
        projectTitle || '',
        projectDescription || '',
        problemStatement || '',
        leaderName,
        leaderEmail,
        leaderPhone,
        leaderRole,
        leaderYear || null,
        leaderBranch || null,
        leaderInstitution || null,
        leaderCompany || null,
        leaderJobTitle || null,
        typeof members === 'string' ? members : JSON.stringify(members)
      ]
    });

    notifySyncClients("REFRESH_APPLICATIONS");
    return res.status(201).json({
      success: true,
      message: "Hackathon team registration recorded successfully.",
      id: Number(result.lastInsertRowid)
    });
  } catch (error: any) {
    console.error("Error inserting hackathon registration:", error);
    return res.status(500).json({ error: "Failed to submit hackathon registration.", details: error.message });
  }
});

// 2.7 Recognition / Judge Application endpoint
app.post('/api/apply/recognition', sensitiveLimiter, async (req, res) => {
  const {
    fullName,
    email,
    mobile,
    designation,
    organization,
    eventName,
    eventDate,
    domainExpertise,
    experienceYears,
    notes
  } = req.body;

  // Validation
  if (!fullName || !email || !mobile || !designation || !organization || !eventName || !domainExpertise || !experienceYears) {
    return res.status(400).json({ error: "Missing required fields: Name, Email, Mobile, Designation, Organization, Event, Domain/Specialization, and Experience are required." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }

  try {
    let resolvedDate = eventDate;
    if (!resolvedDate) {
      const evtRes = await db.execute({
        sql: "SELECT date FROM events WHERE title = ?",
        args: [eventName]
      });
      if (evtRes.rows.length > 0) {
        resolvedDate = evtRes.rows[0].date as string;
      } else {
        resolvedDate = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
      }
    }

    const result = await db.execute({
      sql: `INSERT INTO recognition_applications (
              full_name, email, mobile, designation, organization, event_name, event_date,
              domain_expertise, experience_years, notes, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      args: [
        fullName.trim(),
        email.trim(),
        mobile.trim(),
        designation.trim(),
        organization.trim(),
        eventName.trim(),
        resolvedDate,
        domainExpertise ? domainExpertise.trim() : null,
        experienceYears ? experienceYears.trim() : null,
        notes ? notes.trim() : null
      ]
    });

    notifySyncClients("REFRESH_APPLICATIONS");
    return res.status(201).json({
      success: true,
      message: "Judge / Recognition registration recorded successfully.",
      id: Number(result.lastInsertRowid)
    });
  } catch (error: any) {
    console.error("Error inserting recognition application:", error);
    return res.status(500).json({ error: "Failed to submit recognition application.", details: error.message });
  }
});

// 2.7 Volunteer Application endpoint
app.post('/api/apply/volunteer', sensitiveLimiter, async (req, res) => {
  const {
    fullName,
    pinNumber,
    email,
    mobile,
    branch,
    yearOfStudy,
    eventName,
    volunteerRole,
    skills,
    pastExperience,
    availability,
    notes
  } = req.body;

  if (!fullName || !pinNumber || !email || !mobile || !branch || !yearOfStudy || !volunteerRole || !skills) {
    return res.status(400).json({ error: "Missing required fields for Volunteer registration." });
  }

  try {
    const result = await db.execute({
      sql: `INSERT INTO volunteer_applications (
              full_name, pin_number, email, mobile, branch, year_of_study,
              event_name, volunteer_role, skills, past_experience, availability, notes, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      args: [
        fullName.trim(),
        pinNumber.trim(),
        email.trim().toLowerCase(),
        mobile.trim(),
        branch.trim(),
        yearOfStudy.trim(),
        eventName ? eventName.trim() : 'General / All Events',
        volunteerRole.trim(),
        skills.trim(),
        pastExperience ? pastExperience.trim() : null,
        availability ? availability.trim() : 'Flexible / Event Days',
        notes ? notes.trim() : null
      ]
    });

    notifySyncClients("REFRESH_APPLICATIONS");
    return res.status(201).json({
      success: true,
      message: "Volunteer application submitted successfully.",
      id: Number(result.lastInsertRowid)
    });
  } catch (error: any) {
    console.error("Error inserting volunteer application:", error);
    return res.status(500).json({ error: "Failed to submit volunteer application.", details: error.message });
  }
});

// 3. Contact/Enquiry feedback endpoint
app.post('/api/contact', sensitiveLimiter, async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    const result = await db.execute({
      sql: `INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)`,
      args: [name, email, subject, message]
    });

    return res.status(201).json({
      success: true,
      message: "Feedback recorded successfully.",
      id: Number(result.lastInsertRowid)
    });
  } catch (error: any) {
    console.error("Error inserting contact message:", error);
    return res.status(500).json({ error: "Failed to submit contact enquiry.", details: error.message });
  }
});

// 4. Status Check Endpoint
app.get('/api/status', async (req, res) => {
  try {
    // Perform simple query to verify db health
    const dbTest = await db.execute("SELECT 1 AS ok;");
    return res.status(200).json({
      status: "online",
      database: dbTest.rows[0].ok === 1 ? "connected" : "error"
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "online",
      database: "disconnected",
      error: error.message
    });
  }
});

// Health Check Endpoint (publicly accessible, no auth, monitored by UptimeRobot)
app.get('/api/health', (req, res) => {
  try {
    let groqModels: any = undefined;
    try {
      if (typeof (globalThis as any).GROQ_MODELS !== 'undefined') {
        groqModels = (globalThis as any).GROQ_MODELS;
      } else if (typeof (global as any).GROQ_MODELS !== 'undefined') {
        groqModels = (global as any).GROQ_MODELS;
      } else if (process.env.GROQ_MODELS) {
        try {
          groqModels = JSON.parse(process.env.GROQ_MODELS);
        } catch {
          groqModels = process.env.GROQ_MODELS;
        }
      }
    } catch {
      // safe fallback
    }

    return res.status(200).json({
      status: "online",
      provider: "Groq",
      models: groqModels !== undefined ? groqModels : null
    });
  } catch (error) {
    return res.status(503).json({
      status: "offline"
    });
  }
});

// 5. Admin Login
app.post('/api/admin/login', sensitiveLimiter, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  try {
    const userRes = await db.execute({
      sql: "SELECT * FROM admin_users WHERE username = ?",
      args: [username]
    });

    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    const user = userRes.rows[0];
    const salt = user.salt as string | null | undefined;
    const saltedPassword = salt ? (salt + password) : password;
    const passwordMatch = await bcrypt.compare(saltedPassword, user.password as string);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    const token = jwt.sign(
      { username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    const csrfToken = jwt.sign(
      { username: user.username, type: 'csrf' },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Set HTTP-only secure cookie
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000 // 8 hours
    });

    // Log Activity
    await db.execute({
      sql: "INSERT INTO activity_logs (username, action, details) VALUES (?, ?, ?)",
      args: [username, "Login", `Administrator logged in as role: ${user.role}`]
    });

    return res.status(200).json({
      success: true,
      token,
      csrfToken,
      user: {
        username: user.username,
        role: user.role
      }
    });
  } catch (err: any) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal server error during login.", details: err.message });
  }
});

// Admin Logout
app.post('/api/admin/logout', (req, res) => {
  res.clearCookie('admin_token');
  return res.status(200).json({ success: true, message: "Logged out successfully." });
});

async function sendSystemEmail(to: string, subject: string, text: string, html?: string) {
  if (process.env.GMAIL_HTTP_PROXY_URL) {
    const payload = { to, subject, text, html };
    const proxyRes = await postToAppsScript(process.env.GMAIL_HTTP_PROXY_URL, payload);
    if (!proxyRes.success) {
      throw new Error(`Google Apps Script Proxy failed: ${proxyRes.error}`);
    }
  } else {
    await transporter.sendMail({
      from: SENDER_EMAIL,
      to,
      subject,
      text,
      html
    });
  }
}

// Admin Forgot Password
app.post('/api/admin/forgot-password', sensitiveLimiter, async (req, res) => {
  const { email } = req.body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || email.trim() === '' || !emailRegex.test(email.trim())) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }

  try {
    const userRes = await db.execute({
      sql: "SELECT username FROM admin_users WHERE LOWER(email) = LOWER(?)",
      args: [email.trim()]
    });

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "No account was found with this email address. Please check the email and try again." });
    }

    const username = userRes.rows[0].username as string;
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenSalt = generateSalt();
    const tokenHash = crypto.createHash('sha256').update(tokenSalt + rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

    await db.execute({
      sql: "INSERT INTO password_reset_tokens (username, token_hash, salt, expires_at) VALUES (?, ?, ?, ?)",
      args: [username, tokenHash, tokenSalt, expiresAt]
    });

    const resetToken = jwt.sign(
      { username, rawToken, purpose: 'reset-password' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const origin = req.headers.origin || process.env.FRONTEND_URL || 'https://tcek-rd.web.app';
    const resetLink = `${origin}/admin/reset-password?token=${resetToken}`;

    if (process.env.NODE_ENV === 'test') {
      console.log(`[TEST_RESET_TOKEN]: ${resetToken}`);
    }

    const subject = "R&D Club Admin Password Reset Request";
    const text = `Hello,\n\nYou are receiving this email because a password reset request was submitted for your R&D Club administrator account (${username}).\n\nPlease click on the following link, or paste it into your browser to complete the process. This link is valid for 15 minutes:\n\n<${resetLink}>\n\nIf you did not request a password reset, you can safely ignore this email.\n\nBest regards,\nR&D Club Admin System`;

    const html = `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #0f172a;
      color: #f1f5f9;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #0f172a;
      padding: 40px 0;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    .logo {
      text-align: center;
      margin-bottom: 24px;
    }
    .logo-icon {
      display: inline-block;
      width: 48px;
      height: 48px;
      background-color: rgba(16, 185, 129, 0.1);
      border-radius: 50%;
      line-height: 48px;
      color: #10b981;
      font-size: 24px;
      font-weight: bold;
      text-align: center;
    }
    h2 {
      color: #ffffff;
      font-size: 24px;
      font-weight: 700;
      text-align: center;
      margin-top: 0;
      margin-bottom: 16px;
    }
    p {
      color: #94a3b8;
      font-size: 16px;
      line-height: 24px;
      margin-top: 0;
      margin-bottom: 24px;
    }
    .button-container {
      text-align: center;
      margin-bottom: 24px;
    }
    .btn {
      display: inline-block;
      background-color: #10b981;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 32px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);
    }
    .btn:hover {
      background-color: #059669;
    }
    .footer {
      text-align: center;
      margin-top: 32px;
      border-top: 1px solid #334155;
      padding-top: 24px;
      color: #64748b;
      font-size: 14px;
    }
    .link-fallback {
      word-break: break-all;
      color: #10b981;
      font-size: 14px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="logo">
        <div class="logo-icon">🛡️</div>
      </div>
      <h2>Password Reset Request</h2>
      <p>Hello,</p>
      <p>You are receiving this email because a password reset request was submitted for your R&D Club administrator account (<strong>${username}</strong>).</p>
      <p>Please click the button below to complete the process. This link is valid for 15 minutes:</p>
      <div class="button-container">
        <a href="${resetLink}" class="btn" target="_blank">Reset Password</a>
      </div>
      <p>If the button doesn't work, you can copy and paste the following link into your web browser:</p>
      <p class="link-fallback"><a href="${resetLink}" style="color: #10b981; text-decoration: none;">${resetLink}</a></p>
      <p>If you did not request a password reset, you can safely ignore this email.</p>
      <div class="footer">
        Best regards,<br>
        <strong>R&D Club Admin System</strong>
      </div>
    </div>
  </div>
</body>
</html>`;

    if (process.env.NODE_ENV !== 'test') {
      await sendSystemEmail(email.trim(), subject, text, html);
    }

    // Log Activity
    await db.execute({
      sql: "INSERT INTO activity_logs (username, action, details) VALUES (?, ?, ?)",
      args: [username, "Forgot Password", `Password reset email sent to ${email}`]
    });

    return res.status(200).json({
      success: true,
      message: "Account found. A password reset link has been sent to your email address."
    });
  } catch (err: any) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ error: "Internal server error during password reset request.", details: err.message });
  }
});

// Admin Reset Password
app.post('/api/admin/reset-password', sensitiveLimiter, async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ error: "Token and new password are required." });
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (decoded.purpose !== 'reset-password') {
      return res.status(400).json({ error: "Invalid token purpose." });
    }

    const username = decoded.username;
    const rawToken = decoded.rawToken;

    // Fetch active (unused) tokens for this user
    const tokenRes = await db.execute({
      sql: "SELECT * FROM password_reset_tokens WHERE username = ? AND used = 0",
      args: [username]
    });

    let validTokenRecord = null;
    const now = new Date();
    for (const row of tokenRes.rows) {
      const dbSalt = row.salt as string;
      const dbHash = row.token_hash as string;
      const expiresAt = new Date(row.expires_at as string);

      if (expiresAt < now) {
        continue;
      }

      const computedHash = crypto.createHash('sha256').update(dbSalt + rawToken).digest('hex');
      if (computedHash === dbHash) {
        validTokenRecord = row;
        break;
      }
    }

    if (!validTokenRecord) {
      return res.status(400).json({ error: "The reset link is invalid, expired, or has already been used." });
    }

    // Mark token as used to enforce one-time usage
    await db.execute({
      sql: "UPDATE password_reset_tokens SET used = 1 WHERE id = ?",
      args: [validTokenRecord.id]
    });

    const salt = generateSalt();
    const passwordHash = await bcrypt.hash(salt + newPassword, 10);

    const result = await db.execute({
      sql: "UPDATE admin_users SET password = ?, salt = ? WHERE username = ?",
      args: [passwordHash, salt, username]
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "User not found or password not changed." });
    }

    // Log Activity
    await db.execute({
      sql: "INSERT INTO activity_logs (username, action, details) VALUES (?, ?, ?)",
      args: [username, "Reset Password", "Password reset successfully completed via recovery link."]
    });

    return res.status(200).json({
      success: true,
      message: "Password reset completed successfully. You can now login with your new password."
    });
  } catch (err: any) {
    console.error("Reset password error:", err);
    if (err.name === 'TokenExpiredError') {
      return res.status(400).json({ error: "Reset token has expired. Please request a new one." });
    }
    return res.status(400).json({ error: "Invalid or corrupt reset token." });
  }
});

// 6. Fetch Submissions (Requires Admin or higher)
app.get('/api/admin/applications', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const clubRes = await db.execute("SELECT * FROM club_applications ORDER BY created_at DESC");
    const eventRes = await db.execute("SELECT * FROM event_registrations ORDER BY created_at DESC");
    const hackathonRes = await db.execute("SELECT * FROM hackathon_registrations ORDER BY created_at DESC");
    const recognitionRes = await db.execute("SELECT * FROM recognition_applications ORDER BY created_at DESC");
    const volunteerRes = await db.execute("SELECT * FROM volunteer_applications ORDER BY created_at DESC");

    return res.status(200).json({
      clubApplications: clubRes.rows,
      eventRegistrations: eventRes.rows,
      hackathonRegistrations: hackathonRes.rows,
      recognitionApplications: recognitionRes.rows,
      volunteerApplications: volunteerRes.rows
    });
  } catch (err: any) {
    console.error("Error fetching applications:", err);
    return res.status(500).json({ error: "Failed to fetch student submissions.", details: err.message });
  }
});

// 7. Update Application Status (Requires Admin or higher)
app.post('/api/admin/applications/status', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { type, id, status } = req.body;
  if (!type || !id || !status) {
    return res.status(400).json({ error: "Type, ID, and status are required." });
  }

  if (type === 'club' || type === 'hackathon' || type === 'recognition' || type === 'volunteer') {
    if (status !== 'approved' && status !== 'rejected' && status !== 'pending') {
      return res.status(400).json({ error: "Invalid status state." });
    }
  }

  let tableName = 'club_applications';
  if (type === 'event') tableName = 'event_registrations';
  if (type === 'hackathon' || type === 'hackathon-certificate-type') tableName = 'hackathon_registrations';
  if (type === 'recognition') tableName = 'recognition_applications';
  if (type === 'volunteer') tableName = 'volunteer_applications';

  try {
    const nameField = (type === 'hackathon' || type === 'hackathon-certificate-type') ? 'leader_name' : 'full_name';
    const checkRes = await db.execute({
      sql: `SELECT ${nameField} AS name FROM ${tableName} WHERE id = ?`,
      args: [id]
    });

    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: "Application record not found." });
    }

    const studentName = checkRes.rows[0].name;

    if (type === 'hackathon-certificate-type') {
      await db.execute({
        sql: `UPDATE hackathon_registrations SET certificate_type = ? WHERE id = ?`,
        args: [status, id]
      });
    } else {
      await db.execute({
        sql: `UPDATE ${tableName} SET status = ? WHERE id = ?`,
        args: [status, id]
      });
    }

    // Log Activity
    const appTypeLabel = type === 'club' 
      ? 'Club Membership' 
      : type === 'event' 
        ? 'Event Registration' 
        : type === 'hackathon-certificate-type'
          ? 'Hackathon Certificate Type'
          : type === 'recognition'
            ? 'Judge Recognition'
            : type === 'volunteer'
              ? 'Volunteer Registration'
              : 'Hackathon Registration';

    await db.execute({
      sql: "INSERT INTO activity_logs (username, action, details) VALUES (?, ?, ?)",
      args: [
        req.user?.username || 'unknown',
        "Update Application Status",
        `Changed status of ${appTypeLabel} application (ID: ${id}, Student: ${studentName}) to: ${status}`
      ]
    });

    notifySyncClients("REFRESH_APPLICATIONS");
    return res.status(200).json({
      success: true,
      message: `Successfully updated application status to ${status}.`
    });
  } catch (err: any) {
    console.error("Status update error:", err);
    return res.status(500).json({ error: "Failed to update status.", details: err.message });
  }
});

// 8. List Admin Users (Requires Super Admin or higher)
app.get('/api/admin/users', authenticateToken, async (req: AuthenticatedRequest, res) => {
  if (req.user?.role !== 'developer' && req.user?.role !== 'superadmin') {
    return res.status(403).json({ error: "Forbidden: You do not have permissions to manage users." });
  }

  try {
    const usersRes = await db.execute("SELECT id, username, role, email, created_at FROM admin_users ORDER BY created_at DESC");
    return res.status(200).json(usersRes.rows);
  } catch (err: any) {
    console.error("Error fetching users:", err);
    return res.status(500).json({ error: "Failed to list admin accounts.", details: err.message });
  }
});

// 9. Create Admin User (Requires Super Admin or higher)
app.post('/api/admin/users', authenticateToken, async (req: AuthenticatedRequest, res) => {
  if (req.user?.role !== 'developer' && req.user?.role !== 'superadmin') {
    return res.status(403).json({ error: "Forbidden: Only Developers and Super Admins can manage users." });
  }

  const { username, password, role, email } = req.body;
  if (!username || !password || !role || !email) {
    return res.status(400).json({ error: "Username, password, role, and email are required." });
  }

  if (role !== 'admin' && role !== 'superadmin' && role !== 'developer') {
    return res.status(400).json({ error: "Invalid role specified." });
  }

  // RBAC checks
  if (req.user.role === 'superadmin' && (role === 'developer' || role === 'superadmin')) {
    return res.status(403).json({ error: "Forbidden: Super Admins can only create Admin accounts." });
  }

  try {
    const userCheck = await db.execute({
      sql: "SELECT id FROM admin_users WHERE username = ?",
      args: [username]
    });

    if (userCheck.rows.length > 0) {
      return res.status(409).json({ error: "Username already exists." });
    }

    const salt = generateSalt();
    const passwordHash = await bcrypt.hash(salt + password, 10);
    const result = await db.execute({
      sql: "INSERT INTO admin_users (username, password, salt, role, email) VALUES (?, ?, ?, ?, ?)",
      args: [username, passwordHash, salt, role, email]
    });

    // Log Activity
    await db.execute({
      sql: "INSERT INTO activity_logs (username, action, details) VALUES (?, ?, ?)",
      args: [
        req.user.username,
        "Create User",
        `Created user ${username} with role: ${role} and email: ${email}`
      ]
    });

    notifySyncClients("REFRESH_ADMINS");
    return res.status(201).json({
      success: true,
      message: "Admin account created successfully.",
      id: Number(result.lastInsertRowid)
    });
  } catch (err: any) {
    console.error("Error creating user:", err);
    return res.status(500).json({ error: "Failed to create user account.", details: err.message });
  }
});

// 10. Delete Admin User (Requires Super Admin or higher)
app.delete('/api/admin/users/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  if (req.user?.role !== 'developer' && req.user?.role !== 'superadmin') {
    return res.status(403).json({ error: "Forbidden: Only Developers and Super Admins can manage users." });
  }

  const userId = req.params.id;

  try {
    const userRes = await db.execute({
      sql: "SELECT username, role FROM admin_users WHERE id = ?",
      args: [userId]
    });

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const targetUser = userRes.rows[0];

    if (targetUser.username === req.user.username) {
      return res.status(400).json({ error: "Invalid action: You cannot delete your own account." });
    }

    if (targetUser.role === 'developer') {
      return res.status(403).json({ error: "Forbidden: Developer account cannot be modified or deleted." });
    }

    if (req.user.role === 'superadmin' && targetUser.role === 'superadmin') {
      return res.status(403).json({ error: "Forbidden: Super Admins cannot delete other Super Admins." });
    }

    await db.execute({
      sql: "DELETE FROM admin_users WHERE id = ?",
      args: [userId]
    });

    // Log Activity
    await db.execute({
      sql: "INSERT INTO activity_logs (username, action, details) VALUES (?, ?, ?)",
      args: [
        req.user.username,
        "Delete User",
        `Deleted user account: ${targetUser.username} (${targetUser.role})`
      ]
    });

    notifySyncClients("REFRESH_ADMINS");
    return res.status(200).json({
      success: true,
      message: "Admin account deleted successfully."
    });
  } catch (err: any) {
    console.error("Error deleting user:", err);
    return res.status(500).json({ error: "Failed to delete user account.", details: err.message });
  }
});// 11. Fetch All Events (Public)
app.get('/api/events', async (req, res) => {
  try {
    const eventsRes = await db.execute("SELECT * FROM events ORDER BY created_at DESC");
    return res.status(200).json(eventsRes.rows);
  } catch (err: any) {
    console.error("Error fetching events:", err);
    return res.status(500).json({ error: "Failed to list technical events.", details: err.message });
  }
});

// 12. Create Event (Requires Admin/Superadmin/Developer privileges)
app.post('/api/admin/events', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { category, title, description, date, time, location, speaker, speakerBio } = req.body;

  if (!category || !title || !description || !date || !time || !location) {
    return res.status(400).json({ error: "Category, Title, Description, Date, Time, and Location are required to create an event." });
  }

  try {
    // Check if title is unique
    const titleCheck = await db.execute({
      sql: "SELECT id FROM events WHERE title = ?",
      args: [title]
    });

    if (titleCheck.rows.length > 0) {
      return res.status(409).json({ error: "An event with this title already exists." });
    }

    const result = await db.execute({
      sql: `INSERT INTO events (category, title, description, date, time, location, speaker, speaker_bio) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [category, title, description, date, time, location, speaker || '', speakerBio || '']
    });

    // Log Activity
    await db.execute({
      sql: "INSERT INTO activity_logs (username, action, details) VALUES (?, ?, ?)",
      args: [
        req.user?.username || 'unknown',
        "Create Event",
        `Created event: ${title} (${category}) on date: ${date}`
      ]
    });

    notifySyncClients("REFRESH_EVENTS");
    return res.status(201).json({
      success: true,
      message: "Event created successfully.",
      id: Number(result.lastInsertRowid)
    });
  } catch (err: any) {
    console.error("Error creating event:", err);
    return res.status(500).json({ error: "Failed to create technical event.", details: err.message });
  }
});

// 13. Delete Event (Requires Admin/Superadmin/Developer privileges)
app.delete('/api/admin/events/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const eventId = req.params.id;

  try {
    const eventRes = await db.execute({
      sql: "SELECT title, category FROM events WHERE id = ?",
      args: [eventId]
    });

    if (eventRes.rows.length === 0) {
      return res.status(404).json({ error: "Event record not found." });
    }

    const targetEvent = eventRes.rows[0];

    await db.execute({
      sql: "DELETE FROM events WHERE id = ?",
      args: [eventId]
    });

    // Log Activity
    await db.execute({
      sql: "INSERT INTO activity_logs (username, action, details) VALUES (?, ?, ?)",
      args: [
        req.user?.username || 'unknown',
        "Delete Event",
        `Deleted event: ${targetEvent.title} (${targetEvent.category})`
      ]
    });

    notifySyncClients("REFRESH_EVENTS");
    return res.status(200).json({
      success: true,
      message: "Event deleted successfully."
    });
  } catch (err: any) {
    console.error("Error deleting event:", err);
    return res.status(500).json({ error: "Failed to delete technical event.", details: err.message });
  }
});
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'tcekrdcell@gmail.com';
const SENDER_PASSWORD = process.env.SENDER_PASSWORD || 'qtptqrywkyctekzo';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports. Port 587 uses STARTTLS and is not blocked by Render
  family: 4, // Force connection to use IPv4 to bypass unreachable IPv6 routes
  connectionTimeout: 10000, // 10 seconds connection timeout
  greetingTimeout: 10000, // 10 seconds greeting timeout
  auth: {
    user: SENDER_EMAIL,
    pass: SENDER_PASSWORD.replace(/\s+/g, '')
  }
} as any);

// XML-aware text replacement inside PPTX files
function replacePlaceholdersInPptx(templateBuffer: Buffer, outputPath: string, replacements: Record<string, string>) {
  const zip = new PizZip(templateBuffer);

  Object.keys(zip.files).forEach((filename) => {
    if (filename.startsWith('ppt/slides/slide') && filename.endsWith('.xml')) {
      const fileObj = zip.file(filename);
      if (fileObj) {
        let slideXml = fileObj.asText();

        // Rule: Disable word wrapping for all shapes EXCEPT the main description/paragraph text shape
        slideXml = slideXml.replace(/<p:sp\b[^>]*>(.*?)<\/p:sp>/gs, (spMatch) => {
          // If this is the student name shape, remove autofit
          if (spMatch.includes('PARTICIPANT NAME')) {
            let modifiedShape = spMatch.replace(/<a:spAutoFit\/>/g, '<a:noAutofit/>');
            return modifiedShape;
          }
          // Keep wrapping for the description paragraph shapes (stripping XML tags to handle split placeholders)
          const plainText = spMatch.replace(/<[^>]+>/g, '');
          const keepWrap = /participat|congratulat|appreciat|successfully|member|team|role|hackathon|project|certificate type/i.test(plainText);
          if (keepWrap) {
            return spMatch;
          }
          // Also keep wrapping for the approval info text box to let it wrap on exactly two lines
          if (spMatch.includes('Approved by') || spMatch.includes('AICTE')) {
            return spMatch;
          }
          // For all other shapes, force wrap="none" in <a:bodyPr>
          return spMatch.replace(/<a:bodyPr\b([^>]*)\/?>/g, (m, attrs) => {
            const isSelfClosing = m.endsWith('/>');
            let cleanAttrs = attrs.trim();
            if (cleanAttrs.endsWith('/')) {
              cleanAttrs = cleanAttrs.slice(0, -1).trim();
            }
            if (cleanAttrs.includes('wrap=')) {
              cleanAttrs = cleanAttrs.replace(/wrap="[^"]*"/, 'wrap="none"');
            } else {
              cleanAttrs += ' wrap="none"';
            }
            return `<a:bodyPr ${cleanAttrs}${isSelfClosing ? '/>' : '>'}`;
          });
        });

        // Clean up character spacing (spc) attribute on runs containing placeholders to prevent spacing artifacts (like "Certifi cate")
        slideXml = slideXml.replace(/(<a:r\b[^>]*>(?:(?!<\/a:r>).)*?<a:rPr\b[^>]*)\bspc="[^"]*"([^>]*>(?:(?!<\/a:r>).)*?<a:t>[^<]*?(?:\{\{|\[\[|TCEK)[^<]*?<\/a:t>.*?<\/a:r>)/gs, '$1$2');

        // Perform placeholder replacements
        Object.entries(replacements).forEach(([key, val]) => {
          // Escaping HTML/XML special characters
          const safeValue = String(val)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
          const xmlKey = key
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

          const keysToTry = Array.from(new Set([key, xmlKey]));

          keysToTry.forEach((k) => {
            // Allow PowerPoint XML tags inside the placeholder characters
            const keyChars = k.split('');
            const regexPattern = keyChars
              .map((c) => c.replace(/[{}[\]\\^$.|?*+()]/g, '\\$&'))
              .join('(?:<[^>]+>)*');

            const flexRegex = new RegExp(regexPattern, 'g');
            slideXml = slideXml.replace(flexRegex, safeValue);
          });

          // Post-replacement formatting for CERTIFICATE TYPE to keep it standard (non-bold, Cardo font)
          if (key === '{{CERTIFICATE TYPE}}' || key === '[[CERTIFICATE TYPE]]') {
            const escapedVal = safeValue.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const runRegex = new RegExp(`(<a:rPr\\b[^>]*>)([^<]*<a:latin\\b[^>]*typeface="Cardo Bold"[^>]*>[^<]*)(</a:rPr>)?\\s*<a:t>${escapedVal}</a:t>`, 'g');
            slideXml = slideXml.replace(runRegex, (match, rPr, latin, rPrClose) => {
              let cleanRPr = rPr.replace(/\bb="1"/g, '').replace(/\bb="true"/g, '');
              let cleanLatin = latin.replace(/typeface="Cardo Bold"/g, 'typeface="Cardo"');
              return `${cleanRPr}${cleanLatin}${rPrClose || ''}<a:t>${safeValue}</a:t>`;
            });
          }
        });

        // Force font family mappings to match Linux system font registration names
        slideXml = slideXml.replace(/typeface=["']Bebas\s+Neue\s+Bold["']/gi, 'typeface="Bebas Neue"');
        slideXml = slideXml.replace(/typeface=["']Cardo\s+Bold["']/gi, 'typeface="Cardo"');
        slideXml = slideXml.replace(/typeface=["']Cormorant\s+Garamond\s+Bold["']/gi, 'typeface="Cormorant Garamond"');
        slideXml = slideXml.replace(/typeface=["']Caladea\s+Bold["']/gi, 'typeface="Caladea"');
        slideXml = slideXml.replace(/typeface=["']Inria\s+Serif\s+Bold["']/gi, 'typeface="Inria Serif"');
        slideXml = slideXml.replace(/typeface=["']Palatino\s+Bold["']/gi, 'typeface="Palatino"');

        zip.file(filename, slideXml);
      }
    }
  });

  const buffer = zip.generate({ type: 'nodebuffer' });
  fs.writeFileSync(outputPath, buffer);
}

let win32Lock = Promise.resolve();

// Convert PPTX to PDF (Cross-platform support: PowerPoint COM on Windows, LibreOffice soffice on Linux/others)
async function convertPptxToPdf(inputPptxPath: string, outputPdfPath: string): Promise<void> {
  const absInput = path.resolve(inputPptxPath);
  const absOutput = path.resolve(outputPdfPath);

  // 1. If on Windows, try Native PowerPoint COM automation first (sequentially using win32Lock)
  if (process.platform === 'win32') {
    const currentLock = win32Lock;
    let releaseLock: () => void = () => { };
    win32Lock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    await currentLock;

    try {
      const escapedInput = absInput.replace(/\\/g, '\\\\');
      const escapedOutput = absOutput.replace(/\\/g, '\\\\');

      const psCommand = `
        $PowerPoint = New-Object -ComObject PowerPoint.Application;
        $Presentation = $PowerPoint.Presentations.Open('${escapedInput}');
        $Presentation.SaveAs('${escapedOutput}', 32);
        $Presentation.Close();
        $PowerPoint.Quit();
      `;

      await execPromise(`powershell -Command "${psCommand.replace(/\n/g, ' ')}"`);
      if (fs.existsSync(absOutput)) {
        return;
      }
      throw new Error("PowerPoint COM completed but PDF file was not created.");
    } catch (err: any) {
      console.warn("PowerPoint COM conversion failed. Falling back to LibreOffice...", err.message);
    } finally {
      releaseLock();
    }
  }

  // 2. Headless LibreOffice conversion (soffice) for Linux/others
  const outputDir = path.dirname(absOutput);
  const uniqueProfileDir = path.join(outputDir, `soffice-profile-${Math.random().toString(36).substring(7)}`);
  try {
    // We add -env:UserInstallation to avoid locking issues in parallel executions
    await execPromise(`soffice "-env:UserInstallation=file://${uniqueProfileDir.replace(/\\/g, '/')}" --headless --convert-to pdf --outdir "${outputDir}" "${absInput}"`);

    // LibreOffice auto-saves output as [<pptx_basename>].pdf in outdir.
    // Verify file and rename to the requested outputPdfPath if needed.
    const expectedName = path.basename(absInput, path.extname(absInput)) + '.pdf';
    const tempOutput = path.join(outputDir, expectedName);

    if (tempOutput !== absOutput && fs.existsSync(tempOutput)) {
      if (fs.existsSync(absOutput)) fs.unlinkSync(absOutput);
      fs.renameSync(tempOutput, absOutput);
    }
  } catch (err: any) {
    console.error("LibreOffice PDF conversion failed:", err.message);
    throw new Error(`PDF generation failed: No conversion engine (PowerPoint COM or LibreOffice) is available on this environment. Details: ${err.message}`);
  } finally {
    if (fs.existsSync(uniqueProfileDir)) {
      try {
        fs.rmSync(uniqueProfileDir, { recursive: true, force: true });
      } catch (err) {
        console.warn("Failed to clean up LibreOffice profile directory:", err);
      }
    }
  }
}

// Convert multiple PPTX files to PDF in a single batch (highly optimized to minimize LibreOffice startup overhead)
async function convertPptxToPdfBatch(inputPptxPaths: string[], outputDir: string): Promise<void> {
  if (inputPptxPaths.length === 0) return;

  const resolvedOutputDir = path.resolve(outputDir);

  if (process.platform === 'win32') {
    // Windows: convert sequentially using powerpoint COM
    for (const inputPath of inputPptxPaths) {
      const expectedPdfName = path.basename(inputPath, path.extname(inputPath)) + '.pdf';
      const destPdfPath = path.join(resolvedOutputDir, expectedPdfName);
      await convertPptxToPdf(inputPath, destPdfPath);
    }
    return;
  }

  // Linux (Render): Run headless LibreOffice in batch mode with a unique environment profile
  const uniqueProfileDir = path.join(resolvedOutputDir, `soffice-profile-batch-${Math.random().toString(36).substring(7)}`);
  try {
    const escapedInputs = inputPptxPaths.map(p => `"${path.resolve(p)}"`).join(' ');
    await execPromise(`soffice "-env:UserInstallation=file://${uniqueProfileDir.replace(/\\/g, '/')}" --headless --convert-to pdf --outdir "${resolvedOutputDir}" ${escapedInputs}`);
  } catch (err: any) {
    console.error("LibreOffice PDF batch conversion failed:", err.message);
    throw new Error(`PDF batch generation failed. Details: ${err.message}`);
  } finally {
    if (fs.existsSync(uniqueProfileDir)) {
      try {
        fs.rmSync(uniqueProfileDir, { recursive: true, force: true });
      } catch (err) {
        console.warn("Failed to clean up batch LibreOffice profile directory:", err);
      }
    }
  }
}

// Helper function for concurrent execution with a limit
async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  const promises: Promise<void>[] = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const currentIndex = index++;
      const item = items[currentIndex];
      try {
        results[currentIndex] = await fn(item, currentIndex);
      } catch (err) {
        console.error(`Error in worker at index ${currentIndex}:`, err);
      }
    }
  }

  const numWorkers = Math.min(limit, items.length);
  for (let i = 0; i < numWorkers; i++) {
    promises.push(worker());
  }

  await Promise.all(promises);
  return results;
}

// Helper function to send email via Google Apps Script proxy (bypassing Render SMTP block) with automatic retry
async function postToAppsScript(url: string, payload: any, maxRetries = 3): Promise<any> {
  let lastError: any = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      return data;
    } catch (err: any) {
      lastError = err;
      if (attempt < maxRetries) {
        const delayMs = attempt * 1500;
        console.warn(`[Apps Script Proxy] Attempt ${attempt} failed (${err.message}). Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}

// In-memory verification code store (expires after 10 minutes)
interface EmailVerificationEntry {
  code: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
}

const emailVerificationStore = new Map<string, EmailVerificationEntry>();
const verifiedEmailsStore = new Map<string, number>();

async function sendVerificationCodeEmail(toEmail: string, code: string): Promise<boolean> {
  const subject = 'Your Verification Code - R&D Club TCEK';
  const text = `Dear Applicant,

Your 6-digit email verification code is: ${code}

This code is valid for 15 minutes. Please enter it on the registration form to verify your email address.

If you did not request this verification code, please ignore this email.

Best regards,
Research & Development (R&D) Club
Trinity College of Engineering & Technology, Peddapalli`;

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #059669; margin: 0; font-size: 22px; font-weight: 700;">R&D Club Application Portal</h2>
        <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Trinity College of Engineering & Technology (Autonomous)</p>
      </div>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; text-align: center; margin: 20px 0;">
        <p style="color: #334155; font-size: 14px; margin: 0 0 12px 0; font-weight: 500;">Your 6-digit email verification code is:</p>
        <div style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #059669; font-family: monospace; background: #ffffff; padding: 12px; border-radius: 6px; border: 1px dashed #cbd5e1; display: inline-block;">
          ${code}
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin: 12px 0 0 0;">Valid for 15 minutes. Do not share this code with anyone.</p>
      </div>
      <p style="color: #475569; font-size: 13px; line-height: 1.6; margin: 16px 0;">
        Please enter this code in the email verification field to complete your application.
      </p>
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0 16px 0;" />
      <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
        © 2026 R&D Cell, Trinity College of Engineering & Technology. All rights reserved.
      </p>
    </div>
  `;

  if (process.env.GMAIL_HTTP_PROXY_URL) {
    try {
      const payload = {
        to: toEmail,
        subject,
        text,
        html
      };
      const res = await postToAppsScript(process.env.GMAIL_HTTP_PROXY_URL, payload);
      if (res && res.success) {
        return true;
      }
    } catch (e: any) {
      console.warn("[Email Verification] Apps Script Proxy failed, falling back to direct SMTP:", e.message);
    }
  }

  // Fallback to direct SMTP via Nodemailer
  await transporter.sendMail({
    from: SENDER_EMAIL,
    to: toEmail,
    subject,
    text,
    html
  });
  return true;
}

// Endpoint: Send verification code to email
app.post('/api/send-email-verification', sensitiveLimiter, async (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  if (!emailRegex.test(trimmed)) {
    return res.status(400).json({ error: 'The email address entered is incorrect. Please enter the correct email address (e.g. name@domain.com).' });
  }

  // Rate limiting per email: require 30s cooldown between sends
  const existing = emailVerificationStore.get(trimmed);
  const now = Date.now();
  if (existing && (now - existing.lastSentAt) < 30000) {
    const waitSecs = Math.ceil((30000 - (now - existing.lastSentAt)) / 1000);
    return res.status(429).json({ error: `Please wait ${waitSecs} seconds before requesting another code.` });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = now + 15 * 60 * 1000; // 15 minutes

  emailVerificationStore.set(trimmed, {
    code,
    expiresAt,
    attempts: 0,
    lastSentAt: now
  });

  try {
    await sendVerificationCodeEmail(trimmed, code);
    console.log(`[Email Verification] Verification code dispatched to: ${trimmed} (valid for 15 mins)`);
    return res.json({
      success: true,
      message: `Verification code sent to ${trimmed} (valid for 15 minutes). Please check your inbox (and spam folder).`
    });
  } catch (err: any) {
    console.error(`[Email Verification] Failed to send code to ${trimmed}:`, err);
    emailVerificationStore.delete(trimmed);
    return res.status(500).json({ error: `Failed to deliver verification code email: ${err.message}` });
  }
});

// Endpoint: Verify the 6-digit code
app.post('/api/verify-email-code', sensitiveLimiter, async (req, res) => {
  const { email, code } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email address is required. Please enter the correct email address.' });
  }
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Please enter the 6-digit verification code.' });
  }

  const trimmedEmail = email.trim().toLowerCase();
  const trimmedCode = code.trim();

  const record = emailVerificationStore.get(trimmedEmail);

  if (!record) {
    return res.status(400).json({
      error: 'No active verification code found for this email. Please enter the correct email address and click Send OTP.'
    });
  }

  if (Date.now() > record.expiresAt) {
    emailVerificationStore.delete(trimmedEmail);
    return res.status(400).json({
      error: 'Verification code has expired. Please enter the correct email address and click Send OTP to request a new code.'
    });
  }

  record.attempts += 1;

  if (record.code !== trimmedCode) {
    if (record.attempts >= 5) {
      emailVerificationStore.delete(trimmedEmail);
      return res.status(400).json({
        error: 'Too many incorrect attempts. Please enter the correct email address and click Send OTP to receive a new code.'
      });
    }
    return res.status(400).json({
      error: `Incorrect verification code (${5 - record.attempts} attempts remaining). Please enter the correct code, or enter the correct email address.`
    });
  }

  // Verification succeeded!
  emailVerificationStore.delete(trimmedEmail);
  verifiedEmailsStore.set(trimmedEmail, Date.now() + 60 * 60 * 1000); // verified for 1 hour

  return res.json({
    success: true,
    verified: true,
    message: 'Email address verified successfully!'
  });
});

// 14. Bulk Send Offer Letters to Approved Coordinators
app.post('/api/admin/bulk-send/offers', authenticateToken, async (req: AuthenticatedRequest, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendLog = (message: string, progress: number, isDone = false) => {
    res.write(`data: ${JSON.stringify({ message, progress, isDone })}\n\n`);
  };

  try {
    sendLog("Initializing email service...", 5);

    // 1. Fetch template from DB
    const templateRes = await db.execute({
      sql: "SELECT data_base64 FROM templates WHERE name = ?",
      args: ["offer_letter"]
    });

    if (templateRes.rows.length === 0) {
      res.write(`data: ${JSON.stringify({ error: "Offer letter template not found in database." })}\n\n`);
      res.end();
      return;
    }

    const templateBase64 = templateRes.rows[0].data_base64 as string;
    const templateBuffer = Buffer.from(templateBase64, 'base64');

    sendLog("Fetching recipient details...", 10);

    // 2. Fetch approved, unsent applications
    const appsRes = await db.execute("SELECT * FROM club_applications WHERE status = 'approved' AND (offer_sent = 0 OR offer_sent IS NULL)");
    const approvedApps = appsRes.rows;

    if (approvedApps.length === 0) {
      sendLog("No pending approved student coordinator records found.", 100, true);
      res.end();
      return;
    }

    sendLog(`Found ${approvedApps.length} approved coordinators pending offer letters. Starting bulk dispatch...`, 15);

    let successCount = 0;
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const TODAY_DATE = `${dd}-${mm}-${yyyy}`;

    // 3. Generate customized PPTX templates in-memory/disk
    sendLog("Generating custom PowerPoint templates...", 20);
    const tasks = approvedApps.map((app: any) => {
      const studentName = app.full_name as string;
      const recipientEmail = app.email as string;
      const id = app.id as number;
      const branch = app.branch as string;
      const year = app.year_of_study as string;

      const refNo = `R&D/COORD/OFFER/2026-2027/${String(id).padStart(3, '0')}`;
      const yearBranch = `${year} & ${branch}`;
      const deptName = branch;

      const safeName = studentName.replace(/[^a-zA-Z0-9_\s]/g, '').trim();

      // Name PPTX matching expected PDF name so LibreOffice writes directly to correct PDF filename
      const tempPptx = path.join(process.cwd(), `Offer_Letter_${safeName}_${id}.pptx`);
      const pdfFilename = path.join(process.cwd(), `Offer_Letter_${safeName}_${id}.pdf`);

      const replacements = {
        '{{R&D/COORD/OFFER/2026-2027/001}}': refNo,
        '{{Year & Branch}}': yearBranch,
        '{{Department Name}}': deptName,
        '{{Student Name}}': studentName,
        '{{Data}}': TODAY_DATE,
        '{{Date}}': TODAY_DATE,
        'R&D/COORD/OFFER/2026-2027/001': refNo,
        '[Year & Branch]': yearBranch,
        '[Department Name]': deptName,
        '[Student Name]': studentName
      };

      replacePlaceholdersInPptx(templateBuffer, tempPptx, replacements);

      return {
        app,
        id,
        studentName,
        recipientEmail,
        deptName,
        yearBranch,
        safeName,
        tempPptx,
        pdfFilename
      };
    });

    // 4. Batch convert all PPTX to PDF (extremely fast, initializes LibreOffice once)
    sendLog("Converting all templates to PDF in a single batch...", 30);
    const pptxPaths = tasks.map(t => t.tempPptx);
    await convertPptxToPdfBatch(pptxPaths, process.cwd());

    // 5. Send emails concurrently (up to 10 concurrently since it is lightweight HTTP network calls)
    sendLog("Dispatching emails...", 50);
    let completedTasks = 0;

    const emailConcurrency = process.env.GMAIL_HTTP_PROXY_URL ? 1 : 5;
    await runWithConcurrency(tasks, emailConcurrency, async (task) => {
      const { id, studentName, recipientEmail, deptName, yearBranch, safeName, tempPptx, pdfFilename } = task;
      const progressValBefore = Math.floor(50 + (completedTasks / tasks.length) * 45);
      sendLog(`Sending email to: ${studentName} (${recipientEmail})...`, progressValBefore);

      const mailOptions = {
        from: SENDER_EMAIL,
        to: recipientEmail,
        subject: `Offer of Appointment – Student Coordinator (R&D Cell) | ${studentName}`,
        text: `Dear ${studentName},

Congratulations!

The Research & Development (R&D) Cell of Trinity College of Engineering & Technology (Autonomous), Peddapalli, is pleased to offer you the role of Student Coordinator – ${deptName || yearBranch} for the academic year 2026–2027.

Please find attached your official offer letter (Offer_Letter_${safeName}.pdf).

We look forward to your active participation in building a vibrant research culture in our institution.

Best regards,

Dr. Mani Ganesh / Dr. Vootla Ashok Kumar
R&D Cell
Trinity College of Engineering & Technology (Autonomous), Peddapalli`,
        attachments: [
          {
            filename: `Offer_Letter_${safeName}.pdf`,
            path: pdfFilename
          }
        ]
      };

      try {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!recipientEmail || !emailRegex.test(recipientEmail)) {
          throw new Error(`Invalid email address format: "${recipientEmail}"`);
        }

        if (!fs.existsSync(pdfFilename)) {
          throw new Error("PDF generation failed during batch process.");
        }

        // Send via Proxy or Nodemailer SMTP
        if (process.env.GMAIL_HTTP_PROXY_URL) {
          const attachmentContent = fs.readFileSync(pdfFilename);
          const attachmentBase64 = attachmentContent.toString('base64');
          const payload = {
            to: recipientEmail,
            subject: mailOptions.subject,
            text: mailOptions.text,
            attachments: [
              {
                filename: `Offer_Letter_${safeName}.pdf`,
                base64: attachmentBase64,
                mimeType: 'application/pdf'
              }
            ]
          };
          await new Promise(r => setTimeout(r, 600));
          const proxyRes = await postToAppsScript(process.env.GMAIL_HTTP_PROXY_URL, payload);
          if (!proxyRes.success) {
            throw new Error(`Google Apps Script Proxy failed: ${proxyRes.error}`);
          }
        } else {
          await transporter.sendMail(mailOptions);
        }

        // Update DB
        await db.execute({
          sql: "UPDATE club_applications SET offer_sent = 1 WHERE id = ?",
          args: [id]
        });

        // Log Activity
        await db.execute({
          sql: "INSERT INTO activity_logs (username, action, details) VALUES (?, ?, ?)",
          args: [
            req.user?.username || 'unknown',
            "Send Offer Letter",
            `Emailed Club Offer Letter to: ${studentName} (${recipientEmail})`
          ]
        });

        successCount++;
      } catch (err: any) {
        console.error(`Failed to process offer for ${studentName}:`, err.message);
        sendLog(`Failed for ${studentName}: ${err.message}`, Math.floor(50 + ((completedTasks + 1) / tasks.length) * 45));
      } finally {
        completedTasks++;
        const progressValAfter = Math.floor(50 + (completedTasks / tasks.length) * 45);
        sendLog(`Completed: ${studentName}`, progressValAfter);

        // Cleanup temp files
        if (fs.existsSync(tempPptx)) fs.unlinkSync(tempPptx);
        if (fs.existsSync(pdfFilename)) fs.unlinkSync(pdfFilename);
      }
    });

    notifySyncClients("REFRESH_APPLICATIONS");
    sendLog(`Successfully sent ${successCount} offer letters.`, 95);
    sendLog("Process completed successfully.", 100, true);
    res.end();
  } catch (err: any) {
    console.error("Bulk offers error:", err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// 15. Bulk Send Certificates to Approved Event Registrants
// 15. Bulk Send Certificates to Approved Event Registrants
app.post('/api/admin/bulk-send/certificates', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { eventTitle, certificateTypeText } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendLog = (message: string, progress: number, isDone = false) => {
    res.write(`data: ${JSON.stringify({ message, progress, isDone })}\n\n`);
  };

  if (!eventTitle) {
    res.write(`data: ${JSON.stringify({ error: "Event title is required for generating certificates." })}\n\n`);
    res.end();
    return;
  }

  try {
    sendLog("Initializing email service...", 5);

    // 1. Fetch templates from DB
    let partTemplateRes = await db.execute({
      sql: "SELECT data_base64 FROM templates WHERE name = ?",
      args: ["certificate_participation"]
    });
    if (partTemplateRes.rows.length === 0) {
      partTemplateRes = await db.execute({
        sql: "SELECT data_base64 FROM templates WHERE name = ?",
        args: ["certificate"]
      });
    }

    const appTemplateRes = await db.execute({
      sql: "SELECT data_base64 FROM templates WHERE name = ?",
      args: ["certificate_appreciation"]
    });

    if (partTemplateRes.rows.length === 0) {
      res.write(`data: ${JSON.stringify({ error: "Default certificate template not found in database." })}\n\n`);
      res.end();
      return;
    }

    const partTemplateBuffer = Buffer.from(partTemplateRes.rows[0].data_base64 as string, 'base64');
    const appTemplateBuffer = appTemplateRes.rows.length > 0
      ? Buffer.from(appTemplateRes.rows[0].data_base64 as string, 'base64')
      : partTemplateBuffer; // Fallback to participation template if appreciation template is missing

    // 2. Fetch event details from DB
    const eventRes = await db.execute({
      sql: "SELECT date FROM events WHERE title = ?",
      args: [eventTitle]
    });

    const eventDate = eventRes.rows.length > 0 ? eventRes.rows[0].date as string : '03 August 2026';

    sendLog("Fetching recipient details...", 10);

    // 3. Fetch unsent registrations
    const regsRes = await db.execute({
      sql: "SELECT * FROM event_registrations WHERE event_name = ? AND (certificate_sent = 0 OR certificate_sent IS NULL)",
      args: [eventTitle]
    });
    const registrations = regsRes.rows;

    if (registrations.length === 0) {
      sendLog(`No registrations pending certificates found for: ${eventTitle}.`, 100, true);
      res.end();
      return;
    }

    sendLog(`Found ${registrations.length} attendees pending certificates. Starting bulk dispatch...`, 15);

    let successCount = 0;

    // 4. Generate customized PPTX templates on disk
    sendLog("Generating custom PowerPoint templates...", 20);
    const tasks = registrations.map((reg: any) => {
      const studentName = reg.full_name as string;
      const recipientEmail = reg.email as string;
      const id = reg.id as number;
      const actionText = reg.status || 'Participation';
      const isAppreciation = actionText !== 'Participation' && actionText !== 'participated' && actionText !== 'participation';

      const safeName = studentName.replace(/[^a-zA-Z0-9_\s]/g, '').trim();
      // Name PPTX matching expected PDF name so LibreOffice writes directly to correct PDF filename
      const tempPptx = path.join(process.cwd(), `Certificate_${safeName}_${id}.pptx`);
      const pdfFilename = path.join(process.cwd(), `Certificate_${safeName}_${id}.pdf`);

      const uniqueSuffix = crypto.randomBytes(4).toString('hex').toUpperCase();
      const certId = `TCEK/RD/2026-${uniqueSuffix}`;

      const replacements = {
        '{{PARTICIPANT NAME}}': studentName,
        '{{EVENT NAME}}': eventTitle,
        '{{DATE}}': eventDate,
        '{{CERTIFICATE TYPE}}': actionText,
        '{{CERTIFICATE ID}}': certId,
        '[[PARTICIPANT NAME]]': studentName,
        '[[EVENT NAME]]': eventTitle,
        '[[DATE]]': eventDate,
        '[[CERTIFICATE TYPE]]': actionText,
        '[[CERTIFICATE ID]]': certId,
        'TCEK/RD/2026/0001': certId
      };

      const selectedBuffer = isAppreciation ? appTemplateBuffer : partTemplateBuffer;
      replacePlaceholdersInPptx(selectedBuffer, tempPptx, replacements);

      return {
        reg,
        id,
        certId,
        studentName,
        recipientEmail,
        safeName,
        tempPptx,
        pdfFilename,
        isAppreciation
      };
    });

    // 5. Batch convert all PPTX to PDF using LibreOffice (runs once)
    sendLog("Converting all templates to PDF in a single batch...", 30);
    const pptxPaths = tasks.map(t => t.tempPptx);
    await convertPptxToPdfBatch(pptxPaths, process.cwd());

    // 6. Send emails concurrently (up to 10 concurrently since it is lightweight HTTP network calls)
    sendLog("Dispatching emails...", 50);
    let completedTasks = 0;

    const emailConcurrency = process.env.GMAIL_HTTP_PROXY_URL ? 1 : 5;
    await runWithConcurrency(tasks, emailConcurrency, async (task) => {
      const { id, certId, studentName, recipientEmail, safeName, tempPptx, pdfFilename, isAppreciation } = task;
      const progressValBefore = Math.floor(50 + (completedTasks / tasks.length) * 45);
      sendLog("Sending email...", progressValBefore);

      const mailOptions = {
        from: SENDER_EMAIL,
        to: recipientEmail,
        subject: isAppreciation 
          ? 'Certificate of Appreciation | Trinity College of Engineering & Technology'
          : 'Certificate of Participation | Trinity College of Engineering & Technology',
        text: isAppreciation
          ? `Dear ${studentName},

We are pleased to present you with the Certificate of Appreciation for your contribution/involvement in the ${eventTitle} held on ${eventDate} organized by Trinity College of Engineering and Technology, Peddapalli.

Please find attached your Certificate of Appreciation (Certificate_${safeName}.pdf).

We appreciate your dedication, outstanding effort, and active engagement, and wish you the very best in all your future endeavors.

Best regards,

R&D Cell
Trinity College of Engineering & Technology (Autonomous), Peddapalli`
          : `Dear ${studentName},

Thank you for your enthusiastic participation in the ${eventTitle} held on ${eventDate} organized by Trinity College of Engineering and Technology, Peddapalli.

Please find attached your Certificate of Participation (Certificate_${safeName}.pdf).

We appreciate your innovative thinking and research efforts, and wish you continued success in your academic and professional endeavors.

Best regards,

R&D Cell
Trinity College of Engineering & Technology (Autonomous), Peddapalli`,
        attachments: [
          {
            filename: `Certificate_${safeName}.pdf`,
            path: pdfFilename
          }
        ]
      };

      try {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!recipientEmail || !emailRegex.test(recipientEmail)) {
          throw new Error(`Invalid email address format: "${recipientEmail}"`);
        }

        if (!fs.existsSync(pdfFilename)) {
          throw new Error("PDF generation failed during batch process.");
        }

        // Send via Proxy or Nodemailer SMTP
        if (process.env.GMAIL_HTTP_PROXY_URL) {
          const attachmentContent = fs.readFileSync(pdfFilename);
          const attachmentBase64 = attachmentContent.toString('base64');
          const payload = {
            to: recipientEmail,
            subject: mailOptions.subject,
            text: mailOptions.text,
            attachments: [
              {
                filename: `Certificate_${safeName}.pdf`,
                base64: attachmentBase64,
                mimeType: 'application/pdf'
              }
            ]
          };
          await new Promise(r => setTimeout(r, 600));
          const proxyRes = await postToAppsScript(process.env.GMAIL_HTTP_PROXY_URL, payload);
          if (!proxyRes.success) {
            throw new Error(`Google Apps Script Proxy failed: ${proxyRes.error}`);
          }
        } else {
          await transporter.sendMail(mailOptions);
        }

        // Update DB
        await db.execute({
          sql: "UPDATE event_registrations SET certificate_sent = 1, certificate_id = ? WHERE id = ?",
          args: [certId, id]
        });

        // Log Activity
        await db.execute({
          sql: "INSERT INTO activity_logs (username, action, details) VALUES (?, ?, ?)",
          args: [
            req.user?.username || 'unknown',
            "Send Certificate",
            `Emailed Event Certificate for "${eventTitle}" to: ${studentName} (${recipientEmail})`
          ]
        });

        successCount++;
      } catch (err: any) {
        console.error(`Failed to process certificate for ${studentName}:`, err.message);
        sendLog(`Failed for ${studentName}: ${err.message}`, Math.floor(50 + ((completedTasks + 1) / tasks.length) * 45));
      } finally {
        completedTasks++;
        const progressValAfter = Math.floor(50 + (completedTasks / tasks.length) * 45);
        sendLog(`Completed: ${studentName}`, progressValAfter);

        // Cleanup temp files
        if (fs.existsSync(tempPptx)) fs.unlinkSync(tempPptx);
        if (fs.existsSync(pdfFilename)) fs.unlinkSync(pdfFilename);
      }
    });

    notifySyncClients("REFRESH_APPLICATIONS");
    sendLog(`Successfully sent ${successCount} certificates.`, 95);
    sendLog("Process completed successfully.", 100, true);
    res.end();
  } catch (err: any) {
    console.error("Bulk certificates error:", err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// 15.5. Bulk Send Certificates to Approved Hackathon Registrants
app.post('/api/admin/bulk-send/hackathon-certificates', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { hackathonName, certificateTypeText } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendLog = (message: string, progress: number, isDone = false) => {
    res.write(`data: ${JSON.stringify({ message, progress, isDone })}\n\n`);
  };

  if (!hackathonName) {
    res.write(`data: ${JSON.stringify({ error: "Hackathon name is required for generating certificates." })}\n\n`);
    res.end();
    return;
  }

  try {
    sendLog("Initializing email service...", 5);

    // 1. Fetch template from DB
    let templateRes = await db.execute({
      sql: "SELECT data_base64 FROM templates WHERE name = ?",
      args: ["certificate_hackathon"]
    });
    if (templateRes.rows.length === 0) {
      templateRes = await db.execute({
        sql: "SELECT data_base64 FROM templates WHERE name = ?",
        args: ["certificate_participation"]
      });
    }
    if (templateRes.rows.length === 0) {
      templateRes = await db.execute({
        sql: "SELECT data_base64 FROM templates WHERE name = ?",
        args: ["certificate"]
      });
    }

    if (templateRes.rows.length === 0) {
      res.write(`data: ${JSON.stringify({ error: "No certificate template found in database." })}\n\n`);
      res.end();
      return;
    }

    const templateBuffer = Buffer.from(templateRes.rows[0].data_base64 as string, 'base64');

    // 2. Fetch hackathon details from DB for date
    const eventRes = await db.execute({
      sql: "SELECT date FROM events WHERE title = ?",
      args: [hackathonName]
    });
    const hackathonDate = eventRes.rows.length > 0 ? eventRes.rows[0].date as string : 'September 11-13, 2026';

    sendLog("Fetching approved unsent team registrations...", 10);

    // 3. Fetch approved teams where certificate_sent = 0
    const teamsRes = await db.execute({
      sql: "SELECT * FROM hackathon_registrations WHERE hackathon_name = ? AND status = 'approved' AND (certificate_sent = 0 OR certificate_sent IS NULL)",
      args: [hackathonName]
    });
    const approvedTeams = teamsRes.rows;

    if (approvedTeams.length === 0) {
      sendLog(`No approved team registrations pending certificates found for: ${hackathonName}.`, 100, true);
      res.end();
      return;
    }

    sendLog(`Found ${approvedTeams.length} approved teams pending certificates. Generating recipient tasks...`, 15);

    // 4. Build individual recipient tasks for leader + members
    const tasks: any[] = [];
    const teamSentCounts: { [key: number]: { total: number; sent: number } } = {};

    approvedTeams.forEach((team: any) => {
      const teamId = team.id as number;
      const teamName = team.team_name as string;
      const projectTitle = team.project_title as string;
      let validMembersCount = 0;
      let parsedMembers: any[] = [];

      try {
        parsedMembers = typeof team.members === 'string' 
          ? JSON.parse(team.members || '[]')
          : team.members || [];
      } catch (e) {
        console.error(`Failed to parse members for team ID ${teamId}:`, e);
      }

      // Filter members to ensure they have valid names and emails
      const filteredMembers = parsedMembers.filter((m: any) => m && m.fullName && m.fullName.trim() && m.email && m.email.trim());
      validMembersCount = filteredMembers.length;

      teamSentCounts[teamId] = {
        total: 1 + validMembersCount, // leader + valid members
        sent: 0
      };

      // Add team leader task
      tasks.push({
        teamId,
        teamName,
        projectTitle,
        participantName: team.leader_name as string,
        recipientEmail: team.leader_email as string,
        roleIndex: 1, // leader is 1st member
        isLeader: true,
        certificateType: team.certificate_type || 'Participation',
        participantPhone: team.leader_phone as string,
        role: team.leader_role as string,
        year: team.leader_year || null,
        branch: team.leader_branch || null,
        institution: team.leader_institution || null
      });

      // Add other team members tasks
      filteredMembers.forEach((m: any, idx: number) => {
        tasks.push({
          teamId,
          teamName,
          projectTitle,
          participantName: m.fullName.trim(),
          recipientEmail: m.email.trim(),
          roleIndex: idx + 2,
          isLeader: false,
          certificateType: team.certificate_type || 'Participation',
          participantPhone: m.phone || null,
          role: m.role || 'Student',
          year: m.year || null,
          branch: m.branch || null,
          institution: m.institution || null
        });
      });
    });

    if (tasks.length === 0) {
      sendLog("No valid recipient records found.", 100, true);
      res.end();
      return;
    }

    sendLog(`Created ${tasks.length} certificate tasks for all team members. Starting generation...`, 20);

    let successCount = 0;

    const processedTasks = tasks.map((task) => {
      const { teamId, teamName, projectTitle, participantName, recipientEmail, roleIndex, isLeader } = task;
      
      const safeName = participantName.replace(/[^a-zA-Z0-9_\s]/g, '').trim();
      const tempPptx = path.join(process.cwd(), `Hack_Cert_${safeName}_${teamId}_${roleIndex}.pptx`);
      const pdfFilename = path.join(process.cwd(), `Hack_Cert_${safeName}_${teamId}_${roleIndex}.pdf`);

      const uniqueSuffix = crypto.randomBytes(4).toString('hex').toUpperCase();
      const certId = `TCEK/RD/HACK/2026-${uniqueSuffix}`;
      const actionText = task.certificateType || certificateTypeText || 'Participation';
      const roleText = isLeader ? 'Team Leader' : 'Team Member';

      const replacements = {
        '{{PARTICIPANT NAME}}': participantName,
        '{{EVENT NAME}}': hackathonName,
        '{{HACKATHON NAME}}': hackathonName,
        '{{DATE}}': hackathonDate,
        '{{CERTIFICATE TYPE}}': actionText,
        '{{CERTIFICATE ID}}': certId,
        '{{ROLE}}': roleText,
        '{{TEAM NAME}}': teamName,
        '{{PROJECT TITLE}}': projectTitle,
        '[[PARTICIPANT NAME]]': participantName,
        '[[EVENT NAME]]': hackathonName,
        '[[HACKATHON NAME]]': hackathonName,
        '[[DATE]]': hackathonDate,
        '[[CERTIFICATE TYPE]]': actionText,
        '[[CERTIFICATE ID]]': certId,
        '[[ROLE]]': roleText,
        '[[TEAM NAME]]': teamName,
        '[[PROJECT TITLE]]': projectTitle,
        'TCEK/RD/2026/0001': certId,
        'TCEK/RD/2026/H0001': certId
      };

      replacePlaceholdersInPptx(templateBuffer, tempPptx, replacements);

      return {
        ...task,
        certId,
        safeName,
        tempPptx,
        pdfFilename,
        actionText
      };
    });

    // 6. Convert all PPTX to PDF in a single batch
    sendLog("Converting all certificates to PDF in a single batch...", 35);
    const pptxPaths = processedTasks.map(t => t.tempPptx);
    await convertPptxToPdfBatch(pptxPaths, process.cwd());

    // 7. Dispatch emails concurrently
    sendLog("Dispatching emails to all team members...", 50);
    let completedTasks = 0;

    const emailConcurrency = process.env.GMAIL_HTTP_PROXY_URL ? 1 : 5;
    await runWithConcurrency(processedTasks, emailConcurrency, async (task) => {
      const { teamId, teamName, projectTitle, participantName, recipientEmail, certId, safeName, tempPptx, pdfFilename, actionText } = task;
      const progressValBefore = Math.floor(50 + (completedTasks / processedTasks.length) * 45);
      sendLog(`Sending to ${participantName} (${recipientEmail})...`, progressValBefore);

      const mailOptions = {
        from: SENDER_EMAIL,
        to: recipientEmail,
        subject: `Certificate of Participation | ${hackathonName} | ${participantName}`,
        text: `Dear ${participantName},
        
Thank you for your enthusiastic participation in the ${hackathonName} held on ${hackathonDate} organized by the Research & Development (R&D) Cell of Trinity College of Engineering and Technology, Peddapalli.

Please find attached your official Certificate of Participation (Certificate_${safeName}.pdf). We appreciate your innovative ideas, outstanding team efforts, and technical presentation in Team "${teamName}"${projectTitle ? ` for the project "${projectTitle}"` : ''}.

We wish you continued success in all your future endeavors.

Best regards,

R&D Cell
Trinity College of Engineering & Technology (Autonomous), Peddapalli`,
        attachments: [
          {
            filename: `Certificate_${safeName}.pdf`,
            path: pdfFilename
          }
        ]
      };

      try {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!recipientEmail || !emailRegex.test(recipientEmail)) {
          throw new Error(`Invalid email address format: "${recipientEmail}"`);
        }

        if (!fs.existsSync(pdfFilename)) {
          throw new Error("PDF generation failed during batch process.");
        }

        // Send via Proxy or Nodemailer SMTP
        if (process.env.GMAIL_HTTP_PROXY_URL) {
          const attachmentContent = fs.readFileSync(pdfFilename);
          const attachmentBase64 = attachmentContent.toString('base64');
          const payload = {
            to: recipientEmail,
            subject: mailOptions.subject,
            text: mailOptions.text,
            attachments: [
              {
                filename: `Certificate_${safeName}.pdf`,
                base64: attachmentBase64,
                mimeType: 'application/pdf'
              }
            ]
          };
          await new Promise(r => setTimeout(r, 600));
          const proxyRes = await postToAppsScript(process.env.GMAIL_HTTP_PROXY_URL, payload);
          if (!proxyRes.success) {
            throw new Error(`Google Apps Script Proxy failed: ${proxyRes.error}`);
          }
        } else {
          await transporter.sendMail(mailOptions);
        }

        // Save certificate to DB
        await db.execute({
          sql: `INSERT OR REPLACE INTO hackathon_certificates (
                  certificate_id, registration_id, participant_name, participant_email, participant_phone,
                  role, year, branch, institution, team_name, project_title, hackathon_name, certificate_type
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            certId,
            teamId,
            participantName,
            recipientEmail,
            task.participantPhone || null,
            task.role || 'Student',
            task.year || null,
            task.branch || null,
            task.institution || null,
            teamName,
            projectTitle,
            hackathonName,
            actionText
          ]
        });

        // Update sent count for this team
        teamSentCounts[teamId].sent++;
        
        // If all members of this team have been sent their certificates, mark team as complete
        if (teamSentCounts[teamId].sent === teamSentCounts[teamId].total) {
          await db.execute({
            sql: "UPDATE hackathon_registrations SET certificate_sent = 1 WHERE id = ?",
            args: [teamId]
          });
        }

        // Log Activity for each member
        await db.execute({
          sql: "INSERT INTO activity_logs (username, action, details) VALUES (?, ?, ?)",
          args: [
            req.user?.username || 'unknown',
            "Send Hackathon Certificate",
            `Emailed Certificate for "${hackathonName}" to ${participantName} (${recipientEmail}) of team "${teamName}"`
          ]
        });

        successCount++;
      } catch (err: any) {
        console.error(`Failed to process hackathon certificate for ${participantName}:`, err.message);
        sendLog(`Failed for ${participantName}: ${err.message}`, Math.floor(50 + ((completedTasks + 1) / processedTasks.length) * 45));
      } finally {
        completedTasks++;
        const progressValAfter = Math.floor(50 + (completedTasks / processedTasks.length) * 45);
        sendLog(`Completed: ${participantName}`, progressValAfter);

        // Cleanup temp files
        if (fs.existsSync(tempPptx)) fs.unlinkSync(tempPptx);
        if (fs.existsSync(pdfFilename)) fs.unlinkSync(pdfFilename);
      }
    });

    notifySyncClients("REFRESH_APPLICATIONS");
    sendLog(`Successfully sent ${successCount} hackathon certificates.`, 95);
    sendLog("Process completed successfully.", 100, true);
    res.end();
  } catch (err: any) {
    console.error("Bulk hackathon certificates error:", err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// 17. Bulk Send Certificates to Approved Judges / Dignitaries
app.post('/api/admin/bulk-send/recognition-certificates', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { eventTitle } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendLog = (message: string, progress: number, isDone = false) => {
    res.write(`data: ${JSON.stringify({ message, progress, isDone })}\n\n`);
  };

  try {
    sendLog("Initializing email and template services...", 5);

    // 1. Fetch template from DB
    const templateRes = await db.execute({
      sql: "SELECT data_base64 FROM templates WHERE name = ?",
      args: ["certificate_recognition"]
    });

    if (templateRes.rows.length === 0) {
      res.write(`data: ${JSON.stringify({ error: "Certificate of Recognition template not found in database." })}\n\n`);
      res.end();
      return;
    }

    const templateBase64 = templateRes.rows[0].data_base64 as string;
    const templateBuffer = Buffer.from(templateBase64, 'base64');

    sendLog("Fetching approved judge & dignitary records...", 10);

    // 2. Fetch approved applications where certificate_sent = 0
    let querySql = "SELECT * FROM recognition_applications WHERE status = 'approved' AND (certificate_sent = 0 OR certificate_sent IS NULL)";
    const queryArgs: any[] = [];
    if (eventTitle && eventTitle !== 'all') {
      querySql += " AND event_name = ?";
      queryArgs.push(eventTitle);
    }
    querySql += " ORDER BY id ASC";

    const appsRes = await db.execute({
      sql: querySql,
      args: queryArgs
    });

    const applications = appsRes.rows;

    if (applications.length === 0) {
      sendLog(eventTitle && eventTitle !== 'all'
        ? `No approved judges pending certificates found for: ${eventTitle}.`
        : "No approved judges pending certificates found.", 100, true);
      res.end();
      return;
    }

    sendLog(`Found ${applications.length} approved judges/evaluators pending certificates. Starting dispatch...`, 15);

    let successCount = 0;

    // 3. Generate customized PPTX files on disk
    sendLog("Generating customized PowerPoint templates...", 20);
    const tasks = applications.map((app: any) => {
      const id = app.id as number;
      const judgeName = app.full_name as string;
      const recipientEmail = app.email as string;
      const eventName = app.event_name as string;
      const eventDate = app.event_date || 'September 14, 2026';
      const designation = app.designation as string;
      const organization = app.organization as string;

      const safeName = judgeName.replace(/[^a-zA-Z0-9_\s]/g, '').trim();
      const tempPptx = path.join(process.cwd(), `Recognition_Cert_${safeName}_${id}.pptx`);
      const pdfFilename = path.join(process.cwd(), `Recognition_Cert_${safeName}_${id}.pdf`);

      const uniqueSuffix = crypto.randomBytes(4).toString('hex').toUpperCase();
      const certId = `TCEK/RD/2026/REC-${uniqueSuffix}`;

      const replacements: Record<string, string> = {
        "{{ Judge's Full Name }}": judgeName,
        "{{Judge's Full Name}}": judgeName,
        "Judge's Full Name": judgeName,
        "{{PARTICIPANT NAME}}": judgeName,
        "{{EVENT NAME}}": eventName,
        "{{DATE}}": eventDate,
        "{{CERTIFICATE ID}}": certId,
        "TCEK/RD/2026/H0001": certId,
        "[[ Judge's Full Name ]]": judgeName,
        "[[Judge's Full Name]]": judgeName,
        "[[EVENT NAME]]": eventName,
        "[[DATE]]": eventDate,
        "[[CERTIFICATE ID]]": certId
      };

      replacePlaceholdersInPptx(templateBuffer, tempPptx, replacements);

      return {
        id,
        judgeName,
        recipientEmail,
        eventName,
        eventDate,
        designation,
        organization,
        safeName,
        tempPptx,
        pdfFilename,
        certId
      };
    });

    // 4. Batch convert PPTX to PDF using LibreOffice
    sendLog("Converting templates to PDF in batch...", 30);
    const pptxPaths = tasks.map(t => t.tempPptx);
    await convertPptxToPdfBatch(pptxPaths, process.cwd());

    // 5. Dispatch emails concurrently
    sendLog("Dispatching emails to official judges...", 50);
    let completedTasks = 0;

    const emailConcurrency = process.env.GMAIL_HTTP_PROXY_URL ? 1 : 5;
    await runWithConcurrency(tasks, emailConcurrency, async (task) => {
      const { id, judgeName, recipientEmail, eventName, eventDate, designation, organization, safeName, tempPptx, pdfFilename, certId } = task;
      const progressValBefore = Math.floor(50 + (completedTasks / tasks.length) * 45);
      sendLog(`Sending certificate to ${judgeName}...`, progressValBefore);

      const mailOptions = {
        from: SENDER_EMAIL,
        to: recipientEmail,
        subject: `Certificate of Recognition | Official Judge - ${eventName}`,
        text: `Dear ${judgeName},

We sincerely appreciate your outstanding dedication, expertise, impartiality, and fair judgment demonstrated while serving as an official Judge for ${eventName}, organized by Trinity College of Engineering and Technology, Peddapalli, and held on ${eventDate}.

Your valuable time, professional insight, and commitment to maintaining the highest standards of fairness and excellence are deeply valued by our faculty and participants.

Please find attached your official Certificate of Recognition (Certificate_${safeName}.pdf).
Certificate ID: ${certId}

With sincere appreciation and gratitude,

R&D Cell
Trinity College of Engineering & Technology (Autonomous), Peddapalli`
      };

      try {
        if (!fs.existsSync(pdfFilename)) {
          throw new Error("PDF file generation failed.");
        }

        if (process.env.GMAIL_HTTP_PROXY_URL) {
          const attachmentContent = fs.readFileSync(pdfFilename);
          const attachmentBase64 = attachmentContent.toString('base64');
          const payload = {
            to: recipientEmail,
            subject: mailOptions.subject,
            text: mailOptions.text,
            attachments: [
              {
                filename: `Certificate_${safeName}.pdf`,
                base64: attachmentBase64,
                mimeType: 'application/pdf'
              }
            ]
          };
          await new Promise(r => setTimeout(r, 600));
          const proxyRes = await postToAppsScript(process.env.GMAIL_HTTP_PROXY_URL, payload);
          if (!proxyRes.success) {
            throw new Error(`Google Apps Script Proxy failed: ${proxyRes.error}`);
          }
        } else {
          await transporter.sendMail({
            ...mailOptions,
            attachments: [
              {
                filename: `Certificate_${safeName}.pdf`,
                path: pdfFilename
              }
            ]
          });
        }

        // Update database
        await db.execute({
          sql: "UPDATE recognition_applications SET certificate_sent = 1, certificate_id = ? WHERE id = ?",
          args: [certId, id]
        });

        // Log Activity
        await db.execute({
          sql: "INSERT INTO activity_logs (username, action, details) VALUES (?, ?, ?)",
          args: [
            req.user?.username || 'unknown',
            "Send Recognition Certificate",
            `Dispatched Recognition Certificate for "${eventName}" to Judge ${judgeName} (${recipientEmail}) [Cert ID: ${certId}]`
          ]
        });

        successCount++;
      } catch (err: any) {
        console.error(`Failed to process recognition certificate for ${judgeName}:`, err.message);
        sendLog(`Failed for ${judgeName}: ${err.message}`, Math.floor(50 + ((completedTasks + 1) / tasks.length) * 45));
      } finally {
        completedTasks++;
        const progressValAfter = Math.floor(50 + (completedTasks / tasks.length) * 45);
        sendLog(`Completed: ${judgeName}`, progressValAfter);

        // Cleanup temp files
        if (fs.existsSync(tempPptx)) fs.unlinkSync(tempPptx);
        if (fs.existsSync(pdfFilename)) fs.unlinkSync(pdfFilename);
      }
    });

    notifySyncClients("REFRESH_APPLICATIONS");
    sendLog(`Successfully sent ${successCount} recognition certificates.`, 95);
    sendLog("Process completed successfully.", 100, true);
    res.end();
  } catch (err: any) {
    console.error("Bulk recognition certificates error:", err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// Debug route to list installed fonts
app.get('/api/debug-fonts', authenticateToken, async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).send("Forbidden in production mode.");
  }
  try {
    const { execSync } = require('child_process');
    let output = '';
    output += '=== fc-list custom fonts ===\n';
    output += execSync('fc-list : file family style weight | grep -E "Bebas|Cardo|Cormorant|Vibes|Caladea|Inria|Palatino" | sort').toString() + '\n';
    output += '=== fc-match tests ===\n';
    output += 'Bebas Neue Match: ' + execSync('fc-match "Bebas Neue"').toString().trim() + '\n';
    output += 'Cardo Match: ' + execSync('fc-match "Cardo"').toString().trim() + '\n';
    output += 'Cormorant Garamond Match: ' + execSync('fc-match "Cormorant Garamond"').toString().trim() + '\n';
    output += 'Great Vibes Match: ' + execSync('fc-match "Great Vibes"').toString().trim() + '\n';
    output += 'Caladea Match: ' + execSync('fc-match "Caladea"').toString().trim() + '\n';
    output += 'Inria Serif Match: ' + execSync('fc-match "Inria Serif"').toString().trim() + '\n';
    output += 'Palatino Match: ' + execSync('fc-match "Palatino"').toString().trim() + '\n';
    res.type('text/plain').send(output);
  } catch (err: any) {
    res.status(500).send("Error listing fonts: " + err.message);
  }
});

// Debug route to check embedded PDF fonts
app.get('/api/debug-pdf-fonts', authenticateToken, async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).send("Forbidden in production mode.");
  }
  try {
    const tempPptx = path.join(process.cwd(), `test_debug_temp.pptx`);
    const tempPdf = path.join(process.cwd(), `test_debug_temp.pdf`);
    
    // Read template from DB
    const templateRes = await db.execute({
      sql: "SELECT data_base64 FROM templates WHERE name = ?",
      args: ["certificate"]
    });
    if (templateRes.rows.length === 0) {
      return res.status(404).send("Template not found");
    }
    const templateBuffer = Buffer.from(templateRes.rows[0].data_base64 as string, 'base64');
    
    // Replace placeholders
    const replacements = {
      '{{PARTICIPANT NAME}}': 'Test Student',
      '{{EVENT NAME}}': 'Test Event Title',
      '{{DATE}}': '03 August 2026',
      '[[PARTICIPANT NAME]]': 'Test Student',
      '[[EVENT NAME]]': 'Test Event Title',
      '[[DATE]]': '03 August 2026'
    };
    replacePlaceholdersInPptx(templateBuffer, tempPptx, replacements);

    // Read modified slide XML snippet
    let slideXmlSnippet = '';
    const tempPptxBuffer = fs.readFileSync(tempPptx);
    const tempZip = new PizZip(tempPptxBuffer);
    const slideFile = tempZip.file('ppt/slides/slide1.xml');
    if (slideFile) {
      const slideXml = slideFile.asText();
      const idx = slideXml.indexOf('COLLEGE OF ENGINEERING AND TECHNOLOGY');
      if (idx !== -1) {
        slideXmlSnippet = slideXml.substring(idx - 250, idx + 250);
      }
    }
    
    // Convert to PDF
    await convertPptxToPdf(tempPptx, tempPdf);
    
    // Read PDF and search for /BaseFont
    const pdfContent = fs.readFileSync(tempPdf, 'binary');
    const baseFonts = pdfContent.match(/\/BaseFont\s*\/([^\s>)]+)/g) || [];
    
    // Cleanup
    if (fs.existsSync(tempPptx)) fs.unlinkSync(tempPptx);
    if (fs.existsSync(tempPdf)) fs.unlinkSync(tempPdf);
    
    res.json({
      success: true,
      slideXmlSnippet,
      baseFonts: Array.from(new Set(baseFonts))
    });
  } catch (err: any) {
    res.status(500).send("Error: " + err.message);
  }
});

// 16. Get all branches
app.get('/api/branches', async (req, res) => {
  try {
    const result = await db.execute("SELECT * FROM branches ORDER BY name ASC");
    res.status(200).json(result.rows);
  } catch (error: any) {
    console.error("Fetch branches error:", error);
    res.status(500).json({ error: "Internal server error while fetching branches." });
  }
});

// 17. Add a new branch
app.post('/api/admin/branches', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { name } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: "Branch name is required." });
  }

  try {
    const checkRes = await db.execute({
      sql: "SELECT id FROM branches WHERE name = ?",
      args: [name.trim()]
    });

    if (checkRes.rows.length > 0) {
      return res.status(400).json({ error: "Branch already exists." });
    }

    const insertRes = await db.execute({
      sql: "INSERT INTO branches (name) VALUES (?)",
      args: [name.trim()]
    });

    // Log Activity
    await db.execute({
      sql: "INSERT INTO activity_logs (username, action, details) VALUES (?, ?, ?)",
      args: [
        req.user?.username || 'unknown',
        "Add Branch",
        `Created academic department/branch: ${name.trim()}`
      ]
    });

    notifySyncClients("REFRESH_BRANCHES");
    res.status(201).json({ id: Number(insertRes.lastInsertRowid), name: name.trim() });
  } catch (error: any) {
    console.error("Add branch error:", error);
    res.status(500).json({ error: "Internal server error while adding branch." });
  }
});

// 18. Delete a branch
app.delete('/api/admin/branches/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const branchId = Number(req.params.id);
  if (isNaN(branchId)) {
    return res.status(400).json({ error: "Invalid branch ID." });
  }

  try {
    // Check if branch exists
    const findRes = await db.execute({
      sql: "SELECT name FROM branches WHERE id = ?",
      args: [branchId]
    });

    if (findRes.rows.length === 0) {
      return res.status(404).json({ error: "Branch not found." });
    }

    const branchName = findRes.rows[0].name as string;

    await db.execute({
      sql: "DELETE FROM branches WHERE id = ?",
      args: [branchId]
    });

    // Log Activity
    await db.execute({
      sql: "INSERT INTO activity_logs (username, action, details) VALUES (?, ?, ?)",
      args: [
        req.user?.username || 'unknown',
        "Delete Branch",
        `Deleted academic department/branch: ${branchName}`
      ]
    });

    notifySyncClients("REFRESH_BRANCHES");
    res.status(200).json({ success: true, message: `Successfully deleted branch: ${branchName}` });
  } catch (error: any) {
    console.error("Delete branch error:", error);
    res.status(500).json({ error: "Internal server error while deleting branch." });
  }
});

// 19. Public Certificate Verification Route (Handles both JSON metadata and dynamic PDF streaming)
app.get('/api/verify-certificate/*', sensitiveLimiter, async (req, res) => {
  let certificateId = decodeURIComponent((req.params as any)[0] || '');
  let isPdf = false;

  if (certificateId.endsWith('/pdf')) {
    isPdf = true;
    certificateId = certificateId.slice(0, -4); // Remove the '/pdf' suffix
  }
  
  if (!certificateId || certificateId.trim() === '') {
    if (isPdf) {
      return res.status(400).send("Certificate ID is required.");
    }
    return res.status(400).json({ error: "Certificate ID is required." });
  }
  
  try {
    // Resolve student registration (with legacy fallback for TCEK/RD/2026/XXXX ID)
    let parsedId: number | null = null;
    const legacyMatch = certificateId.match(/^TCEK\/RD\/2026\/(\d+)$/i);
    if (legacyMatch) {
      parsedId = parseInt(legacyMatch[1], 10);
    }

    let reg;
    let isHackathon = false;
    let isRecognition = false;
    if (parsedId !== null) {
      // Legacy fallback: only match by id if the database row does NOT contain a hyphen/suffix in its certificate_id
      const evRes = await db.execute({
        sql: "SELECT * FROM event_registrations WHERE (certificate_id = ? OR (id = ? AND (certificate_id IS NULL OR certificate_id NOT LIKE '%-%'))) AND certificate_sent = 1",
        args: [certificateId, parsedId]
      });
      if (evRes.rows.length > 0) {
        reg = evRes.rows[0];
      }
    } else {
      const evRes = await db.execute({
        sql: "SELECT * FROM event_registrations WHERE certificate_id = ? AND certificate_sent = 1",
        args: [certificateId]
      });
      if (evRes.rows.length > 0) {
        reg = evRes.rows[0];
      }
    }
    
    if (!reg) {
      // Check hackathon_certificates table
      const hackRes = await db.execute({
        sql: "SELECT * FROM hackathon_certificates WHERE certificate_id = ?",
        args: [certificateId]
      });
      if (hackRes.rows.length > 0) {
        reg = hackRes.rows[0];
        isHackathon = true;
      }
    }

    if (!reg) {
      // Check recognition_applications table
      const recRes = await db.execute({
        sql: "SELECT * FROM recognition_applications WHERE certificate_id = ? AND certificate_sent = 1",
        args: [certificateId]
      });
      if (recRes.rows.length > 0) {
        reg = recRes.rows[0];
        isRecognition = true;
      }
    }
    
    if (!reg) {
      if (isPdf) {
        return res.status(404).send("Certificate not found or not yet issued.");
      }
      return res.status(404).json({ error: "Certificate not found or not yet issued." });
    }
    
    const studentName = isHackathon ? (reg.participant_name as string) : (reg.full_name as string);
    const eventTitle = isHackathon ? (reg.hackathon_name as string) : (reg.event_name as string);
    const actionText = isHackathon 
      ? (reg.certificate_type as string || 'Participation') 
      : isRecognition 
        ? 'Certificate of Recognition (Official Judge)' 
        : (reg.status || 'Participation');
    const id = reg.id as number;

    // Fetch event details to get the exact event date
    const eventRes = await db.execute({
      sql: "SELECT date FROM events WHERE title = ?",
      args: [eventTitle]
    });
    const eventDate = eventRes.rows.length > 0 
      ? eventRes.rows[0].date as string 
      : (reg.event_date || (isHackathon ? 'September 11-13, 2026' : '03 August 2026'));

    const certId = reg.certificate_id || `TCEK/RD/2026/${String(id).padStart(4, '0')}`;

    if (isPdf) {
      // Compile and stream the original PDF certificate
      let templateRes;
      if (isRecognition) {
        templateRes = await db.execute({
          sql: "SELECT data_base64 FROM templates WHERE name = ?",
          args: ["certificate_recognition"]
        });
      } else if (isHackathon) {
        templateRes = await db.execute({
          sql: "SELECT data_base64 FROM templates WHERE name = ?",
          args: ["certificate_hackathon"]
        });
        if (templateRes.rows.length === 0) {
          templateRes = await db.execute({
            sql: "SELECT data_base64 FROM templates WHERE name = ?",
            args: ["certificate_participation"]
          });
        }
        if (templateRes.rows.length === 0) {
          templateRes = await db.execute({
            sql: "SELECT data_base64 FROM templates WHERE name = ?",
            args: ["certificate"]
          });
        }
      } else {
        const isAppreciation = actionText !== 'Participation' && actionText !== 'participated' && actionText !== 'participation';
        const templateName = isAppreciation ? "certificate_appreciation" : "certificate_participation";
        templateRes = await db.execute({
          sql: "SELECT data_base64 FROM templates WHERE name = ?",
          args: [templateName]
        });
        
        if (templateRes.rows.length === 0 && !isAppreciation) {
          templateRes = await db.execute({
            sql: "SELECT data_base64 FROM templates WHERE name = ?",
            args: ["certificate"]
          });
        }
      }

      if (!templateRes || templateRes.rows.length === 0) {
        return res.status(500).send("Certificate template not found in database.");
      }

      const templateBase64 = templateRes.rows[0].data_base64 as string;
      const templateBuffer = Buffer.from(templateBase64, 'base64');

      // Generate customized PPTX file
      const safeName = studentName.replace(/[^a-zA-Z0-9_\s]/g, '').trim();
      const tempPptx = path.join(process.cwd(), `Verify_Temp_${safeName}_${id}.pptx`);
      const tempPdf = path.join(process.cwd(), `Verify_Temp_${safeName}_${id}.pdf`);

      let replacements: Record<string, string>;
      if (isRecognition) {
        replacements = {
          "{{ Judge's Full Name }}": String(studentName),
          "{{Judge's Full Name}}": String(studentName),
          "Judge's Full Name": String(studentName),
          "{{PARTICIPANT NAME}}": String(studentName),
          "{{EVENT NAME}}": String(eventTitle),
          "{{DATE}}": String(eventDate),
          "{{CERTIFICATE ID}}": String(certId),
          "TCEK/RD/2026/H0001": String(certId),
          "[[ Judge's Full Name ]]": String(studentName),
          "[[Judge's Full Name]]": String(studentName),
          "[[EVENT NAME]]": String(eventTitle),
          "[[DATE]]": String(eventDate),
          "[[CERTIFICATE ID]]": String(certId)
        };
      } else if (isHackathon) {
        replacements = {
          '{{PARTICIPANT NAME}}': String(studentName),
          '{{EVENT NAME}}': String(eventTitle),
          '{{HACKATHON NAME}}': String(eventTitle),
          '{{DATE}}': String(eventDate),
          '{{CERTIFICATE TYPE}}': String(actionText),
          '{{CERTIFICATE ID}}': String(certId),
          '{{ROLE}}': String(reg.role || 'Team Member'),
          '{{TEAM NAME}}': String(reg.team_name || ''),
          '{{PROJECT TITLE}}': String(reg.project_title || ''),
          '[[PARTICIPANT NAME]]': String(studentName),
          '[[EVENT NAME]]': String(eventTitle),
          '[[HACKATHON NAME]]': String(eventTitle),
          '[[DATE]]': String(eventDate),
          '[[CERTIFICATE TYPE]]': String(actionText),
          '[[CERTIFICATE ID]]': String(certId),
          '[[ROLE]]': String(reg.role || 'Team Member'),
          '[[TEAM NAME]]': String(reg.team_name || ''),
          '[[PROJECT TITLE]]': String(reg.project_title || ''),
          'TCEK/RD/2026/0001': String(certId),
          'TCEK/RD/2026/H0001': String(certId)
        };
      } else {
        replacements = {
          '{{PARTICIPANT NAME}}': String(studentName),
          '{{EVENT NAME}}': String(eventTitle),
          '{{DATE}}': String(eventDate),
          '{{CERTIFICATE TYPE}}': String(actionText),
          '{{CERTIFICATE ID}}': String(certId),
          '[[PARTICIPANT NAME]]': String(studentName),
          '[[EVENT NAME]]': String(eventTitle),
          '[[DATE]]': String(eventDate),
          '[[CERTIFICATE TYPE]]': String(actionText),
          '[[CERTIFICATE ID]]': String(certId),
          'TCEK/RD/2026/0001': String(certId)
        };
      }

      replacePlaceholdersInPptx(templateBuffer, tempPptx, replacements);

      // Convert customized PPTX to PDF using LibreOffice
      await convertPptxToPdf(tempPptx, tempPdf);

      // Stream PDF to the client browser
      if (fs.existsSync(tempPdf)) {
        const pdfContent = fs.readFileSync(tempPdf);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="Certificate_${safeName}.pdf"`);
        res.send(pdfContent);
      } else {
        res.status(500).send("Failed to compile certificate PDF.");
      }

      // Cleanup temp files
      if (fs.existsSync(tempPptx)) fs.unlinkSync(tempPptx);
      if (fs.existsSync(tempPdf)) fs.unlinkSync(tempPdf);

    } else {
      // Return JSON metadata
      return res.json({
        success: true,
        data: {
          id: reg.id,
          fullName: isHackathon ? (reg.participant_name as string) : (reg.full_name as string),
          pinNumber: isRecognition ? (reg.designation as string) : isHackathon ? (reg.participant_phone as string || 'N/A') : (reg.pin_number as string),
          email: reg.email || reg.participant_email,
          branch: isRecognition ? (reg.organization as string) : isHackathon ? (reg.branch as string || 'N/A') : (reg.branch as string),
          yearOfStudy: isRecognition ? (reg.domain_expertise || 'Official Judge / Evaluator') : isHackathon ? (reg.year as string || 'N/A') : (reg.year_of_study as string),
          section: isRecognition ? reg.organization : isHackathon ? `Team: ${reg.team_name}` : reg.section,
          eventName: isHackathon ? (reg.hackathon_name as string) : (reg.event_name as string),
          status: isHackathon ? `${reg.role} (${actionText})` : actionText,
          certificateId: certId,
          eventDate: eventDate,
          issuedAt: reg.created_at
        }
      });
    }
  } catch (err: any) {
    console.error("Certificate verification error:", err);
    if (isPdf) {
      return res.status(500).send("Internal server error: " + err.message);
    }
    return res.status(500).json({ error: "Internal server error." });
  }
});

// Start the express server
app.listen(port, async () => {
  console.log(`Server listening on http://localhost:${port}`);
  await setupDatabase();
});
