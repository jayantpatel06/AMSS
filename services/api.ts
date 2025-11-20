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

export const getIP = async (): Promise<string> => {
  try {
    // Try to get local IP via WebRTC first
    const localIp = await getLocalIP();
    if (localIp) return localIp;
  } catch (e) {
    console.warn("Failed to get local IP, falling back to public", e);
  }

  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (e) {
    console.error("Failed to get IP", e);
    return '127.0.0.1';
  }
};

// WebRTC Local IP detection
const getLocalIP = (): Promise<string | null> => {
  return new Promise((resolve) => {
    try {
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel('');
      pc.createOffer().then(pc.setLocalDescription.bind(pc));

      pc.onicecandidate = (ice) => {
        if (!ice || !ice.candidate || !ice.candidate.candidate) {
          // No more candidates or invalid
          return;
        }
        const myIP = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/.exec(ice.candidate.candidate)?.[1];
        if (myIP) {
          pc.onicecandidate = null;
          pc.close();
          resolve(myIP);
        }
      };

      // Timeout after 1s
      setTimeout(() => {
        pc.close();
        resolve(null);
      }, 1000);
    } catch (e) {
      resolve(null);
    }
  });
};

// Export alias for backward compatibility if needed, or update call sites
export const getPublicIP = getIP;

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