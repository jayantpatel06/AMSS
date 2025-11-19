import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';
import { Button } from './Button';
import { Trash2, Plus, Shield } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState<Partial<User>>({ role: UserRole.STUDENT });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const u = await api.getUsers();
    setUsers(u);
  };

  const handleAdd = async () => {
    if (!newUser.name || !newUser.email) return;
    setLoading(true);
    // @ts-ignore
    await api.addUser({
      name: newUser.name,
      email: newUser.email,
      role: newUser.role as UserRole,
      password: '123'
    });
    setNewUser({ role: UserRole.STUDENT, name: '', email: '' });
    loadUsers();
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Are you sure?")) return;
    await api.deleteUser(id);
    loadUsers();
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Shield className="text-indigo-600" /> User Management
        </h2>
        
        {/* Add User Form */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <input 
            placeholder="Full Name"
            className="border rounded-lg px-3 py-2"
            value={newUser.name || ''}
            onChange={e => setNewUser({...newUser, name: e.target.value})}
          />
          <input 
            placeholder="Email"
            className="border rounded-lg px-3 py-2"
            value={newUser.email || ''}
            onChange={e => setNewUser({...newUser, email: e.target.value})}
          />
          <select 
            className="border rounded-lg px-3 py-2"
            value={newUser.role}
            onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}
          >
            <option value={UserRole.STUDENT}>Student</option>
            <option value={UserRole.TEACHER}>Teacher</option>
            <option value={UserRole.ADMIN}>Admin</option>
          </select>
          <Button onClick={handleAdd} isLoading={loading}>
            <Plus size={16} /> Add User
          </Button>
        </div>

        {/* User List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 text-gray-600 uppercase">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                // @ts-ignore
                <tr key={u._id || u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-gray-200 rounded text-xs font-bold text-gray-700">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button 
                      // @ts-ignore
                      onClick={() => handleDelete(u._id || u.id)} 
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
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