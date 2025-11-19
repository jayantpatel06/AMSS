export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT'
}

export interface User {
  id: string;
  _id?: string; // Mongo ID support
  name: string;
  email: string;
  role: UserRole;
  password?: string; // In a real app, hashed. Here for mock auth.
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE'
}

export interface Session {
  id: string;
  _id?: string; // Mongo ID support
  teacherId: string;
  subject: string;
  date: string; // ISO string
  teacherIp: string;
  isActive: boolean;
}

export interface AttendanceRecord {
  id: string;
  _id?: string; // Mongo ID support
  sessionId: string;
  studentId: string;
  studentName: string;
  status: AttendanceStatus;
  timestamp: string;
  studentIp: string;
}

// Initial Mock Data Types
export interface DbSchema {
  users: User[];
  sessions: Session[];
  attendance: AttendanceRecord[];
}