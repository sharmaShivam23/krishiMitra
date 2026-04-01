'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Store, Search, Loader2, ShieldCheck, ShieldAlert, Image as ImageIcon } from 'lucide-react';

export default function AdminProvidersManager() {
  const [providers, setProviders] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'reviewed'>('pending');

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/admin/providers', { cache: 'no-store' });
      const json = await res.json();
      if (json.success) setProviders(json.providers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'Accepted' | 'Rejected', isVerified: boolean) => {
    try {
      const res = await fetch('/api/admin/providers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isVerifiedProvider: isVerified, providerStatus: status })
      });
      const json = await res.json();
      if (json.success) {
        setProviders(providers.map(p => p._id === id ? { ...p, isVerifiedProvider: isVerified, providerStatus: status } : p));
      }
    } catch (err) {
      alert("Failed to update verification status");
    }
  };

  const searchFilter = (p: any) => 
    (p.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (p.shopName?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (p.phone?.toLowerCase() || '').includes(search.toLowerCase());

  const pendingProviders = providers.filter(p => searchFilter(p) && (!p.providerStatus || p.providerStatus === 'Pending'));
  const reviewedProviders = providers.filter(p => searchFilter(p) && p.providerStatus && p.providerStatus !== 'Pending');

  const displayProviders = activeTab === 'pending' ? pendingProviders : reviewedProviders;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-emerald-950 flex items-center">
            <Store className="w-8 h-8 mr-3 text-emerald-600" />
            Provider Verification
          </h1>
          <p className="text-stone-500 font-medium mt-2">Verify new shop owners and manage their selling privileges.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-stone-400" />
          <input 
            type="text" placeholder="Search providers or shops..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-stone-900 placeholder:text-stone-400 shadow-sm"
          />
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 font-bold rounded-xl transition-colors ${activeTab === 'pending' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
        >
          Pending Requests ({pendingProviders.length})
        </button>
        <button 
          onClick={() => setActiveTab('reviewed')}
          className={`px-4 py-2 font-bold rounded-xl transition-colors ${activeTab === 'reviewed' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
        >
          Reviewed Providers ({reviewedProviders.length})
        </button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-stone-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
        ) : (
          <div className="overflow-x-auto p-6">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b-2 border-stone-100 text-stone-400 text-sm">
                  <th className="pb-4 font-bold uppercase tracking-wider">Provider / Shop Info</th>
                  <th className="pb-4 font-bold uppercase tracking-wider">License & GST</th>
                  <th className="pb-4 font-bold uppercase tracking-wider">Location</th>
                  <th className="pb-4 font-bold uppercase tracking-wider text-center">Status</th>
                  <th className="pb-4 font-bold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-stone-700 font-medium">
                {displayProviders.map((provider: any) => (
                  <tr key={provider._id} className="border-b border-stone-50 hover:bg-stone-50 transition-colors">
                    <td className="py-4 pr-4">
                      <p className="font-bold text-emerald-950">{provider.name}</p>
                      <p className="text-sm font-medium text-stone-600">{provider.shopName || 'No Shop Name'}</p>
                      <p className="text-xs text-stone-400">+91 {provider.phone}</p>
                    </td>
                    <td className="py-4">
                      <p className="font-bold text-stone-800 text-sm">Lic: {provider.licenseNumber || 'N/A'}</p>
                      <p className="text-xs text-stone-500 mb-1">GST: {provider.gstNumber || 'N/A'}</p>
                      {provider.licenseImage ? (
                        <a href={provider.licenseImage} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded">
                          <ImageIcon className="w-3 h-3 mr-1" /> View Document
                        </a>
                      ) : (
                        <span className="text-xs text-stone-400">No Image provided</span>
                      )}
                    </td>
                    <td className="py-4">
                      <p className="text-sm">{provider.district}</p>
                      <p className="text-xs text-stone-400">{provider.state}</p>
                    </td>
                    <td className="py-4 text-center">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider inline-flex items-center ${
                        provider.providerStatus === 'Accepted' ? 'bg-emerald-100 text-emerald-700' : 
                        provider.providerStatus === 'Rejected' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {provider.providerStatus === 'Accepted' ? (
                          <><ShieldCheck className="w-3.5 h-3.5 mr-1" /> Accepted</>
                        ) : provider.providerStatus === 'Rejected' ? (
                          <><ShieldAlert className="w-3.5 h-3.5 mr-1" /> Rejected</>
                        ) : (
                          <><ShieldAlert className="w-3.5 h-3.5 mr-1" /> Pending</>
                        )}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      {activeTab === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleUpdateStatus(provider._id, 'Rejected', false)} 
                            className="px-4 py-2 font-bold text-sm rounded-xl transition-colors bg-red-100 text-red-600 hover:bg-red-200"
                          >
                            Reject
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(provider._id, 'Accepted', true)} 
                            className="px-4 py-2 font-bold text-sm rounded-xl transition-colors bg-emerald-600 text-white hover:bg-emerald-700"
                          >
                            Accept
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleUpdateStatus(provider._id, provider.providerStatus === 'Accepted' ? 'Rejected' : 'Accepted', provider.providerStatus !== 'Accepted')} 
                          className={`px-4 py-2 font-bold text-sm rounded-xl transition-colors ${
                            provider.providerStatus === 'Accepted' 
                              ? 'bg-stone-100 text-stone-600 hover:bg-stone-200' 
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                        >
                          {provider.providerStatus === 'Accepted' ? 'Revoke (Reject)' : 'Verify (Accept)'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {displayProviders.length === 0 && (
              <div className="text-center p-10 text-stone-400 font-medium">No providers found in this category.</div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
