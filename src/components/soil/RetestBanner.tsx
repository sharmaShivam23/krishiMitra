'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, RefreshCw } from 'lucide-react';

type Props = {
  nextRetestAt?: string | Date;
  lastTestedAt?: string | Date;
  onRetest: () => void;
  loading?: boolean;
};

export default function RetestBanner({ nextRetestAt, lastTestedAt, onRetest, loading }: Props) {
  if (!nextRetestAt) return null;

  const now = new Date();
  const retestDate = new Date(nextRetestAt);
  const daysUntil = Math.ceil((retestDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysUntil <= 0;
  const isUpcoming = daysUntil > 0 && daysUntil <= 30;

  if (!isOverdue && !isUpcoming) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className={`rounded-2xl border-2 p-4 ${
          isOverdue
            ? 'border-rose-200 bg-gradient-to-r from-rose-50 to-red-50'
            : 'border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isOverdue ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
              }`}
            >
              {isOverdue ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <Clock className="w-5 h-5" />
              )}
            </div>
            <div>
              <p className={`text-sm font-black ${isOverdue ? 'text-rose-800' : 'text-amber-800'}`}>
                {isOverdue
                  ? `pH & Moisture retest overdue by ${Math.abs(daysUntil)} days`
                  : `Retest due in ${daysUntil} days`}
              </p>
              <p className={`text-xs font-semibold ${isOverdue ? 'text-rose-600/70' : 'text-amber-600/70'}`}>
                {lastTestedAt
                  ? `Last tested: ${new Date(lastTestedAt).toLocaleDateString()}`
                  : 'pH & moisture should be rechecked every 4 months'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRetest}
            disabled={loading}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition-all ${
              isOverdue
                ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-200'
                : 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-200'
            } disabled:opacity-60`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Retest Now
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
