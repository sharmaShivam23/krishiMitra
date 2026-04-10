'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, AlertCircle, Tractor, Clock, CheckCircle2,
  XCircle, Shield, IndianRupee, User, Calendar, MapPin, Eye,
  ChevronDown, ChevronUp, FileText, Camera, AlertTriangle, Gavel
} from 'lucide-react';
import RentalStatusTimeline from '@/components/rental/RentalStatusTimeline';
import AgreementCard from '@/components/rental/AgreementCard';
import InspectionUploader from '@/components/rental/InspectionUploader';
import DamageClaimCard from '@/components/rental/DamageClaimCard';

interface RentalOrder {
  _id: string;
  listingId: any;
  renterId: any;
  ownerId: any;
  status: string;
  rentalPeriod: { startDate: string; endDate: string; totalDays: number };
  pricing: { dailyRate: number; totalAmount: number; securityDeposit: number; protectionFee: number; protectionTier: string; rateUnit: string };
  agreement: { acceptedByRenter: boolean; acceptedByOwner: boolean; renterAcceptedAt?: string; ownerAcceptedAt?: string; terms: string[] };
  preInspection?: { photos: string[]; condition: string; notes: string; inspectedAt: string };
  postInspection?: { photos: string[]; condition: string; notes: string; inspectedAt: string };
  damageReport: { hasDamage: boolean; description: string; claimAmount: number; photos: string[]; coveredByProtection: number; renterLiability: number; status: string; resolution?: string };
  payment: { method: string; depositStatus: string; rentalPaidStatus: string; damageDeducted: number };
  renterMessage?: string;
  timeline: any[];
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  requested: { label: 'Requested', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: <Clock className="w-3.5 h-3.5" /> },
  approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  agreement_pending: { label: 'Sign Agreement', color: 'bg-amber-100 text-amber-700 border-amber-300', icon: <FileText className="w-3.5 h-3.5" /> },
  deposit_pending: { label: 'Deposit Pending', color: 'bg-orange-100 text-orange-700 border-orange-300', icon: <Shield className="w-3.5 h-3.5" /> },
  active: { label: 'Active Rental', color: 'bg-green-100 text-green-700 border-green-300', icon: <Tractor className="w-3.5 h-3.5" /> },
  return_pending: { label: 'Return Pending', color: 'bg-purple-100 text-purple-700 border-purple-300', icon: <Clock className="w-3.5 h-3.5" /> },
  inspecting: { label: 'Inspecting', color: 'bg-indigo-100 text-indigo-700 border-indigo-300', icon: <Camera className="w-3.5 h-3.5" /> },
  completed: { label: 'Completed', color: 'bg-gray-100 text-gray-700 border-gray-300', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  disputed: { label: 'Disputed', color: 'bg-red-100 text-red-700 border-red-300', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-300', icon: <XCircle className="w-3.5 h-3.5" /> },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500 border-gray-300', icon: <XCircle className="w-3.5 h-3.5" /> },
};

export default function MyRentalsPage() {
  const [rentals, setRentals] = useState<RentalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [roleFilter, setRoleFilter] = useState<'all' | 'renter' | 'owner'>('all');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.user) setCurrentUser(d.user); })
      .catch(() => {});
  }, []);

  const fetchRentals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ role: roleFilter });
      if (statusFilter) params.append('status', statusFilter);
      const res = await fetch(`/api/rentals?${params}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load');
      setRentals(data.rentals);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRentals(); }, [roleFilter, statusFilter]);

  const updateStatus = async (rentalId: string, newStatus: string, note?: string) => {
    setActionLoading(rentalId);
    try {
      const res = await fetch(`/api/rentals/${rentalId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ newStatus, note })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed');
      fetchRentals();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const acceptAgreement = async (rentalId: string) => {
    setActionLoading(rentalId);
    try {
      const res = await fetch(`/api/rentals/${rentalId}/agreement`, {
        method: 'POST', credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed');
      fetchRentals();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const submitInspection = async (rentalId: string, type: 'pre' | 'post', inspectionData: any) => {
    setActionLoading(rentalId);
    try {
      const res = await fetch(`/api/rentals/${rentalId}/inspection`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ type, ...inspectionData })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed');
      fetchRentals();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDamageAction = async (rentalId: string, action: string, extra?: any) => {
    setActionLoading(rentalId);
    try {
      const res = await fetch(`/api/rentals/${rentalId}/damage`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ action, ...extra })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed');
      fetchRentals();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const fileDamageClaim = async (rentalId: string, claimData: any) => {
    setActionLoading(rentalId);
    try {
      const res = await fetch(`/api/rentals/${rentalId}/damage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify(claimData)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed');
      fetchRentals();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getUserRole = (rental: RentalOrder): 'renter' | 'owner' => {
    if (!currentUser) return 'renter';
    return rental.ownerId?._id === currentUser._id ? 'owner' : 'renter';
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24 font-sans">
      <div className="max-w-5xl mx-auto px-4 pt-4 pb-6 space-y-6">
        {/* Header */}
        <div>
          <Link href="/dashboard/Services" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-emerald-600 transition-colors mb-3">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Equipment
          </Link>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">My Rental Orders</h1>
          <p className="text-gray-500 font-medium mt-1">Manage your equipment bookings — as a renter or owner.</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {[
              { key: 'all' as const, label: 'All' },
              { key: 'renter' as const, label: 'As Renter' },
              { key: 'owner' as const, label: 'As Owner' }
            ].map(f => (
              <button key={f.key} onClick={() => setRoleFilter(f.key)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${roleFilter === f.key ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {f.label}
              </button>
            ))}
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none">
            <option value="">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-emerald-500" /></div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-10 text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" /><p className="text-red-700 font-bold">{error}</p>
          </div>
        ) : rentals.length === 0 ? (
          <div className="bg-white border border-gray-200 border-dashed rounded-2xl p-16 text-center">
            <Tractor className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Rental Orders Yet</h3>
            <p className="text-gray-500 text-sm mb-4">Browse equipment listings and book something!</p>
            <Link href="/dashboard/Services" className="text-emerald-600 font-bold hover:underline">Browse Equipment →</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {rentals.map((rental) => {
              const status = STATUS_CONFIG[rental.status] || STATUS_CONFIG.requested;
              const isExpanded = expandedId === rental._id;
              const role = getUserRole(rental);
              const isLoading = actionLoading === rental._id;
              const equipTitle = rental.listingId?.title || 'Unknown Equipment';
              const equipImage = rental.listingId?.images?.[0];

              return (
                <motion.div key={rental._id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  
                  {/* Card Header */}
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : rental._id)}>
                    
                    {/* Thumbnail */}
                    <div className="w-full sm:w-20 h-32 sm:h-20 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                      {equipImage ? (
                        <img src={equipImage} alt={equipTitle} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Tractor className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-black text-gray-900 truncate">{equipTitle}</h3>
                          <p className="text-xs text-gray-500 font-medium mt-0.5">
                            {role === 'owner' ? `Renter: ${rental.renterId?.name || 'Unknown'}` : `Owner: ${rental.ownerId?.name || 'Unknown'}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1 ${status.color}`}>
                            {status.icon} {status.label}
                          </span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs font-medium text-gray-500">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {rental.rentalPeriod.totalDays} days</span>
                        <span className="flex items-center gap-1"><IndianRupee className="w-3 h-3" /> ₹{rental.pricing.totalAmount}</span>
                        <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> {rental.pricing.protectionTier}</span>
                        <span className="flex items-center gap-1 capitalize"><User className="w-3 h-3" /> You: {role}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden border-t border-gray-100">
                        <div className="p-5 space-y-6">

                          {/* Cost Breakdown */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-gray-50 rounded-xl p-3 text-center">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Rental</span>
                              <span className="font-black text-gray-900">₹{rental.pricing.totalAmount}</span>
                            </div>
                            <div className="bg-amber-50 rounded-xl p-3 text-center">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Deposit</span>
                              <span className="font-black text-amber-700">₹{rental.pricing.securityDeposit}</span>
                            </div>
                            <div className="bg-blue-50 rounded-xl p-3 text-center">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Protection</span>
                              <span className="font-black text-blue-700">₹{rental.pricing.protectionFee}</span>
                            </div>
                            <div className="bg-emerald-50 rounded-xl p-3 text-center">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Deposit Status</span>
                              <span className="font-black text-emerald-700 capitalize text-sm">{rental.payment.depositStatus}</span>
                            </div>
                          </div>

                          {/* Action Buttons by status */}
                          {rental.status === 'requested' && role === 'owner' && (
                            <div className="flex gap-3">
                              <button onClick={() => updateStatus(rental._id, 'approved', 'Approved by owner')}
                                disabled={isLoading}
                                className="flex-1 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2">
                                <CheckCircle2 className="w-4 h-4" /> Approve
                              </button>
                              <button onClick={() => updateStatus(rental._id, 'rejected', 'Rejected by owner')}
                                disabled={isLoading}
                                className="flex-1 py-3 rounded-xl font-bold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 disabled:opacity-60 flex items-center justify-center gap-2">
                                <XCircle className="w-4 h-4" /> Reject
                              </button>
                            </div>
                          )}
                          {rental.status === 'requested' && role === 'renter' && (
                            <button onClick={() => updateStatus(rental._id, 'cancelled', 'Cancelled by renter')}
                              disabled={isLoading}
                              className="w-full py-3 rounded-xl font-bold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 disabled:opacity-60 flex items-center justify-center gap-2">
                              <XCircle className="w-4 h-4" /> Cancel Request
                            </button>
                          )}

                          {/* Agreement */}
                          {rental.status === 'agreement_pending' && (
                            <AgreementCard
                              agreement={{
                                ...rental.agreement,
                                rentalDetails: {
                                  equipment: equipTitle,
                                  renter: rental.renterId?.name || 'Unknown',
                                  owner: rental.ownerId?.name || 'Unknown',
                                  period: rental.rentalPeriod,
                                  pricing: rental.pricing,
                                  status: rental.status
                                }
                              }}
                              userRole={role}
                              onAccept={() => acceptAgreement(rental._id)}
                              loading={isLoading}
                            />
                          )}

                          {/* Deposit pending */}
                          {rental.status === 'deposit_pending' && (
                            <div className="space-y-4">
                              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                <h3 className="font-bold text-amber-900 flex items-center gap-2"><Shield className="w-4 h-4" /> Deposit Collection</h3>
                                <p className="text-sm text-amber-700 mt-1">Collect ₹{rental.pricing.securityDeposit} security deposit from the renter before handing over equipment.</p>
                              </div>
                              {/* Pre-inspection */}
                              {!rental.preInspection && role === 'owner' && (
                                <InspectionUploader type="pre" onSubmit={(data) => submitInspection(rental._id, 'pre', data)} loading={isLoading} />
                              )}
                              {rental.preInspection && (
                                <InspectionUploader type="pre" existingPhotos={rental.preInspection.photos} existingCondition={rental.preInspection.condition} existingNotes={rental.preInspection.notes} readOnly onSubmit={async () => {}} />
                              )}
                              {role === 'owner' && (
                                <button onClick={() => updateStatus(rental._id, 'active', 'Equipment handed over')}
                                  disabled={isLoading}
                                  className="w-full py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2">
                                  <Tractor className="w-4 h-4" /> Confirm Handover — Start Rental
                                </button>
                              )}
                            </div>
                          )}

                          {/* Active rental */}
                          {rental.status === 'active' && role === 'renter' && (
                            <button onClick={() => updateStatus(rental._id, 'return_pending', 'Renter initiated return')}
                              disabled={isLoading}
                              className="w-full py-3 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-60 flex items-center justify-center gap-2">
                              <ArrowLeft className="w-4 h-4" /> Initiate Return
                            </button>
                          )}

                          {/* Return pending */}
                          {rental.status === 'return_pending' && role === 'owner' && (
                            <div className="space-y-4">
                              <InspectionUploader type="post" onSubmit={(data) => submitInspection(rental._id, 'post', data)} loading={isLoading} />
                            </div>
                          )}

                          {/* Inspecting — owner can complete or file damage */}
                          {rental.status === 'inspecting' && role === 'owner' && (
                            <div className="space-y-4">
                              {rental.postInspection && (
                                <InspectionUploader type="post" existingPhotos={rental.postInspection.photos} existingCondition={rental.postInspection.condition} existingNotes={rental.postInspection.notes} readOnly onSubmit={async () => {}} />
                              )}
                              <div className="flex gap-3">
                                <button onClick={() => updateStatus(rental._id, 'completed', 'No damage found, rental completed')}
                                  disabled={isLoading}
                                  className="flex-1 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2">
                                  <CheckCircle2 className="w-4 h-4" /> No Damage — Complete
                                </button>
                                <button onClick={() => {
                                  const desc = prompt('Describe the damage:');
                                  const amt = prompt('Claim amount (₹):');
                                  if (desc && amt) fileDamageClaim(rental._id, { description: desc, claimAmount: Number(amt), photos: rental.postInspection?.photos || [] });
                                }}
                                  disabled={isLoading}
                                  className="flex-1 py-3 rounded-xl font-bold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 disabled:opacity-60 flex items-center justify-center gap-2">
                                  <AlertTriangle className="w-4 h-4" /> File Damage Claim
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Damage claim display */}
                          {rental.damageReport?.hasDamage && (
                            <DamageClaimCard
                              damageReport={rental.damageReport}
                              preInspectionPhotos={rental.preInspection?.photos}
                              postInspectionPhotos={rental.postInspection?.photos}
                              userRole={role}
                              protectionTier={rental.pricing.protectionTier}
                              onAcceptClaim={() => handleDamageAction(rental._id, 'accept')}
                              onDisputeClaim={() => handleDamageAction(rental._id, 'dispute')}
                              loading={isLoading}
                            />
                          )}

                          {/* Timeline */}
                          {rental.timeline?.length > 0 && (
                            <RentalStatusTimeline timeline={rental.timeline} currentStatus={rental.status} />
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
