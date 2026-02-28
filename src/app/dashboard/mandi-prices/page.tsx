'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { 
  Search, MapPin, Filter, ArrowDownToLine, 
  Activity, Loader2, AlertCircle, IndianRupee, 
  Calendar, Scale
} from 'lucide-react';

/* ======================================================
   TYPES (Mapped to your backend response)
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

// Major agricultural states for the API filter
const INDIAN_STATES = [
  'All States', 'Uttar Pradesh', 'Punjab', 'Haryana', 
  'Maharashtra', 'Madhya Pradesh', 'Gujarat', 
  'Rajasthan', 'Karnataka', 'Andhra Pradesh', 'West Bengal',
  'Bihar', 'Kerala', 'Tamil Nadu'
];

/* ======================================================
   COMPONENT
====================================================== */
export default function MandiPrices() {
  const [prices, setPrices] = useState<MandiPriceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('All States');

  /* ======================================================
     FETCH REAL DATA FROM YOUR NEXT.JS BACKEND
  ====================================================== */
  useEffect(() => {
    const fetchPrices = async () => {
      setIsLoading(true);
      setError('');
      try {
        // If a specific state is selected, pass it as a query param to your backend
        const url = selectedState === 'All States' 
          ? '/api/mandi' 
          : `/api/mandi?state=${encodeURIComponent(selectedState)}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to connect to Market Telemetry.');
        
        const data = await res.json();
        
        if (data.prices) {
          setPrices(data.prices);
        } else {
          throw new Error('Invalid data format received from government portal.');
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Unable to fetch live prices.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrices();
  }, [selectedState]); // Re-fetch whenever the state filter changes

  /* ======================================================
     LOCAL SEARCH FILTER (By Commodity, Market, or District)
  ====================================================== */
  const filteredData = useMemo(() => {
    if (!searchQuery) return prices;
    const lowerQuery = searchQuery.toLowerCase();
    return prices.filter(entry => 
      entry.commodity.toLowerCase().includes(lowerQuery) || 
      entry.market.toLowerCase().includes(lowerQuery) ||
      entry.district.toLowerCase().includes(lowerQuery)
    );
  }, [searchQuery, prices]);

  /* ======================================================
     ANIMATIONS
  ====================================================== */
  const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120 } }
  };

  /* ======================================================
     UI RENDER
  ====================================================== */
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50/50 py-8 px-2 sm:px-6 lg:px-8 font-sans">
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-[1400px] mx-auto">
        
        {/* Header Section */}
        <motion.div variants={item} className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b border-gray-200/60 pb-6">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-xl shadow-lg shadow-emerald-500/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Live Market Telemetry</h1>
              <p className="text-gray-500 text-sm mt-1">Real-time APMC mandi prices synced directly from data.gov.in</p>
            </div>
          </div>
          <button className="hidden md:flex items-center space-x-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-bold hover:bg-gray-50 transition shadow-sm active:scale-95">
            <ArrowDownToLine className="w-4 h-4 text-gray-400" />
            <span className="text-sm">Export CSV</span>
          </button>
        </motion.div>

        {/* Controls: Search and API Filter */}
        <motion.div variants={item} className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by crop, market, or district..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-gray-900 font-medium transition-all text-sm"
            />
          </div>
          
          <div className="relative min-w-[220px]">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="block w-full pl-11 pr-10 py-3.5 bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold text-gray-900 appearance-none cursor-pointer transition-all text-sm"
            >
              {INDIAN_STATES.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* The Data Visualization Grid */}
        <motion.div variants={item} className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden min-h-[500px] flex flex-col">
          
          {/* Desktop Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 bg-gray-50/80 border-b border-gray-200/60 p-6 text-xs font-bold text-gray-500 uppercase tracking-wider items-center">
            <div className="col-span-4">Commodity & Variety</div>
            <div className="col-span-4">Market Location</div>
            <div className="col-span-4 text-right pr-4">Price / Quintal (Modal)</div>
          </div>

          {/* Data States */}
          <div className="flex-1 relative">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
                  <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
                  <p className="text-gray-500 font-medium">Fetching live national market data...</p>
                </motion.div>
              ) : error ? (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center bg-red-50/50 z-10 p-6 text-center">
                  <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                  <h3 className="text-lg font-bold text-red-900 mb-1">Telemetry Error</h3>
                  <p className="text-red-700 font-medium text-sm">{error}</p>
                </motion.div>
              ) : filteredData.length === 0 ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 p-6 text-center">
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
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="grid grid-cols-1 md:grid-cols-12 gap-4 p-6 hover:bg-emerald-50/30 transition-colors items-center group"
                    >
                      
                      {/* Commodity Info */}
                      <div className="col-span-1 md:col-span-4 flex flex-col">
                        <span className="text-lg font-black text-gray-900 flex items-center group-hover:text-emerald-700 transition-colors">
                          {data.commodity}
                        </span>
                        <span className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-wider bg-gray-100 w-max px-2 py-0.5 rounded-md border border-gray-200/60">
                          Variety: {data.variety || 'FAQ / Other'}
                        </span>
                      </div>

                      {/* Location Info */}
                      <div className="col-span-1 md:col-span-4 flex flex-col mt-2 md:mt-0">
                        <div className="flex items-center text-sm font-bold text-gray-700">
                          <MapPin className="w-4 h-4 mr-1.5 text-emerald-500" /> 
                          {data.market}, {data.district}
                        </div>
                        <div className="flex items-center text-xs font-medium text-gray-400 mt-1 pl-[22px]">
                          {data.state}
                        </div>
                      </div>

                      {/* Price Info (Real API Min/Max/Modal) */}
                      <div className="col-span-1 md:col-span-4 flex flex-col md:items-end mt-4 md:mt-0 bg-gray-50 md:bg-transparent p-4 md:p-0 rounded-xl md:rounded-none">
                        <div className="flex items-center justify-between w-full md:w-auto">
                          <span className="md:hidden text-xs font-bold text-gray-400 uppercase tracking-wider">Modal Price:</span>
                          <span className="text-2xl font-black text-emerald-600 flex items-center">
                            <IndianRupee className="w-5 h-5 mr-0.5" />
                            {data.modalPrice}
                          </span>
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