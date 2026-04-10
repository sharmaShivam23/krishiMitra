


'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { 
  Search, MapPin, Filter, ArrowDownToLine, 
  Activity, Loader2, AlertCircle, IndianRupee, 
  Calendar, Scale, Wheat, Bot, Navigation, Volume2
} from 'lucide-react';

// 🔊 IMPORT THE SPEECH HOOK
import { useSpeech } from '@/hooks/useSpeech';

/* ======================================================
   TYPES & CONSTANTS
====================================================== */
interface MandiPriceData {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  minPrice: string | number;
  maxPrice: string | number;
  modalPrice: string | number;
  date: string;
}

const INDIAN_STATES = [
  { value: 'All States', key: 'all' },
  { value: 'Uttar Pradesh', key: 'uttarPradesh' },
  { value: 'Punjab', key: 'punjab' },
  { value: 'Haryana', key: 'haryana' },
  { value: 'Maharashtra', key: 'maharashtra' },
  { value: 'Madhya Pradesh', key: 'madhyaPradesh' },
  { value: 'Gujarat', key: 'gujarat' },
  { value: 'Rajasthan', key: 'rajasthan' },
  { value: 'Karnataka', key: 'karnataka' },
  { value: 'Andhra Pradesh', key: 'andhraPradesh' },
  { value: 'West Bengal', key: 'westBengal' },
  { value: 'Bihar', key: 'bihar' },
  { value: 'Kerala', key: 'kerala' },
  { value: 'Tamil Nadu', key: 'tamilNadu' }
];

const COMMON_COMMODITIES = [
  { value: 'All Commodities', key: 'all' },
  { value: 'Wheat', key: 'wheat' },
  { value: 'Paddy(Dhan)', key: 'paddy' },
  { value: 'Potato', key: 'potato' },
  { value: 'Onion', key: 'onion' },
  { value: 'Tomato', key: 'tomato' },
  { value: 'Mustard', key: 'mustard' },
  { value: 'Cotton', key: 'cotton' },
  { value: 'Sugarcane', key: 'sugarcane' },
  { value: 'Soyabean', key: 'soyabean' },
  { value: 'Maize', key: 'maize' },
  { value: 'Apple', key: 'apple' }
];

