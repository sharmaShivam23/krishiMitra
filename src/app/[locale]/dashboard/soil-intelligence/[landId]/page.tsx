'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Loader2, MapPin, Droplets, BarChart3,
  ArrowRight, ChevronDown, Camera, Search, Phone, Download,
  Save, Trash2, UserCheck, Clock, CheckCircle2,
  AlertTriangle, FileText, X, ExternalLink
} from 'lucide-react';
import RetestBanner from '@/components/soil/RetestBanner';
import ScheduleTestModal from '@/components/soil/ScheduleTestModal';

/* ───── Types ───── */
type Farmland = {
  _id: string; landName: string; areaAcres?: number; soilType?: string;
  location: { state: string; district: string; village?: string };
  landRecord?: Record<string, string>;
  phMoisture?: { ph?: number; moisture?: number; source?: string; testedAt?: string; nextRetestAt?: string; testerName?: string };
  phMoistureHistory?: Array<{ ph: number; moisture: number; source: string; testedAt: string }>;
  scheduledTest?: { status?: string; requestedAt?: string; preferredDate?: string; assignedTo?: { name?: string; phone?: string }; notes?: string };
  soilHealthCard?: { cardNumber?: string; imageUrl?: string; issuedAt?: string; validUntil?: string; values?: { n?: number; p?: number; k?: number; ec?: number; organicCarbon?: number }; extractedVia?: string };
  report?: { score?: number; rating?: string; generatedAt?: string; insights?: string[]; cropRecommendations?: Array<{ cropName: string; confidence: number; reason: string }>; issues?: Array<{ parameter: string; severity: string; description: string; fix: string }> };
  status: string; progress: number;
};
type StatusMeta = { retestNeeded?: boolean; shcExpired?: boolean; nextRetestAt?: string };
const SOIL_TYPES = ['Alluvial', 'Black', 'Red', 'Laterite', 'Sandy', 'Clay', 'Loamy'] as const;

