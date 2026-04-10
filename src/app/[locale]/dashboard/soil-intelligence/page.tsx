'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  Plus, Loader2, AlertTriangle,
  MapPin, X, ArrowRight, Leaf,
  Droplets, FileText, BarChart3, FlaskConical, ChevronDown
} from 'lucide-react';
import LandCard from '@/components/soil/LandCard';

type FarmlandItem = {
  _id: string; landName: string; areaAcres?: number; soilType?: string;
  location?: { state?: string; district?: string; village?: string };
  status: string; progress: number;
  phMoisture?: { ph?: number; moisture?: number; testedAt?: string; nextRetestAt?: string };
  report?: { score?: number; rating?: string };
  _statusMeta?: { retestNeeded?: boolean; shcExpired?: boolean };
};
type Stats = { total: number; completed: number; needsAttention: number; testScheduled: number };
const SOIL_TYPES = [
  { value: 'Alluvial', key: 'alluvial' },
  { value: 'Black', key: 'black' },
  { value: 'Red', key: 'red' },
  { value: 'Laterite', key: 'laterite' },
  { value: 'Sandy', key: 'sandy' },
  { value: 'Clay', key: 'clay' },
  { value: 'Loamy', key: 'loamy' }
] as const;

const STEPS = [
  {
    key: 'register',
    icon: MapPin,
    color: 'bg-emerald-500',
    ring: 'ring-emerald-500/20'
  },
  {
    key: 'test',
    icon: Droplets,
    color: 'bg-blue-500',
    ring: 'ring-blue-500/20'
  },
  {
    key: 'upload',
    icon: FileText,
    color: 'bg-amber-500',
    ring: 'ring-amber-500/20'
  },
  {
    key: 'report',
    icon: BarChart3,
    color: 'bg-violet-500',
    ring: 'ring-violet-500/20'
  }
];

