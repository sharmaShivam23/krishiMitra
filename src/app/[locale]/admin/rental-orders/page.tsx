'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Tractor, Loader2, AlertCircle, Clock, CheckCircle2, XCircle,
  Shield, IndianRupee, Gavel, Calendar, User, AlertTriangle,
  Eye, Search, Filter, BarChart3
} from 'lucide-react';

interface RentalOrder {
  _id: string;
  listingId: any;
  renterId: any;
  ownerId: any;
  status: string;
  rentalPeriod: { startDate: string; endDate: string; totalDays: number };
  pricing: { dailyRate: number; totalAmount: number; securityDeposit: number; protectionFee: number; protectionTier: string };
  damageReport: { hasDamage: boolean; description: string; claimAmount: number; renterLiability: number; status: string; resolution?: string };
  payment: { method: string; depositStatus: string; rentalPaidStatus: string; damageDeducted: number };
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  requested: 'bg-blue-100 text-blue-700', approved: 'bg-emerald-100 text-emerald-700',
  agreement_pending: 'bg-amber-100 text-amber-700', deposit_pending: 'bg-orange-100 text-orange-700',
  active: 'bg-green-100 text-green-700', return_pending: 'bg-purple-100 text-purple-700',
  inspecting: 'bg-indigo-100 text-indigo-700', completed: 'bg-gray-100 text-gray-700',
  disputed: 'bg-red-100 text-red-700', rejected: 'bg-red-100 text-red-500',
  cancelled: 'bg-gray-100 text-gray-500'
};

export default function AdminRentalOrders() {
  const [rentals, setRentals] = useState<RentalOrder[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, disputed: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [resolveAmount, setResolveAmount] = useState(0);
  const [resolveNote, setResolveNote] = useState('');
  const [resolving, setResolving] = useState(false);

  const fetchRentals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      const res = await fetch(`/api/admin/rental-orders?${params}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setRentals(data.rentals);
        setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRentals(); }, [statusFilter]);

  const resolveDispute = async () => {
    if (!resolveId) return;
    setResolving(true);
    try {
      const res = await fetch('/api/admin/rental-orders', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ id: resolveId, action: 'resolve_dispute', resolution: resolveNote, finalAmount: resolveAmount })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setResolveId(null);
      setResolveAmount(0);
      setResolveNote('');
      fetchRentals();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
          <Tractor className="w-8 h-8 text-emerald-600" /> Rental Orders
        </h1>
        <p className="text-gray-500 font-medium mt-1">Manage all equipment rental transactions and disputes.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: stats.total, icon: <BarChart3 className="w-5 h-5" />, color: 'bg-gray-50 text-gray-700 border-gray-200' },
          { label: 'Active Rentals', value: stats.active, icon: <Tractor className="w-5 h-5" />, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
          { label: 'Disputes', value: stats.disputed, icon: <AlertTriangle className="w-5 h-5" />, color: 'bg-red-50 text-red-700 border-red-200' },
          { label: 'Completed', value: stats.completed, icon: <CheckCircle2 className="w-5 h-5" />, color: 'bg-blue-50 text-blue-700 border-blue-200' }
        ].map((s, i) => (
          <div key={i} className={`rounded-2xl border p-4 ${s.color}`}>
            <div className="flex items-center justify-between mb-2">{s.icon}<span className="text-3xl font-black">{s.value}</span></div>
            <span className="text-xs font-bold uppercase tracking-wider opacity-70">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-gray-400" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none">
          <option value="">All Statuses</option>
          <option value="requested">Requested</option>
          <option value="active">Active</option>
          <option value="disputed">Disputed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Resolve Modal */}
      {resolveId && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-black text-lg text-gray-900 flex items-center gap-2"><Gavel className="w-5 h-5 text-purple-600" /> Resolve Dispute</h3>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Final Amount Renter Must Pay (₹)</label>
              <input type="number" value={resolveAmount} onChange={(e) => setResolveAmount(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500/20" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Resolution Notes</label>
              <textarea value={resolveNote} onChange={(e) => setResolveNote(e.target.value)} rows={3}
                placeholder="Explain the ruling..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:ring-2 focus:ring-purple-500/20 resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setResolveId(null)} className="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition">Cancel</button>
              <button onClick={resolveDispute} disabled={resolving}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-60 flex items-center justify-center gap-2 transition">
                {resolving && <Loader2 className="w-4 h-4 animate-spin" />} Resolve
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Orders Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-emerald-600" /></div>
      ) : rentals.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <Tractor className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-bold">No rental orders found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th className="text-left p-4 font-bold text-gray-600">Equipment</th>
                  <th className="text-left p-4 font-bold text-gray-600">Renter</th>
                  <th className="text-left p-4 font-bold text-gray-600">Owner</th>
                  <th className="text-left p-4 font-bold text-gray-600">Status</th>
                  <th className="text-left p-4 font-bold text-gray-600">Amount</th>
                  <th className="text-left p-4 font-bold text-gray-600">Days</th>
                  <th className="text-left p-4 font-bold text-gray-600">Protection</th>
                  <th className="text-left p-4 font-bold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rentals.map((r) => (
                  <tr key={r._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="p-4"><span className="font-bold text-gray-900 line-clamp-1">{r.listingId?.title || 'Unknown'}</span></td>
                    <td className="p-4"><span className="font-medium text-gray-700">{r.renterId?.name || 'Unknown'}</span><br /><span className="text-xs text-gray-400">{r.renterId?.phone}</span></td>
                    <td className="p-4"><span className="font-medium text-gray-700">{r.ownerId?.name || 'Unknown'}</span><br /><span className="text-xs text-gray-400">{r.ownerId?.phone}</span></td>
                    <td className="p-4"><span className={`px-2 py-1 rounded-lg text-xs font-bold ${STATUS_COLORS[r.status] || ''}`}>{r.status}</span></td>
                    <td className="p-4 font-bold text-gray-900">₹{r.pricing.totalAmount}</td>
                    <td className="p-4 font-medium text-gray-700">{r.rentalPeriod.totalDays}</td>
                    <td className="p-4"><span className="capitalize text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded">{r.pricing.protectionTier}</span></td>
                    <td className="p-4">
                      {r.status === 'disputed' && (
                        <button onClick={() => { setResolveId(r._id); setResolveAmount(r.damageReport?.renterLiability || 0); }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 flex items-center gap-1 transition">
                          <Gavel className="w-3 h-3" /> Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
