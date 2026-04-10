'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, CheckCircle2, Shield, Calendar, IndianRupee, User, AlertTriangle } from 'lucide-react';

interface AgreementData {
  terms: string[];
  acceptedByRenter: boolean;
  acceptedByOwner: boolean;
  renterAcceptedAt?: string;
  ownerAcceptedAt?: string;
  rentalDetails: {
    equipment: string;
    renter: string;
    owner: string;
    period: { startDate: string; endDate: string; totalDays: number };
    pricing: {
      dailyRate: number; totalAmount: number; securityDeposit: number;
      protectionFee: number; protectionTier: string;
    };
    status: string;
  };
}

interface Props {
  agreement: AgreementData;
  userRole: 'renter' | 'owner';
  onAccept: () => Promise<void>;
  loading?: boolean;
}

export default function AgreementCard({ agreement, userRole, onAccept, loading }: Props) {
  const [accepted, setAccepted] = useState(false);
  const { terms, acceptedByRenter, acceptedByOwner, rentalDetails } = agreement;
  const alreadyAccepted = userRole === 'renter' ? acceptedByRenter : acceptedByOwner;
  const bothSigned = acceptedByRenter && acceptedByOwner;

  const handleAccept = async () => {
    if (!accepted) return;
    await onAccept();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 p-5 text-white">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-5 h-5 text-emerald-300" />
          <h2 className="font-black text-lg">Rental Agreement</h2>
        </div>
        <p className="text-emerald-200 text-sm font-medium">
          {bothSigned ? 'Agreement signed by both parties ✓' :
           alreadyAccepted ? 'Waiting for other party to sign...' :
           'Review and accept the terms below'}
        </p>
      </div>

      {/* Details Grid */}
      <div className="p-5 border-b border-gray-100">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <User className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-gray-400 font-medium block text-xs">Owner</span>
              <span className="font-bold text-gray-900">{rentalDetails.owner}</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <User className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-gray-400 font-medium block text-xs">Renter</span>
              <span className="font-bold text-gray-900">{rentalDetails.renter}</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-gray-400 font-medium block text-xs">Period</span>
              <span className="font-bold text-gray-900">{rentalDetails.period.totalDays} days</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <IndianRupee className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
            <div>
              <span className="text-gray-400 font-medium block text-xs">Total Amount</span>
              <span className="font-bold text-gray-900">₹{rentalDetails.pricing.totalAmount}</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <span className="text-gray-400 font-medium block text-xs">Security Deposit</span>
              <span className="font-bold text-gray-900">₹{rentalDetails.pricing.securityDeposit}</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <div>
              <span className="text-gray-400 font-medium block text-xs">Protection</span>
              <span className="font-bold text-gray-900 capitalize">{rentalDetails.pricing.protectionTier}</span>
              {rentalDetails.pricing.protectionFee > 0 && (
                <span className="text-xs text-gray-400 ml-1">(₹{rentalDetails.pricing.protectionFee})</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Signature Status */}
      <div className="p-4 border-b border-gray-100 flex gap-4">
        <div className={`flex-1 rounded-xl p-3 text-center ${acceptedByOwner ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50 border border-gray-200'}`}>
          <span className="text-xs font-bold text-gray-400 block mb-1">Owner</span>
          {acceptedByOwner ? (
            <span className="text-emerald-600 font-bold text-sm flex items-center justify-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Signed
            </span>
          ) : (
            <span className="text-gray-400 font-bold text-sm">Pending</span>
          )}
        </div>
        <div className={`flex-1 rounded-xl p-3 text-center ${acceptedByRenter ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50 border border-gray-200'}`}>
          <span className="text-xs font-bold text-gray-400 block mb-1">Renter</span>
          {acceptedByRenter ? (
            <span className="text-emerald-600 font-bold text-sm flex items-center justify-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Signed
            </span>
          ) : (
            <span className="text-gray-400 font-bold text-sm">Pending</span>
          )}
        </div>
      </div>

      {/* Terms */}
      <div className="p-5 border-b border-gray-100">
        <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Terms & Conditions
        </h3>
        <ol className="space-y-2">
          {terms.map((term, i) => (
            <li key={i} className="text-sm text-gray-600 font-medium flex items-start gap-2">
              <span className="text-emerald-500 font-black text-xs mt-0.5 shrink-0">{i + 1}.</span>
              {term}
            </li>
          ))}
        </ol>
      </div>

      {/* Accept Section */}
      {!alreadyAccepted && (
        <div className="p-5">
          <label className="flex items-start gap-3 cursor-pointer group mb-4">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900 transition-colors">
              I have read and agree to all the terms and conditions stated above. I understand the damage protection coverage and security deposit terms.
            </span>
          </label>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleAccept}
            disabled={!accepted || loading}
            className="w-full py-3.5 rounded-xl font-black text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
            {loading ? 'Signing...' : 'I Accept & Sign Agreement'}
          </motion.button>
        </div>
      )}

      {alreadyAccepted && !bothSigned && (
        <div className="p-5">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <p className="text-amber-700 font-bold text-sm">✓ You have signed. Waiting for the other party to sign...</p>
          </div>
        </div>
      )}

      {bothSigned && (
        <div className="p-5">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
            <p className="text-emerald-700 font-bold text-sm">✓ Agreement has been signed by both parties!</p>
          </div>
        </div>
      )}
    </div>
  );
}
