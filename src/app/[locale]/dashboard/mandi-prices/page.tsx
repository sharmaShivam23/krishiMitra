


'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { 
  Search, MapPin, Filter, ArrowDownToLine, 
  Activity, Loader2, AlertCircle, IndianRupee, 
  Calendar, Scale, Wheat, Bot, Navigation, Volume2
} from 'lucide-react';

// 🔊 IMPORT THE SPEECH HOOK
import { useSpeech } from '@/hooks/useSpeech';
import { requestKrishiSarthi } from '@/lib/krishiSarthi';

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
  'All States', 'Uttar Pradesh', 'Punjab', 'Haryana', 
  'Maharashtra', 'Madhya Pradesh', 'Gujarat', 
  'Rajasthan', 'Karnataka', 'Andhra Pradesh', 'West Bengal',
  'Bihar', 'Kerala', 'Tamil Nadu'
];

const COMMON_COMMODITIES = [
  'All Commodities', 'Wheat', 'Paddy(Dhan)', 'Potato', 'Onion', 
  'Tomato', 'Mustard', 'Cotton', 'Sugarcane', 'Soyabean', 'Maize', 'Apple'
];

/* ======================================================
   COMPONENT
====================================================== */
export default function MandiPrices() {
  const router = useRouter(); 
  const locale = useLocale();
  
  // 🔊 INITIALIZE TEXT-TO-SPEECH
  const { speak } = useSpeech();
  
  const [prices, setPrices] = useState<MandiPriceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLocating, setIsLocating] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('All States');
  const [selectedCommodity, setSelectedCommodity] = useState('All Commodities');
  
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

  /* ======================================================
     DEBOUNCE EFFECT FOR DISTRICT TYPING
  ====================================================== */
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedDistrict(districtQuery);
    }, 500);
    return () => clearTimeout(handler);
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
        
        if (selectedState !== 'All States') params.append('state', selectedState);
        if (selectedCommodity !== 'All Commodities') params.append('commodity', selectedCommodity);
        if (debouncedDistrict.trim() !== '') params.append('district', debouncedDistrict.trim());

        const url = `/api/mandi${params.toString() ? `?${params.toString()}` : ''}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to connect to Market Telemetry.');
        
        const data = await res.json();
        
        if (data.prices) {
          setPrices(data.prices);
        } else {
          throw new Error('Invalid data format received from government portal.');
        }
      } catch (err: unknown) {
        console.error(err);
        const message = err instanceof Error ? err.message : 'Unable to fetch live prices.';
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
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-xl shadow-lg shadow-emerald-500/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-[2rem] leading-[1.05] md:text-3xl font-black text-gray-900 tracking-tight">Live Market Telemetry</h1>
              <p className="text-gray-500 text-sm mt-1 flex items-center">
                {isLocating ? (
                   <span className="flex items-center text-emerald-600"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Acquiring satellite lock...</span>
                ) : (
                   <span className="flex items-center"><Navigation className="w-3 h-3 mr-1" /> Data synced to your local region</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/${locale}/dashboard/mandi-prices/mandi-advisor`)}
              className="flex items-center space-x-2 bg-gradient-to-r from-gray-900 to-gray-800 text-white px-4 py-2.5 rounded-xl font-bold hover:from-gray-800 hover:to-gray-700 transition shadow-sm active:scale-95"
            >
              <Bot className="w-4 h-4" />
              <span className="text-sm">AI Market Predictor</span>
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
              className="flex items-center space-x-2 bg-agri-100 border border-agri-300 text-agri-900 px-4 py-2.5 rounded-xl font-black hover:bg-agri-200 transition shadow-sm active:scale-95"
            >
              <Bot className="w-4 h-4" />
              <span className="text-sm">Ask KrishiSarthi</span>
            </button>
            <button className="hidden md:flex items-center space-x-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-bold hover:bg-gray-50 transition shadow-sm active:scale-95">
              <ArrowDownToLine className="w-4 h-4 text-gray-400" />
              <span className="text-sm">Export CSV</span>
            </button>
          </div>
        </motion.div>
   
        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          
          {/* <div className="relative">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Search Multi</label>
            <div className="absolute inset-y-0 bottom-0 left-0 pl-4 flex items-center pointer-events-none mt-6">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input type="text" placeholder="Crop, Market, District..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="block w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500/20 text-gray-900 font-medium text-sm transition-all outline-none" />
          </div> */}

          <div className="relative">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Commodity</label>
            <div className="absolute inset-y-0 bottom-0 left-0 pl-4 flex items-center pointer-events-none mt-6">
              <Wheat className="h-4 w-4 text-gray-400" />
            </div>
            <select value={selectedCommodity} onChange={(e) => setSelectedCommodity(e.target.value)} className="block w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500/20 font-bold text-gray-900 appearance-none cursor-pointer text-sm transition-all outline-none">
              {COMMON_COMMODITIES.map(commodity => (
                <option key={commodity} value={commodity}>{commodity}</option>
              ))}
            </select>
          </div>
          
          <div className="relative">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">State / Region</label>
            <div className="absolute inset-y-0 bottom-0 left-0 pl-4 flex items-center pointer-events-none mt-6">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
            <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)} className="block w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500/20 font-bold text-gray-900 appearance-none cursor-pointer text-sm transition-all outline-none">
              {INDIAN_STATES.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex justify-between">
              <span>District Filter</span>
              {isLocating && <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />}
            </label>
            <div className="absolute inset-y-0 bottom-0 left-0 pl-4 flex items-center pointer-events-none mt-6">
              <MapPin className="h-4 w-4 text-gray-400" />
            </div>
            <input type="text" placeholder="Type district name..." value={districtQuery} onChange={(e) => setDistrictQuery(e.target.value)} className="block w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500/20 text-gray-900 font-medium text-sm transition-all outline-none" />
          </div>

        </motion.div>

        <motion.div variants={item} className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden min-h-[500px] flex flex-col relative z-10">
          
          <div className="hidden md:grid grid-cols-12 gap-4 bg-gray-50/80 border-b border-gray-200/60 p-6 text-xs font-bold text-gray-500 uppercase tracking-wider items-center">
            <div className="col-span-4">Commodity & Variety</div>
            <div className="col-span-4">Market Location</div>
            <div className="col-span-4 text-right pr-4">Price / Quintal (Modal)</div>
          </div>

          <div className="flex-1 relative">
            <AnimatePresence mode="wait">
              {isLocating || isLoading ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 py-20">
                  <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
                  <p className="text-gray-500 font-medium">
                    {isLocating ? "Acquiring satellite location..." : "Fetching live national market data..."}
                  </p>
                </motion.div>
              ) : error ? (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center bg-red-50/50 z-10 p-6 text-center py-20">
                  <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                  <h3 className="text-lg font-bold text-red-900 mb-1">Telemetry Error</h3>
                  <p className="text-red-700 font-medium text-sm">{error}</p>
                </motion.div>
              ) : filteredData.length === 0 ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 p-6 text-center py-20">
                  <div className="bg-gray-50 p-6 rounded-full mb-4">
                    <Search className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">No Data Found</h3>
                  <p className="text-gray-500 font-medium text-sm">No recent arrivals match your current search and filter criteria.</p>
                </motion.div>
              ) : (
                <motion.div key="data" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="divide-y divide-gray-100">
                  {filteredData.map((data, idx) => (
                    <motion.div 
                      key={`${data.market}-${data.commodity}-${idx}`} 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }} 
                      className="grid grid-cols-1 md:grid-cols-12 gap-4 p-6 hover:bg-emerald-50/30 transition-colors items-center group"
                    >
                      <div className="col-span-1 md:col-span-4 flex flex-col">
                        <span className="text-lg font-black text-gray-900 flex items-center group-hover:text-emerald-700 transition-colors">
                          {data.commodity}
                        </span>
                        <span className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-wider bg-gray-100 w-max px-2 py-0.5 rounded-md border border-gray-200/60">
                          Variety: {data.variety || 'FAQ / Other'}
                        </span>
                      </div>

                      <div className="col-span-1 md:col-span-4 flex flex-col mt-2 md:mt-0">
                        <div className="flex items-center text-sm font-bold text-gray-700">
                          <MapPin className="w-4 h-4 mr-1.5 text-emerald-500" /> 
                          {data.market}, <span className="ml-1 text-gray-500">{data.district}</span>
                        </div>
                        <div className="flex items-center text-xs font-medium text-gray-400 mt-1 pl-[22px]">
                          {data.state}
                        </div>
                      </div>

                      <div className="col-span-1 md:col-span-4 flex flex-col md:items-end mt-4 md:mt-0 bg-gray-50 md:bg-transparent p-4 md:p-0 rounded-xl md:rounded-none">
                        
                        <div className="flex items-center justify-between w-full md:w-auto gap-4">
                          <span className="md:hidden text-xs font-bold text-gray-400 uppercase tracking-wider">Modal Price:</span>
                          
                          <div className="flex items-center gap-3">
                            {/* The Price */}
                            <span className="text-2xl font-black text-emerald-600 flex items-center">
                              <IndianRupee className="w-5 h-5 mr-0.5" />
                              {data.modalPrice}
                            </span>
                            
                            {/* 🔊 THE NEW AUDIO BUTTON */}
                            <button 
                              onClick={() => handleListenPrice(data)}
                              title="सुनने के लिए दबाएं (Listen)"
                              className="w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white active:scale-95"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between md:justify-end w-full mt-2 md:mt-1 gap-2">
                          <span className="text-xs font-semibold text-gray-500 flex items-center bg-white md:bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
                            <Scale className="w-3 h-3 mr-1 text-gray-400" />
                            ₹{data.minPrice} - ₹{data.maxPrice}
                          </span>
                          <span className="text-xs font-semibold text-gray-500 flex items-center bg-white md:bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
                            <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                            {data.date}
                          </span>
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