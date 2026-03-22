'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Truck, Users, MapPin, Loader2, Plus, X, Scale, 
  TrendingUp, IndianRupee, Clock, Phone, MessageCircle, Volume2, VolumeX, Trash2, Calendar
} from 'lucide-react';
import { useTranslations } from 'next-intl';

// --- INTERFACES ---
interface PoolMember {
  farmerName: string;
  phone: string;
  quantity: number;
  district: string;
  state: string;
  joinedAt: string;
}

interface SharedTransport {
  _id: string;
  arrangerName: string;
  arrangerPhone: string;
  vehicle: string;
  departureTime: string;
  costPerFarmer: number;
  capacity: number;
  joinedFarmers: string[]; 
}

interface Pool {
  _id: string;
  creatorName: string;
  creatorPhone: string;
  district: string;
  state: string;
  commodity: string;
  mandi: string;
  targetQuantity: number;
  currentQuantity: number;
  priceExpectation: number;
  closingDate: string;
  members: PoolMember[];
  transports?: SharedTransport[];
}

export default function SellingPoolsPage() {
  const t = useTranslations('SellingPools'); 

  // --- STATES ---
  const [pools, setPools] = useState<Pool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{name: string, phone: string, district: string, state: string} | null>(null);
  
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState('All');
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isTransportModalOpen, setIsTransportModalOpen] = useState(false);
  
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);

  // Form States
  const [createForm, setCreateForm] = useState({ commodity: '', mandi: '', targetQuantity: '', initialQuantity: '', priceExpectation: '', closingDate: '', district: '', state: '' });
  const [joinForm, setJoinForm] = useState({ quantity: '' });
  const [transportForm, setTransportForm] = useState({ vehicle: 'Tata Ace (Chota Hathi)', departureTime: '', costPerFarmer: '', capacity: '' });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);

  // --- EFFECTS ---
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setCurrentUser({ 
              name: data.user.name, 
              phone: data.user.phone,
              district: data.user.district || 'Ghaziabad', 
              state: data.user.state || 'Uttar Pradesh'
            });
            setCreateForm(prev => ({...prev, district: data.user.district || '', state: data.user.state || ''}));
          }
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };

    const fetchPoolsData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/selling-pools');
        const data = await res.json();
        if (data.success) {
          const fetchedPools = data.pools.map((p: Pool) => ({...p, transports: p.transports || []}));
          setPools(fetchedPools);
        }
      } catch (e) { console.error("Failed to fetch pools:", e); }
      finally { setIsLoading(false); }
    };

    fetchUser();
    fetchPoolsData();

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // --- HANDLERS ---
  const toggleAudio = (pool: Pool) => {
    if (!('speechSynthesis' in window)) return;
    if (playingId === pool._id) {
      window.speechSynthesis.cancel();
      setPlayingId(null);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`Pool for ${pool.commodity} at ${pool.mandi}. Target is ${pool.targetQuantity} quintals. Target price is ${pool.priceExpectation} rupees per quintal.`);
      utterance.onend = () => setPlayingId(null);
      utterance.onerror = () => setPlayingId(null);
      window.speechSynthesis.speak(utterance);
      setPlayingId(pool._id);
    }
  };

  const uniqueDistricts = useMemo(() => {
    const districts = pools.map(p => p.district).filter(Boolean);
    return ['All', ...Array.from(new Set(districts))].sort();
  }, [pools]);

  // ✅ IMPROVED: "My Pools" now shows pools you created AND pools you joined
  const filteredPools = pools.filter(pool => {
    const matchesDistrict = selectedDistrictFilter === 'All' || pool.district === selectedDistrictFilter;
    
    let matchesTab = true;
    if (activeTab === 'my' && currentUser) {
      const isCreator = pool.creatorPhone === currentUser.phone;
      const isMember = pool.members.some(m => m.phone === currentUser.phone);
      matchesTab = isCreator || isMember;
    }
    
    return matchesDistrict && matchesTab;
  });

  const handleCreatePool = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const payload = {
      ...createForm,
      creatorName: currentUser?.name || 'Unknown Farmer',
      creatorPhone: currentUser?.phone || '0000000000'
    };

    try {
      const res = await fetch('/api/selling-pools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setPools([{...data.pool, transports: []}, ...pools]);
        setIsCreateModalOpen(false);
        setCreateForm(prev => ({...prev, commodity: '', mandi: '', targetQuantity: '', initialQuantity: '', priceExpectation: '', closingDate: ''}));
      }
    } catch (e) { console.error(e); }
    finally { setIsSubmitting(false); }
  };

  const handleJoinPool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoolId) return;
    setIsSubmitting(true);
    
    const payload = {
      quantity: joinForm.quantity,
      farmerName: currentUser?.name || 'Unknown Farmer',
      phone: currentUser?.phone || '0000000000',
      district: currentUser?.district || 'Unknown',
      state: currentUser?.state || 'Unknown'
    };

    try {
      const res = await fetch(`/api/selling-pools/${selectedPoolId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setPools(pools.map(p => p._id === data.pool._id ? {...data.pool, transports: p.transports} : p));
        setIsJoinModalOpen(false);
        setJoinForm({ quantity: '' });
      }
    } catch (e) { console.error(e); }
    finally { setIsSubmitting(false); }
  };

  // ✅ IMPROVED: Safely and instantly updates the UI when a member is fired
  const handleRemoveMember = async (poolId: string, memberPhone: string, quantityToDeduct: number) => {
    if(!confirm("Are you sure you want to remove this farmer from the pool?")) return;
    
    // 1. Update the main pools array
    const updatedPools = pools.map(p => {
      if(p._id === poolId) {
        return {
          ...p, 
          currentQuantity: p.currentQuantity - quantityToDeduct,
          members: p.members.filter(m => m.phone !== memberPhone)
        };
      }
      return p;
    });
    setPools(updatedPools);

    // 2. Explicitly update the currently viewed modal so it disappears instantly
    if (selectedPool && selectedPool._id === poolId) {
      setSelectedPool({
        ...selectedPool,
        currentQuantity: selectedPool.currentQuantity - quantityToDeduct,
        members: selectedPool.members.filter(m => m.phone !== memberPhone)
      });
    }

    try {
      await fetch(`/api/selling-pools/${poolId}/members/${memberPhone}`, { method: 'DELETE' });
    } catch(e) { console.error("Failed to delete member", e); }
  };

  const handleDeletePool = async (poolId: string) => {
    if(!confirm("Are you sure you want to permanently delete this selling pool?")) return;
    setPools(pools.filter(p => p._id !== poolId));
    try {
      await fetch(`/api/selling-pools/${poolId}`, { method: 'DELETE' });
    } catch(e) { console.error("Failed to delete pool", e); }
  };

  const handleArrangeTransport = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!selectedPoolId) return;
    setIsSubmitting(true);

    const newTransport: SharedTransport = {
      _id: Math.random().toString(), 
      arrangerName: currentUser?.name || 'Farmer',
      arrangerPhone: currentUser?.phone || '00',
      vehicle: transportForm.vehicle,
      departureTime: transportForm.departureTime,
      costPerFarmer: Number(transportForm.costPerFarmer),
      capacity: Number(transportForm.capacity),
      joinedFarmers: [currentUser?.phone || '00']
    };

    setPools(pools.map(p => p._id === selectedPoolId ? {...p, transports: [...(p.transports || []), newTransport]} : p));
    setIsTransportModalOpen(false);
    setTransportForm({ vehicle: 'Tata Ace (Chota Hathi)', departureTime: '', costPerFarmer: '', capacity: '' });
    setIsSubmitting(false);

    try {
      await fetch(`/api/selling-pools/${selectedPoolId}/transport`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTransport)
      });
    } catch(e) { console.error("Failed to save transport", e); }
  };

  const handleJoinTransport = async (poolId: string, transportId: string) => {
    const userPhone = currentUser?.phone || '00';
    
    setPools(pools.map(p => {
      if(p._id === poolId) {
        const updatedTransports = p.transports?.map(t => {
          if(t._id === transportId && !t.joinedFarmers.includes(userPhone) && t.joinedFarmers.length < t.capacity) {
            return {...t, joinedFarmers: [...t.joinedFarmers, userPhone]};
          }
          return t;
        });
        return {...p, transports: updatedTransports};
      }
      return p;
    }));

    try {
      await fetch(`/api/selling-pools/${poolId}/transport/${transportId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: userPhone })
      });
    } catch(e) { console.error("Failed to join transport", e); }
  };

  const openMembersModal = (pool: Pool) => {
    setSelectedPool(pool);
    setIsMembersModalOpen(true);
  };

  const openTransportModal = (pool: Pool) => {
    setSelectedPool(pool);
    setSelectedPoolId(pool._id);
    setIsTransportModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 font-sans pb-16">
      {/* --- HERO SECTION --- */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-[#041a13] px-8 py-12 md:p-16 shadow-2xl border border-emerald-900/50">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />
        <Truck className="absolute -right-12 -bottom-16 w-80 h-80 text-white/[0.03] pointer-events-none transform -rotate-6" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-300 text-xs font-bold tracking-widest uppercase">Live Market Network</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-4 tracking-tight">
              {t('title') || 'Community Selling Pools'}
            </h1>
            <p className="text-lg text-emerald-100/80 font-medium leading-relaxed max-w-xl">
              {t('subtitle') || 'Join local farmers to aggregate your crops, bypass middlemen, and sell directly to wholesale buyers at premium rates.'}
            </p>
          </div>
          
          <div className="flex-shrink-0">
            <button onClick={() => setIsCreateModalOpen(true)} className="group relative flex items-center justify-center bg-amber-400 text-stone-950 px-8 py-4 rounded-2xl font-black text-lg hover:bg-amber-300 shadow-[0_0_40px_-10px_rgba(251,191,36,0.5)] active:scale-95 transition-all w-full md:w-auto overflow-hidden">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative flex items-center">
                <Plus className="w-6 h-6 mr-2" /> {t('startBtn') || 'Start a Pool'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* --- FILTER & POOLS GRID --- */}
      <div>
        <div className="flex bg-stone-100 rounded-2xl p-1 mb-6 border border-stone-200/60 max-w-[280px]">
          <button 
            onClick={() => setActiveTab('all')} 
            className={`flex-1 py-2.5 text-sm font-black rounded-xl transition-all ${activeTab === 'all' ? 'bg-white text-emerald-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
          >
            All Pools
          </button>
          <button 
            onClick={() => setActiveTab('my')} 
            className={`flex-1 py-2.5 text-sm font-black rounded-xl transition-all ${activeTab === 'my' ? 'bg-white text-emerald-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
          >
            My Pools
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 px-2 gap-4">
          <h2 className="text-2xl font-black text-black flex items-center">
            <TrendingUp className="w-6 h-6 mr-3 text-emerald-600" /> {t('activePools') || 'Active Pools'}
          </h2>
          <div className="relative min-w-[200px] w-full sm:w-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-emerald-500" />
            </div>
            <select
              value={selectedDistrictFilter}
              onChange={(e) => setSelectedDistrictFilter(e.target.value)}
              className="block w-full pl-11 pr-10 py-3 bg-white text-stone-900 border border-stone-200 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500 font-bold outline-none cursor-pointer"
            >
              <option value="All">All Local Mandis</option>
              {uniqueDistricts.filter(d => d !== 'All').map((district, idx) => (
                <option key={idx} value={district}>{district}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2rem] border border-stone-200 shadow-sm">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mb-4" />
            <p className="text-stone-500 font-bold">{t('syncing') || 'Syncing live pools...'}</p>
          </div>
        ) : filteredPools.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2rem] border border-stone-200 shadow-sm text-center px-6">
            <p className="text-stone-500 font-medium max-w-md">{selectedDistrictFilter !== 'All' ? `No active pools found in ${selectedDistrictFilter}. Be the first to start one!` : (t('noPools') || 'No active pools currently. Start your own!')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredPools.map(pool => {
              const progress = Math.min((pool.currentQuantity / pool.targetQuantity) * 100, 100);
              const isFull = progress >= 100;
              const hasTransport = pool.transports && pool.transports.length > 0;

              return (
                <div key={pool._id} className="group flex flex-col bg-white rounded-[2rem] border border-stone-200 shadow-sm hover:shadow-2xl hover:shadow-emerald-900/5 hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                  <div className="p-6 md:p-8 bg-stone-50/50 border-b border-stone-100 relative">
                    {isFull && <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-bl-xl">{t('targetReached') || 'Target Reached'}</div>}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-2xl font-black text-black flex items-center mb-1">{pool.commodity}</h3>
                        <p className="text-sm text-stone-500 font-bold flex items-center"><MapPin className="w-4 h-4 mr-1 text-emerald-500" />{pool.mandi}, {pool.district}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center space-x-2">
                          {(pool.creatorPhone === currentUser?.phone || pool.creatorName === currentUser?.name) && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeletePool(pool._id); }}
                              className="p-1.5 rounded-full transition-colors bg-red-50 text-red-500 hover:bg-red-500 hover:text-white"
                              title="Delete Pool"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => toggleAudio(pool)}
                            className={`p-1.5 rounded-full transition-colors ${playingId === pool._id ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400 hover:bg-emerald-50 hover:text-emerald-500'}`}
                          >
                            {playingId === pool._id ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                          </button>
                        </div>
                        <div className="bg-amber-100/50 text-amber-700 px-4 py-2 rounded-xl border border-amber-200/50 flex flex-col items-end">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600/80 mb-0.5">{t('targetRate') || 'Target Rate'}</span>
                          <span className="text-base font-black flex items-center"><IndianRupee className="w-4 h-4 mr-0.5" />{pool.priceExpectation}/q</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 md:p-8 flex-1 flex flex-col">
                    <div className="mb-6">
                      <div className="flex justify-between items-end mb-3">
                        <div>
                          <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">{t('currentVolume') || 'Current Volume'}</p>
                          <span className="text-3xl font-black text-black leading-none">{pool.currentQuantity} <span className="text-lg text-stone-400 font-bold">/ {pool.targetQuantity} Qtl</span></span>
                        </div>
                        <span className="text-sm font-black text-emerald-600">{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-stone-100 rounded-full h-3.5 overflow-hidden p-0.5 inset-shadow-sm">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className={`h-full rounded-full relative overflow-hidden ${isFull ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`} />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-8">
                      <button onClick={() => openMembersModal(pool)} className="bg-stone-50 hover:bg-stone-100 hover:border-blue-200 transition-colors rounded-xl p-3 border border-stone-100 text-left group/btn">
                        <span className="flex items-center justify-between text-xs font-bold text-stone-500 mb-1">
                          <span className="flex items-center"><Users className="w-3.5 h-3.5 mr-1.5 text-blue-500" /> {t('network') || 'Network'}</span>
                          <span className="text-[10px] text-blue-500 opacity-0 group-hover/btn:opacity-100 transition-opacity">View</span>
                        </span>
                        <span className="text-sm font-black text-black">{pool.members.length} Farmers</span>
                      </button>
                      <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                        <span className="flex items-center text-xs font-bold text-stone-500 mb-1"><Clock className="w-3.5 h-3.5 mr-1.5 text-red-400" /> {t('closing') || 'Closing'}</span>
                        <span className="text-sm font-black text-black">{new Date(pool.closingDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* DYNAMIC BUTTON LOGIC */}
                    {isFull ? (
                      <button 
                        onClick={() => openTransportModal(pool)} 
                        className={`w-full py-4 rounded-xl font-black text-sm flex justify-center items-center transition-all mt-auto ${hasTransport ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-300' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-900/20'}`}
                      >
                        <Truck className="w-5 h-5 mr-2" /> 
                        {hasTransport ? 'View Shared Trucks' : 'Arrange Shared Transport'}
                      </button>
                    ) : (
                      <button 
                        onClick={() => { setSelectedPoolId(pool._id); setIsJoinModalOpen(true); }} 
                        className="w-full py-4 rounded-xl font-black text-sm flex justify-center items-center transition-all mt-auto bg-[#041a13] text-white hover:bg-emerald-900 shadow-lg shadow-emerald-900/20 active:scale-[0.98]"
                      >
                        <Scale className="w-5 h-5 mr-2" /> {t('pledgeBtn') || 'Pledge Harvest'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- MEMBERS MODAL --- */}
      <AnimatePresence>
        {isMembersModalOpen && selectedPool && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={() => setIsMembersModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-[2rem] p-6 md:p-8 w-full max-w-xl relative z-10 shadow-2xl overflow-y-auto max-h-[85vh] custom-scrollbar">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-black text-black mb-1">Pool Members</h2>
                  <p className="text-stone-500 text-sm font-medium">Farmers pledging {selectedPool.commodity}</p>
                </div>
                <button onClick={() => setIsMembersModalOpen(false)} className="p-2 bg-stone-100 text-stone-400 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                {selectedPool.members.map((member, idx) => {
                  const isAdmin = Boolean(currentUser && (currentUser.phone === selectedPool.creatorPhone || currentUser.name === selectedPool.creatorName));
                  const isCreator = Boolean(selectedPool.creatorPhone === member.phone || selectedPool.creatorName === member.farmerName);

                  return (
                    <div key={idx} className="flex items-center justify-between p-4 border border-stone-100 rounded-2xl bg-stone-50/50 hover:bg-white transition-colors hover:shadow-sm">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-black text-lg">{member.farmerName}</h4>
                          {/* ✅ IMPROVED: Grp Leader badge added */}
                          {isCreator && <span className="bg-amber-100 text-amber-700 text-[10px] font-black uppercase px-2 py-0.5 rounded-md">Grp Leader</span>}
                        </div>
                        <p className="text-xs text-stone-500 font-bold flex items-center mt-1">
                          <MapPin className="w-3 h-3 mr-1 text-stone-400" /> {member.district}, {member.state}
                        </p>
                        <p className="text-sm font-black text-emerald-600 mt-1">{member.quantity} Quintals pledged</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <a href={`tel:+91${member.phone}`} title="Call" className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-colors">
                          <Phone className="w-5 h-5" />
                        </a>
                        <a href={`https://wa.me/91${member.phone}`} target="_blank" rel="noreferrer" title="WhatsApp" className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-xl transition-colors">
                          <MessageCircle className="w-5 h-5" />
                        </a>
                        {isAdmin && !isCreator && (
                          <button 
                            onClick={() => handleRemoveMember(selectedPool._id, member.phone, member.quantity)}
                            title="Remove from pool" 
                            className="flex items-center px-4 py-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-colors ml-2 font-bold text-xs"
                          >
                            <Trash2 className="w-4 h-4 mr-1.5" /> Fire User
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- TRANSPORT LOGISTICS MODAL --- */}
      <AnimatePresence>
        {isTransportModalOpen && selectedPool && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={() => setIsTransportModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2rem] p-6 md:p-8 w-full max-w-2xl relative z-10 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-black text-black flex items-center"><Truck className="w-6 h-6 mr-2 text-blue-600" /> Shared Transport</h2>
                  <p className="text-stone-500 text-sm font-medium mt-1">Pool complete! Coordinate a single truck to save logistics costs.</p>
                </div>
                <button onClick={() => setIsTransportModalOpen(false)} className="p-2 bg-stone-100 text-stone-400 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {selectedPool.transports && selectedPool.transports.length > 0 && (
                <div className="mb-8 space-y-4">
                  <h3 className="text-sm font-black text-stone-400 uppercase tracking-wider">Available Trucks</h3>
                  {selectedPool.transports.map((t, idx) => {
                    const isJoined = t.joinedFarmers.includes(currentUser?.phone || '');
                    const isFull = t.joinedFarmers.length >= t.capacity;

                    return (
                      <div key={idx} className="border border-blue-100 bg-blue-50/50 rounded-2xl p-5 relative overflow-hidden">
                        {isJoined && <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-lg">Seat Reserved</div>}
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-lg text-black">{t.vehicle}</h4>
                            <p className="text-sm text-stone-500 font-medium flex items-center mt-1"><Calendar className="w-4 h-4 mr-1.5" /> Departs: {new Date(t.departureTime).toLocaleString()}</p>
                            <p className="text-sm text-stone-500 font-medium flex items-center mt-1"><Users className="w-4 h-4 mr-1.5" /> Arranged by {t.arrangerName}</p>
                          </div>
                          <div className="text-right">
                            <span className="block text-2xl font-black text-blue-600">₹{t.costPerFarmer}</span>
                            <span className="text-xs font-bold text-stone-400 uppercase">Per Farmer</span>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between border-t border-blue-100 pt-4">
                          <span className="text-sm font-bold text-stone-600">{t.joinedFarmers.length} / {t.capacity} Farmers Joined</span>
                          {!isJoined ? (
                            <button 
                              onClick={() => handleJoinTransport(selectedPool._id, t._id)}
                              disabled={isFull}
                              className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${isFull ? 'bg-stone-200 text-stone-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'}`}
                            >
                              {isFull ? 'Truck Full' : 'Reserve Seat'}
                            </button>
                          ) : (
                            <button className="px-6 py-2 rounded-xl font-bold text-sm bg-emerald-100 text-emerald-700 cursor-default">
                              <span className="flex items-center"><Scale className="w-4 h-4 mr-1.5" /> Booked</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200">
                <h3 className="text-sm font-black text-stone-800 mb-4 flex items-center"><Plus className="w-4 h-4 mr-1" /> Arrange a New Truck</h3>
                <form onSubmit={handleArrangeTransport} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-stone-500">Vehicle Type</label>
                    <input required type="text" value={transportForm.vehicle} onChange={e => setTransportForm({...transportForm, vehicle: e.target.value})} placeholder="e.g. Tata Ace, Eicher" className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-black font-bold outline-none focus:border-blue-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-stone-500">Departure (Date & Time)</label>
                    <input required type="datetime-local" value={transportForm.departureTime} onChange={e => setTransportForm({...transportForm, departureTime: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-black font-bold outline-none focus:border-blue-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-stone-500">Cost per Farmer (₹)</label>
                    <input required type="number" value={transportForm.costPerFarmer} onChange={e => setTransportForm({...transportForm, costPerFarmer: e.target.value})} placeholder="e.g. 200" className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-black font-bold outline-none focus:border-blue-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-stone-500">Total Capacity (Farmers)</label>
                    <input required type="number" value={transportForm.capacity} onChange={e => setTransportForm({...transportForm, capacity: e.target.value})} placeholder="e.g. 5" className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-black font-bold outline-none focus:border-blue-500" />
                  </div>
                  <div className="md:col-span-2 pt-2">
                    <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-stone-900 text-white rounded-xl font-bold hover:bg-black transition-colors flex justify-center items-center">
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Post Transport Details'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CREATE MODAL --- */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2.5rem] p-8 md:p-10 w-full max-w-2xl relative z-10 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-black text-black">Start a Selling Pool</h2>
                </div>
                <button onClick={() => setIsCreateModalOpen(false)} className="p-2 bg-stone-100 text-stone-400 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleCreatePool} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5"><label className="block text-sm font-black text-black">Commodity</label><input required type="text" className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-black font-bold outline-none focus:bg-white focus:border-emerald-500" onChange={e => setCreateForm({...createForm, commodity: e.target.value})} placeholder="e.g. Wheat, Potato" /></div>
                  <div className="space-y-1.5"><label className="block text-sm font-black text-black">Target Mandi</label><input required type="text" className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-black font-bold outline-none focus:bg-white focus:border-emerald-500" onChange={e => setCreateForm({...createForm, mandi: e.target.value})} placeholder="e.g. Ghaziabad Mandi" /></div>
                  <div className="space-y-1.5"><label className="block text-sm font-black text-black">District</label><input required type="text" value={createForm.district} className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-black font-bold outline-none focus:bg-white focus:border-emerald-500" onChange={e => setCreateForm({...createForm, district: e.target.value})} /></div>
                  <div className="space-y-1.5"><label className="block text-sm font-black text-black">State</label><input required type="text" value={createForm.state} className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-black font-bold outline-none focus:bg-white focus:border-emerald-500" onChange={e => setCreateForm({...createForm, state: e.target.value})} /></div>
                  <div className="space-y-1.5"><label className="block text-sm font-black text-black">Target Total Quantity (Qtl)</label><input required type="number" className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-black font-bold outline-none focus:bg-white focus:border-emerald-500" onChange={e => setCreateForm({...createForm, targetQuantity: e.target.value})} /></div>
                  <div className="space-y-1.5"><label className="block text-sm font-black text-black">Your Initial Pledge (Qtl)</label><input required type="number" className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-black font-bold outline-none focus:bg-white focus:border-emerald-500" onChange={e => setCreateForm({...createForm, initialQuantity: e.target.value})} /></div>
                  <div className="space-y-1.5"><label className="block text-sm font-black text-black">Expected Price (₹/Qtl)</label><input required type="number" className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-black font-bold outline-none focus:bg-white focus:border-emerald-500" onChange={e => setCreateForm({...createForm, priceExpectation: e.target.value})} /></div>
                  <div className="space-y-1.5"><label className="block text-sm font-black text-black">Closing Date</label><input required type="date" className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-black font-bold outline-none focus:bg-white focus:border-emerald-500" onChange={e => setCreateForm({...createForm, closingDate: e.target.value})} /></div>
                </div>
                <div className="pt-6 border-t border-stone-100 mt-8">
                  <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-amber-400 text-stone-950 rounded-2xl font-black text-lg hover:bg-amber-300 shadow-lg active:scale-[0.98] transition-all flex justify-center items-center disabled:opacity-70">
                    {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Create Pool'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- JOIN MODAL --- */}
      <AnimatePresence>
        {isJoinModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={() => setIsJoinModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2rem] p-8 w-full max-w-sm relative z-10 shadow-2xl">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-black text-black mb-1">Pledge Harvest</h2>
                <button onClick={() => setIsJoinModalOpen(false)} className="p-2 bg-stone-100 text-stone-400 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleJoinPool} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="block text-sm font-black text-black">Quantity (Quintals)</label>
                  <input required type="number" className="w-full px-5 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-black font-bold outline-none focus:bg-white focus:border-emerald-500" onChange={e => setJoinForm({...joinForm, quantity: e.target.value})} />
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-[#041a13] text-white rounded-2xl font-black hover:bg-emerald-900 shadow-lg active:scale-[0.98] transition-all flex justify-center items-center disabled:opacity-70">
                  {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Confirm Pledge'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}