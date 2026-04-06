'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Loader2, MapPin, BarChart3, ArrowRight,
  Leaf, AlertTriangle, RefreshCw, CheckCircle2, Sprout
} from 'lucide-react';
import SoilScoreGauge from '@/components/soil/SoilScoreGauge';

type Farmland = {
  _id: string; landName: string; areaAcres?: number; soilType?: string;
  location: { state: string; district: string; village?: string };
  phMoisture?: { ph?: number; moisture?: number; source?: string; testedAt?: string };
  soilHealthCard?: { values?: { n?: number; p?: number; k?: number; ec?: number; organicCarbon?: number } };
  report?: {
    score?: number; rating?: string; summary?: string; generatedAt?: string;
    insights?: string[];
    cropRecommendations?: Array<{ cropName: string; confidence: number; reason: string; season?: string }>;
    issues?: Array<{ parameter: string; severity: string; description: string; fix: string }>;
    fertilizerSchedule?: Array<{ stage: string; instructions: string }>;
  };
  status: string;
};

export default function SoilReportPage({ params }: { params: Promise<{ landId: string }> }) {
  const { landId } = use(params);
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('Soil.report');

  const [farmland, setFarmland] = useState<Farmland | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/farmlands/${landId}`, { credentials: 'include' });
      const d = await res.json();
      if (d.success) setFarmland(d.farmland);
      else setError('Failed to load farmland');
    } catch { setError('Failed to load'); }
    finally { setLoading(false); }
  }, [landId]);

  useEffect(() => { load(); }, [load]);

  const generate = async () => {
    setGenerating(true); setError('');
    try {
      const res = await fetch(`/api/farmlands/${landId}/report`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ locale }),
        credentials: 'include',
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed');
      await load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to generate'); }
    finally { setGenerating(false); }
  };

  const hasPh = typeof farmland?.phMoisture?.ph === 'number';
  const hasReport = typeof farmland?.report?.score === 'number';
  const loc = farmland ? [farmland.location.village, farmland.location.district, farmland.location.state].filter(Boolean).join(', ') : '';
  const backUrl = `/${locale}/dashboard/soil-intelligence/${landId}`;

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
    </div>
  );

  if (!farmland) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
      <p className="font-bold text-gray-600">Farmland not found</p>
      <button type="button" onClick={() => router.back()} className="text-emerald-600 underline text-sm">Go back</button>
    </div>
  );

  /* ── No pH data yet ── */
  if (!hasPh) return (
    <div className="max-w-lg mx-auto mt-10 space-y-5">
      <button type="button" onClick={() => router.push(backUrl)}
        className="inline-flex items-center gap-1.5 text-gray-500 text-sm font-semibold hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to {farmland.landName}
      </button>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 mx-auto flex items-center justify-center mb-4">
          <BarChart3 className="w-8 h-8 text-gray-300" />
        </div>
        <h2 className="text-lg font-black text-gray-900">Report Not Available</h2>
        <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
          Add pH and moisture test data to your farmland first, then come back to generate your report.
        </p>
        <button type="button" onClick={() => router.push(backUrl)}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 text-white px-5 py-2.5 text-sm font-bold hover:bg-emerald-700 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Go Add Test Data
        </button>
      </div>
    </div>
  );

  /* ── No report yet, but has data ── */
  if (!hasReport) return (
    <div className="max-w-lg mx-auto mt-10 space-y-5">
      <button type="button" onClick={() => router.push(backUrl)}
        className="inline-flex items-center gap-1.5 text-gray-500 text-sm font-semibold hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to {farmland.landName}
      </button>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 mx-auto flex items-center justify-center mb-4">
          <BarChart3 className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-lg font-black text-gray-900">Generate Your Soil Report</h2>
        <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
          We&apos;ll analyze your soil data and give you crop recommendations, health score, and improvement tips.
        </p>

        {/* Data summary */}
        <div className="mt-4 flex gap-2 justify-center">
          <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-xs font-bold text-blue-700">pH {farmland.phMoisture!.ph}</span>
          <span className="px-3 py-1.5 rounded-lg bg-cyan-50 text-xs font-bold text-cyan-700">Moisture {farmland.phMoisture!.moisture}%</span>
          {farmland.soilType && <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-xs font-bold text-emerald-700">{farmland.soilType}</span>}
        </div>

        {error && <p className="mt-3 text-xs font-bold text-red-600 flex items-center justify-center gap-1"><AlertTriangle className="w-3 h-3" /> {error}</p>}

        <button type="button" onClick={generate} disabled={generating}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 text-white px-6 py-3 text-sm font-black shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-colors disabled:opacity-60">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          {generating ? 'Analyzing soil...' : 'Generate Report'}
        </button>
      </div>
    </div>
  );

  /* ══════════════════ FULL REPORT ══════════════════ */
  const report = farmland.report!;

  return (
    <div className="max-w-3xl mx-auto space-y-4 md:space-y-5">

      {/* Nav */}
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => router.push(backUrl)}
          className="inline-flex items-center gap-1.5 text-gray-500 text-sm font-semibold hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" /> {farmland.landName}
        </button>
        <button type="button" onClick={generate} disabled={generating}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-60">
          {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Regenerate
        </button>
      </div>

      {/* ── Score Hero ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden shadow-[0_18px_50px_-22px_rgba(2,44,34,0.85)]">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1200&auto=format&fit=crop')" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/95 via-emerald-950/85 to-emerald-900/60" />

        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
          <SoilScoreGauge score={report.score!} rating={report.rating!} size={170} />
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-black text-white">Soil Health Report</h1>
            <p className="mt-1 text-emerald-200/60 text-sm font-semibold flex items-center gap-1.5 justify-center md:justify-start">
              <MapPin className="w-3.5 h-3.5" /> {farmland.landName} · {loc}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 justify-center md:justify-start">
              {farmland.phMoisture?.ph && <span className="px-3 py-1 rounded-lg bg-white/10 border border-white/15 text-xs font-bold text-white">pH {farmland.phMoisture.ph}</span>}
              {farmland.phMoisture?.moisture && <span className="px-3 py-1 rounded-lg bg-white/10 border border-white/15 text-xs font-bold text-white">Moisture {farmland.phMoisture.moisture}%</span>}
              {farmland.soilType && <span className="px-3 py-1 rounded-lg bg-white/10 border border-white/15 text-xs font-bold text-white">{farmland.soilType}</span>}
            </div>
            {report.generatedAt && (
              <p className="mt-2 text-xs text-emerald-300/40 font-medium">
                Generated {new Date(report.generatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Summary & Insights ── */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] p-6 md:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-black text-gray-900 mb-2">{t('executiveSummary')}</h2>
          <p className="text-sm font-medium text-gray-600 leading-relaxed">
            {report.summary || t('analysisComplete')}
          </p>
        </div>

        {report.insights && report.insights.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6 border-t border-gray-100">
            {report.insights.map((ins, i) => (
              <div key={i} className="flex items-start gap-3 rounded-2xl bg-emerald-50/50 border border-emerald-100/50 p-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                <p className="text-sm font-semibold text-emerald-900 leading-snug">{ins}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Soil Chemistry Matrix ── */}
      {farmland.soilHealthCard?.values && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] p-6 md:p-8">
          <h2 className="text-xl font-black text-gray-900 mb-6">{t('soilChemistry')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {[
              { l: t('nitrogen'), k: 'n', v: farmland.soilHealthCard.values.n, unit: 'kg/ha', min: 0, max: 400, optMin: 180, optMax: 280, color: 'emerald' },
              { l: t('phosphorus'), k: 'p', v: farmland.soilHealthCard.values.p, unit: 'kg/ha', min: 0, max: 60, optMin: 15, optMax: 35, color: 'blue' },
              { l: t('potassium'), k: 'k', v: farmland.soilHealthCard.values.k, unit: 'kg/ha', min: 0, max: 400, optMin: 140, optMax: 280, color: 'purple' },
              { l: t('organicCarbon'), k: 'oc', v: farmland.soilHealthCard.values.organicCarbon, unit: '%', min: 0, max: 1.5, optMin: 0.5, optMax: 0.75, color: 'orange' },
            ].map(n => {
              if (n.v === undefined || n.v === null) return null;
              const valNum = Number(n.v);
              const pct = Math.min(100, Math.max(0, (valNum / n.max) * 100));
              const optMinPct = (n.optMin / n.max) * 100;
              const optMaxPct = (n.optMax / n.max) * 100;
              const isLow = valNum < n.optMin;
              const isHigh = valNum > n.optMax;
              const colorClass = isLow ? 'bg-amber-400' : isHigh ? 'bg-red-400' : 'bg-emerald-500';

              return (
                <div key={n.k} className="relative">
                  <div className="flex justify-between items-baseline mb-2">
                    <p className="text-sm font-bold text-gray-700">{n.l}</p>
                    <p className="text-lg font-black text-gray-900">{valNum} <span className="text-xs text-gray-400 font-medium">{n.unit}</span></p>
                  </div>
                  {/* Gauge bar track */}
                  <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden mb-1">
                    {/* Optimal zone marker */}
                    <div className="absolute top-0 bottom-0 bg-black/5" style={{ left: `${optMinPct}%`, width: `${optMaxPct - optMinPct}%` }} />
                    {/* Value bar */}
                    <div className={`absolute top-0 bottom-0 left-0 ${colorClass} rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
                    <span>{isLow ? <span className="text-amber-500">{t('low')}</span> : '0'}</span>
                    <span>{isHigh ? <span className="text-red-500">{t('high')}</span> : n.max}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── Issues & Fixes ── */}
      {report.issues && report.issues.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] p-6 md:p-8">
          <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" /> {t('actionPlan')}
          </h2>
          <div className="space-y-4">
            {report.issues.map((iss, i) => (
              <div key={i} className={`rounded-2xl overflow-hidden border ${
                iss.severity === 'critical' ? 'border-red-200 shadow-sm shadow-red-100' : iss.severity === 'warning' ? 'border-amber-200' : 'border-green-200'
              }`}>
                <div className={`px-5 py-4 flex items-center justify-between ${
                  iss.severity === 'critical' ? 'bg-red-50' : iss.severity === 'warning' ? 'bg-amber-50' : 'bg-green-50'
                }`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-gray-900">{iss.parameter}</p>
                      <span className={`text-[9px] font-black uppercase tracking-widest rounded-md px-2 py-0.5 ${
                        iss.severity === 'critical' ? 'bg-red-200 text-red-800' :
                        iss.severity === 'warning' ? 'bg-amber-200 text-amber-800' : 'bg-green-200 text-green-800'
                      }`}>{iss.severity}</span>
                    </div>
                    <p className="text-xs font-semibold text-gray-600 mt-1">{iss.description}</p>
                  </div>
                </div>
                <div className="px-5 py-4 bg-white">
                  <p className="text-sm font-bold text-gray-800 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="leading-relaxed">{iss.fix}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Crop Matrix & Fertilizer Guide ── */}
      <div className="space-y-4 md:space-y-5">
        
        {/* Recommended Crops */}
        {report.cropRecommendations && report.cropRecommendations.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] p-6 md:p-8">
            <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
              <Sprout className="w-5 h-5 text-emerald-500" /> {t('recommendedCrops')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
              {report.cropRecommendations.map((c, i) => (
                <div key={i} className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-5 shadow-sm hover:border-emerald-100 hover:shadow-[0_8px_30px_-12px_rgba(16,185,129,0.15)] transition-all duration-300">
                  {/* Decorative background element */}
                  <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-[100px] opacity-20 transition-transform duration-500 group-hover:scale-110 ${
                    c.confidence >= 80 ? 'bg-gradient-to-br from-emerald-50 to-emerald-200' :
                    c.confidence >= 60 ? 'bg-gradient-to-br from-amber-50 to-amber-200' : 'bg-gradient-to-br from-gray-50 to-gray-200'
                  }`} />
                  
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Icon Base */}
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-50 text-gray-400 shrink-0 border border-gray-100 group-hover:bg-emerald-50 group-hover:text-emerald-500 group-hover:border-emerald-100 transition-colors">
                      <Sprout className="w-6 h-6" />
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex flex-row items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <h4 className="text-base font-black text-gray-900 truncate">{c.cropName}</h4>
                          {c.season && (
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 group-hover:text-emerald-600 transition-colors">
                              {c.season} {t('seasonLabel')}
                            </p>
                          )}
                        </div>
                        
                        {/* Match Progress Bar */}
                        <div className="flex flex-col items-end shrink-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
                              <div className={`h-full rounded-full ${
                                c.confidence >= 80 ? 'bg-emerald-500' : c.confidence >= 60 ? 'bg-amber-400' : 'bg-gray-300'
                              }`} style={{ width: `${Math.min(100, Math.max(0, c.confidence))}%` }} />
                            </div>
                            <span className={`text-xs font-black ${
                              c.confidence >= 80 ? 'text-emerald-600' : c.confidence >= 60 ? 'text-amber-600' : 'text-gray-500'
                            }`}>
                              {c.confidence}%
                            </span>
                          </div>
                          <span className="text-[9px] font-black text-gray-300 uppercase tracking-wider">{t('match')}</span>
                        </div>
                      </div>
                      
                      <p className="text-[13px] font-medium text-gray-500 leading-relaxed">
                        {c.reason}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Fertilizer Schedule */}
        {report.fertilizerSchedule && report.fertilizerSchedule.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-white rounded-3xl border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] p-6 md:p-8">
            <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
              <Leaf className="w-5 h-5 text-amber-500" /> {t('fertilizerGuide')}
            </h2>
            <div className="relative border-l-2 border-gray-100 ml-3 space-y-6">
              {report.fertilizerSchedule.map((fs, i) => (
                <div key={i} className="relative pl-6">
                  {/* Timeline dot */}
                  <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-4 border-amber-400 shrink-0" />
                  <h4 className="text-sm font-black text-gray-900">{fs.stage}</h4>
                  <p className="text-xs font-semibold text-gray-600 mt-1.5 leading-relaxed bg-amber-50/50 p-3 rounded-xl border border-amber-100/30">
                    {fs.instructions}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
        
      </div>

      {/* Bottom spacing */}
      <div className="h-4" />
    </div>
  );
}
