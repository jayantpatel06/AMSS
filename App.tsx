import React, { useState } from 'react';
import { User, UserRole } from './types';
import { api } from './services/api';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { AIChatbot } from './components/AIChatbot';
import { Button } from './components/Button';
import { LogOut, School } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loginEmail, setLoginEmail] = useState('teacher@school.edu');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const u = await api.login(loginEmail);
      if (u) setUser(u);
      else setError('User not found. Please check credentials.');
    } catch (err) {
      setError('Connection failed. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => setUser(null);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full mb-4">
              <School size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">GeoAttend</h1>
            <p className="text-gray-500">Smart Attendance Verification</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="Enter your email"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full py-3" isLoading={loading}>Sign In</Button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-gray-100 text-xs text-gray-500">
            <p className="font-semibold mb-2">Demo Credentials (Ensure Database is Seeded):</p>
            <div className="grid grid-cols-1 gap-1">
              <code className="bg-gray-100 p-1 rounded cursor-pointer hover:bg-gray-200" onClick={() => setLoginEmail('teacher@school.edu')}>Teacher: teacher@school.edu</code>
              <code className="bg-gray-100 p-1 rounded cursor-pointer hover:bg-gray-200" onClick={() => setLoginEmail('student1@school.edu')}>Student: student1@school.edu</code>
              <code className="bg-gray-100 p-1 rounded cursor-pointer hover:bg-gray-200" onClick={() => setLoginEmail('admin@school.edu')}>Admin: admin@school.edu</code>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <School size={20} />
            </div>
            <span className="font-bold text-xl text-gray-800">GeoAttend</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500 uppercase">{user.role}</p>
            </div>
            <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600">
               {user.name.charAt(0)}
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user.role === UserRole.TEACHER && <TeacherDashboard user={user} />}
        {user.role === UserRole.STUDENT && <StudentDashboard user={user} />}
        {user.role === UserRole.ADMIN && <AdminDashboard />}
      </main>

      {/* AI Integration */}
      {(user.role === UserRole.TEACHER || user.role === UserRole.ADMIN) && (
        <AIChatbot />
      )}
    </div>
  );
};

export default App;