/* ======================================================
   COMPONENT
====================================================== */
export default function MandiPrices() {
  const router = useRouter(); 
  const locale = useLocale();
  const t = useTranslations('MandiPrices');
  const allStatesValue = INDIAN_STATES[0].value;
  const allCommoditiesValue = COMMON_COMMODITIES[0].value;
  
  // 🔊 INITIALIZE TEXT-TO-SPEECH
  const { speak } = useSpeech();
  
  const [prices, setPrices] = useState<MandiPriceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLocating, setIsLocating] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState(allStatesValue);
  const [selectedCommodity, setSelectedCommodity] = useState(allCommoditiesValue);
  
  // District Filter & Debounce State
  const [districtQuery, setDistrictQuery] = useState('');
  const [debouncedDistrict, setDebouncedDistrict] = useState('');

  /* ======================================================
     GLOBAL AUTO-GEOLOCATION SYNC
  ====================================================== */
  useEffect(() => {
    const savedState = localStorage.getItem('userState');
    
    if (savedState) setSelectedState(savedState);
    
    setIsLocating(false);

    const handleLocationUpdated = () => {
      const newState = localStorage.getItem('userState');
      if (newState) setSelectedState(newState);
      setIsLocating(false);
    };

    window.addEventListener('locationUpdated', handleLocationUpdated);
    return () => window.removeEventListener('locationUpdated', handleLocationUpdated);
  }, []);

  /* district dropdown: keep debouncedDistrict in sync immediately */
  useEffect(() => {
    setDebouncedDistrict(districtQuery);
  }, [districtQuery]);

  /* ======================================================
     FETCH REAL DATA FROM BACKEND 
  ====================================================== */
  useEffect(() => {
    if (isLocating) return;

    const fetchPrices = async () => {
      setIsLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        
        if (selectedState !== allStatesValue) params.append('state', selectedState);
        if (selectedCommodity !== allCommoditiesValue) params.append('commodity', selectedCommodity);
        if (debouncedDistrict.trim() !== '') params.append('district', debouncedDistrict.trim());

        const url = `/api/mandi${params.toString() ? `?${params.toString()}` : ''}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(t('error.connect'));
        
        const data = await res.json();
        
        if (data.prices) {
          setPrices(data.prices);
        } else {
          throw new Error(t('error.invalidFormat'));
        }
      } catch (err: unknown) {
        console.error(err);
        const message = err instanceof Error ? err.message : t('error.fetchFailed');
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrices();
  }, [selectedState, selectedCommodity, debouncedDistrict, isLocating]);

  /* ======================================================
     LOCAL SEARCH FILTER & BULLETPROOF DATE SORTING
  ====================================================== */
  const filteredData = useMemo(() => {
    const parseDate = (dateStr: string) => {
      if (!dateStr) return 0;
      
      try {
        const dateOnly = dateStr.split(' ')[0];

        if (dateOnly.includes('/')) {
          const [day, month, year] = dateOnly.split('/');
          if (year && month && day) {
             const timestamp = new Date(`${year}-${month}-${day}`).getTime();
             if (!isNaN(timestamp)) return timestamp;
          }
        }
        
        const fallback = new Date(dateStr).getTime();
        return isNaN(fallback) ? 0 : fallback;
      } catch {
        return 0; 
      }
    };

    const filtered = prices.filter(entry => {
      const matchesSearch = !searchQuery || 
        entry.commodity.toLowerCase().includes(searchQuery.toLowerCase()) || 
        entry.market.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.variety.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.district.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });

    return filtered.sort((a, b) => parseDate(b.date) - parseDate(a.date));
  }, [searchQuery, prices]);

  /* ======================================================
     🔊 HINGLISH VOICE READOUT FUNCTION
  ====================================================== */
  const handleListenPrice = (data: MandiPriceData) => {
    // Generates: "Potato ka rate, Uttar Pradesh ke Shamli zile ki Shamli mandi mein, 1500 rupees prati quintal hai."
    const hinglishText = `${data.commodity} ka rate, ${data.state} ke ${data.district} zile ki ${data.market} mandi mein, ${data.modalPrice} rupees prati quintal hai.`;
    speak(hinglishText);
  };

  /* ======================================================
     EXPORT CSV FUNCTIONALITY
  ====================================================== */
  const handleExportCSV = () => {
    if (filteredData.length === 0) return;
    
    const headers = [
      t('csv.commodity'),
      t('csv.variety'),
      t('csv.state'),
      t('csv.district'),
      t('csv.market'),
      t('csv.minPrice'),
      t('csv.maxPrice'),
      t('csv.modalPrice'),
      t('csv.date')
    ];
    const rows = filteredData.map((data: any) => [
      data.commodity,
      data.variety || t('labels.varietyFallback'),
      data.state,
      data.district,
      data.market,
      data.minPrice,
      data.maxPrice,
      data.modalPrice,
      data.date
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(item => `"${item}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `mandi_prices_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* ======================================================
     ANIMATIONS & RENDER
  ====================================================== */
  const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120 } }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50/50 py-6 md:py-8 px-2 sm:px-6 lg:px-8 font-sans relative overflow-hidden">

      <motion.div variants={container} initial="hidden" animate="show" className="max-w-[1400px] mx-auto">
        
        <motion.div variants={item} className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-7 md:mb-8 border-b border-gray-200/60 pb-5 md:pb-6">
          <div className="flex items-center gap-4 rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-50 p-4 md:p-0 md:border-0 md:bg-transparent">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-2xl shadow-lg shadow-emerald-500/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-[1.75rem] leading-[1.05] md:text-3xl font-black text-gray-900 tracking-tight">{t('title')}</h1>
              <p className="text-gray-500 text-sm mt-1 flex items-center">
                {isLocating ? (
                   <span className="flex items-center text-emerald-600"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> {t('subtitle.locating')}</span>
                ) : (
                   <span className="flex items-center"><Navigation className="w-3 h-3 mr-1" /> {t('subtitle.sync')}</span>
                )}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:flex items-center gap-2">
            <button
              onClick={() => router.push(`/${locale}/dashboard/mandi-prices/mandi-advisor`)}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-gray-900 to-gray-800 text-white px-4 py-2.5 rounded-2xl font-bold hover:from-gray-800 hover:to-gray-700 transition shadow-sm active:scale-95"
            >
              <Bot className="w-4 h-4" />
              <span className="text-sm">{t('buttons.predictor')}</span>
            </button>
            <button
              onClick={() =>
                requestKrishiSarthi({
                  prompt: 'KrishiSarthi, mandi ke bhav samjhao.',
                  context: {
                    module: 'mandi-prices',
                    summary: 'User is reviewing mandi prices and needs market-rate interpretation plus timing advice.'
                  }
                })
              }
              className="flex items-center justify-center space-x-2 bg-agri-100 border border-agri-300 text-agri-900 px-4 py-2.5 rounded-2xl font-black hover:bg-agri-200 transition shadow-sm active:scale-95"
            >
              <Bot className="w-4 h-4" />
              <span className="text-sm">{t('buttons.ask')}</span>
            </button>
            <button 
              onClick={handleExportCSV}
              className="hidden md:flex items-center space-x-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-bold hover:bg-gray-50 transition shadow-sm active:scale-95"
            >
              <ArrowDownToLine className="w-4 h-4 text-gray-400" />
              <span className="text-sm">{t('buttons.export')}</span>
            </button>
          </div>
        </motion.div>
   
        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8 rounded-2xl border border-emerald-100 bg-white/90 p-3 md:p-0 md:border-0 md:bg-transparent">
          
          {/* <div className="relative">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Search Multi</label>
            <div className="absolute inset-y-0 bottom-0 left-0 pl-4 flex items-center pointer-events-none mt-6">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input type="text" placeholder="Crop, Market, District..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="block w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500/20 text-gray-900 font-medium text-sm transition-all outline-none" />
          </div> */}

          <div className="relative">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">{t('filters.commodity')}</label>
            <div className="absolute inset-y-0 bottom-0 left-0 pl-4 flex items-center pointer-events-none mt-6">
              <Wheat className="h-4 w-4 text-gray-400" />
            </div>
            <select value={selectedCommodity} onChange={(e) => setSelectedCommodity(e.target.value)} className="block w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500/20 font-bold text-gray-900 appearance-none cursor-pointer text-sm transition-all outline-none">
              {COMMON_COMMODITIES.map(commodity => (
                <option key={commodity.value} value={commodity.value}>{t(`commodities.${commodity.key}`)}</option>
              ))}
            </select>
          </div>
          
          <div className="relative">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">{t('filters.state')}</label>
            <div className="absolute inset-y-0 bottom-0 left-0 pl-4 flex items-center pointer-events-none mt-6">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
            <select value={selectedState} onChange={(e) => { setSelectedState(e.target.value); setDistrictQuery(''); }} className="block w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500/20 font-bold text-gray-900 appearance-none cursor-pointer text-sm transition-all outline-none">
              {INDIAN_STATES.map(state => (
                <option key={state.value} value={state.value}>{t(`states.${state.key}`)}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex justify-between">
              <span>{t('filters.district')}</span>
              {isLocating && <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />}
            </label>
            <div className="absolute inset-y-0 bottom-0 left-0 pl-4 flex items-center pointer-events-none mt-6">
              <MapPin className="h-4 w-4 text-gray-400" />
            </div>
            <input type="text" placeholder={t('filters.districtPlaceholder')} value={districtQuery} onChange={(e) => setDistrictQuery(e.target.value)} className="block w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500/20 text-gray-900 font-medium text-sm transition-all outline-none" />
          </div>

        </motion.div>

        <motion.div variants={item} className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden min-h-[420px] md:min-h-[500px] flex flex-col relative z-10">
          
          <div className="hidden md:grid grid-cols-12 gap-4 bg-gray-50/80 border-b border-gray-200/60 p-6 text-xs font-bold text-gray-500 uppercase tracking-wider items-center">
            <div className="col-span-4">{t('columns.commodityVariety')}</div>
            <div className="col-span-4">{t('columns.marketLocation')}</div>
            <div className="col-span-4 text-right pr-4">{t('columns.priceModal')}</div>
          </div>

          <div className="flex-1 relative">
            <AnimatePresence mode="wait">
              {isLocating || isLoading ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 py-20">
                  <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
                  <p className="text-gray-500 font-medium">
                    {isLocating ? t('loading.locating') : t('loading.fetching')}
                  </p>
                </motion.div>
              ) : error ? (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center bg-red-50/50 z-10 p-6 text-center py-20">
                  <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                  <h3 className="text-lg font-bold text-red-900 mb-1">{t('error.title')}</h3>
                  <p className="text-red-700 font-medium text-sm">{error}</p>
                </motion.div>
              ) : filteredData.length === 0 ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 p-6 text-center py-20">
                  <div className="bg-gray-50 p-6 rounded-full mb-4">
                    <Search className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{t('empty.title')}</h3>
                  <p className="text-gray-500 font-medium text-sm">{t('empty.desc')}</p>
                </motion.div>
              ) : (
                <motion.div key="data" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 md:space-y-0 md:divide-y md:divide-gray-100">
                  {filteredData.map((data, idx) => (
                    <motion.div 
                      key={`${data.market}-${data.commodity}-${idx}`} 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }} 
                      className="block md:grid md:grid-cols-12 md:gap-4 p-0 md:p-6 mb-3 md:mb-0 rounded-[20px] md:rounded-none border border-emerald-100/60 md:border-0 md:hover:bg-emerald-50/30 transition-colors items-center group bg-white shadow-sm md:shadow-none"
                    >
                      {/* 📱 DEDICATED MOBILE TILE */}
                      <div className="flex flex-col md:hidden p-4 gap-3">
                         <div className="flex justify-between items-start">
                            <div>
                               <h3 className="text-[17px] font-black text-gray-900 leading-tight tracking-tight">{data.commodity}</h3>
                               <p className="text-[10px] font-black text-emerald-800/60 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider mt-1.5 w-max border border-emerald-100">{data.variety || t('labels.varietyFallback')}</p>
                            </div>
                            <div className="flex items-center gap-3">
                               <div className="text-right">
                                 <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">{t('labels.modalPrice')}</span>
                                 <h4 className="text-xl font-black text-emerald-600 leading-none flex items-center justify-end tracking-tight"><IndianRupee className="w-4 h-4 mr-0.5" />{data.modalPrice}</h4>
                               </div>
                               <button onClick={() => handleListenPrice(data)} className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-sm active:scale-95 border border-blue-100"><Volume2 className="w-4 h-4" /></button>
                            </div>
                         </div>
                         
                         <div className="flex justify-between items-end border-t border-gray-50 pt-3 mt-0.5">
                            <div className="flex-1 min-w-0 pr-2">
                               <p className="text-[13px] font-black text-gray-700 flex items-center truncate"><MapPin className="w-3.5 h-3.5 mr-1.5 text-emerald-500 shrink-0" />{data.market}</p>
                               <p className="text-xs font-semibold text-gray-400 pl-[18px] mt-0.5 truncate">{data.district}, {data.state}</p>
                            </div>
                            <div className="text-right shrink-0">
                               <p className="text-[11px] font-bold text-gray-600 flex items-center justify-end"><Scale className="w-3 h-3 mr-1" /> ₹{data.minPrice} - ₹{data.maxPrice}</p>
                               <p className="text-[10px] font-bold text-gray-400 flex items-center justify-end mt-1.5"><Calendar className="w-3 h-3 mr-1" /> {data.date}</p>
                            </div>
                         </div>
                      </div>

                      {/* 💻 DESKTOP ROW (Hidden on Mobile) */}
                      <div className="hidden md:contents">
                        <div className="col-span-1 md:col-span-4 flex flex-col">
                          <span className="text-lg font-black text-gray-900 group-hover:text-emerald-700 transition-colors">
                            {data.commodity}
                          </span>
                          <span className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-wider bg-gray-100 w-max px-2 py-0.5 rounded-md border border-gray-200/60">
                            {t('labels.variety')}: {data.variety || t('labels.varietyFallback')}
                          </span>
                        </div>

                        <div className="col-span-1 md:col-span-4 flex flex-col">
                          <div className="flex items-center text-sm font-bold text-gray-700">
                            <MapPin className="w-4 h-4 mr-1.5 text-emerald-500" /> 
                            {data.market}, <span className="ml-1 text-gray-500">{data.district}</span>
                          </div>
                          <div className="flex items-center text-xs font-medium text-gray-400 mt-1 pl-[22px]">
                            {data.state}
                          </div>
                        </div>

                        <div className="col-span-1 md:col-span-4 flex flex-col items-end">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-black text-emerald-600 flex items-center">
                              <IndianRupee className="w-5 h-5 mr-0.5" />
                              {data.modalPrice}
                            </span>
                            <button onClick={() => handleListenPrice(data)} title={t('labels.listen')} className="w-10 h-10 rounded-full flex items-center justify-center transition-all bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-100">
                              <Volume2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex items-center justify-end w-full mt-1.5 gap-2">
                            <span className="text-xs font-semibold text-gray-500 flex items-center px-2 py-1 bg-gray-50 rounded-md border border-gray-200">
                              <Scale className="w-3 h-3 mr-1 text-gray-400" /> ₹{data.minPrice} - ₹{data.maxPrice}
                            </span>
                            <span className="text-xs font-semibold text-gray-500 flex items-center px-2 py-1 bg-gray-50 rounded-md border border-gray-200">
                              <Calendar className="w-3 h-3 mr-1 text-gray-400" /> {data.date}
                            </span>
                          </div>
                        </div>
                      </div>

                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}