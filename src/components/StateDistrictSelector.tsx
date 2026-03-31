'use client';

import React, { useEffect, useState } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { STATES_DISTRICTS } from '@/utils/indiaStates';

const STATE_LIST = Object.keys(STATES_DISTRICTS).sort();

interface Props {
  state: string;
  district: string;
  onStateChange: (state: string) => void;
  onDistrictChange: (district: string) => void;
  /** If true, fetch user's state/district from /api/auth/me on mount */
  autoFillFromDB?: boolean;
  stateLabel?: string;
  districtLabel?: string;
  required?: boolean;
  className?: string;
}

const selectClass =
  'w-full pl-9 pr-8 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-900 ' +
  'focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 outline-none appearance-none cursor-pointer ' +
  'transition-all disabled:opacity-50 disabled:cursor-not-allowed';

export default function StateDistrictSelector({
  state,
  district,
  onStateChange,
  onDistrictChange,
  autoFillFromDB = false,
  stateLabel = 'State',
  districtLabel = 'District',
  required = false,
  className = '',
}: Props) {
  const [autoFilled, setAutoFilled] = useState(false);
  const districts = state ? (STATES_DISTRICTS[state] ?? []) : [];

  // Auto-fill from DB user profile (auth_token cookie)
  useEffect(() => {
    if (!autoFillFromDB) return;
    const fill = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        if (!data.success || !data.user) return;
        const { state: dbState, district: dbDistrict } = data.user;
        if (dbState && !state) {
          onStateChange(dbState);
          setAutoFilled(true);
        }
        if (dbDistrict && !district) {
          onDistrictChange(dbDistrict);
        }
      } catch (e) {
        console.error('StateDistrictSelector: DB fetch failed', e);
      }
    };
    fill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFillFromDB]);

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onStateChange(e.target.value);
    // Parent should reset district via onStateChange — calling two callbacks in
    // the same event causes stale-closure overwrites in parent setState
  };

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className}`}>
      {/* STATE */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          {stateLabel}
          {autoFilled && (
            <span className="ml-1 text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
              from profile
            </span>
          )}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select
            required={required}
            value={state}
            onChange={handleStateChange}
            className={selectClass}
          >
            <option value="">— Select State —</option>
            {STATE_LIST.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* DISTRICT */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          {districtLabel}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select
            required={required}
            value={district}
            onChange={e => onDistrictChange(e.target.value)}
            disabled={!state}
            className={selectClass}
          >
            <option value="">— Select District —</option>
            {districts.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
