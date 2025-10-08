// server.js
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// Create pool (reads from .env)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'luct_reporting_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Helper: test DB connection
async function testDatabaseConnection() {
  try {
    const conn = await pool.getConnection();
    conn.release();
    console.log('✅ Database connected successfully.');
    return true;
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    return false;
  }
}

// JWT auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// Role guard helper
const requireRole = (roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

// Basic route
app.get('/api', (req, res) => {
  res.json({ message: 'LUCT Reporting API running', timestamp: new Date().toISOString() });
});

// Health
app.get('/api/health', async (req, res) => {
  const ok = await testDatabaseConnection();
  res.json({ status: ok ? 'OK' : 'DB connection failed', timestamp: new Date().toISOString() });
});

/**
 * USER / AUTH routes
 * Single "users" table stores all accounts: role = 'lecturer' | 'student' | 'admin' | 'prl'
 * Additional profile tables optionally store more info: lecturer_profiles, student_profiles, prl_profiles
 */

// Register (open or admin-only — here it's open but you can require admin by uncommenting requireRole)
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, role, name, email } = req.body;
    if (!username || !password || !role || !name) {
      return res.status(400).json({ error: 'username, password, role and name are required' });
    }

    // check existing username
    const [rows] = await pool.execute('SELECT id FROM users WHERE username = ?', [username]);
    if (rows.length > 0) return res.status(400).json({ error: 'Username already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (username, password, role, name, email) VALUES (?, ?, ?, ?, ?)',
      [username, hashed, role, name, email || null]
    );

    const userId = result.insertId;

    // create role-specific profile row if needed
    if (role === 'lecturer') {
      await pool.execute('INSERT INTO lecturer_profiles (user_id, full_name, email) VALUES (?, ?, ?)', [userId, name, email || null]);
    } else if (role === 'student') {
      await pool.execute('INSERT INTO student_profiles (user_id, full_name, email) VALUES (?, ?, ?)', [userId, name, email || null]);
    } else if (role === 'prl') {
      await pool.execute('INSERT INTO prl_profiles (user_id, full_name, email) VALUES (?, ?, ?)', [userId, name, email || null]);
    } else if (role === 'admin') {
      // nothing extra needed but you could add admin_profiles
    }

    res.status(201).json({ message: 'User registered', userId });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username & password required' });

    const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * CRUD endpoints for lecturers, students, admins, prl
 * - Create endpoints actually create entries via /api/register (shared)
 * - Below: list, get by id, update (admin or owner), delete (admin)
 */

// List users by role (admin or same role user)
app.get('/api/users/:role', authenticateToken, async (req, res) => {
  const role = req.params.role;
  if (!['lecturer', 'student', 'admin', 'prl'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  try {
    // Admins can see all; lecturers/prl/students can list only their own role
    if (req.user.role !== 'admin' && req.user.role !== role) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    const [rows] = await pool.execute('SELECT id, username, role, name, email, created_at FROM users WHERE role = ?', [role]);
    res.json(rows);
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get user by id
app.get('/api/user/:id', authenticateToken, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

  try {
    // Admins can access any user; users can access their own record; otherwise forbidden
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    const [rows] = await pool.execute('SELECT id, username, role, name, email, created_at FROM users WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update user (admin or owner)
app.put('/api/user/:id', authenticateToken, async (req, res) => {
  const id = Number(req.params.id);
  const { name, email, password } = req.body;
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

  try {
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const updates = [];
    const params = [];

    if (name) { updates.push('name = ?'); params.push(name); }
    if (email) { updates.push('email = ?'); params.push(email); }
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      updates.push('password = ?'); params.push(hashed);
    }

    if (updates.length === 0) return res.status(400).json({ error: 'Nothing to update' });

    params.push(id);
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    await pool.execute(sql, params);
    res.json({ message: 'User updated' });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete user (admin only)
app.delete('/api/user/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

  try {
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    // optionally remove profiles
    await pool.execute('DELETE FROM lecturer_profiles WHERE user_id = ?', [id]);
    await pool.execute('DELETE FROM student_profiles WHERE user_id = ?', [id]);
    await pool.execute('DELETE FROM prl_profiles WHERE user_id = ?', [id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Example: lecturer-specific endpoint to list their classes (requires role lecturer)
app.get('/api/lecturer/classes', authenticateToken, requireRole(['lecturer']), async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM classes WHERE lecturer_id = ?', [req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error('Lecturer classes error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
(async () => {
  console.log('Starting server...');
  const ok = await testDatabaseConnection();
  if (!ok) {
    console.warn('Warning: Database connection failed. Fix .env or MySQL server before using DB routes.');
  }
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`API root: http://localhost:${PORT}/api`);
  });
})();