/* ═══════════════════════════════════════════════════════ */
export default function FarmlandDetailPage({ params }: { params: Promise<{ landId: string }> }) {
  const { landId } = use(params);
  const router = useRouter();
  const locale = useLocale();

  const [farmland, setFarmland] = useState<Farmland | null>(null);
  const [statusMeta, setStatusMeta] = useState<StatusMeta>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);

  // Which section is expanded (only one at a time)
  const [expanded, setExpanded] = useState<'land' | 'ph' | 'shc' | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Form states
  const [landName, setLandName] = useState('');
  const [areaAcres, setAreaAcres] = useState('');
  const [soilType, setSoilType] = useState('');
  const [stateName, setStateName] = useState('');
  const [district, setDistrict] = useState('');
  const [village, setVillage] = useState('');
  const [phInput, setPhInput] = useState('');
  const [moistureInput, setMoistureInput] = useState('');
  const [shcNumber, setShcNumber] = useState('');
  const [shcImageUrl, setShcImageUrl] = useState('');
  const [shcValues, setShcValues] = useState<Record<string, string>>({});
  const [ocrLoading, setOcrLoading] = useState(false);

  // Government SHC lookup
  const [shcTab, setShcTab] = useState<'govt' | 'photo' | 'manual'>('govt');
  const [govtPhone, setGovtPhone] = useState('');
  const [govtResults, setGovtResults] = useState<Array<{ farmer: { name: string }; computedID: string; sampleDate: string; cycle: string; scheme: string; status: string }>>([]);
  const [govtSearching, setGovtSearching] = useState(false);
  const [govtFetching, setGovtFetching] = useState('');
  const [govtSearched, setGovtSearched] = useState(false);

  const [statesList, setStatesList] = useState<Array<{id: string, name: string}>>([]);
  const [districtsList, setDistrictsList] = useState<Array<{id: string, name: string}>>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistrs, setLoadingDistrs] = useState(false);

  useEffect(() => {
    if (expanded !== 'land') return;
    if (statesList.length > 0) return;
    setLoadingStates(true);
    fetch('/api/shc/labs?type=states&t=' + Date.now())
      .then(async r => { const d = await r.json(); if (d.success) setStatesList(d.data); setLoadingStates(false); })
      .catch(() => setLoadingStates(false));
  }, [expanded]);

  useEffect(() => {
    const sId = statesList.find(x => x.name === stateName)?.id;
    if (!sId) { setDistrictsList([]); return; }
    setLoadingDistrs(true);
    fetch(`/api/shc/labs?type=districts&stateId=${sId}&t=${Date.now()}`)
      .then(async r => { const d = await r.json(); if (d.success) setDistrictsList(d.data); setLoadingDistrs(false); })
      .catch(() => setLoadingDistrs(false));
  }, [stateName, statesList]);

  const flash = (text: string, ok: boolean) => { setToast({ text, ok }); setTimeout(() => setToast(null), 3000); };

  /* ── Load ── */
  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/farmlands/${landId}`, { credentials: 'include' });
      const d = await res.json();
      if (d.success) {
        const f = d.farmland;
        setFarmland(f); setStatusMeta(d.statusMeta || {});
        setLandName(f.landName || ''); setAreaAcres(f.areaAcres ? String(f.areaAcres) : '');
        setSoilType(f.soilType || ''); setStateName(f.location?.state || '');
        setDistrict(f.location?.district || ''); setVillage(f.location?.village || '');
        setShcNumber(f.soilHealthCard?.cardNumber || ''); setShcImageUrl(f.soilHealthCard?.imageUrl || '');
        if (f.soilHealthCard?.values) {
          const sv: Record<string, string> = {};
          Object.entries(f.soilHealthCard.values).forEach(([k, v]) => { if (typeof v === 'number') sv[k] = String(v); });
          setShcValues(sv);
        }
        // Auto-expand the next incomplete step
        const hasPh = typeof f.phMoisture?.ph === 'number';
        const hasShc = typeof f.soilHealthCard?.values?.n === 'number';
        if (!hasPh) setExpanded('ph');
        else if (!hasShc) setExpanded('shc');
        else setExpanded(null);
      }
    } catch { flash('Failed to load', false); }
    finally { setLoading(false); }
  }, [landId]);
  useEffect(() => { load(); }, [load]);

  const hasPh = typeof farmland?.phMoisture?.ph === 'number';
  const hasShc = typeof farmland?.soilHealthCard?.values?.n === 'number';
  const hasReport = typeof farmland?.report?.score === 'number';
  const loc = farmland ? [farmland.location.village, farmland.location.district, farmland.location.state].filter(Boolean).join(', ') : '';

  /* ── Actions ── */
  const saveLand = async () => {
    if (!landName.trim() || !stateName.trim() || !district.trim()) { flash('Name, state, district required', false); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/farmlands/${landId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ landName, areaAcres: areaAcres ? Number(areaAcres) : undefined, soilType, state: stateName, district, village }) });
      const d = await res.json(); if (!res.ok) throw new Error(d.error);
      setFarmland(d.farmland); setStatusMeta(d.statusMeta || {}); setExpanded(null); flash('Updated!', true);
    } catch { flash('Failed', false); } finally { setSaving(false); }
  };

  const savePh = async () => {
    const ph = parseFloat(phInput), m = parseFloat(moistureInput);
    if (isNaN(ph) || isNaN(m)) { flash('Enter valid pH and moisture', false); return; }
    if (ph < 0 || ph > 14) { flash('pH must be 0–14', false); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/farmlands/${landId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ ph, moisture: m, phSource: 'manual' }) });
      const d = await res.json(); if (!res.ok) throw new Error(d.error);
      setFarmland(d.farmland); setStatusMeta(d.statusMeta || {}); setPhInput(''); setMoistureInput('');
      flash('Saved!', true); setExpanded('shc');
    } catch { flash('Failed', false); } finally { setSaving(false); }
  };

  const saveShc = async () => {
    setSaving(true);
    try {
      const values: Record<string, number | undefined> = {};
      ['n', 'p', 'k', 'ec', 'organicCarbon'].forEach(k => { if (shcValues[k]) values[k] = Number(shcValues[k]); });
      const res = await fetch(`/api/farmlands/${landId}/shc`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ cardNumber: shcNumber || undefined, imageUrl: shcImageUrl || undefined, values, extractedVia: 'manual' }) });
      if (!res.ok) throw new Error();
      await load(); flash('Card saved!', true); setExpanded(null);
    } catch { flash('Failed', false); } finally { setSaving(false); }
  };

  const runOcr = async () => {
    if (!shcImageUrl) return;
    setOcrLoading(true);
    try {
      const res = await fetch('/api/soil-ocr', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageUrl: shcImageUrl }) });
      const d = await res.json(); if (!res.ok) throw new Error();
      if (d.values) {
        const sv: Record<string, string> = {};
        Object.entries(d.values).forEach(([k, v]) => { if (typeof v === 'number') sv[k] = String(v); });
        setShcValues(sv); flash('Values extracted!', true);
      }
    } catch { flash('OCR failed, enter manually', false); } finally { setOcrLoading(false); }
  };


  const doDelete = async () => {
    setSaving(true);
    try { await fetch(`/api/farmlands/${landId}`, { method: 'DELETE', credentials: 'include' }); router.push(`/${locale}/dashboard/soil-intelligence`); }
    catch { flash('Failed', false); setSaving(false); }
  };

  const toggle = (s: typeof expanded) => setExpanded(expanded === s ? null : s);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>;
  if (!farmland) return <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3"><p className="font-bold text-gray-600">Not found</p><button type="button" onClick={() => router.back()} className="text-emerald-600 underline text-sm">Go back</button></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-3">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className={`fixed top-5 left-1/2 -translate-x-1/2 z-[100] rounded-2xl px-5 py-3 text-sm font-bold shadow-2xl ${toast.ok ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero Card ── */}
      <div className="relative rounded-3xl overflow-hidden shadow-[0_18px_50px_-22px_rgba(2,44,34,0.85)]">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1200&auto=format&fit=crop')" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/95 via-emerald-950/80 to-emerald-900/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/60 to-transparent" />

        <div className="relative z-10 p-5 md:p-6">
          {/* Top actions */}
          <div className="flex items-center justify-between mb-5">
            <button type="button" onClick={() => router.push(`/${locale}/dashboard/soil-intelligence`)}
              className="inline-flex items-center gap-1.5 text-emerald-300/80 text-sm font-semibold hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" /> My Farmlands
            </button>
            <button type="button" onClick={() => setDeleteOpen(true)}
              className="w-9 h-9 rounded-xl bg-white/8 border border-white/15 flex items-center justify-center text-white/40 hover:text-red-400 hover:border-red-400/40 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Info */}
          <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">{farmland.landName}</h1>
          <p className="mt-1 text-emerald-200/60 text-sm font-semibold flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> {loc}
          </p>

          {/* Quick stats chips */}
          <div className="mt-4 flex flex-wrap gap-2">
            {farmland.areaAcres && <span className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs font-bold text-white">{farmland.areaAcres} acres</span>}
            {farmland.soilType && <span className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs font-bold text-white">{farmland.soilType} soil</span>}
            {hasPh && <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/25 text-xs font-bold text-emerald-200">pH {farmland.phMoisture!.ph} · Moisture {farmland.phMoisture!.moisture}%</span>}
            {hasReport && <span className="px-3 py-1.5 rounded-xl bg-amber-400/20 border border-amber-400/25 text-xs font-bold text-amber-200">Score: {farmland.report!.score}/100</span>}
          </div>
        </div>
      </div>

      {/* Retest */}
      <RetestBanner nextRetestAt={statusMeta.nextRetestAt || farmland.phMoisture?.nextRetestAt} lastTestedAt={farmland.phMoisture?.testedAt}
        onRetest={() => { setExpanded('ph'); setPhInput(''); setMoistureInput(''); }} loading={saving} />

      {/* ══════════════════ ACCORDION SECTIONS ══════════════════ */}

      {/* ─── 1. LAND DETAILS ─── */}
      <AccordionCard
        title="Land Details"
        subtitle={loc || 'Set up your land identity'}
        icon={<MapPin className="w-5 h-5" />}
        iconColor="bg-emerald-100 text-emerald-700"
        done={true}
        open={expanded === 'land'}
        onToggle={() => toggle('land')}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <InputField label="Land Name" value={landName} onChange={setLandName} placeholder="e.g. North Field" />
            <InputField label="Area (acres)" value={areaAcres} onChange={setAreaAcres} placeholder="2.5" type="number" />
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Soil Type</label>
              <select value={soilType} onChange={(e) => setSoilType(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 outline-none">
                <option value="">Select...</option>
                {SOIL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="flex-1 relative">
              <label className="text-xs font-semibold text-gray-500 block mb-1">State</label>
              <select value={stateName} onChange={(e) => setStateName(e.target.value)} disabled={loadingStates}
                className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 outline-none pr-8">
                <option value="">Select...</option>
                {statesList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
              {loadingStates ? <Loader2 className="absolute right-3 top-[26px] w-4 h-4 animate-spin text-emerald-500 pointer-events-none" /> :
               <ChevronDown className="absolute right-3 top-[28px] w-4 h-4 text-gray-400 pointer-events-none" />}
            </div>
            <div className="flex-1 relative">
              <label className="text-xs font-semibold text-gray-500 block mb-1">District</label>
              <select value={district} onChange={(e) => setDistrict(e.target.value)} disabled={loadingDistrs || !stateName}
                className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 outline-none pr-8">
                <option value="">Select...</option>
                {districtsList.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
              {loadingDistrs ? <Loader2 className="absolute right-3 top-[26px] w-4 h-4 animate-spin text-emerald-500 pointer-events-none" /> :
               <ChevronDown className="absolute right-3 top-[28px] w-4 h-4 text-gray-400 pointer-events-none" />}
            </div>
            <InputField label="Village" value={village} onChange={setVillage} placeholder="Optional" />
          </div>
          <SaveBtn onClick={saveLand} saving={saving} label="Save Changes" />
        </div>
      </AccordionCard>

      {/* ─── 2. pH & MOISTURE ─── */}
      <AccordionCard
        title="pH & Moisture Test"
        subtitle={hasPh ? `pH ${farmland.phMoisture!.ph} · Moisture ${farmland.phMoisture!.moisture}%` : 'Required — enter values or schedule a field test'}
        icon={<Droplets className="w-5 h-5" />}
        iconColor="bg-blue-100 text-blue-700"
        done={hasPh}
        open={expanded === 'ph'}
        onToggle={() => toggle('ph')}
        badge={hasPh ? undefined : 'Action needed'}
        badgeColor="bg-amber-100 text-amber-700"
      >
        <div className="space-y-4">
          {/* Current values summary */}
          {hasPh && (
            <div className="flex gap-3">
              <StatBox label="pH" value={String(farmland.phMoisture!.ph)} sub={Number(farmland.phMoisture!.ph) < 6 ? 'Acidic' : Number(farmland.phMoisture!.ph) > 7.5 ? 'Alkaline' : 'Neutral'} color="bg-blue-50 text-blue-900" />
              <StatBox label="Moisture" value={`${farmland.phMoisture!.moisture}%`} sub={Number(farmland.phMoisture!.moisture) < 15 ? 'Dry' : Number(farmland.phMoisture!.moisture) > 40 ? 'Wet' : 'Good'} color="bg-cyan-50 text-cyan-900" />
              <StatBox label="Tested" value={farmland.phMoisture!.testedAt ? new Date(farmland.phMoisture!.testedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'} sub={farmland.phMoisture!.source === 'field-test' ? 'Field test' : 'Manual'} color="bg-gray-50 text-gray-900" />
            </div>
          )}

          <p className="text-xs font-semibold text-gray-400">{hasPh ? 'Update values' : 'Enter values from your Krishi Seva Kendra report'}</p>

          <div className="flex gap-2.5">
            <InputField label="pH (0–14)" value={phInput} onChange={setPhInput} placeholder="6.8" type="number" />
            <InputField label="Moisture %" value={moistureInput} onChange={setMoistureInput} placeholder="22" type="number" />
          </div>
          <SaveBtn onClick={savePh} saving={saving} label="Save Values" />

          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-semibold text-gray-400 mb-2">Don&apos;t have data?</p>
            {farmland.scheduledTest?.status && !['none', 'cancelled', 'completed'].includes(farmland.scheduledTest.status) ? (
              <div className="flex items-center justify-between rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-bold text-blue-800 capitalize">Test {farmland.scheduledTest.status}</span>
                </div>
                <button type="button" onClick={() => setShowScheduleModal(true)} className="text-xs font-bold text-blue-600 underline">Details</button>
              </div>
            ) : (
              <button type="button" onClick={() => setShowScheduleModal(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 text-sm font-bold transition-colors">
                <UserCheck className="w-4 h-4" /> Schedule a field tester visit
              </button>
            )}
          </div>

          {/* History */}
          {farmland.phMoistureHistory && farmland.phMoistureHistory.length > 1 && (
            <details className="group">
              <summary className="cursor-pointer text-xs font-semibold text-gray-400 flex items-center gap-1 select-none">
                <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" /> Past tests ({farmland.phMoistureHistory.length})
              </summary>
              <div className="mt-2 space-y-1">
                {farmland.phMoistureHistory.slice().reverse().slice(0, 5).map((e, i) => (
                  <div key={i} className="flex justify-between rounded-lg bg-gray-50 px-3 py-1.5 text-xs text-gray-600">
                    <span>pH {e.ph} · {e.moisture}%</span>
                    <span>{new Date(e.testedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      </AccordionCard>

      {/* ─── 3. SOIL HEALTH CARD ─── */}
      <AccordionCard
        title="Soil Health Card"
        subtitle={hasShc ? `N: ${farmland.soilHealthCard!.values!.n} · P: ${farmland.soilHealthCard!.values!.p} · K: ${farmland.soilHealthCard!.values!.k}` : 'Fetch from government portal or enter manually'}
        icon={<FileText className="w-5 h-5" />}
        iconColor="bg-amber-100 text-amber-700"
        done={hasShc}
        open={expanded === 'shc'}
        onToggle={() => toggle('shc')}
      >
        <div className="space-y-4">
          {/* Existing values */}
          {hasShc && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[
                { l: 'N', v: farmland.soilHealthCard!.values!.n, c: 'bg-green-50 text-green-800' },
                { l: 'P', v: farmland.soilHealthCard!.values!.p, c: 'bg-blue-50 text-blue-800' },
                { l: 'K', v: farmland.soilHealthCard!.values!.k, c: 'bg-purple-50 text-purple-800' },
                { l: 'EC', v: farmland.soilHealthCard!.values!.ec, c: 'bg-amber-50 text-amber-800' },
                { l: 'OC', v: farmland.soilHealthCard!.values!.organicCarbon, c: 'bg-orange-50 text-orange-800' },
              ].map(x => (
                <div key={x.l} className={`flex-1 min-w-[60px] rounded-xl p-2.5 text-center ${x.c}`}>
                  <p className="text-[10px] font-bold uppercase">{x.l}</p>
                  <p className="text-lg font-black">{x.v ?? '—'}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
            {[
              { key: 'govt' as const, label: 'Govt Portal', icon: <Download className="w-3.5 h-3.5" /> },
              { key: 'photo' as const, label: 'Upload Photo', icon: <Camera className="w-3.5 h-3.5" /> },
              { key: 'manual' as const, label: 'Manual', icon: <FileText className="w-3.5 h-3.5" /> },
            ].map(t => (
              <button key={t.key} type="button" onClick={() => setShcTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold transition-all ${
                  shcTab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* ── TAB: Government Portal Lookup ── */}
          {shcTab === 'govt' && (
            <div className="space-y-3">
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
                <p className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  Fetch directly from Soil Health Card Portal
                </p>
                <p className="text-[11px] text-emerald-600 mt-0.5">Data from soilhealth.dac.gov.in — the official government program</p>
              </div>

              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="tel" value={govtPhone} onChange={e => setGovtPhone(e.target.value)}
                    placeholder="Enter farmer's phone number"
                    className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-emerald-400 outline-none" />
                </div>
                <button type="button" disabled={!govtPhone.trim() || govtSearching}
                  onClick={async () => {
                    setGovtSearching(true); setGovtResults([]); setGovtSearched(false);
                    try {
                      const res = await fetch('/api/shc-lookup', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'search-phone', phone: govtPhone.trim() })
                      });
                      const d = await res.json();
                      setGovtResults(d.tests || []);
                      setGovtSearched(true);
                      if (!d.tests?.length) flash('No records found for this number', false);
                    } catch { flash('Search failed', false); }
                    finally { setGovtSearching(false); }
                  }}
                  className="shrink-0 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5">
                  {govtSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Search
                </button>
              </div>

              {/* Results list */}
              {govtResults.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Found {govtResults.length} record{govtResults.length > 1 ? 's' : ''}</p>
                  {govtResults.map(t => (
                    <div key={t.computedID}
                      className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{t.farmer?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">
                          {t.sampleDate ? new Date(t.sampleDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                          {t.cycle ? ` · Cycle ${t.cycle}` : ''}
                          {t.status ? ` · ${t.status}` : ''}
                        </p>
                      </div>
                      <button type="button" disabled={govtFetching === t.computedID}
                        onClick={async () => {
                          setGovtFetching(t.computedID);
                          try {
                            const res = await fetch('/api/shc-lookup', {
                              method: 'POST', headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ action: 'get-detail', computedID: t.computedID })
                            });
                            const d = await res.json();
                            if (d.success && d.card?.values) {
                              const v = d.card.values;
                              const sv: Record<string, string> = {};
                              if (v.n != null) sv.n = String(v.n);
                              if (v.p != null) sv.p = String(v.p);
                              if (v.k != null) sv.k = String(v.k);
                              if (v.ec != null) sv.ec = String(v.ec);
                              if (v.organicCarbon != null) sv.organicCarbon = String(v.organicCarbon);
                              setShcValues(sv);
                              setShcNumber(t.computedID);
                              flash('Values imported! Click Save below.', true);
                            } else {
                              flash('Could not fetch detailed results', false);
                            }
                          } catch { flash('Failed to fetch card details', false); }
                          finally { setGovtFetching(''); }
                        }}
                        className="shrink-0 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1">
                        {govtFetching === t.computedID ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                        Import
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {govtSearched && govtResults.length === 0 && (
                <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 text-center">
                  <p className="text-sm text-gray-500">No records found. Try a different number or use the other tabs.</p>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: Photo Upload ── */}
          {shcTab === 'photo' && (
            <div className="space-y-3">
              <InputField label="Card Number (optional)" value={shcNumber} onChange={setShcNumber} placeholder="Enter SHC number" />
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Upload card photo — AI will read the values</p>
                {shcImageUrl ? (
                  <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-100 p-3">
                    <img src={shcImageUrl} alt="" className="w-14 h-14 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-600 truncate">Image uploaded</p>
                      <div className="flex gap-2 mt-1.5">
                        <button type="button" onClick={runOcr} disabled={ocrLoading}
                          className="rounded-lg bg-amber-600 text-white px-3 py-1.5 text-xs font-bold disabled:opacity-60">
                          {ocrLoading ? 'Reading...' : 'Extract Values'}
                        </button>
                        <button type="button" onClick={() => setShcImageUrl('')} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-500">Remove</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label className="block cursor-pointer rounded-xl border-2 border-dashed border-gray-200 hover:border-amber-300 bg-gray-50 hover:bg-amber-50/50 p-5 text-center transition-all">
                    <Camera className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                    <p className="text-sm font-semibold text-gray-600">Tap to upload photo</p>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) { const r = new FileReader(); r.onloadend = () => setShcImageUrl(r.result as string); r.readAsDataURL(file); }
                    }} />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* ── TAB: Manual Entry ── */}
          {shcTab === 'manual' && (
            <div className="space-y-3">
              <InputField label="Card Number (optional)" value={shcNumber} onChange={setShcNumber} placeholder="Enter SHC number" />
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {[{ k: 'n', l: 'N (kg/ha)' }, { k: 'p', l: 'P (kg/ha)' }, { k: 'k', l: 'K (kg/ha)' }, { k: 'ec', l: 'EC (dS/m)' }, { k: 'organicCarbon', l: 'OC (%)' }].map(f => (
                  <div key={f.k}>
                    <label className="text-[10px] font-semibold text-gray-400 block mb-0.5">{f.l}</label>
                    <input type="number" step="0.1" value={shcValues[f.k] || ''} onChange={(e) => setShcValues({ ...shcValues, [f.k]: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm font-medium text-gray-900 focus:border-amber-300 outline-none" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Values preview (when filled from any method) */}
          {Object.keys(shcValues).length > 0 && !hasShc && (
            <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1.5">Values to save</p>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(shcValues).filter(([, v]) => v).map(([k, v]) => (
                  <span key={k} className="inline-block rounded-md bg-white border border-amber-200 px-2 py-0.5 text-xs font-bold text-amber-800">
                    {k.toUpperCase()}: {v}
                  </span>
                ))}
              </div>
            </div>
          )}

          <SaveBtn onClick={saveShc} saving={saving} label="Save Health Card" />
        </div>
      </AccordionCard>

      {/* ─── REPORT CTA ─── */}
      {hasReport ? (
        <button type="button" onClick={() => router.push(`/${locale}/dashboard/soil-intelligence/${landId}/report`)}
          className="group w-full rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-600 p-4 flex items-center gap-4 text-left shadow-lg hover:shadow-xl transition-all active:scale-[0.99]">
          <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-black text-white">Soil Report</p>
            <p className="text-sm text-emerald-100/70 font-medium">Score: {farmland.report!.score}/100 — {farmland.report!.rating}</p>
          </div>
          <ExternalLink className="w-5 h-5 text-white/50 group-hover:text-white transition-colors shrink-0" />
        </button>
      ) : (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center shrink-0">
            <BarChart3 className="w-7 h-7 text-gray-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900">Soil Report</p>
            <p className="text-xs text-gray-500 font-medium">{hasPh ? 'Data collected — generate your report' : 'Complete pH test to unlock'}</p>
          </div>
          {hasPh ? (
            <button type="button" onClick={() => router.push(`/${locale}/dashboard/soil-intelligence/${landId}/report`)}
              className="shrink-0 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-sm font-bold transition-colors flex items-center gap-1.5">
              View <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button type="button" onClick={() => setExpanded('ph')}
              className="shrink-0 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-50">
              Add Data
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      <ScheduleTestModal isOpen={showScheduleModal} onClose={() => setShowScheduleModal(false)} farmlandId={landId}
        scheduledTest={farmland.scheduledTest} location={farmland.location} onSuccess={() => { load(); setShowScheduleModal(false); }} />

      <AnimatePresence>
        {deleteOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDeleteOpen(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()} className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl">
              <h3 className="text-base font-black text-gray-900">Delete &ldquo;{farmland.landName}&rdquo;?</h3>
              <p className="mt-1.5 text-sm text-gray-500">All soil data will be lost permanently.</p>
              <div className="mt-4 flex gap-2">
                <button type="button" onClick={() => setDeleteOpen(false)} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-bold text-gray-600">Cancel</button>
                <button type="button" onClick={doDelete} disabled={saving} className="flex-1 rounded-xl bg-red-600 text-white py-2.5 text-sm font-bold disabled:opacity-60">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════ REUSABLE COMPONENTS ═══════════════════ */

function AccordionCard({ title, subtitle, icon, iconColor, done, open, onToggle, badge, badgeColor, children }: {
  title: string; subtitle: string; icon: React.ReactNode; iconColor: string;
  done: boolean; open: boolean; onToggle: () => void; badge?: string; badgeColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl bg-white border shadow-sm transition-all duration-200 ${open ? 'border-emerald-200 shadow-md' : 'border-gray-100'}`}>
      <button type="button" onClick={onToggle} className="w-full flex items-center gap-3 p-4 text-left">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-900">{title}</h3>
            {done && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
            {badge && <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${badgeColor}`}>{badge}</span>}
          </div>
          <p className="text-xs text-gray-500 font-medium truncate mt-0.5">{subtitle}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-gray-100 pt-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string;
}) {
  return (
    <div className="flex-1">
      <label className="text-xs font-semibold text-gray-500 block mb-1">{label}</label>
      <input type={type} step={type === 'number' ? '0.1' : undefined} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 outline-none transition-all" />
    </div>
  );
}

function SaveBtn({ onClick, saving, label }: { onClick: () => void; saving: boolean; label: string }) {
  return (
    <button type="button" onClick={onClick} disabled={saving}
      className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-60">
      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {label}
    </button>
  );
}

function StatBox({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className={`flex-1 rounded-xl p-3 text-center ${color}`}>
      <p className="text-[10px] font-bold uppercase tracking-wide opacity-60">{label}</p>
      <p className="text-xl font-black leading-tight mt-0.5">{value}</p>
      <p className="text-[10px] font-semibold opacity-50 mt-0.5">{sub}</p>
    </div>
  );
}
