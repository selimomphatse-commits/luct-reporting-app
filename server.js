const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ExcelJS = require('exceljs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'luct_reporting_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

app.post('/api/register', async (req, res) => {
  try {
    const { username, password, role, name, email } = req.body;

    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      'INSERT INTO users (username, password, role, name, email) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, role, name, email]
    );

    res.status(201).json({ 
      message: 'User registered successfully',
      userId: result.insertId 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const [users] = await pool.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        name: user.name 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/lecturer/classes', authenticateToken, requireRole(['lecturer']), async (req, res) => {
  try {
    const [classes] = await pool.execute(
      'SELECT * FROM classes WHERE lecturer_id = ?',
      [req.user.id]
    );
    res.json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/lecturer/reports', authenticateToken, requireRole(['lecturer']), async (req, res) => {
  try {
    const {
      faculty_name,
      class_id,
      week_of_reporting,
      date_of_lecture,
      actual_students_present,
      scheduled_lecture_time,
      topic_taught,
      learning_outcomes,
      lecturer_recommendations
    } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO reports (
        faculty_name, class_id, week_of_reporting, date_of_lecture, 
        lecturer_id, actual_students_present, scheduled_lecture_time,
        topic_taught, learning_outcomes, lecturer_recommendations, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted')`,
      [
        faculty_name,
        class_id,
        week_of_reporting,
        date_of_lecture,
        req.user.id,
        actual_students_present,
        scheduled_lecture_time,
        topic_taught,
        learning_outcomes,
        lecturer_recommendations
      ]
    );

    res.status(201).json({
      message: 'Report submitted successfully',
      reportId: result.insertId
    });
  } catch (error) {
    console.error('Error submitting report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/lecturer/reports', authenticateToken, requireRole(['lecturer']), async (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT r.*, c.class_name, c.course_name, c.course_code 
      FROM reports r 
      JOIN classes c ON r.class_id = c.id 
      WHERE r.lecturer_id = ?
    `;
    const params = [req.user.id];

    if (search) {
      query += ' AND (c.class_name LIKE ? OR c.course_name LIKE ? OR r.topic_taught LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    query += ' ORDER BY r.created_at DESC';

    const [reports] = await pool.execute(query, params);
    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/prl/reports', authenticateToken, requireRole(['prl']), async (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT r.*, c.class_name, c.course_name, c.course_code, u.name as lecturer_name
      FROM reports r 
      JOIN classes c ON r.class_id = c.id 
      JOIN users u ON r.lecturer_id = u.id 
      WHERE r.status IN ('submitted', 'under_review')
    `;
    const params = [];

    if (search) {
      query += ' AND (c.class_name LIKE ? OR c.course_name LIKE ? OR r.topic_taught LIKE ? OR u.name LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    query += ' ORDER BY r.created_at DESC';

    const [reports] = await pool.execute(query, params);
    res.json(reports);
  } catch (error) {
    console.error('Error fetching PRL reports:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/prl/reports/:id/feedback', authenticateToken, requireRole(['prl']), async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;

    await pool.execute(
      'UPDATE reports SET prl_feedback = ?, status = ? WHERE id = ?',
      [feedback, 'under_review', id]
    );

    res.json({ message: 'Feedback added successfully' });
  } catch (error) {
    console.error('Error adding feedback:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/pl/reports', authenticateToken, requireRole(['pl']), async (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT r.*, c.class_name, c.course_name, c.course_code, u.name as lecturer_name
      FROM reports r 
      JOIN classes c ON r.class_id = c.id 
      JOIN users u ON r.lecturer_id = u.id 
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ' AND (c.class_name LIKE ? OR c.course_name LIKE ? OR r.topic_taught LIKE ? OR u.name LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    query += ' ORDER BY r.created_at DESC';

    const [reports] = await pool.execute(query, params);
    res.json(reports);
  } catch (error) {
    console.error('Error fetching PL reports:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/pl/reports/:id/approve', authenticateToken, requireRole(['pl']), async (req, res) => {
  try {
    const { id } = req.params;

    await pool.execute(
      'UPDATE reports SET status = ? WHERE id = ?',
      ['approved', id]
    );

    res.json({ message: 'Report approved successfully' });
  } catch (error) {
    console.error('Error approving report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/reports/export', authenticateToken, async (req, res) => {
  try {
    const [reports] = await pool.execute(`
      SELECT r.*, c.class_name, c.course_name, c.course_code, u.name as lecturer_name
      FROM reports r 
      JOIN classes c ON r.class_id = c.id 
      JOIN users u ON r.lecturer_id = u.id 
      ORDER BY r.created_at DESC
    `);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('LUCT Reports');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Faculty', key: 'faculty_name', width: 20 },
      { header: 'Class', key: 'class_name', width: 15 },
      { header: 'Course', key: 'course_name', width: 25 },
      { header: 'Lecturer', key: 'lecturer_name', width: 20 },
      { header: 'Week', key: 'week_of_reporting', width: 10 },
      { header: 'Date', key: 'date_of_lecture', width: 15 },
      { header: 'Students Present', key: 'actual_students_present', width: 15 },
      { header: 'Topic', key: 'topic_taught', width: 30 },
      { header: 'Status', key: 'status', width: 15 }
    ];

    reports.forEach(report => {
      worksheet.addRow(report);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=luct-reports.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting reports:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, username, role, name, email, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});