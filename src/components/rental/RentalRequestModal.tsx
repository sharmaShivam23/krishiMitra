'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Calendar, MessageSquare, IndianRupee, Shield, Loader2,
  CheckCircle2, AlertCircle, ChevronRight, ChevronLeft,
  FileText, Lock, ExternalLink, Check
} from 'lucide-react';
import ProtectionPlanSelector from './ProtectionPlanSelector';

interface Props {
  listing: {
    _id: string;
    title: string;
    pricing: { rate: number; unit: string };
    equipment: { name: string; condition: string };
  };
  onClose: () => void;
  onSuccess: () => void;
}

const STEPS = ['Schedule', 'Protection', 'Payment', 'Confirm'];

export default function RentalRequestModal({ listing, onClose, onSuccess }: Props) {
  const [step, setStep] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [protectionTier, setProtectionTier] = useState('standard');
  const [message, setMessage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [policy, setPolicy] = useState<any>(null);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);

  useEffect(() => {
    fetch('/api/rentals/policy').then(r => r.json()).then(d => { if (d.success) setPolicy(d.policy); });
  }, []);

  const totalDays = startDate && endDate
    ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  const totalAmount = listing.pricing.rate * totalDays;
  const depositPct = policy?.defaultDepositPercent || 25;
  const securityDeposit = Math.round(totalAmount * (depositPct / 100));
  const protPct = protectionTier === 'premium' ? 12 : protectionTier === 'standard' ? 5 : 0;
  const protectionFee = Math.round(totalAmount * (protPct / 100));
  const grandTotal = totalAmount + securityDeposit + protectionFee;

  const canNext = () => {
    if (step === 0) return totalDays > 0 && new Date(endDate) > new Date(startDate);
    if (step === 3) return policyAccepted;
    return true;
  };

  const next = () => {
    if (step === 0 && !canNext()) { setError('Select valid dates to continue'); return; }
    setError('');
    if (step < 3) setStep(step + 1);
  };
  const prev = () => { if (step > 0) { setStep(step - 1); setError(''); } };

  const submit = async () => {
    if (!policyAccepted) { setError('Accept the rental policy to continue'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/rentals', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ listingId: listing._id, startDate, endDate, protectionTier, renterMessage: message, paymentMethod })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Booking failed');
      setSuccess(true);
      setTimeout(onSuccess, 2200);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            onClick={e => e.stopPropagation()}
            className="w-full sm:max-w-[480px] max-h-[90vh] bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* ── TOP BAR ── */}
            <div className="shrink-0 flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
              <div className="min-w-0">
                <h2 className="text-[17px] font-semibold text-gray-900 truncate">{listing.title}</h2>
                <p className="text-[13px] text-gray-400 mt-0.5">₹{listing.pricing.rate}/{listing.pricing.unit} · {listing.equipment.condition}</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors -mr-1">
                <X className="w-[18px] h-[18px]" />
              </button>
            </div>

            {/* ── PROGRESS ── */}
            <div className="shrink-0 px-5 py-3 flex items-center gap-1 border-b border-gray-50">
              {STEPS.map((s, i) => (
                <React.Fragment key={s}>
                  <button
                    onClick={() => i < step && setStep(i)}
                    disabled={i > step}
                    className={`text-[12px] font-medium transition-colors ${
                      i === step ? 'text-emerald-600' :
                      i < step ? 'text-gray-500 cursor-pointer hover:text-emerald-600' : 'text-gray-300'
                    } flex items-center gap-1`}
                  >
                    {i < step ? (
                      <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center"><Check className="w-2.5 h-2.5" /></span>
                    ) : (
                      <span className={`w-4 h-4 rounded-full text-[10px] font-semibold flex items-center justify-center ${
                        i === step ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-400'
                      }`}>{i + 1}</span>
                    )}
                    {s}
                  </button>
                  {i < 3 && <div className={`flex-1 h-px ${i < step ? 'bg-emerald-400' : 'bg-gray-200'}`} />}
                </React.Fragment>
              ))}
            </div>

            {/* ── BODY ── */}
            <div className="flex-1 overflow-y-auto">
              {error && (
                <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-[13px] text-red-600 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}

              {success ? (
                <div className="p-8 text-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                  </div>
                  <p className="text-[17px] font-semibold text-gray-900">Booking request sent</p>
                  <p className="text-[13px] text-gray-500 mt-1">The owner will review your request shortly.</p>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.15 }}
                    className="p-5"
                  >
                    {/* ─── STEP 0: SCHEDULE ─── */}
                    {step === 0 && (
                      <div className="space-y-5">
                        <p className="text-[15px] font-semibold text-gray-900">When do you need it?</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-medium text-gray-500 mb-1 block">FROM</label>
                            <input type="date" min={minDate} value={startDate}
                              onChange={e => { setStartDate(e.target.value); setError(''); }}
                              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-900 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 transition-all" />
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-gray-500 mb-1 block">TO</label>
                            <input type="date" min={startDate || minDate} value={endDate}
                              onChange={e => { setEndDate(e.target.value); setError(''); }}
                              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-900 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 transition-all" />
                          </div>
                        </div>

                        {totalDays > 0 && (
                          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                            <div className="text-[13px] text-emerald-700">
                              <span className="font-semibold">{totalDays} day{totalDays > 1 ? 's' : ''}</span>
                              <span className="text-emerald-500 ml-1">({fmtDate(startDate)} – {fmtDate(endDate)})</span>
                            </div>
                            <span className="text-[15px] font-semibold text-gray-900">₹{totalAmount.toLocaleString('en-IN')}</span>
                          </div>
                        )}

                        <div>
                          <label className="text-[11px] font-medium text-gray-500 mb-1 block">NOTE TO OWNER <span className="text-gray-300">(optional)</span></label>
                          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={2}
                            placeholder="E.g., I need this for 5 acres of wheat sowing..."
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] text-gray-900 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 resize-none placeholder:text-gray-400 transition-all" />
                        </div>
                      </div>
                    )}

                    {/* ─── STEP 1: PROTECTION ─── */}
                    {step === 1 && (
                      <div className="space-y-4">
                        <div>
                          <p className="text-[15px] font-semibold text-gray-900">Add damage protection</p>
                          <p className="text-[13px] text-gray-400 mt-0.5">Optional coverage in case of accidental damage during the rental.</p>
                        </div>
                        <ProtectionPlanSelector selected={protectionTier} onSelect={setProtectionTier} totalAmount={totalAmount} />
                      </div>
                    )}

                    {/* ─── STEP 2: PAYMENT ─── */}
                    {step === 2 && (
                      <div className="space-y-4">
                        <div>
                          <p className="text-[15px] font-semibold text-gray-900">Payment method</p>
                          <p className="text-[13px] text-gray-400 mt-0.5">Payment is exchanged directly between you and the owner.</p>
                        </div>
                        <div className="space-y-2">
                          {[
                            { id: 'cash', label: 'Cash', sub: 'Pay at equipment pickup' },
                            { id: 'upi', label: 'UPI', sub: 'PhonePe, GPay, Paytm' },
                            { id: 'bank_transfer', label: 'Bank Transfer', sub: 'NEFT / IMPS' },
                          ].map(m => (
                            <button key={m.id} type="button" onClick={() => setPaymentMethod(m.id)}
                              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                                paymentMethod === m.id
                                  ? 'border-emerald-500 bg-emerald-50/40'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}>
                              <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 ${
                                paymentMethod === m.id ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                              }`}>
                                {paymentMethod === m.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                              <div>
                                <span className="text-[14px] font-medium text-gray-900 block">{m.label}</span>
                                <span className="text-[12px] text-gray-400">{m.sub}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ─── STEP 3: CONFIRM ─── */}
                    {step === 3 && (
                      <div className="space-y-5">
                        <p className="text-[15px] font-semibold text-gray-900">Order summary</p>

                        {/* Line items */}
                        <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 text-[13px]">
                          <div className="px-4 py-3 flex items-center justify-between">
                            <div>
                              <span className="text-gray-900 font-medium">{listing.title}</span>
                              <span className="text-gray-400 block text-[12px]">{fmtDate(startDate)} – {fmtDate(endDate)} · {totalDays}d</span>
                            </div>
                            <span className="font-medium text-gray-900">₹{totalAmount.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="px-4 py-2.5 flex justify-between text-gray-500">
                            <span>Security deposit ({depositPct}%)</span>
                            <span className="text-amber-600 font-medium">₹{securityDeposit.toLocaleString('en-IN')}</span>
                          </div>
                          {protectionFee > 0 && (
                            <div className="px-4 py-2.5 flex justify-between text-gray-500">
                              <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> {protectionTier} protection</span>
                              <span className="text-blue-600 font-medium">₹{protectionFee.toLocaleString('en-IN')}</span>
                            </div>
                          )}
                          <div className="px-4 py-3 flex justify-between bg-gray-50 rounded-b-xl">
                            <span className="text-gray-900 font-semibold">Total</span>
                            <span className="text-[16px] font-semibold text-gray-900">₹{grandTotal.toLocaleString('en-IN')}</span>
                          </div>
                        </div>

                        <p className="text-[11px] text-gray-400 -mt-2">Security deposit is refundable after undamaged return</p>

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-3 text-[12px]">
                          <div className="bg-gray-50 rounded-lg px-3 py-2">
                            <span className="text-gray-400 block">Payment</span>
                            <span className="text-gray-700 font-medium capitalize">{paymentMethod.replace('_', ' ')}</span>
                          </div>
                          <div className="bg-gray-50 rounded-lg px-3 py-2">
                            <span className="text-gray-400 block">Protection</span>
                            <span className="text-gray-700 font-medium capitalize">{protectionTier}</span>
                          </div>
                        </div>

                        {/* ── POLICY CHECKBOX ── */}
                        <div className={`rounded-xl border p-3.5 transition-colors ${policyAccepted ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200'}`}>
                          <label className="flex items-start gap-3 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={policyAccepted}
                              onChange={e => setPolicyAccepted(e.target.checked)}
                              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                            />
                            <span className="text-[12px] text-gray-600 leading-relaxed">
                              I agree to the{' '}
                              <button type="button" onClick={() => setShowPolicy(true)}
                                className="text-emerald-600 font-medium underline underline-offset-2 decoration-emerald-300 hover:text-emerald-700">
                                Equipment Rental Policy & Terms
                              </button>
                              , including liability, damage assessment, and deposit forfeiture provisions.
                            </span>
                          </label>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>

            {/* ── FOOTER ── */}
            {!success && (
              <div className="shrink-0 border-t border-gray-100 px-5 py-3 flex items-center gap-3 bg-white">
                {step > 0 ? (
                  <button onClick={prev} className="text-[13px] font-medium text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                ) : <div />}
                <div className="flex-1" />

                {/* Price pill on confirm step */}
                {step === 3 && totalDays > 0 && (
                  <span className="text-[13px] font-semibold text-gray-900 mr-2">₹{grandTotal.toLocaleString('en-IN')}</span>
                )}

                {step < 3 ? (
                  <button onClick={next} disabled={!canNext()}
                    className="px-6 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1">
                    Continue <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button onClick={submit} disabled={loading || !policyAccepted}
                    className="px-6 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5">
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                    {loading ? 'Booking...' : 'Confirm Booking'}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* ── POLICY DRAWER ── */}
      <AnimatePresence>
        {showPolicy && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 flex items-end sm:items-center justify-center"
            onClick={() => setShowPolicy(false)}
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full sm:max-w-lg max-h-[80vh] bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col"
            >
              <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="text-[15px] font-semibold text-gray-900">Rental Policy & Terms</h3>
                <button onClick={() => setShowPolicy(false)} className="text-gray-400 hover:text-gray-600"><X className="w-[18px] h-[18px]" /></button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 text-[13px] text-gray-600 leading-relaxed space-y-5">
                <p className="text-[11px] text-gray-400 font-medium">KrishiMitra Equipment Rental Agreement · Version 2.0 · April 2026</p>

                <Section n="1" t="Definitions">
                  <p><b>"Platform"</b> means KrishiMitra, an intermediary connecting equipment owners ("Lessors") with renters ("Lessees"). <b>"Rental Period"</b> means the period between confirmed Handover Date and Return Date. <b>"Security Deposit"</b> means the refundable amount held against damage or breach.</p>
                </Section>

                <Section n="2" t="Inspection Protocol">
                  <p>The Lessor shall conduct a <b>Pre-Handover Inspection</b> with minimum 4 photographs before equipment transfer. A <b>Post-Return Inspection</b> shall be completed within 24 hours of return. Failure by the Lessee to dispute the pre-handover record within 2 hours of receipt constitutes <b>irrevocable acceptance</b> of the baseline condition.</p>
                </Section>

                <Section n="3" t="Liability for Damages">
                  <p>The Lessee is <b>solely liable</b> for all damage during the Rental Period except: (a) normal wear consistent with intended use; (b) pre-existing defects in the baseline record; (c) force majeure with demonstrated reasonable care. Damage quantum is the <b>lower of</b> repair cost or diminution in fair market value.</p>
                </Section>

                <Section n="4" t="Protection Coverage">
                  <p><b>Basic (Free):</b> Zero coverage — 100% liability. <b>Standard (5%):</b> 50% damage coverage, priority support in 48h. <b>Premium (12%):</b> 90% coverage, breakdown protection, express support in 24h, liability capped at 10%. Coverage <b>excludes</b>: intentional damage, misuse, sub-letting, theft, operation under intoxicants, or use for non-agricultural purposes.</p>
                </Section>

                <Section n="5" t="Security Deposit">
                  <p>Deposit ({depositPct}% of rental) collected before handover. Refunded within 48 hours if no damage claim is filed. <b>Full forfeiture</b> applies for: late return without consent, material deterioration beyond baseline, unauthorized third-party transfer, or illegal use.</p>
                </Section>

                <Section n="6" t="Dispute Resolution">
                  <p>Disputes shall first be resolved amicably within 72 hours via Platform messaging. Failing resolution, either party may escalate to Platform Administration whose decision shall be <b>final and binding</b>. Users acting in bad faith or submitting fraudulent claims are subject to account termination.</p>
                </Section>

                <Section n="7" t="Cancellation">
                  <p><b>Free cancellation</b> if notice given 24+ hours before handover. Late cancellation may incur a fee of one day's rental. No-show results in automatic cancellation after 24 hours with no liability to Lessor.</p>
                </Section>

                <Section n="8" t="Limitation of Liability">
                  <p>KrishiMitra is an <b>IT intermediary</b> per Information Technology Act, 2000. The Platform is not liable for equipment condition, fitness, safety, personal injury, or any direct/indirect losses from rental transactions. Both parties transact at their own risk.</p>
                </Section>

                <Section n="9" t="Governing Law">
                  <p>Governed by the laws of the Republic of India. Exclusive jurisdiction: courts at New Delhi. If any provision is invalid, remaining provisions continue in full force.</p>
                </Section>
              </div>

              <div className="shrink-0 border-t border-gray-100 px-5 py-3 flex justify-end">
                <button onClick={() => { setShowPolicy(false); setPolicyAccepted(true); }}
                  className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all">
                  I Agree
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Section({ n, t, children }: { n: string; t: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[12px] font-semibold text-gray-900 mb-1">{n}. {t}</h4>
      <div className="text-[12px] text-gray-500 leading-relaxed">{children}</div>
    </div>
  );
}
