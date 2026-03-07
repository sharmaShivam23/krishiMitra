'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Truck, Users, MapPin, Loader2, Plus, X, Scale, 
  TrendingUp, IndianRupee, Clock, Phone, MessageCircle, Volume2, VolumeX
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PoolMember {
  farmerName: string;
  phone: string;
  quantity: number;
  joinedAt: string;
}

interface Pool {
  _id: string;
  creatorName: string;
  commodity: string;
  mandi: string;
  targetQuantity: number;
  currentQuantity: number;
  priceExpectation: number;
  closingDate: string;
  members: PoolMember[];
}

export default function SellingPools() {
  const t = useTranslations('SellingPools'); 

  const [pools, setPools] = useState<Pool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{name: string, phone: string} | null>(null);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);

  const [createForm, setCreateForm] = useState({ commodity: '', mandi: '', targetQuantity: '', initialQuantity: '', priceExpectation: '', closingDate: '' });
  const [joinForm, setJoinForm] = useState({ quantity: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setCurrentUser({ name: data.user.name, phone: data.user.phone });
          }
        }
      } catch (error) {
        console.error(error);
      }
    };

    const fetchPoolsData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/selling-pools');
        const data = await res.json();
        if (data.success) setPools(data.pools);
      } catch (e) { console.error(e); }
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
        setPools([data.pool, ...pools]);
        setIsCreateModalOpen(false);
        setCreateForm({ commodity: '', mandi: '', targetQuantity: '', initialQuantity: '', priceExpectation: '', closingDate: '' });
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
      phone: currentUser?.phone || '0000000000'
    };

    try {
      const res = await fetch(`/api/selling-pools/${selectedPoolId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setPools(pools.map(p => p._id === data.pool._id ? data.pool : p));
        setIsJoinModalOpen(false);
        setJoinForm({ quantity: '' });
      }
    } catch (e) { console.error(e); }
    finally { setIsSubmitting(false); }
  };

  const openMembersModal = (pool: Pool) => {
    setSelectedPool(pool);
    setIsMembersModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 font-sans pb-16">
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
              {t('title')}
            </h1>
            <p className="text-lg text-emerald-100/80 font-medium leading-relaxed max-w-xl">
              {t('subtitle')}
            </p>
          </div>
          
          <div className="flex-shrink-0">
            <button onClick={() => setIsCreateModalOpen(true)} className="group relative flex items-center justify-center bg-amber-400 text-stone-950 px-8 py-4 rounded-2xl font-black text-lg hover:bg-amber-300 shadow-[0_0_40px_-10px_rgba(251,191,36,0.5)] active:scale-95 transition-all w-full md:w-auto overflow-hidden">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative flex items-center">
                <Plus className="w-6 h-6 mr-2" /> {t('startBtn')}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-8 px-2">
          <h2 className="text-2xl font-black text-black flex items-center">
            <TrendingUp className="w-6 h-6 mr-3 text-emerald-600" /> {t('activePools')}
          </h2>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2rem] border border-stone-200 shadow-sm">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mb-4" />
            <p className="text-stone-500 font-bold">{t('syncing')}</p>
          </div>
        ) : pools.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2rem] border border-stone-200 shadow-sm text-center px-6">
            <p className="text-stone-500 font-medium max-w-md">{t('noPools')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {pools.map(pool => {
              const progress = Math.min((pool.currentQuantity / pool.targetQuantity) * 100, 100);
              const isFull = progress >= 100;

              return (
                <div key={pool._id} className="group flex flex-col bg-white rounded-[2rem] border border-stone-200 shadow-sm hover:shadow-2xl hover:shadow-emerald-900/5 hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                  <div className="p-6 md:p-8 bg-stone-50/50 border-b border-stone-100 relative">
                    {isFull && <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-bl-xl">{t('targetReached')}</div>}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-2xl font-black text-black flex items-center mb-1">{pool.commodity}</h3>
                        <p className="text-sm text-stone-500 font-bold flex items-center"><MapPin className="w-4 h-4 mr-1 text-emerald-500" />{pool.mandi}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <button 
                          onClick={() => toggleAudio(pool)}
                          className={`p-1.5 rounded-full transition-colors ${playingId === pool._id ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400 hover:bg-emerald-50 hover:text-emerald-500'}`}
                        >
                          {playingId === pool._id ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                        <div className="bg-amber-100/50 text-amber-700 px-4 py-2 rounded-xl border border-amber-200/50 flex flex-col items-end">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600/80 mb-0.5">{t('targetRate')}</span>
                          <span className="text-base font-black flex items-center"><IndianRupee className="w-4 h-4 mr-0.5" />{pool.priceExpectation}/q</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 md:p-8 flex-1 flex flex-col">
                    <div className="mb-6">
                      <div className="flex justify-between items-end mb-3">
                        <div>
                          <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">{t('currentVolume')}</p>
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
                          <span className="flex items-center"><Users className="w-3.5 h-3.5 mr-1.5 text-blue-500" /> {t('network')}</span>
                          <span className="text-[10px] text-blue-500 opacity-0 group-hover/btn:opacity-100 transition-opacity">View</span>
                        </span>
                        {/* <span className="text-sm font-black text-black">{pool.members.length} {t('farmers')}</span>
                         */}
                         <span className="text-sm font-black text-black">{t('farmers', { count: pool.members.length })}</span>
                      </button>
                      <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                        <span className="flex items-center text-xs font-bold text-stone-500 mb-1"><Clock className="w-3.5 h-3.5 mr-1.5 text-red-400" /> {t('closing')}</span>
                        <span className="text-sm font-black text-black">{new Date(pool.closingDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => { setSelectedPoolId(pool._id); setIsJoinModalOpen(true); }} 
                      disabled={isFull}
                      className={`w-full py-4 rounded-xl font-black text-sm flex justify-center items-center transition-all mt-auto ${isFull ? 'bg-stone-100 text-stone-400 cursor-not-allowed' : 'bg-[#041a13] text-white hover:bg-emerald-900 shadow-lg shadow-emerald-900/20 active:scale-[0.98]'}`}
                    >
                      <Scale className="w-5 h-5 mr-2" /> {isFull ? t('poolClosed') : t('pledgeBtn')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isMembersModalOpen && selectedPool && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={() => setIsMembersModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-[2rem] p-6 md:p-8 w-full max-w-xl relative z-10 shadow-2xl overflow-y-auto max-h-[85vh] custom-scrollbar">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-black text-black mb-1">{t('membersModal.title')}</h2>
                  <p className="text-stone-500 text-sm font-medium">{t('membersModal.subtitle')}</p>
                </div>
                <button onClick={() => setIsMembersModalOpen(false)} className="p-2 bg-stone-100 text-stone-400 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                {selectedPool.members.map((member, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border border-stone-100 rounded-2xl bg-stone-50/50 hover:bg-white transition-colors hover:shadow-sm">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-black text-lg">{member.farmerName}</h4>
                        {idx === 0 && <span className="bg-amber-100 text-amber-700 text-[10px] font-black uppercase px-2 py-0.5 rounded-md">{t('membersModal.creator')}</span>}
                      </div>
                      <p className="text-sm font-bold text-emerald-600 mt-0.5">{member.quantity} Quintals pledged</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <a href={`tel:+91${member.phone}`} title={t('membersModal.call')} className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-colors">
                        <Phone className="w-5 h-5" />
                      </a>
                      <a href={`https://wa.me/91${member.phone}?text=Hello ${member.farmerName}, I am reaching out regarding the ${selectedPool.commodity} selling pool on KrishiMitra.`} target="_blank" rel="noreferrer" title={t('membersModal.whatsapp')} className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-xl transition-colors">
                        <MessageCircle className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2.5rem] p-8 md:p-10 w-full max-w-2xl relative z-10 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-black text-black">{t('createModal.title')}</h2>
                </div>
                <button onClick={() => setIsCreateModalOpen(false)} className="p-2 bg-stone-100 text-stone-400 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleCreatePool} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5"><label className="block text-sm font-black text-black">{t('createModal.commodity')}</label><input required type="text" className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-black font-bold outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" onChange={e => setCreateForm({...createForm, commodity: e.target.value})} /></div>
                  <div className="space-y-1.5"><label className="block text-sm font-black text-black">{t('createModal.mandi')}</label><input required type="text" className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-black font-bold outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" onChange={e => setCreateForm({...createForm, mandi: e.target.value})} /></div>
                  <div className="space-y-1.5"><label className="block text-sm font-black text-black">{t('createModal.target')}</label><input required type="number" className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-black font-bold outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" onChange={e => setCreateForm({...createForm, targetQuantity: e.target.value})} /></div>
                  <div className="space-y-1.5"><label className="block text-sm font-black text-black">{t('createModal.pledge')}</label><input required type="number" className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-black font-bold outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" onChange={e => setCreateForm({...createForm, initialQuantity: e.target.value})} /></div>
                  <div className="space-y-1.5"><label className="block text-sm font-black text-black">{t('createModal.price')}</label><input required type="number" className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-black font-bold outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" onChange={e => setCreateForm({...createForm, priceExpectation: e.target.value})} /></div>
                  <div className="space-y-1.5"><label className="block text-sm font-black text-black">{t('createModal.date')}</label><input required type="date" className="w-full px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-black font-bold outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" onChange={e => setCreateForm({...createForm, closingDate: e.target.value})} /></div>
                </div>
                <div className="pt-6 border-t border-stone-100 mt-8">
                  <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-amber-400 text-stone-950 rounded-2xl font-black text-lg hover:bg-amber-300 shadow-lg active:scale-[0.98] transition-all flex justify-center items-center disabled:opacity-70">
                    {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : t('createModal.submit')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isJoinModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={() => setIsJoinModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2rem] p-8 w-full max-w-sm relative z-10 shadow-2xl">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-black text-black mb-1">{t('joinModal.title')}</h2>
                <button onClick={() => setIsJoinModalOpen(false)} className="p-2 bg-stone-100 text-stone-400 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleJoinPool} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="block text-sm font-black text-black">{t('joinModal.quantity')}</label>
                  <input required type="number" className="w-full px-5 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-black font-bold outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" onChange={e => setJoinForm({...joinForm, quantity: e.target.value})} />
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-[#041a13] text-white rounded-2xl font-black hover:bg-emerald-900 shadow-lg active:scale-[0.98] transition-all flex justify-center items-center disabled:opacity-70">
                  {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : t('joinModal.submit')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}