export default function SoilIntelligenceHub() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('SoilHub');
  const [farmlands, setFarmlands] = useState<FarmlandItem[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, completed: 0, needsAttention: 0, testScheduled: 0 });
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/farmlands', { credentials: 'include' });
      const d = await res.json();
      if (d.success) { setFarmlands(d.farmlands || []); setStats(d.stats || { total: 0, completed: 0, needsAttention: 0, testScheduled: 0 }); }
    } catch { /* */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const go = (id: string) => router.push(`/${locale}/dashboard/soil-intelligence/${id}`);
  const done = (id?: string) => { setShowAdd(false); if (id) go(id); else load(); };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>;

  /* ═══════ EMPTY STATE ═══════ */
  if (farmlands.length === 0) return (
    <div className="max-w-4xl mx-auto">
      {/* Full-width hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden shadow-[0_18px_50px_-22px_rgba(2,44,34,0.85)] min-h-[260px] md:min-h-[300px]"
      >
        <div className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2064&auto=format&fit=crop')" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/95 via-emerald-950/80 to-emerald-900/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/70 to-transparent" />

        {/* Floating leaf particles */}
        {['🌿', '🍃', '🌾'].map((e, i) => (
          <motion.span key={i} className="absolute text-2xl pointer-events-none select-none"
            style={{ right: `${15 + i * 18}%`, top: `${20 + i * 12}%` }}
            animate={{ y: [0, -10, 0], rotate: [0, 8, -8, 0], opacity: [0.15, 0.35, 0.15] }}
            transition={{ duration: 4 + i, repeat: Infinity, delay: i * 1.2 }} >
            {e}
          </motion.span>
        ))}

        <div className="relative z-10 p-7 md:p-10 flex flex-col justify-end h-full min-h-[260px] md:min-h-[300px]">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/15 border border-emerald-400/25 text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-3 w-fit">
            <FlaskConical className="w-3 h-3" /> {t('badge')}
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-[1.1]">
            {t('heroTitle')}<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-amber-400">{t('heroTitleHighlight')}</span>
          </h1>
          <p className="mt-3 text-emerald-200/60 text-sm md:text-base font-semibold max-w-lg">
            {t('heroSubtitle')}
          </p>
        </div>
      </motion.div>

      {/* How it works — visual steps */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="mt-5 md:mt-6"
      >
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">{t('howItWorks')}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.06 }}
              className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`w-10 h-10 rounded-xl ${step.color} ring-4 ${step.ring} flex items-center justify-center mb-3`}>
                <step.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-black text-gray-300">0{i + 1}</span>
                <h3 className="text-sm font-bold text-gray-900 leading-tight">{t(`steps.${step.key}.title`)}</h3>
              </div>
              <p className="text-xs text-gray-500 font-medium leading-snug">{t(`steps.${step.key}.desc`)}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="mt-5 space-y-4"
      >
        <button type="button" onClick={() => setShowAdd(true)}
          className="group w-full flex items-center justify-center gap-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 text-base font-black transition-all shadow-[0_12px_28px_-8px_rgba(16,185,129,0.55)] active:scale-[0.98]">
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          {t('cta.addFirst')}
          <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </button>

        {/* Lab Finder CTA */}
        <div 
          onClick={() => router.push(`/${locale}/dashboard/soil-intelligence/labs`)}
          className="cursor-pointer group bg-emerald-50 rounded-2xl border border-emerald-100 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-lg hover:border-emerald-200 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
              <FlaskConical className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-black text-emerald-950">{t('labCta.needTitle')}</h3>
              <p className="text-xs font-semibold text-emerald-800/80 mt-0.5 max-w-sm">{t('labCta.desc')}</p>
            </div>
          </div>
          <button className="whitespace-nowrap shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-white text-emerald-700 px-5 py-2.5 text-xs font-bold shadow-sm shadow-emerald-200/50 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            {t('labCta.button')} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>

      <AddModal open={showAdd} onClose={() => setShowAdd(false)} onDone={done} />
    </div>
  );

  /* ═══════ HUB WITH FARMLANDS ═══════ */
  return (
    <div className="max-w-5xl mx-auto space-y-4 md:space-y-5">
      {/* Header */}
      <div className="relative rounded-3xl overflow-hidden shadow-[0_18px_50px_-22px_rgba(2,44,34,0.85)]">
        <div className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1200&auto=format&fit=crop')" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/95 via-emerald-950/85 to-emerald-900/60" />

        <div className="relative z-10 p-5 md:p-7 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] font-bold text-emerald-200 uppercase tracking-widest mb-2">
              <Leaf className="w-3 h-3" /> {t('badge')}
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white">{t('header.title')}</h1>
            <p className="text-emerald-200/50 text-sm font-semibold mt-0.5">
              {t('header.fields', { count: stats.total })}
              {stats.needsAttention > 0 && <span className="text-amber-300 ml-2">· {t('header.needsAttention', { count: stats.needsAttention })}</span>}
            </p>
          </div>
          <button type="button" onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-400 hover:bg-amber-400 text-emerald-950 px-5 py-2.5 text-sm font-black transition-all shadow-lg active:scale-95 shrink-0">
            <Plus className="w-4 h-4" /> {t('cta.addLand')}
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([
          { label: 'Total Fields',    value: stats.total,          cls: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
          { label: 'Completed',       value: stats.completed,      cls: 'border-green-200 bg-green-50 text-green-700' },
          { label: 'Need Attention',  value: stats.needsAttention, cls: 'border-amber-200 bg-amber-50 text-amber-700' },
          { label: 'Test Scheduled',  value: stats.testScheduled,  cls: 'border-blue-200 bg-blue-50 text-blue-700' },
        ] as const).map(stat => (
          <div key={stat.label} className={`rounded-2xl border p-4 ${stat.cls}`}>
            <p className="text-2xl font-black">{stat.value}</p>
            <p className="text-[11px] font-bold uppercase tracking-wide opacity-70 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {farmlands.map((f, i) => (
          <motion.div key={f._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <LandCard farm={f} onClick={() => go(f._id)} />
          </motion.div>
        ))}
        <button type="button" onClick={() => setShowAdd(true)}
          className="group rounded-2xl border-2 border-dashed border-gray-200 hover:border-emerald-300 bg-white/50 hover:bg-emerald-50/40 p-6 flex flex-col items-center justify-center gap-2 min-h-[170px] transition-all">
          <div className="w-11 h-11 rounded-xl bg-gray-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
            <Plus className="w-5 h-5 text-gray-400 group-hover:text-emerald-600" />
          </div>
          <p className="text-sm font-semibold text-gray-500 group-hover:text-emerald-700 transition-colors">{t('cta.addNewLand')}</p>
        </button>
      </div>

      {/* Lab Finder CTA */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        onClick={() => router.push(`/${locale}/dashboard/soil-intelligence/labs`)}
        className="mt-6 cursor-pointer group bg-emerald-50 rounded-3xl border border-emerald-100 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-lg hover:border-emerald-200 transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0">
            <FlaskConical className="w-7 h-7 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-black text-emerald-950">{t('labCta.noCardTitle')}</h3>
            <p className="text-sm font-semibold text-emerald-800/80 mt-1">{t('labCta.desc')}</p>
          </div>
        </div>
        <button className="whitespace-nowrap shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-white text-emerald-700 px-6 py-3 text-sm font-bold shadow-sm shadow-emerald-200/50 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
          {t('labCta.button')} <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>

      <AddModal open={showAdd} onClose={() => setShowAdd(false)} onDone={done} />
    </div>
  );
}

/* ═══════════ ADD MODAL ═══════════ */
function AddModal({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: (id?: string) => void }) {
  const t = useTranslations('SoilHub');
  const [n, setN] = useState('');
  const [a, setA] = useState('');
  const [s, setS] = useState('');
  const [st, setSt] = useState('');
  const [d, setD] = useState('');
  const [v, setV] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const [statesList, setStatesList] = useState<Array<{id: string, name: string}>>([]);
  const [districtsList, setDistrictsList] = useState<Array<{id: string, name: string}>>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistrs, setLoadingDistrs] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoadingStates(true);
    fetch('/api/shc/labs?type=states&t=' + Date.now())
      .then(async r => { const d = await r.json(); if (d.success) setStatesList(d.data); setLoadingStates(false); })
      .catch(() => setLoadingStates(false));
  }, [open]);

  useEffect(() => {
    const sId = statesList.find(x => x.name === st)?.id;
    if (!sId) { setDistrictsList([]); setD(''); return; }
    setLoadingDistrs(true);
    fetch(`/api/shc/labs?type=districts&stateId=${sId}&t=${Date.now()}`)
      .then(async r => { const d = await r.json(); if (d.success) setDistrictsList(d.data); setLoadingDistrs(false); })
      .catch(() => setLoadingDistrs(false));
  }, [st, statesList]);

  const submit = async () => {
    if (!n.trim()) { setErr(t('addModal.errors.landName')); return; }
    if (!st.trim() || !d.trim()) { setErr(t('addModal.errors.stateDistrict')); return; }
    setSaving(true); setErr('');
    try {
      const res = await fetch('/api/farmlands', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ landName: n.trim(), areaAcres: a ? Number(a) : undefined, soilType: s || undefined, state: st.trim(), district: d.trim(), village: v.trim() || undefined }) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed');
      setN(''); setA(''); setS(''); setSt(''); setD(''); setV('');
      onDone(data.farmland?._id);
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
          <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-base font-black text-gray-900">{t('addModal.title')}</h3>
              <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-4 space-y-3">
              <Field label={t('addModal.landName.label')} value={n} onChange={v2 => { setN(v2); setErr(''); }} ph={t('addModal.landName.placeholder')} />
              <div className="grid grid-cols-2 gap-2.5">
                <Field label={t('addModal.area.label')} value={a} onChange={setA} ph={t('addModal.area.placeholder')} type="number" />
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">{t('addModal.soilType')}</label>
                  <select value={s} onChange={e => setS(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-emerald-400 outline-none">
                    <option value="">{t('addModal.soilTypePlaceholder')}</option>
                    {SOIL_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{t(`soilTypes.${type.key}`)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 space-y-2">
                <p className="text-xs font-semibold text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {t('addModal.location')}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <select value={st} onChange={e => { setSt(e.target.value); setErr(''); }} disabled={loadingStates}
                      className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 outline-none transition-all disabled:opacity-60 disabled:bg-gray-50 pr-8 truncate">
                      <option value="">{t('addModal.statePlaceholder')}</option>
                      {statesList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                    {loadingStates ? <Loader2 className="absolute right-2.5 top-3 w-3.5 h-3.5 animate-spin text-emerald-500 pointer-events-none" /> : 
                     <ChevronDown className="absolute right-2.5 top-3 w-3.5 h-3.5 text-gray-400 pointer-events-none" />}
                  </div>
                  <div className="relative">
                    <select value={d} onChange={e => { setD(e.target.value); setErr(''); }} disabled={loadingDistrs || !st}
                      className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 outline-none transition-all disabled:opacity-60 disabled:bg-gray-50 pr-8 truncate">
                      <option value="">{t('addModal.districtPlaceholder')}</option>
                      {districtsList.map(dMap => <option key={dMap.id} value={dMap.name}>{dMap.name}</option>)}
                    </select>
                    {loadingDistrs ? <Loader2 className="absolute right-2.5 top-3 w-3.5 h-3.5 animate-spin text-emerald-500 pointer-events-none" /> : 
                     <ChevronDown className="absolute right-2.5 top-3 w-3.5 h-3.5 text-gray-400 pointer-events-none" />}
                  </div>
                </div>
                <input value={v} onChange={e => setV(e.target.value)} placeholder={t('addModal.villagePlaceholder')}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 outline-none transition-all" />
              </div>

              {err && <p className="flex items-center gap-1.5 text-xs font-bold text-red-600"><AlertTriangle className="w-3 h-3" /> {err}</p>}

              <button type="button" onClick={submit} disabled={saving}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 text-sm font-bold transition-colors shadow-lg shadow-emerald-200 disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {saving ? t('addModal.submit.creating') : t('addModal.submit.createContinue')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, value, onChange, ph, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; ph: string; type?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 block mb-1">{label}</label>
      <input type={type} step={type === 'number' ? '0.1' : undefined} value={value} onChange={e => onChange(e.target.value)} placeholder={ph}
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 outline-none transition-all" />
    </div>
  );
}
