'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Loader2 } from 'lucide-react';

export default function AdminUsersManager() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/admin/users');
        const json = await res.json();
        if (json.success) setUsers(json.users);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => 
    (user.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (user.phone || '').includes(search) ||
    (user.state?.toLowerCase() || '').includes(search.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-emerald-950 flex items-center">
            <Users className="w-8 h-8 mr-3 text-emerald-600" />
            Manage Users
          </h1>
          <p className="text-stone-500 font-medium mt-2">View and manage all registered farmers on the platform.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-stone-400" />
          <input 
            type="text" 
            placeholder="Search name, phone, or state..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-stone-900 placeholder:text-stone-400 shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-stone-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : (
          <div className="overflow-x-auto p-6">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b-2 border-stone-100 text-stone-400 text-sm">
                  <th className="pb-4 font-bold uppercase tracking-wider">Name</th>
                  <th className="pb-4 font-bold uppercase tracking-wider">Phone</th>
                  <th className="pb-4 font-bold uppercase tracking-wider">State</th>
                  <th className="pb-4 font-bold uppercase tracking-wider">Role</th>
                  <th className="pb-4 font-bold uppercase tracking-wider">Joined Date</th>
                </tr>
              </thead>
              <tbody className="text-stone-700 font-medium">
                {filteredUsers.map((user: any) => (
                  <tr key={user._id} className="border-b border-stone-50 hover:bg-stone-50 transition-colors">
                    <td className="py-4 font-bold text-emerald-950">{user.name}</td>
                    <td className="py-4">{user.phone}</td>
                    <td className="py-4">{user.state || <span className="text-stone-400 italic">Not provided</span>}</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 text-stone-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div className="text-center p-10 text-stone-400 font-medium">
                No users found matching "{search}"
              </div>
            )}
          </div>
        )}
      </div>

    </motion.div>
  );
}