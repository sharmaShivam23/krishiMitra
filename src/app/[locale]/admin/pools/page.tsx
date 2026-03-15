'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Search, Loader2, Trash2, Users, Target } from 'lucide-react';

export default function AdminPoolsManager() {
  const [pools, setPools] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPools();
  }, []);

  const fetchPools = async () => {
    try {
      const res = await fetch('/api/admin/pools');
      const json = await res.json();
      if (json.success) setPools(json.pools);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this selling pool? This will remove all associated members.")) return;
    try {
      const res = await fetch(`/api/admin/pools?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) setPools(pools.filter(p => p._id !== id));
    } catch (err) {
      alert("Failed to delete pool");
    }
  };

  const filteredPools = pools.filter(p => 
    (p.commodity?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (p.mandi?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (p.creatorName?.toLowerCase() || '').includes(search.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-emerald-950 flex items-center">
            <Briefcase className="w-8 h-8 mr-3 text-emerald-600" />
            Collective Selling
          </h1>
          <p className="text-stone-500 font-medium mt-2">Monitor farmer pools, group progress, and market targets.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-stone-400" />
          <input 
            type="text" placeholder="Search crop, mandi, or creator..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-stone-900 placeholder:text-stone-400 shadow-sm"
          />
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-stone-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
        ) : (
          <div className="overflow-x-auto p-6">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b-2 border-stone-100 text-stone-400 text-sm">
                  <th className="pb-4 font-bold uppercase tracking-wider w-1/4">Pool Details</th>
                  <th className="pb-4 font-bold uppercase tracking-wider">Creator</th>
                  <th className="pb-4 font-bold uppercase tracking-wider w-1/4">Collection Progress</th>
                  <th className="pb-4 font-bold uppercase tracking-wider text-center">Status</th>
                  <th className="pb-4 font-bold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-stone-700 font-medium">
                {filteredPools.map((pool: any) => {
                  const progressPercentage = Math.min((pool.currentQuantity / pool.targetQuantity) * 100, 100);
                  
                  return (
                    <tr key={pool._id} className="border-b border-stone-50 hover:bg-stone-50 transition-colors">
                      {/* Details */}
                      <td className="py-4 pr-4">
                        <p className="font-bold text-emerald-950 text-lg mb-1">{pool.commodity}</p>
                        <p className="text-xs text-stone-500 font-bold uppercase tracking-wider bg-stone-100 inline-block px-2 py-1 rounded-md">
                          📍 {pool.mandi}
                        </p>
                      </td>
                      
                      {/* Creator */}
                      <td className="py-4">
                        <p className="font-bold text-stone-800">{pool.creatorName}</p>
                        <p className="text-xs text-stone-400 flex items-center mt-1">
                          <Users className="w-3 h-3 mr-1" /> {pool.members?.length || 0} Members
                        </p>
                      </td>

                      {/* Progress Bar */}
                      <td className="py-4 pr-6">
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-emerald-700">{pool.currentQuantity} Qtl collected</span>
                          <span className="text-stone-400">Target: {pool.targetQuantity} Qtl</span>
                        </div>
                        <div className="w-full bg-stone-100 rounded-full h-2.5 mb-1 overflow-hidden">
                          <div 
                            className={`h-2.5 rounded-full ${progressPercentage >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider flex items-center mt-1">
                          <Target className="w-3 h-3 mr-1" /> Exp: ₹{pool.priceExpectation}/Qtl
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-4 text-center">
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                          pool.status === 'Open' ? 'bg-blue-100 text-blue-700' : 
                          pool.status === 'Sold' ? 'bg-emerald-100 text-emerald-700' : 
                          'bg-stone-100 text-stone-500'
                        }`}>
                          {pool.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 text-right">
                        <button onClick={() => handleDelete(pool._id)} className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredPools.length === 0 && (
              <div className="text-center p-10 text-stone-400 font-medium">No active selling pools found.</div>
            )}
          </div>
        )}
      </div>

    </motion.div>
  );
}