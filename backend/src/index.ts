import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createClient } from '@libsql/client';

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

    console.log("Database tables verified successfully.");
  } catch (error) {
    console.error("Database setup failed:", error);
  }
}

// Endpoints

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

    return res.status(200).json({
      success: true,
      message: "Admin account deleted successfully."
    });
  } catch (err: any) {
    console.error("Error deleting user:", err);
    return res.status(500).json({ error: "Failed to delete user account.", details: err.message });
  }
});



// Start the express server
app.listen(port, async () => {
  console.log(`Server listening on http://localhost:${port}`);
  await setupDatabase();
});
