import { User, Session, AttendanceRecord, DbSchema, UserRole, AttendanceStatus } from '../types';

const DB_KEY = 'geoattend_db_v1';

const INITIAL_DB: DbSchema = {
  users: [
    { id: 'u1', name: 'Admin User', email: 'admin@school.edu', role: UserRole.ADMIN, password: '123' },
    { id: 'u2', name: 'Prof. Albus', email: 'teacher@school.edu', role: UserRole.TEACHER, password: '123' },
    { id: 'u3', name: 'Harry P.', email: 'student1@school.edu', role: UserRole.STUDENT, password: '123' },
    { id: 'u4', name: 'Hermione G.', email: 'student2@school.edu', role: UserRole.STUDENT, password: '123' },
    { id: 'u5', name: 'Ron W.', email: 'student3@school.edu', role: UserRole.STUDENT, password: '123' },
  ],
  sessions: [],
  attendance: []
};

// Helper to load/save DB
const getDb = (): DbSchema => {
  const stored = localStorage.getItem(DB_KEY);
  if (!stored) {
    localStorage.setItem(DB_KEY, JSON.stringify(INITIAL_DB));
    return INITIAL_DB;
  }
  return JSON.parse(stored);
};

const saveDb = (db: DbSchema) => {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
};

// API Simulation
export const api = {
  login: async (email: string) => {
    const db = getDb();
    return db.users.find(u => u.email === email);
  },

  getUsers: () => getDb().users,
  addUser: (user: User) => {
    const db = getDb();
    db.users.push(user);
    saveDb(db);
  },
  deleteUser: (id: string) => {
    const db = getDb();
    db.users = db.users.filter(u => u.id !== id);
    saveDb(db);
  },

  // Session Management
  createSession: (teacherId: string, subject: string, ip: string) => {
    const db = getDb();
    const newSession: Session = {
      id: Math.random().toString(36).substring(2, 9),
      teacherId,
      subject,
      date: new Date().toISOString(),
      teacherIp: ip,
      isActive: true
    };
    db.sessions.push(newSession);
    saveDb(db);
    return newSession;
  },

  getActiveSessions: () => {
    return getDb().sessions.filter(s => s.isActive);
  },

  endSession: (sessionId: string) => {
    const db = getDb();
    const session = db.sessions.find(s => s.id === sessionId);
    if (session) {
      session.isActive = false;
      saveDb(db);
    }
  },

  getTeacherSessions: (teacherId: string) => {
    return getDb().sessions.filter(s => s.teacherId === teacherId);
  },

  // Attendance
  markAttendance: (sessionId: string, studentId: string, studentName: string, ip: string, teacherIp: string) => {
    const db = getDb();
    
    // IP Matching Logic (First 3 octets)
    const teacherParts = teacherIp.split('.');
    const studentParts = ip.split('.');
    
    const isSubnetMatch = 
      teacherParts[0] === studentParts[0] &&
      teacherParts[1] === studentParts[1] &&
      teacherParts[2] === studentParts[2];

    const status = isSubnetMatch ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT;

    const record: AttendanceRecord = {
      id: Math.random().toString(36).substring(2, 9),
      sessionId,
      studentId,
      studentName,
      status, // Defaults to absent if IP mismatch, or present if match
      timestamp: new Date().toISOString(),
      studentIp: ip
    };

    // Prevent duplicate
    const exists = db.attendance.find(a => a.sessionId === sessionId && a.studentId === studentId);
    if (!exists) {
      db.attendance.push(record);
      saveDb(db);
    }
    return record;
  },

  updateAttendanceStatus: (recordId: string, status: AttendanceStatus) => {
    const db = getDb();
    const record = db.attendance.find(a => a.id === recordId);
    if (record) {
      record.status = status;
      saveDb(db);
    }
  },

  getSessionAttendance: (sessionId: string) => {
    return getDb().attendance.filter(a => a.sessionId === sessionId);
  },

  getStudentHistory: (studentId: string) => {
    const db = getDb();
    // Join sessions to get subject details
    return db.attendance
      .filter(a => a.studentId === studentId)
      .map(record => {
        const session = db.sessions.find(s => s.id === record.sessionId);
        return { ...record, sessionSubject: session?.subject, sessionDate: session?.date };
      });
  },

  getAllAttendance: () => getDb().attendance,
};

export const getPublicIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (e) {
    console.error("Failed to get IP", e);
    // Fallback mock IP for demo purposes if offline or blocked
    return '192.168.1.105';
  }
};