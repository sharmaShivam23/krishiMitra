'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  ArrowLeft, Search, MapPin, Building2,
  Phone, Mail, Loader2, FlaskConical, Map
} from 'lucide-react';

type Item = { id: string; name: string };
type Lab = { name: string; address?: string; email?: string; STLdetails?: { phone?: string }; state?: string; district?: string };

export default function SoilHealthCardLabsPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('SoilLabs');

  const [states, setStates] = useState<Item[]>([]);
  const [districts, setDistricts] = useState<Item[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  
  const [selState, setSelState] = useState('');
  const [selDistrict, setSelDistrict] = useState('');
  
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingDistr, setLoadingDistr] = useState(false);
  const [loadingLabs, setLoadingLabs] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const sampleSteps = [
    t('steps.step1'),
    t('steps.step2'),
    t('steps.step3'),
    t('steps.step4'),
    t('steps.step5')
  ];

  useEffect(() => {
    fetch('/api/shc/labs?type=states&t=' + Date.now())
      .then(async r => {
        const text = await r.text();
        try {
          const d = JSON.parse(text);
          if (d.success) {
            setStates(d.data);
            setFetchError('');
          } else {
            setFetchError(t('errors.api', { message: d.error || t('errors.unknown') }));
          }
        } catch {
          setFetchError(t('errors.parse', { snippet: text.substring(0, 80) }));
        }
        setLoadingStates(false);
      })
      .catch((err) => {
        setFetchError(t('errors.network', { message: err.message }));
        setLoadingStates(false);
        });
      }, [t]);

  useEffect(() => {
    if (!selState) { setDistricts([]); setSelDistrict(''); setLabs([]); return; }
    setLoadingDistr(true);
    setSelDistrict('');
    setLabs([]);
    fetch(`/api/shc/labs?type=districts&stateId=${selState}&t=${Date.now()}`)
      .then(async r => {
        const d = await r.json();
        if (d.success) setDistricts(d.data);
        setLoadingDistr(false);
      })
      .catch(() => setLoadingDistr(false));
  }, [selState]);

  const searchLabs = async () => {
    if (!selState || !selDistrict) return;
    setLoadingLabs(true);
    try {
      const res = await fetch(`/api/shc/labs?type=labs&stateId=${selState}&districtId=${selDistrict}&t=${Date.now()}`);
      const d = await res.json();
      if (d.success) setLabs(d.data);
    } catch { /* Error fetching */ }
    finally { setLoadingLabs(false); }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 mb-10">
      
      {/* Top Nav */}
      <button 
        onClick={() => router.push(`/${locale}/dashboard/soil-intelligence`)}
        className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-emerald-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> {t('back')}
      </button>

      {/* Hero Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden shadow-[0_18px_50px_-22px_rgba(2,44,34,0.85)] min-h-[220px] flex items-center">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1592982537447-6f2eda2fac2b?q=80&w=1200&auto=format&fit=crop')" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/95 via-emerald-950/90 to-emerald-900/60" />
        
        <div className="relative z-10 p-6 md:p-10 w-full">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-black text-amber-300 uppercase tracking-widest mb-3">
            <FlaskConical className="w-3.5 h-3.5" /> {t('badge')}
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">
            {t('title')}
          </h1>
          <p className="mt-3 text-emerald-100/70 text-sm md:text-base font-semibold max-w-2xl leading-relaxed">
            {t('subtitle')}
          </p>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        
        {/* Left Side: Controller Panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] p-6 md:p-8">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2 mb-6">
              <Map className="w-5 h-5 text-emerald-500" /> {t('locateTitle')}
            </h2>

            <div className="space-y-5">
              {/* State */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">{t('selectState')}</label>
                <div className="relative">
                  <CustomSelect 
                    disabled={loadingStates}
                    value={selState}
                    onChange={setSelState}
                    options={states}
                    placeholder={t('chooseState')}
                  />
                  {loadingStates && <Loader2 className="absolute right-10 top-3.5 w-4 h-4 animate-spin text-emerald-500 pointer-events-none" />}
                </div>
                {fetchError && (
                  <p className="mt-2 text-xs font-bold text-red-500 bg-red-50 p-2 rounded-lg border border-red-100 break-words">
                    {fetchError}
                  </p>
                )}
              </div>

              {/* District */}
              <AnimatePresence>
                {selState && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} 
                    className="relative z-40"
                  >
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-3 block">{t('selectDistrict')}</label>
                    <div className="relative">
                      <CustomSelect 
                        disabled={loadingDistr}
                        value={selDistrict}
                        onChange={setSelDistrict}
                        options={districts}
                        placeholder={t('chooseDistrict')}
                      />
                      {loadingDistr && <Loader2 className="absolute right-10 top-3.5 w-4 h-4 animate-spin text-emerald-500 pointer-events-none" />}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                onClick={searchLabs}
                disabled={!selState || !selDistrict || loadingLabs}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white px-6 py-3.5 text-sm font-black shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:shadow-none active:scale-[0.98]"
              >
                {loadingLabs ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                {loadingLabs ? t('searching') : t('findLabs')}
              </button>
            </div>
          </div>
          
          {/* Quick Guide */}
          <div className="bg-emerald-50 rounded-3xl border border-emerald-100 p-6">
            <h3 className="text-sm font-black text-emerald-900 mb-4 uppercase tracking-wider">{t('howToSample')}</h3>
            <ul className="space-y-3">
              {sampleSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm font-medium text-emerald-800">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center text-[10px] font-black mt-0.5">{i+1}</span>
                  <span className="leading-snug">{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Side: Results */}
        <div className="lg:col-span-8">
          {labs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {labs.map((lab, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  key={i} 
                  className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_4px_16px_-8px_rgba(0,0,0,0.05)] hover:border-emerald-200 hover:shadow-lg transition-all flex flex-col"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0">
                      <Building2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-black text-gray-900 leading-tight line-clamp-2">{lab.name || t('labCard.unnamed')}</h3>
                      <p className="text-[11px] font-black text-gray-400 uppercase mt-1 tracking-wider">
                        {typeof lab.district === 'object' ? (lab.district as any)?.name || (lab.district as any)?.districtName : lab.district || t('labCard.unknownDistrict')}, 
                        {' '}
                        {typeof lab.state === 'object' ? (lab.state as any)?.name || (lab.state as any)?.stateName : lab.state || t('labCard.unknownState')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-gray-50 space-y-2.5">
                    {lab.address && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span className="font-semibold text-gray-600 leading-snug">{lab.address}</span>
                      </div>
                    )}
                    {lab.STLdetails?.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-blue-500 shrink-0" />
                        <span className="font-bold text-gray-700">{lab.STLdetails.phone}</span>
                      </div>
                    )}
                    {lab.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-purple-500 shrink-0" />
                        <span className="font-bold text-gray-700 truncate">{lab.email}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-gray-300" />
              </div>
              <h3 className="text-lg font-black text-gray-600">{t('noLabsTitle')}</h3>
              <p className="text-sm font-semibold text-gray-400 max-w-sm text-center mt-1">{t('noLabsDesc')}</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function CustomSelect({ options, value, onChange, placeholder, disabled }: any) {
  const t = useTranslations('SoilLabs');
  const [open, setOpen] = useState(false);
  const selected = options.find((o: any) => o.id === value);

  return (
    <div className="relative">
      <button 
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="w-full text-left appearance-none rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-sm font-semibold text-gray-900 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all disabled:opacity-60 flex justify-between items-center"
      >
        <span className={!selected ? "text-gray-500" : "truncate pr-4"}>{selected ? selected.name : placeholder}</span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              className="absolute left-0 right-0 top-full mt-2 z-50 max-h-60 overflow-y-auto rounded-xl bg-white border border-gray-100 shadow-xl shadow-gray-200/50 py-2 origin-top"
            >
              {options.map((o: any) => (
                <button
                  type="button"
                  key={o.id}
                  onClick={() => { onChange(o.id); setOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-emerald-50 hover:text-emerald-700 transition-colors ${value === o.id ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700'}`}
                >
                  {o.name}
                </button>
              ))}
              {options.length === 0 && <div className="px-4 py-3 text-sm text-gray-400 font-medium">{t('noOptions')}</div>}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
