import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import nodemailer from 'nodemailer';
import PizZip from 'pizzip';

// Initialize env
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS and json parsing
app.use(cors());
app.use(express.json());

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

const JWT_SECRET = process.env.JWT_SECRET || 'rd_club_secret_key_2026';

// Request typing for JWT authentication
interface AuthenticatedRequest extends express.Request {
  user?: {
    username: string;
    role: 'developer' | 'superadmin' | 'admin';
  };
}

const authenticateToken = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "Access token missing." });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token." });
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
        role TEXT NOT NULL CHECK(role IN ('developer', 'superadmin', 'admin')),
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

    // Alter table schemas to add status columns if missing
    try {
      await db.execute(`ALTER TABLE club_applications ADD COLUMN status TEXT DEFAULT 'pending';`);
      console.log("Database verification: status column verified/added to club_applications.");
    } catch (e) {
      // Column already exists, ignore
    }

    try {
      await db.execute(`ALTER TABLE event_registrations ADD COLUMN status TEXT DEFAULT 'pending';`);
      console.log("Database verification: status column verified/added to event_registrations.");
    } catch (e) {
      // Column already exists, ignore
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

    // Seed Default accounts
    // Seeding Developer: charan / Bharat@8336
    const devPassHash = await bcrypt.hash('Bharat@8336', 10);
    try {
      await db.execute({
        sql: `INSERT OR IGNORE INTO admin_users (username, password, role) VALUES (?, ?, ?)`,
        args: ['charan', devPassHash, 'developer']
      });
      console.log("Seeding verification: Developer 'charan' verified/seeded.");
    } catch (e) {
      console.error("Error seeding developer:", e);
    }

    // Seeding Super Admin: akhya / akhya@1962
    const superadminPassHash = await bcrypt.hash('akhya@1962', 10);
    try {
      await db.execute({
        sql: `INSERT OR IGNORE INTO admin_users (username, password, role) VALUES (?, ?, ?)`,
        args: ['akhya', superadminPassHash, 'superadmin']
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

    // Seed templates if missing
    try {
      // 1. Offer Letter Template
      const offerCheck = await db.execute({
        sql: "SELECT count(*) as count FROM templates WHERE name = ?",
        args: ["offer_letter"]
      });
      if (Number(offerCheck.rows[0].count) === 0) {
        const filePath = path.join(process.cwd(), '../OFFER LETTER (1).pptx');
        if (fs.existsSync(filePath)) {
          console.log("Seeding 'offer_letter' template into database...");
          const fileData = fs.readFileSync(filePath);
          const base64 = fileData.toString('base64');
          await db.execute({
            sql: "INSERT INTO templates (name, filename, data_base64) VALUES (?, ?, ?)",
            args: ["offer_letter", "OFFER LETTER (1).pptx", base64]
          });
          console.log("Template 'offer_letter' seeded successfully.");
        } else {
          console.warn(`Warning: Template file not found at ${filePath}. Skipping seeding.`);
        }
      }

      // 2. Certificate Template
      const certCheck = await db.execute({
        sql: "SELECT count(*) as count FROM templates WHERE name = ?",
        args: ["certificate"]
      });
      if (Number(certCheck.rows[0].count) === 0) {
        const filePath = path.join(process.cwd(), '../CERTIFICATE_TEMPLATE.pptx');
        if (fs.existsSync(filePath)) {
          console.log("Seeding 'certificate' template into database...");
          const fileData = fs.readFileSync(filePath);
          const base64 = fileData.toString('base64');
          await db.execute({
            sql: "INSERT INTO templates (name, filename, data_base64) VALUES (?, ?, ?)",
            args: ["certificate", "CERTIFICATE_TEMPLATE.pptx", base64]
          });
          console.log("Template 'certificate' seeded successfully.");
        } else {
          console.warn(`Warning: Template file not found at ${filePath}. Skipping seeding.`);
        }
      }
    } catch (e: any) {
      console.error("Error seeding templates:", e.message);
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

// 1. Club Membership Application endpoint
app.post('/api/apply/club', async (req, res) => {
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
app.post('/api/apply/event', async (req, res) => {
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
      sql: `INSERT INTO event_registrations (full_name, pin_number, email, mobile, branch, year_of_study, section, event_name, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

// 3. Contact/Enquiry feedback endpoint
app.post('/api/contact', async (req, res) => {
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

// 5. Admin Login
app.post('/api/admin/login', async (req, res) => {
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
    const passwordMatch = await bcrypt.compare(password, user.password as string);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    const token = jwt.sign(
      { username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Log Activity
    await db.execute({
      sql: "INSERT INTO activity_logs (username, action, details) VALUES (?, ?, ?)",
      args: [username, "Login", `Administrator logged in as role: ${user.role}`]
    });

    return res.status(200).json({
      success: true,
      token,
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

// 6. Fetch Submissions (Requires Admin or higher)
app.get('/api/admin/applications', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const clubRes = await db.execute("SELECT * FROM club_applications ORDER BY created_at DESC");
    const eventRes = await db.execute("SELECT * FROM event_registrations ORDER BY created_at DESC");
    
    return res.status(200).json({
      clubApplications: clubRes.rows,
      eventRegistrations: eventRes.rows
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

  if (status !== 'approved' && status !== 'rejected' && status !== 'pending') {
    return res.status(400).json({ error: "Invalid status state." });
  }

  const tableName = type === 'club' ? 'club_applications' : 'event_registrations';

  try {
    const checkRes = await db.execute({
      sql: `SELECT full_name FROM ${tableName} WHERE id = ?`,
      args: [id]
    });

    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: "Application record not found." });
    }

    const studentName = checkRes.rows[0].full_name;

    await db.execute({
      sql: `UPDATE ${tableName} SET status = ? WHERE id = ?`,
      args: [status, id]
    });

    // Log Activity
    await db.execute({
      sql: "INSERT INTO activity_logs (username, action, details) VALUES (?, ?, ?)",
      args: [
        req.user?.username || 'unknown',
        "Update Application Status",
        `Changed status of ${type === 'club' ? 'Club Membership' : 'Event Registration'} application (ID: ${id}, Student: ${studentName}) to: ${status}`
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
    const usersRes = await db.execute("SELECT id, username, role, created_at FROM admin_users ORDER BY created_at DESC");
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

  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ error: "Username, password, and role are required." });
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

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.execute({
      sql: "INSERT INTO admin_users (username, password, role) VALUES (?, ?, ?)",
      args: [username, passwordHash, role]
    });

    // Log Activity
    await db.execute({
      sql: "INSERT INTO activity_logs (username, action, details) VALUES (?, ?, ?)",
      args: [
        req.user.username,
        "Create User",
        `Created user ${username} with role: ${role}`
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
  
  if (!category || !title || !description || !date || !time || !location || !speaker || !speakerBio) {
    return res.status(400).json({ error: "All fields are required to create an event." });
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
      args: [category, title, description, date, time, location, speaker, speakerBio]
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
const SENDER_EMAIL = 'recruitmentrd6@gmail.com';
const SENDER_PASSWORD = 'kohmtlqkeezrbewz';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: SENDER_EMAIL,
    pass: SENDER_PASSWORD.replace(/\s+/g, '')
  }
});

// XML-aware text replacement inside PPTX files
function replacePlaceholdersInPptx(templateBuffer: Buffer, outputPath: string, replacements: Record<string, string>) {
  const zip = new PizZip(templateBuffer);

  Object.keys(zip.files).forEach((filename) => {
    if (filename.startsWith('ppt/slides/slide') && filename.endsWith('.xml')) {
      const fileObj = zip.file(filename);
      if (fileObj) {
        let slideXml = fileObj.asText();

        // Rule: Disable word wrapping specifically for the shape containing Date placeholders
        slideXml = slideXml.replace(
          /(<p:sp\b[^>]*>(?:(?!<\/p:sp>).)*?{{D(?:ate|ata)}}(?:(?!<\/p:sp>).)*?<\/p:sp>)/gs,
          (spMatch) => {
            return spMatch.replace(/<a:bodyPr\b([^>]*)>/g, (m, attrs) => {
              if (attrs.includes('wrap=')) {
                return `<a:bodyPr ${attrs.replace(/wrap="[^"]*"/, 'wrap="none"')}>`;
              }
              return `<a:bodyPr ${attrs} wrap="none">`;
            });
          }
        );

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
        });

        zip.file(filename, slideXml);
      }
    }
  });

  const buffer = zip.generate({ type: 'nodebuffer' });
  fs.writeFileSync(outputPath, buffer);
}

