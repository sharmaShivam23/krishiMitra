'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Check, X } from 'lucide-react';

interface Props {
  selected: string;
  onSelect: (tier: string) => void;
  totalAmount: number;
}

const TIERS = [
  {
    id: 'none',
    name: 'Basic',
    pct: 0,
    coverage: 0,
    tag: null,
    features: ['No damage coverage', 'Full deposit at risk'],
    excluded: ['Normal wear not covered', 'No dispute priority'],
  },
  {
    id: 'standard',
    name: 'Standard',
    pct: 5,
    coverage: 50,
    tag: 'Recommended',
    features: ['50% damage coverage', 'Normal wear covered', 'Priority support (48h)'],
    excluded: ['Breakdown not covered'],
  },
  {
    id: 'premium',
    name: 'Premium',
    pct: 12,
    coverage: 90,
    tag: 'Max Protection',
    features: ['90% damage coverage', 'Breakdown protection', 'Express support (24h)', 'Liability capped at 10%'],
    excluded: [],
  },
];

export default function ProtectionPlanSelector({ selected, onSelect, totalAmount }: Props) {
  return (
    <div className="space-y-3">
      {TIERS.map((tier) => {
        const isActive = selected === tier.id;
        const price = Math.round(totalAmount * (tier.pct / 100));

        return (
          <motion.button
            key={tier.id}
            type="button"
            onClick={() => onSelect(tier.id)}
            whileTap={{ scale: 0.99 }}
            className={`w-full text-left rounded-2xl border-2 p-4 transition-all duration-200 relative overflow-hidden ${
              isActive
                ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/20'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            {/* Tag */}
            {tier.tag && (
              <span className={`absolute top-3 right-3 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                tier.id === 'standard'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-violet-100 text-violet-700'
              }`}>
                {tier.tag}
              </span>
            )}

            <div className="flex items-start gap-3.5">
              {/* Radio */}
              <div className={`w-[18px] h-[18px] rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                isActive ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
              }`}>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>

              <div className="flex-1 min-w-0">
                {/* Title row */}
                <div className="flex items-baseline gap-2">
                  <span className={`text-[15px] font-semibold ${isActive ? 'text-gray-900' : 'text-gray-800'}`}>
                    {tier.name}
                  </span>
                  {tier.pct > 0 ? (
                    <span className={`text-[15px] font-semibold ${isActive ? 'text-emerald-600' : 'text-gray-500'}`}>
                      ₹{price}
                    </span>
                  ) : (
                    <span className="text-[13px] font-medium text-gray-400">Free</span>
                  )}
                  {tier.coverage > 0 && (
                    <span className="text-[11px] text-gray-400 font-medium ml-auto">
                      Covers {tier.coverage}% of damage
                    </span>
                  )}
                </div>

                {/* Features */}
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.2 }}
                    className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1"
                  >
                    {tier.features.map((f, i) => (
                      <span key={i} className="text-[12px] text-gray-600 flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-500 shrink-0" /> {f}
                      </span>
                    ))}
                    {tier.excluded.map((f, i) => (
                      <span key={i} className="text-[12px] text-gray-400 flex items-center gap-1">
                        <X className="w-3 h-3 text-gray-300 shrink-0" /> {f}
                      </span>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
