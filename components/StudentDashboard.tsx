import React, { useEffect, useState } from 'react';
import { User, Session, AttendanceRecord } from '../types';
import { api, getPublicIP } from '../services/api';
import { Button } from './Button';
import { Wifi, CheckCircle, XCircle } from 'lucide-react';

interface Props {
  user: User;
}

export const StudentDashboard: React.FC<Props> = ({ user }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [history, setHistory] = useState<(AttendanceRecord & { sessionSubject?: string; sessionDate?: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);
  const [myIp, setMyIp] = useState('');

  useEffect(() => {
    loadData();
    getPublicIP().then(setMyIp);
  }, []);

  const loadData = async () => {
    const s = await api.getActiveSessions();
    setSessions(s);
    const h = await api.getStudentHistory(user.id);
    setHistory(h);
  };

  const handleJoin = async (session: Session) => {
    setLoading(true);
    setMessage(null);
    try {
      const ip = await getPublicIP();
      setMyIp(ip);
      // @ts-ignore - Mongo ID check
      const sessionId = session._id || session.id;
      const record = await api.markAttendance(sessionId, user.id, user.name, ip, session.teacherIp);
      
      if (record.status === 'PRESENT') {
        setMessage({ type: 'success', text: 'Attendance Marked Successfully!' });
      } else {
        setMessage({ type: 'error', text: `Attendance Rejected: IP Mismatch. You: ${ip}, Teacher Subnet: ${session.teacherIp.split('.').slice(0,3).join('.')}.*` });
      }
      
      // Refresh history
      const h = await api.getStudentHistory(user.id);
      setHistory(h);
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to connect to network.' });
    } finally {
      setLoading(false);
    }
  };

  // Calculate Stats
  const total = history.length;
  const present = history.filter(h => h.status === 'PRESENT').length;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs uppercase font-semibold">Attendance Rate</p>
          <p className={`text-2xl font-bold ${percentage >= 75 ? 'text-green-600' : 'text-red-500'}`}>
            {percentage}%
          </p>
        </div>
         <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs uppercase font-semibold">Classes Attended</p>
          <p className="text-2xl font-bold text-gray-800">{present}</p>
        </div>
         <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs uppercase font-semibold">Your IP</p>
          <p className="text-sm font-mono text-gray-800 mt-1">{myIp || 'Fetching...'}</p>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl p-6 text-white shadow-lg">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Wifi size={24} /> Active Classes
        </h2>
        {sessions.length === 0 ? (
          <p className="opacity-80">No classes are currently active. Relax!</p>
        ) : (
          <div className="grid gap-4">
            {sessions.map(s => (
              // @ts-ignore
              <div key={s._id || s.id} className="bg-white/10 backdrop-blur-md p-4 rounded-lg flex justify-between items-center border border-white/20">
                <div>
                  <p className="font-bold text-lg">{s.subject}</p>
                  <p className="text-sm opacity-80">Started at {new Date(s.date).toLocaleTimeString()}</p>
                </div>
                <Button 
                  onClick={() => handleJoin(s)} 
                  isLoading={loading}
                  className="bg-white text-indigo-600 hover:bg-gray-100 hover:shadow-md border-none"
                >
                  Mark Present
                </Button>
              </div>
            ))}
          </div>
        )}
        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-500/20 text-green-100 border border-green-500/30' : 'bg-red-500/20 text-red-100 border border-red-500/30'}`}>
            {message.text}
          </div>
        )}
      </div>

      {/* History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">Attendance History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-3">Subject</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.map(record => (
                // @ts-ignore
                <tr key={record._id || record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-800">{record.sessionSubject}</td>
                  <td className="px-6 py-4 text-gray-500">{record.sessionDate && new Date(record.sessionDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                     <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium w-fit ${
                          record.status === 'PRESENT' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {record.status === 'PRESENT' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                          {record.status}
                        </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};