'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, UserCheck, Clock, CheckCircle2, X, MapPin, Send } from 'lucide-react';

type ScheduledTest = {
  status?: string;
  requestedAt?: string;
  preferredDate?: string;
  assignedTo?: { name?: string; phone?: string };
  assignedAt?: string;
  completedAt?: string;
  notes?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  farmlandId: string;
  scheduledTest?: ScheduledTest;
  location?: { state?: string; district?: string; village?: string };
  onSuccess: (data: ScheduledTest) => void;
};

const STATUS_TIMELINE = [
  { key: 'requested', label: 'Requested', icon: <Send className="w-4 h-4" /> },
  { key: 'assigned', label: 'Tester Assigned', icon: <UserCheck className="w-4 h-4" /> },
  { key: 'in-progress', label: 'Testing', icon: <Clock className="w-4 h-4" /> },
  { key: 'completed', label: 'Completed', icon: <CheckCircle2 className="w-4 h-4" /> },
];

export default function ScheduleTestModal({ isOpen, onClose, farmlandId, scheduledTest, location, onSuccess }: Props) {
  const [selDate, setSelDate] = useState('');
  const [selTime, setSelTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hasExistingRequest =
    scheduledTest?.status && !['none', 'cancelled', 'completed'].includes(scheduledTest.status);

  // Generate next 7 days for booking
  const nextDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1); // Start from tomorrow
    return {
      iso: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      dayNum: d.getDate(),
      monthName: d.toLocaleDateString('en-IN', { month: 'short' })
    };
  });
  const TIME_SLOTS = ['09:00 AM', '11:30 AM', '02:00 PM', '04:30 PM'];

  const handleSubmit = async () => {
    if (!selDate || !selTime) {
      setError('Please select a date and time slot');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const formattedPrefDate = `${selDate} ${selTime}`;
      const res = await fetch(`/api/farmlands/${farmlandId}/test-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ preferredDate: formattedPrefDate, notes: notes || undefined }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to schedule test');
      onSuccess(data.scheduledTest);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const currentStepIndex = STATUS_TIMELINE.findIndex((s) => s.key === scheduledTest?.status);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-[420px] rounded-t-3xl sm:rounded-3xl border border-emerald-100 bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                  Concierge Service
                </p>
                <h3 className="text-xl font-black text-emerald-950 mt-0.5">
                  {hasExistingRequest ? 'Test Status' : 'Book Field Test'}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Location info */}
            {location && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-orange-50 border border-orange-100/50 px-3 py-2.5 text-xs font-bold text-orange-800">
                <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                <span className="truncate">{[location.village, location.district, location.state].filter(Boolean).join(', ')}</span>
              </div>
            )}

            {/* Existing request — show timeline */}
            {hasExistingRequest && (
              <div className="mt-6 space-y-0 pl-2">
                {STATUS_TIMELINE.map((step, index) => {
                  const isDone = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  return (
                    <div key={step.key} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center border-[3px] shadow-sm z-10 ${
                            isDone
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : 'border-gray-100 bg-white text-gray-300'
                          } ${isCurrent ? 'ring-4 ring-emerald-100/50' : ''}`}
                        >
                          {step.icon}
                        </div>
                        {index < STATUS_TIMELINE.length - 1 && (
                          <div className={`w-[2px] h-10 -mt-1 -mb-1 ${isDone ? 'bg-emerald-400' : 'bg-gray-100'}`} />
                        )}
                      </div>
                      <div className="pt-2 pb-4">
                        <p className={`text-[15px] font-black uppercase tracking-wide ${isDone ? 'text-emerald-950' : 'text-gray-400'}`}>
                          {step.label}
                        </p>
                        {isCurrent && step.key === 'assigned' && scheduledTest?.assignedTo?.name && (
                          <p className="text-xs font-bold text-emerald-600 mt-1">
                            Assigned to: {scheduledTest.assignedTo.name}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}

                {scheduledTest?.notes && (
                  <div className="mt-4 rounded-xl bg-gray-50 border border-gray-100 p-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Your Note</p>
                    <p className="text-sm font-semibold text-gray-700">{scheduledTest.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* New request form (Premium Flow) */}
            {!hasExistingRequest && (
              <div className="mt-5 space-y-6">
                <div className="flex items-start gap-3 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 p-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                    <UserCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-emerald-950">Expert Setup</h4>
                    <p className="text-xs font-semibold text-emerald-800/70 mt-1 leading-relaxed">
                      A certified technician will visit your location to extract soil safely and securely for precision pH mapping.
                    </p>
                  </div>
                </div>

                {/* Date Picker */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-black text-gray-900">Select Date</h4>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{nextDays[0].monthName} {new Date().getFullYear()}</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 no-scrollbar snap-x">
                    {nextDays.map((d) => (
                      <button
                        type="button"
                        key={d.iso}
                        onClick={() => setSelDate(d.iso)}
                        className={`shrink-0 snap-center rounded-2xl border-2 px-3 pt-3 pb-2 w-[72px] text-center transition-all ${
                          selDate === d.iso 
                            ? 'border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/20' 
                            : 'border-gray-100 bg-white hover:border-emerald-200 hover:bg-emerald-50 text-gray-600'
                        }`}
                      >
                        <p className={`text-[10px] font-black uppercase mb-1 ${selDate === d.iso ? 'text-emerald-200' : 'text-gray-400'}`}>{d.dayName}</p>
                        <p className="text-xl font-black leading-none">{d.dayNum}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Picker */}
                <AnimatePresence>
                  {selDate && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                      <h4 className="text-sm font-black text-gray-900 mb-3">Available Time</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {TIME_SLOTS.map(t => (
                          <button
                            type="button"
                            key={t}
                            onClick={() => setSelTime(t)}
                            className={`rounded-xl border border-gray-200 py-3 text-xs font-black transition-all ${
                              selTime === t 
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600' 
                                : 'bg-white hover:border-emerald-300 hover:bg-emerald-50/50 text-gray-700'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && (
                  <p className="text-xs font-bold text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100">{error}</p>
                )}

                <div className="pt-2">
                  <div className="flex items-center justify-between mb-4 px-1">
                    <span className="text-sm font-bold text-gray-500">Service Fee</span>
                    <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">Free (Govt Subsidized)</span>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading || !selDate || !selTime}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-tr from-emerald-950 to-emerald-800 text-white px-4 py-4 text-sm font-black shadow-xl shadow-emerald-900/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none"
                  >
                    {loading ? <Clock className="w-5 h-5 animate-spin text-emerald-300" /> : <CalendarDays className="w-5 h-5 text-emerald-300" />}
                    {loading ? 'Confirming...' : 'Confirm Booking'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
