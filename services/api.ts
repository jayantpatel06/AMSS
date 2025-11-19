/// <reference types="vite/client" />

import { User, Session, AttendanceRecord, AttendanceStatus } from '../types';

// Safely access environment variables
const getApiUrl = () => {
  if (import.meta.env && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return '/api';
};

const API_URL = getApiUrl();

export const getPublicIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (e) {
    console.error("Failed to get IP", e);
    return '127.0.0.1';
  }
};

export const api = {
  login: async (email: string): Promise<User | undefined> => {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!res.ok) return undefined;
      return res.json();
    } catch (e) {
      console.error("Login failed", e);
      return undefined;
    }
  },

  getUsers: async (): Promise<User[]> => {
    const res = await fetch(`${API_URL}/users`);
    return res.json();
  },

  addUser: async (user: User) => {
    await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
  },

  deleteUser: async (id: string) => {
    await fetch(`${API_URL}/users/${id}`, { method: 'DELETE' });
  },

  // Session Management
  createSession: async (teacherId: string, subject: string, ip: string): Promise<Session> => {
    const res = await fetch(`${API_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacherId, subject, teacherIp: ip })
    });
    return res.json();
  },

  getActiveSessions: async (): Promise<Session[]> => {
    const res = await fetch(`${API_URL}/sessions?active=true`);
    return res.json();
  },

  endSession: async (sessionId: string) => {
    await fetch(`${API_URL}/sessions/${sessionId}/end`, { method: 'PUT' });
  },

  getTeacherSessions: async (teacherId: string): Promise<Session[]> => {
    const res = await fetch(`${API_URL}/sessions?teacherId=${teacherId}`);
    return res.json();
  },

  // Attendance
  markAttendance: async (sessionId: string, studentId: string, studentName: string, ip: string, teacherIp: string): Promise<AttendanceRecord> => {
    const res = await fetch(`${API_URL}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, studentId, studentName, studentIp: ip })
    });
    return res.json();
  },

  updateAttendanceStatus: async (recordId: string, status: AttendanceStatus) => {
    await fetch(`${API_URL}/attendance/${recordId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
  },

  getSessionAttendance: async (sessionId: string): Promise<AttendanceRecord[]> => {
    const res = await fetch(`${API_URL}/attendance?sessionId=${sessionId}`);
    return res.json();
  },

  getStudentHistory: async (studentId: string): Promise<(AttendanceRecord & { sessionSubject?: string; sessionDate?: string })[]> => {
    const attendanceRes = await fetch(`${API_URL}/attendance?studentId=${studentId}`);
    const records: AttendanceRecord[] = await attendanceRes.json();
    
    // Fetch sessions for details (not efficient, but MVP)
    const enriched = await Promise.all(records.map(async (r) => {
      return { ...r, sessionSubject: 'Class', sessionDate: r.timestamp }; 
    }));
    
    return enriched;
  },

  getAllAttendance: async (): Promise<AttendanceRecord[]> => {
    const res = await fetch(`${API_URL}/attendance`);
    return res.json();
  },
};