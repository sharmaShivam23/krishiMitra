'use client';

import React from 'react';
import { AlertTriangle, Shield, IndianRupee, Camera, CheckCircle2, XCircle, Gavel } from 'lucide-react';
import { motion } from 'framer-motion';

interface DamageReportData {
  hasDamage: boolean;
  description: string;
  claimAmount: number;
  photos: string[];
  coveredByProtection: number;
  renterLiability: number;
  status: string; // 'none' | 'filed' | 'accepted' | 'disputed' | 'resolved'
  resolution?: string;
}

interface Props {
  damageReport: DamageReportData;
  preInspectionPhotos?: string[];
  postInspectionPhotos?: string[];
  userRole: 'renter' | 'owner' | 'admin';
  protectionTier: string;
  onAcceptClaim?: () => Promise<void>;
  onDisputeClaim?: () => Promise<void>;
  onResolveClaim?: (finalAmount: number, resolution: string) => Promise<void>;
  loading?: boolean;
}

const STATUS_BADGES: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  filed: { label: 'Claim Filed', color: 'bg-amber-100 text-amber-700 border-amber-300', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  accepted: { label: 'Accepted', color: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  disputed: { label: 'Disputed', color: 'bg-red-100 text-red-700 border-red-300', icon: <XCircle className="w-3.5 h-3.5" /> },
  resolved: { label: 'Resolved', color: 'bg-purple-100 text-purple-700 border-purple-300', icon: <Gavel className="w-3.5 h-3.5" /> }
};

export default function DamageClaimCard({ damageReport, preInspectionPhotos, postInspectionPhotos, userRole, protectionTier, onAcceptClaim, onDisputeClaim, onResolveClaim, loading }: Props) {
  const badge = STATUS_BADGES[damageReport.status] || STATUS_BADGES.filed;
  const [resolveAmount, setResolveAmount] = React.useState(damageReport.renterLiability);
  const [resolveNote, setResolveNote] = React.useState('');

  return (
    <div className="bg-white border-2 border-amber-200 rounded-2xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-5 border-b border-amber-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h2 className="font-black text-gray-900">Damage Report</h2>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${badge.color}`}>
            {badge.icon} {badge.label}
          </span>
        </div>
      </div>

      {/* Description */}
      <div className="p-5 border-b border-gray-100">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Damage Description</h3>
        <p className="text-sm text-gray-700 font-medium">{damageReport.description}</p>
      </div>

      {/* Financials */}
      <div className="p-5 border-b border-gray-100">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-red-50 rounded-xl">
            <span className="text-xs font-bold text-gray-400 block mb-1">Claim Amount</span>
            <span className="text-lg font-black text-red-600 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />{damageReport.claimAmount}
            </span>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-xl">
            <span className="text-xs font-bold text-gray-400 block mb-1">Protected</span>
            <span className="text-lg font-black text-blue-600 flex items-center justify-center">
              <Shield className="w-4 h-4 mr-0.5" />{damageReport.coveredByProtection}
            </span>
          </div>
          <div className="text-center p-3 bg-amber-50 rounded-xl">
            <span className="text-xs font-bold text-gray-400 block mb-1">You Owe</span>
            <span className="text-lg font-black text-amber-600 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />{damageReport.renterLiability}
            </span>
          </div>
          <div className="text-center p-3 bg-emerald-50 rounded-xl">
            <span className="text-xs font-bold text-gray-400 block mb-1">Plan</span>
            <span className="text-sm font-black text-emerald-600 capitalize">{protectionTier}</span>
          </div>
        </div>
      </div>

      {/* Photo comparison */}
      {(preInspectionPhotos?.length || postInspectionPhotos?.length) ? (
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Camera className="w-4 h-4" /> Photo Evidence
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-bold text-blue-600 block mb-2">Before (Pre-inspection)</span>
              <div className="grid grid-cols-2 gap-1">
                {preInspectionPhotos?.slice(0, 4).map((p, i) => (
                  <img key={i} src={p} alt={`Before ${i + 1}`} className="w-full aspect-square object-cover rounded-lg" />
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs font-bold text-amber-600 block mb-2">After (Post-inspection)</span>
              <div className="grid grid-cols-2 gap-1">
                {postInspectionPhotos?.slice(0, 4).map((p, i) => (
                  <img key={i} src={p} alt={`After ${i + 1}`} className="w-full aspect-square object-cover rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Damage claim photos */}
      {damageReport.photos?.length > 0 && (
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Damage Photos</h3>
          <div className="grid grid-cols-3 gap-2">
            {damageReport.photos.map((p, i) => (
              <img key={i} src={p} alt={`Damage ${i + 1}`} className="w-full aspect-square object-cover rounded-lg border-2 border-red-200" />
            ))}
          </div>
        </div>
      )}

      {/* Resolution */}
      {damageReport.resolution && (
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Gavel className="w-3.5 h-3.5" /> Resolution
          </h3>
          <p className="text-sm text-gray-700 font-medium bg-purple-50 rounded-xl p-3 border border-purple-100">{damageReport.resolution}</p>
        </div>
      )}

      {/* Actions */}
      {damageReport.status === 'filed' && userRole === 'renter' && (
        <div className="p-5 flex gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onAcceptClaim}
            disabled={loading}
            className="flex-1 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" /> Accept Claim
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onDisputeClaim}
            disabled={loading}
            className="flex-1 py-3 rounded-xl font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4" /> Dispute
          </motion.button>
        </div>
      )}

      {/* Admin resolve */}
      {damageReport.status === 'disputed' && userRole === 'admin' && (
        <div className="p-5 space-y-3 bg-purple-50/50">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <Gavel className="w-4 h-4 text-purple-600" /> Admin Resolution
          </h3>
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1">Final Amount (₹)</label>
            <input
              type="number"
              value={resolveAmount}
              onChange={(e) => setResolveAmount(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1">Resolution Notes</label>
            <textarea
              value={resolveNote}
              onChange={(e) => setResolveNote(e.target.value)}
              rows={2}
              placeholder="Explain the ruling..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:ring-2 focus:ring-purple-500/20 resize-none"
            />
          </div>
          <button
            onClick={() => onResolveClaim?.(resolveAmount, resolveNote)}
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
          >
            <Gavel className="w-4 h-4" /> Resolve Dispute
          </button>
        </div>
      )}
    </div>
  );
}
