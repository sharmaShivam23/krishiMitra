'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tractor, Search, Loader2, Trash2, Power, PowerOff } from 'lucide-react';

export default function AdminRentalsManager() {
  const [listings, setListings] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const res = await fetch('/api/admin/rentals');
      const json = await res.json();
      if (json.success) setListings(json.listings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/admin/rentals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentStatus })
      });
      const json = await res.json();
      if (json.success) {
        setListings(listings.map(l => l._id === id ? { ...l, isActive: !currentStatus } : l));
      }
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this listing permanently?")) return;
    try {
      const res = await fetch(`/api/admin/rentals?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) setListings(listings.filter(l => l._id !== id));
    } catch (err) {
      alert("Failed to delete listing");
    }
  };

  const filteredListings = listings.filter(l => 
    (l.title?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (l.providerId?.name?.toLowerCase() || '').includes(search.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-emerald-950 flex items-center">
            <Tractor className="w-8 h-8 mr-3 text-emerald-600" />
            Rental Listings
          </h1>
          <p className="text-stone-500 font-medium mt-2">Manage equipment and service listings posted by users.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-stone-400" />
          <input 
            type="text" placeholder="Search equipment or owner..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-stone-900 placeholder:text-stone-400 shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-stone-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
        ) : (
          <div className="overflow-x-auto p-6">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b-2 border-stone-100 text-stone-400 text-sm">
                  <th className="pb-4 font-bold uppercase tracking-wider">Equipment/Service</th>
                  <th className="pb-4 font-bold uppercase tracking-wider">Provider</th>
                  <th className="pb-4 font-bold uppercase tracking-wider">Location</th>
                  <th className="pb-4 font-bold uppercase tracking-wider">Pricing</th>
                  <th className="pb-4 font-bold uppercase tracking-wider text-center">Status</th>
                  <th className="pb-4 font-bold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-stone-700 font-medium">
                {filteredListings.map((listing: any) => (
                  <tr key={listing._id} className="border-b border-stone-50 hover:bg-stone-50 transition-colors">
                    <td className="py-4 pr-4">
                      <p className="font-bold text-emerald-950">{listing.title}</p>
                      <p className="text-xs text-stone-500 uppercase tracking-wider">{listing.listingType} • {listing.category}</p>
                    </td>
                    <td className="py-4">
                      <p className="font-bold text-stone-800">{listing.providerId?.name || 'Unknown'}</p>
                      <p className="text-xs text-stone-400">{listing.providerId?.phone}</p>
                    </td>
                    <td className="py-4">
                      <p className="text-sm">{listing.location?.district}</p>
                      <p className="text-xs text-stone-400">{listing.location?.state}</p>
                    </td>
                    <td className="py-4">
                      <span className="font-bold text-emerald-700">₹{listing.pricing?.rate}</span>
                      <span className="text-stone-500 text-xs">/{listing.pricing?.unit}</span>
                    </td>
                    <td className="py-4 text-center">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                        listing.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'
                      }`}>
                        {listing.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => handleToggleStatus(listing._id, listing.isActive)} 
                          title={listing.isActive ? "Hide Listing" : "Activate Listing"}
                          className={`p-2 rounded-xl transition-colors ${listing.isActive ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                        >
                          {listing.isActive ? <PowerOff className="w-5 h-5" /> : <Power className="w-5 h-5" />}
                        </button>
                        <button onClick={() => handleDelete(listing._id)} className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredListings.length === 0 && (
              <div className="text-center p-10 text-stone-400 font-medium">No rental listings found.</div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}