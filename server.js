import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || '*', // Allow Vercel frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/geoattend')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Models
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['ADMIN', 'TEACHER', 'STUDENT'] }
});
const User = mongoose.model('User', userSchema);

const sessionSchema = new mongoose.Schema({
  teacherId: String,
  subject: String,
  date: { type: Date, default: Date.now },
  teacherIp: String,
  isActive: { type: Boolean, default: true }
});
const Session = mongoose.model('Session', sessionSchema);

const attendanceSchema = new mongoose.Schema({
  sessionId: String,
  studentId: String,
  studentName: String,
  status: { type: String, enum: ['PRESENT', 'ABSENT'] },
  timestamp: { type: Date, default: Date.now },
  studentIp: String
});
const Attendance = mongoose.model('Attendance', attendanceSchema);

// Helper: IP matching
const checkIpMatch = (teacherIp, studentIp) => {
  // Relaxed Subnet match (first 2 octets) to handle different subnets in same network
  // or different public IPs from same ISP/Hotspot
  const tParts = teacherIp.split('.');
  const sParts = studentIp.split('.');
  return tParts[0] === sParts[0] && tParts[1] === sParts[1];
};

// Routes
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/users', async (req, res) => {
  try {
    const newUser = await User.create(req.body);
    res.json(newUser);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email } = req.body;
    // In real app, check password. Demo: Just email.
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/sessions', async (req, res) => {
  try {
    const { teacherId, subject, teacherIp } = req.body;
    // Deactivate other sessions for this teacher
    await Session.updateMany({ teacherId, isActive: true }, { isActive: false });

    const session = await Session.create({
      teacherId,
      subject,
      teacherIp, // In prod, might want to use req.ip as validation
      isActive: true
    });
    res.json(session);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/sessions', async (req, res) => {
  try {
    const { teacherId, active } = req.query;
    const query = {};
    if (teacherId) query.teacherId = teacherId;
    if (active === 'true') query.isActive = true;

    const sessions = await Session.find(query).sort({ date: -1 });
    res.json(sessions);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/sessions/:id/end', async (req, res) => {
  try {
    const session = await Session.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    res.json(session);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/attendance', async (req, res) => {
  try {
    const { sessionId, studentId, studentName, studentIp } = req.body;
    const session = await Session.findById(sessionId);

    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (!session.isActive) return res.status(400).json({ error: 'Session is closed' });

    // Verify IP
    const isMatch = checkIpMatch(session.teacherIp, studentIp);
    const status = isMatch ? 'PRESENT' : 'ABSENT';

    const record = await Attendance.create({
      sessionId,
      studentId,
      studentName,
      studentIp,
      status
    });

    res.json(record);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/attendance', async (req, res) => {
  try {
    const { sessionId, studentId } = req.query;
    const query = {};
    if (sessionId) query.sessionId = sessionId;
    if (studentId) query.studentId = studentId;

    const records = await Attendance.find(query).sort({ timestamp: -1 });
    res.json(records);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/attendance/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const record = await Attendance.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(record);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Fallback for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});