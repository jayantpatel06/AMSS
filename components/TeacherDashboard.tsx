import React, { useEffect, useState } from 'react';
import { User, Session, AttendanceRecord, AttendanceStatus } from '../types';
import { api, getPublicIP } from '../services/api';
import { Button } from './Button';
import { Users, Wifi, Play, StopCircle, Download, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  user: User;
}

export const TeacherDashboard: React.FC<Props> = ({ user }) => {
  const [currentIp, setCurrentIp] = useState<string>('');
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [subject, setSubject] = useState('Mathematics 101');
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchIp();
    loadActiveSession();
    loadStats();
    
    const interval = setInterval(() => {
      if (activeSession) refreshAttendance(activeSession.id);
    }, 5000); // Poll every 5s

    return () => clearInterval(interval);
  }, [activeSession?._id]); // Check mongo ID

  const fetchIp = async () => {
    const ip = await getPublicIP();
    setCurrentIp(ip);
  };

  const loadActiveSession = async () => {
    const sessions = await api.getTeacherSessions(user.id);
    // In real mongo, id is _id
    // We should map or use strict types. For now assuming API returns id or _id.
    const active = sessions.find(s => s.isActive);
    if (active) {
      setActiveSession(active);
      refreshAttendance(active._id || active.id);
    }
  };

  const loadStats = async () => {
    const all = await api.getAllAttendance();
    const present = all.filter(a => a.status === AttendanceStatus.PRESENT).length;
    const absent = all.filter(a => a.status === AttendanceStatus.ABSENT).length;
    setStats([
      { name: 'Present', value: present, color: '#4ade80' },
      { name: 'Absent', value: absent, color: '#f87171' }
    ]);
  };

  const refreshAttendance = async (sessionId: string) => {
    const list = await api.getSessionAttendance(sessionId);
    setAttendanceList(list);
  };

  const startSession = async () => {
    setLoading(true);
    if (!currentIp) await fetchIp();
    const session = await api.createSession(user.id, subject, currentIp);
    setActiveSession(session);
    setAttendanceList([]);
    setLoading(false);
  };

  const endSession = async () => {
    if (activeSession) {
      await api.endSession(activeSession._id || activeSession.id);
      setActiveSession(null);
    }
  };

  const toggleStatus = async (record: AttendanceRecord) => {
    const newStatus = record.status === AttendanceStatus.PRESENT ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT;
    await api.updateAttendanceStatus(record._id || record.id, newStatus);
    if (activeSession) {
      refreshAttendance(activeSession._id || activeSession.id);
    }
  };

  const downloadCSV = () => {
    const headers = "Student Name,Time,Status,IP\n";
    const rows = attendanceList.map(a => `${a.studentName},${new Date(a.timestamp).toLocaleTimeString()},${a.status},${a.studentIp}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${activeSession?.id}.csv`;
    a.click();
  };

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <Wifi size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Network IP</p>
              <p className="text-lg font-bold text-gray-800">{currentIp || 'Loading...'}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Students in Class</p>
              <p className="text-lg font-bold text-gray-800">{attendanceList.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Session Control */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="w-full md:w-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-1">Classroom Control</h2>
            <p className="text-gray-500 text-sm">Manage your active session and verify attendance.</p>
          </div>
          
          {!activeSession ? (
            <div className="flex gap-3 w-full md:w-auto">
              <input 
                type="text" 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Subject Name"
              />
              <Button onClick={startSession} isLoading={loading}>
                <Play size={18} /> Start Class
              </Button>
            </div>
          ) : (
             <div className="flex gap-3 w-full md:w-auto items-center">
               <div className="px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium animate-pulse border border-green-200">
                 Session Active: {activeSession.subject}
               </div>
               <Button variant="danger" onClick={endSession}>
                <StopCircle size={18} /> End Session
              </Button>
             </div>
          )}
        </div>
      </div>

      {/* Attendance Table */}
      {activeSession && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Live Attendance</h3>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => 
                refreshAttendance(activeSession._id || activeSession.id)
              }>
                <RefreshCw size={16} />
              </Button>
              <Button variant="outline" onClick={downloadCSV}>
                <Download size={16} /> Export CSV
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase">
                <tr>
                  <th className="px-6 py-3">Student</th>
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3">IP Address</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {attendanceList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                      Waiting for students to join...
                    </td>
                  </tr>
                ) : (
                  attendanceList.map(record => (
                    <tr key={record._id || record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-800">{record.studentName}</td>
                      <td className="px-6 py-4 text-gray-500">{new Date(record.timestamp).toLocaleTimeString()}</td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">{record.studentIp}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          record.status === AttendanceStatus.PRESENT 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => toggleStatus(record)}
                          className="text-indigo-600 hover:text-indigo-800 font-medium text-xs"
                        >
                          Override
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stats Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
         <h3 className="font-bold text-gray-800 mb-4">Attendance Overview</h3>
         <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {stats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
         </ResponsiveContainer>
      </div>
    </div>
  );
};