// Convert PPTX to PDF using native Windows PowerPoint COM
function convertPptxToPdf(inputPptxPath: string, outputPdfPath: string) {
  const absInput = path.resolve(inputPptxPath);
  const absOutput = path.resolve(outputPdfPath);

  const escapedInput = absInput.replace(/\\/g, '\\\\');
  const escapedOutput = absOutput.replace(/\\/g, '\\\\');

  const psCommand = `
    $PowerPoint = New-Object -ComObject PowerPoint.Application;
    $Presentation = $PowerPoint.Presentations.Open('${escapedInput}');
    $Presentation.SaveAs('${escapedOutput}', 32);
    $Presentation.Close();
    $PowerPoint.Quit();
  `;

  execSync(`powershell -Command "${psCommand.replace(/\n/g, ' ')}"`);
}

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

    for (let idx = 0; idx < approvedApps.length; idx++) {
      const app = approvedApps[idx];
      const studentName = app.full_name as string;
      const recipientEmail = app.email as string;
      const id = app.id as number;
      const branch = app.branch as string;
      const year = app.year_of_study as string;
      
      const refNo = `R&D/COORD/OFFER/2026-2027/${String(id).padStart(3, '0')}`;
      const yearBranch = `${year} & ${branch}`;
      const deptName = branch;

      const safeName = studentName.replace(/[^a-zA-Z0-9_\s]/g, '').trim();
      const tempPptx = path.join(process.cwd(), `Temp_Offer_${safeName}_${id}.pptx`);
      const pdfFilename = path.join(process.cwd(), `Offer_Letter_${safeName}_${id}.pdf`);

      const progressVal = Math.floor(15 + (idx / approvedApps.length) * 80);

      sendLog(`Name: ${studentName}`, progressVal);
      sendLog(`Email: ${recipientEmail}`, progressVal);
      sendLog(`Sending email (${idx + 1}/${approvedApps.length})...`, progressVal);

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

      try {
        // Step 1: Replace placeholders and write temp pptx
        replacePlaceholdersInPptx(templateBuffer, tempPptx, replacements);

        // Step 2: Convert to PDF
        convertPptxToPdf(tempPptx, pdfFilename);

        // Step 3: Compose mail
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

        // Step 4: Send mail
        await transporter.sendMail(mailOptions);
        sendLog("Email sent successfully.", progressVal);

        sendLog("Updating database...", progressVal);
        // Step 5: Update DB
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
        sendLog(`Failed: ${err.message}`, progressVal);
      } finally {
        // Cleanup temp files
        if (fs.existsSync(tempPptx)) fs.unlinkSync(tempPptx);
        if (fs.existsSync(pdfFilename)) fs.unlinkSync(pdfFilename);
      }
    }

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
app.post('/api/admin/bulk-send/certificates', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { eventTitle } = req.body;

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
    
    // 1. Fetch template from DB
    const templateRes = await db.execute({
      sql: "SELECT data_base64 FROM templates WHERE name = ?",
      args: ["certificate"]
    });

    if (templateRes.rows.length === 0) {
      res.write(`data: ${JSON.stringify({ error: "Certificate template not found in database." })}\n\n`);
      res.end();
      return;
    }

    const templateBase64 = templateRes.rows[0].data_base64 as string;
    const templateBuffer = Buffer.from(templateBase64, 'base64');

    // 2. Fetch event details from DB
    const eventRes = await db.execute({
      sql: "SELECT date FROM events WHERE title = ?",
      args: [eventTitle]
    });

    const eventDate = eventRes.rows.length > 0 ? eventRes.rows[0].date as string : '03 August 2026';

    sendLog("Fetching recipient details...", 10);

    // 3. Fetch approved, unsent registrations
    const regsRes = await db.execute({
      sql: "SELECT * FROM event_registrations WHERE event_name = ? AND status = 'approved' AND (certificate_sent = 0 OR certificate_sent IS NULL)",
      args: [eventTitle]
    });
    const registrations = regsRes.rows;

    if (registrations.length === 0) {
      sendLog(`No approved registrations pending certificates found for: ${eventTitle}.`, 100, true);
      res.end();
      return;
    }

    sendLog(`Found ${registrations.length} approved attendees pending certificates. Starting bulk dispatch...`, 15);

    let successCount = 0;

    for (let idx = 0; idx < registrations.length; idx++) {
      const reg = registrations[idx];
      const studentName = reg.full_name as string;
      const recipientEmail = reg.email as string;
      const id = reg.id as number;

      const safeName = studentName.replace(/[^a-zA-Z0-9_\s]/g, '').trim();
      const tempPptx = path.join(process.cwd(), `Temp_Cert_${safeName}_${id}.pptx`);
      const pdfFilename = path.join(process.cwd(), `Certificate_${safeName}_${id}.pdf`);

      const progressVal = Math.floor(15 + (idx / registrations.length) * 80);

      sendLog(`Name: ${studentName}`, progressVal);
      sendLog(`Email: ${recipientEmail}`, progressVal);
      sendLog(`Sending email (${idx + 1}/${registrations.length})...`, progressVal);

      const replacements = {
        '{{PARTICIPANT NAME}}': studentName,
        '{{EVENT NAME}}': eventTitle,
        '{{DATE}}': eventDate,
        '[[PARTICIPANT NAME]]': studentName,
        '[[EVENT NAME]]': eventTitle,
        '[[DATE]]': eventDate
      };

      try {
        // Step 1: Replace placeholders and write temp pptx
        replacePlaceholdersInPptx(templateBuffer, tempPptx, replacements);

        // Step 2: Convert to PDF
        convertPptxToPdf(tempPptx, pdfFilename);

        // Step 3: Compose mail
        const mailOptions = {
          from: SENDER_EMAIL,
          to: recipientEmail,
          subject: 'Certificate of Participation | Trinity College of Engineering & Technology',
          text: `Dear ${studentName},

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

        // Step 4: Send mail
        await transporter.sendMail(mailOptions);
        sendLog("Email sent successfully.", progressVal);

        sendLog("Updating database...", progressVal);
        // Step 5: Update DB
        await db.execute({
          sql: "UPDATE event_registrations SET certificate_sent = 1 WHERE id = ?",
          args: [id]
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
        sendLog(`Failed: ${err.message}`, progressVal);
      } finally {
        // Cleanup temp files
        if (fs.existsSync(tempPptx)) fs.unlinkSync(tempPptx);
        if (fs.existsSync(pdfFilename)) fs.unlinkSync(pdfFilename);
      }
    }

    notifySyncClients("REFRESH_APPLICATIONS");
    sendLog(`Successfully sent ${successCount} participation certificates.`, 95);
    sendLog("Process completed successfully.", 100, true);
    res.end();
  } catch (err: any) {
    console.error("Bulk certificates error:", err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
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

// Start the express server
app.listen(port, async () => {
  console.log(`Server listening on http://localhost:${port}`);
  await setupDatabase();
});
