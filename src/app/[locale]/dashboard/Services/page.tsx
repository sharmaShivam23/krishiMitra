'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Tractor, Wrench, MapPin, Search, Filter, 
  User, ShieldCheck, PlusCircle, 
  Loader2, AlertCircle 
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import ListingContactFooter from '@/components/ListingContactFooter';
import { STATES_DISTRICTS } from '@/utils/indiaStates';
import TractorAnimation from '@/Lottie/Tractor.json';

// Dynamic import — disables SSR to avoid Lottie hydration mismatch
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });


interface Provider {
  _id: string;
  name: string;
  phone: string;
  profileImage?: string;
}

interface Listing {
  _id: string;
  listingType: 'rent' | 'service';
  title: string;
  description: string;
  category: string;
  pricing: { rate: number; unit: string };
  equipment: { name: string; condition: string };
  serviceDetails?: { operatorIncluded: boolean; jobType: string; estimatedCapacity: string };
  location: { state: string; district: string; village?: string };
  images: string[];
  providerId: Provider | string | null;
  createdAt: string;
}

const CATEGORIES = ['All Equipment', 'Tractor', 'Harvester', 'Sprayer', 'Cultivator', 'Seeder', 'Other'];

export default function EquipmentExchange() {
  const t = useTranslations('EquipmentExchange');

  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentUser, setCurrentUser] = useState<{ _id: string; name?: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'rent' | 'service'>('rent');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Equipment');
  const [stateFilter, setStateFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');

  useEffect(() => {
    const savedState = localStorage.getItem('userState');
    const savedDistrict = localStorage.getItem('userDistrict');
    if (savedState) setStateFilter(savedState);
    if (savedDistrict) setDistrictFilter(savedDistrict);

    const handleLocationUpdated = () => {
      const newState = localStorage.getItem('userState');
      const newDistrict = localStorage.getItem('userDistrict');
      if (newState) setStateFilter(newState);
      if (newDistrict) setDistrictFilter(newDistrict);
    };

    window.addEventListener('locationUpdated', handleLocationUpdated);
    return () => window.removeEventListener('locationUpdated', handleLocationUpdated);
  }, []);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.user) setCurrentUser(d.user); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    const fetchListings = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        const params = new URLSearchParams({ type: activeTab });
        if (debouncedSearch) params.append('search', debouncedSearch);
        if (selectedCategory !== 'All Equipment') params.append('category', selectedCategory);
        if (stateFilter) params.append('state', stateFilter);
        if (districtFilter) params.append('district', districtFilter);

        const res = await fetch(`/api/listing?${params.toString()}`);
        
        const textData = await res.text();
        let data;
        try {
          data = JSON.parse(textData);
        } catch (err) {
          throw new Error('API Route not found. Server returned HTML instead of JSON.');
        }

        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Error fetching data.');
        }
        
        setListings(data.listings);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, [activeTab, debouncedSearch, selectedCategory, stateFilter, districtFilter]);

  const handleDeleteListing = async (id: string) => {
    if (!window.confirm(t('deleteConfirm'))) return;
    try {
      setDeletingId(id);
      const res = await fetch(`/api/listings/${id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || t('deleteError'));
      setListings(prev => prev.filter(l => l._id !== id));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : t('deleteError'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20 font-sans selection:bg-emerald-400 selection:text-emerald-950">

      {/* ═══════════════ HERO HEADER ═══════════════ */}
      <div className="bg-emerald-950 relative overflow-hidden pt-12 pb-0 px-6 lg:px-8 border-b-[6px] border-emerald-500">
        {/* Background texture */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        {/* Glow blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/20 rounded-full mix-blend-screen filter blur-[80px]" />
        <div className="absolute -bottom-10 left-1/4 w-64 h-64 bg-teal-600/10 rounded-full mix-blend-screen filter blur-[60px]" />

        {/* Content row */}
        <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-widest mb-4">
              <Tractor className="w-4 h-4" /> <span>{t('badge')}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              {t('title1')}<span className="text-emerald-400">{t('title2')}</span>
            </h1>
            <p className="text-emerald-100/80 mt-2 text-lg max-w-xl font-medium">
              {t('subtitle')}
            </p>
          </div>

          <Link 
            href="/dashboard/Services/post" 
            className="flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-6 py-3.5 rounded-xl font-bold transition-all shadow-[0_0_30px_-5px_rgba(16,185,129,0.4)] active:scale-95 group mb-6"
          >
            <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            <span>{t('postListingBtn')}</span>
          </Link>
        </div>

        {/* ── TRACTOR ROAD STRIP ── */}
        <div className="relative z-10 w-full h-28 overflow-hidden select-none pointer-events-none">
          {/* Road surface */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-emerald-900/60 to-emerald-950 border-t border-emerald-700/40" />

          {/* Dashed center line — scrolling */}
          <div className="absolute bottom-8 left-0 right-0 h-[2px] overflow-hidden">
            <motion.div
              className="flex gap-8 whitespace-nowrap"
              animate={{ x: [0, -200] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
            >
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className="w-12 h-[2px] bg-yellow-400/40 shrink-0" />
              ))}
            </motion.div>
          </div>

          {/* Tractor driving left → right */}
          <motion.div
            className="absolute bottom-4"
            style={{ width: 160 }}
            animate={{ x: ['-160px', '110vw'] }}
            transition={{ repeat: Infinity, duration: 7, ease: 'linear' }}
          >
            <Lottie
              animationData={TractorAnimation}
              loop
              autoplay
              style={{ width: 160, height: 80 }}
            />
          </motion.div>

          {/* Dust cloud puffs */}
          {[0.3, 0.55, 0.8].map((delay, i) => (
            <motion.div
              key={i}
              className="absolute bottom-8 rounded-full bg-amber-100/10"
              style={{ width: 20 + i * 10, height: 20 + i * 10 }}
              animate={{
                x: ['-180px', '115vw'],
                opacity: [0, 0.5, 0],
                scale: [0.5, 1.4, 0.8],
              }}
              transition={{
                repeat: Infinity,
                duration: 7,
                ease: 'linear',
                delay: delay,
              }}
            />
          ))}
        </div>
      </div>


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-4 sm:p-5 flex flex-col mb-8 border border-gray-100 gap-4">
          <div className="flex w-full sm:w-max bg-gray-100 p-1.5 rounded-xl self-start">
            <button
              onClick={() => { setActiveTab('rent'); setSelectedCategory('All Equipment'); setSearchQuery(''); }}
              className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
                activeTab === 'rent'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Tractor className="w-4 h-4" /> <span>{t('tabRent')}</span>
            </button>
            <button
              onClick={() => { setActiveTab('service'); setSelectedCategory('All Equipment'); setSearchQuery(''); }}
              className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
                activeTab === 'service'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Wrench className="w-4 h-4" /> <span>{t('tabService')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
             <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input 
                  type="text" placeholder={t('searchPlaceholder')} 
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border text-black border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                />
             </div>
             <div className="relative w-full">
                <Filter className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <select 
                  value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-emerald-500/20 outline-none appearance-none cursor-pointer transition-all"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{t(`categories.${c}`)}</option>)}
                </select>
             </div>
             <div className="relative w-full">
                <MapPin className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <select 
                  value={stateFilter} 
                  onChange={(e) => { setStateFilter(e.target.value); setDistrictFilter(''); }}
                  className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-emerald-500/20 outline-none appearance-none cursor-pointer text-ellipsis transition-all"
                >
                  <option value="">All States</option>
                  {Object.keys(STATES_DISTRICTS).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
             </div>
             <div className="relative w-full">
                <MapPin className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <select 
                  value={districtFilter} 
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  disabled={!stateFilter}
                  className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-emerald-500/20 outline-none appearance-none cursor-pointer disabled:opacity-50 text-ellipsis transition-all"
                >
                  <option value="">All Districts</option>
                  {stateFilter && (STATES_DISTRICTS as any)[stateFilter]?.map((d: string) => <option key={d} value={d}>{d}</option>)}
                </select>
             </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-32">
              <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mb-4" />
              <p className="text-gray-500 font-medium">{t('loading')}</p>
            </motion.div>
          ) : error ? (
            <motion.div key="error" className="bg-red-50 border border-red-100 rounded-2xl p-10 text-center flex flex-col items-center">
              <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
              <h3 className="text-lg font-bold text-red-900">{t('errorTitle')}</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </motion.div>
          ) : listings.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-gray-200 border-dashed rounded-[2rem] p-16 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                {activeTab === 'rent' ? <Tractor className="w-10 h-10 text-gray-300" /> : <Wrench className="w-10 h-10 text-gray-300" />}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('emptyTitle')}</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {t('emptyDesc', { type: activeTab === 'rent' ? t('typeEquipment') : t('typeServices') })}
              </p>
            </motion.div>
          ) : (
            <motion.div key="grid" initial="hidden" animate="show" variants={{
              hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } }
            }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {listings.map((listing) => {
                const providerId =
                  typeof listing.providerId === 'string'
                    ? listing.providerId
                    : listing.providerId?._id;
                const providerName =
                  typeof listing.providerId === 'object' && listing.providerId !== null
                    ? listing.providerId.name
                    : undefined;
                const providerPhone =
                  typeof listing.providerId === 'object' && listing.providerId !== null
                    ? listing.providerId.phone
                    : undefined;

                return (<motion.div
                  key={listing._id} 
                  variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                  className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-300 flex flex-col group overflow-hidden"
                >
                  <div className="h-48 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                    {listing.images && listing.images.length > 0 ? (
                      <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className={`w-full h-full flex flex-col items-center justify-center ${activeTab === 'rent' ? 'bg-emerald-50 text-emerald-200' : 'bg-blue-50 text-blue-200'}`}>
                        {activeTab === 'rent' ? <Tractor className="w-20 h-20 mb-2" /> : <Wrench className="w-20 h-20 mb-2" />}
                      </div>
                    )}
                    
                    <div className="absolute top-4 left-4">
                      {activeTab === 'rent' ? (
                        <span className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center shadow-sm">
                          <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-500" /> {t('condition')} {listing.equipment.condition}
                        </span>
                      ) : listing.serviceDetails?.operatorIncluded ? (
                        <span className="bg-blue-600/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center shadow-sm">
                          <User className="w-3.5 h-3.5 mr-1" /> {t('operatorIncluded')}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-black text-gray-900 leading-tight line-clamp-2 pr-2 group-hover:text-emerald-700 transition-colors">
                        {listing.title}
                      </h3>
                    </div>
                    
                    <p className="text-sm text-gray-500 font-medium mb-4 flex items-center">
                      <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                      {listing.location.district}, {listing.location.state}
                    </p>

                    <div className="flex items-center mb-4 bg-gray-50/80 w-max px-3 py-1.5 rounded-lg border border-gray-100">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center mr-2 text-emerald-700 font-bold text-xs">
                        {providerName ? providerName.charAt(0).toUpperCase() : <User className="w-3 h-3" />}
                      </div>
                      <p className="text-xs font-semibold text-gray-500">
                        {t('owner')} <span className="text-gray-900 font-bold">{providerName || t('verifiedFarmer')}</span>
                      </p>
                    </div>

                    <div className="space-y-2 mt-auto">
                      <div className="flex items-center text-sm">
                        <span className="text-gray-400 font-medium w-24">{t('equipmentLabel')}</span>
                        <span className="text-gray-800 font-bold truncate">{listing.equipment.name}</span>
                      </div>
                      
                      {activeTab === 'service' && listing.serviceDetails && (
                        <div className="flex items-center text-sm">
                          <span className="text-gray-400 font-medium w-24">{t('jobTypeLabel')}</span>
                          <span className="text-gray-800 font-bold truncate">{listing.serviceDetails.jobType || t('generalJob')}</span>
                        </div>
                      )}
                    </div>

                    <hr className="my-5 border-gray-100" />

                    {currentUser && providerId === currentUser._id && (
                      <div className="flex flex-wrap gap-3 mb-4">
                        <Link
                          href={`/dashboard/Services/post?listingId=${listing._id}`}
                          className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 px-4 py-2 text-sm font-semibold hover:bg-emerald-100 transition"
                        >
                          {t('edit')}
                        </Link>
                        <button
                          type="button"
                          disabled={deletingId === listing._id}
                          onClick={() => handleDeleteListing(listing._id)}
                          className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-2 text-sm font-semibold hover:bg-red-100 transition disabled:opacity-60"
                        >
                          {deletingId === listing._id ? t('deleting') : t('delete')}
                        </button>
                      </div>
                    )}

                    <ListingContactFooter
                      title={listing.title}
                      pricing={listing.pricing}
                      provider={{
                        name: providerName || t('verifiedFarmer'),
                        phone: providerPhone || ''
                      }}
                      location={listing.location}
                      type={activeTab}
                    />

                  </div>
                </motion.div>
                );
              })}

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}