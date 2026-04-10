'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, AlertTriangle, Truck, Shield, FileText, Camera, XCircle, Gavel } from 'lucide-react';

interface TimelineEntry {
  event: string;
  timestamp: string;
  actor?: string;
  note?: string;
}

const ACTOR_COLORS: Record<string, string> = {
  renter: 'bg-blue-100 text-blue-700',
  owner: 'bg-emerald-100 text-emerald-700',
  admin: 'bg-purple-100 text-purple-700',
  system: 'bg-gray-100 text-gray-600'
};

const EVENT_ICONS: Record<string, React.ReactNode> = {
  'requested': <Clock className="w-4 h-4" />,
  'approved': <CheckCircle2 className="w-4 h-4" />,
  'rejected': <XCircle className="w-4 h-4" />,
  'agreement': <FileText className="w-4 h-4" />,
  'deposit': <Shield className="w-4 h-4" />,
  'active': <Truck className="w-4 h-4" />,
  'inspection': <Camera className="w-4 h-4" />,
  'damage': <AlertTriangle className="w-4 h-4" />,
  'completed': <CheckCircle2 className="w-4 h-4" />,
  'cancelled': <XCircle className="w-4 h-4" />,
  'dispute': <Gavel className="w-4 h-4" />,
};

function getIcon(event: string) {
  const lower = event.toLowerCase();
  for (const [key, icon] of Object.entries(EVENT_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return <Clock className="w-4 h-4" />;
}

function getEventDotColor(event: string) {
  const lower = event.toLowerCase();
  if (lower.includes('completed') || lower.includes('approved') || lower.includes('accepted')) return 'bg-emerald-500';
  if (lower.includes('rejected') || lower.includes('cancelled')) return 'bg-red-500';
  if (lower.includes('damage') || lower.includes('dispute')) return 'bg-amber-500';
  if (lower.includes('active') || lower.includes('started')) return 'bg-blue-500';
  return 'bg-gray-400';
}

interface Props {
  timeline: TimelineEntry[];
  currentStatus: string;
}

export default function RentalStatusTimeline({ timeline, currentStatus }: Props) {
  if (!timeline || timeline.length === 0) return null;

  return (
    <div className="space-y-1">
      <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4 text-gray-400" />
        Rental Timeline
      </h3>
      <div className="relative pl-6">
        {/* Vertical line */}
        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200" />

        {timeline.map((entry, i) => {
          const isLatest = i === timeline.length - 1;
          const dotColor = getEventDotColor(entry.event);

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`relative pb-5 last:pb-0 ${isLatest ? '' : ''}`}
            >
              {/* Dot */}
              <div className={`absolute -left-6 top-1 w-[10px] h-[10px] rounded-full border-2 border-white ${dotColor} shadow-sm z-10`} />

              <div className={`${isLatest ? 'bg-gray-50 border border-gray-200 rounded-xl p-3' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <span className={`mt-0.5 shrink-0 ${isLatest ? 'text-gray-700' : 'text-gray-400'}`}>
                      {getIcon(entry.event)}
                    </span>
                    <div className="min-w-0">
                      <p className={`text-sm font-bold leading-tight ${isLatest ? 'text-gray-900' : 'text-gray-600'}`}>
                        {entry.event}
                      </p>
                      {entry.note && (
                        <p className="text-xs text-gray-400 font-medium mt-0.5 line-clamp-2">{entry.note}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {entry.actor && (
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${ACTOR_COLORS[entry.actor] || ACTOR_COLORS.system}`}>
                        {entry.actor}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 mt-1 ml-6 font-medium">
                  {new Date(entry.timestamp).toLocaleString('en-IN', { 
                    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
