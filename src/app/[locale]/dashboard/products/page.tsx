'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Leaf, Bug, Store, IndianRupee, 
  ShieldAlert, Phone, Filter, X, Loader2, Star,
  ShieldCheck, AlertTriangle, FileText, MessageSquare, CheckCircle
} from 'lucide-react';
import { STATES_DISTRICTS } from '@/utils/indiaStates';

export default function ProductsMarketplace() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ state: '', district: '', crop: '', disease: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [newReview, setNewReview] = useState({ rating: 5, feedback: '', effectiveness: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
  const [userRole, setUserRole] = useState<string | null>(null);

  // Fetch Reviews when a product is selected
  useEffect(() => {
    if (selectedProduct) {
      fetch(`/api/products/${selectedProduct._id}/reviews`)
        .then(res => res.json())
        .then(data => { if (data.success) setReviews(data.reviews); })
        .catch(err => console.error(err));
    } else {
      setReviews([]);
    }
  }, [selectedProduct]);

  // Submit a Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setIsSubmittingReview(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/products/${selectedProduct._id}/reviews`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(newReview)
      });
      const data = await res.json();
      if (data.success) {
        setReviews([data.review, ...reviews]);
        setNewReview({ rating: 5, feedback: '', effectiveness: '' });
      } else { alert(data.error); }
    } catch (err: any) { console.error(err); } finally { setIsSubmittingReview(false); }
  };

  // Fetch Products based on filters
  const fetchProducts = async (state: string, district: string, crop: string, disease: string) => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams();
      if (state) query.append('state', state);
      if (district) query.append('district', district);
      if (crop) query.append('crop', crop);
      if (disease) query.append('disease', disease);
      const res = await fetch(`/api/products?${query.toString()}`);
      const data = await res.json();
      if (data.success) setProducts(data.products);
    } catch (err: any) { console.error(err); } finally { setIsLoading(false); }
  };

  // Initialize page: Get user role, then fetch ALL products by default
  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem('token');
        
        const userRes = await fetch('/api/auth/me', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        const userData = await userRes.json();
        
        if (userData.success && userData.user) {
          setUserRole(userData.user.role);
          console.log("Authenticated User Role:", userData.user.role);
        } else {
          console.log("Not authenticated or token invalid.");
        }
        
       
        await fetchProducts('', '', '', '');
      } catch (err) { 
        console.error("Initialization error:", err);
        setIsLoading(false); 
      }
    };
    init();
  }, []);

  const handleApplyFilters = () => { setShowFilters(false); fetchProducts(filters.state, filters.district, filters.crop, filters.disease); };
  const clearFilters = () => { setFilters({ state: '', district: '', crop: '', disease: '' }); fetchProducts('', '', '', ''); setShowFilters(false); };

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-[2.05rem] leading-[1.05] md:text-4xl font-black text-emerald-900 flex items-center">
            <Store className="w-8 h-8 mr-3 text-emerald-600" /> Agricultural Products
          </h1>
          <p className="text-gray-600 font-semibold mt-2">Discover pesticides and herbicides from local providers.</p>
        </div>
        
        <div className="flex gap-3">
          {userRole === 'provider' && (
            <Link 
              href="/dashboard/provider-panel"
              className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition flex items-center shadow-sm"
            >
              <Store className="w-5 h-5 mr-2" /> Add/Manage Products
            </Link>
          )}

          <button onClick={() => setShowFilters(true)} className="bg-emerald-100 border border-emerald-300 text-emerald-900 px-5 py-2.5 rounded-xl font-black hover:bg-emerald-200 transition flex items-center shadow-sm">
            <Filter className="w-5 h-5 mr-2" /> Filter Products
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl p-6 w-full max-w-lg relative z-10 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-emerald-900">Filter Products</h3>
                <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
              </div>
              <div className="space-y-4">
                <div className="flex gap-4">
                   <div className="flex-1">
                      <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center"><MapPin className="w-4 h-4 mr-1"/> State</label>
                      {/* 🔥 FIX: Added text-gray-900 bg-white */}
                      <select name="state" value={filters.state} onChange={(e) => setFilters({ ...filters, state: e.target.value, district: '' })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 bg-white">
                        <option value="">All States</option>
                        {Object.keys(STATES_DISTRICTS).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                   </div>
                   <div className="flex-1">
                      <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center">District</label>
                      {/* 🔥 FIX: Added text-gray-900 bg-white */}
                      <select disabled={!filters.state} name="district" value={filters.district} onChange={(e) => setFilters({ ...filters, district: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none disabled:opacity-50 text-gray-900 bg-white">
                        <option value="">All Districts</option>
                        {filters.state && STATES_DISTRICTS[filters.state]?.map((d: string) => <option key={d} value={d}>{d}</option>)}
                      </select>
                   </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center"><Leaf className="w-4 h-4 mr-1 text-emerald-600"/> Crop (e.g., Wheat)</label>
                  {/* 🔥 FIX: Added text-gray-900 bg-white */}
                  <input value={filters.crop} onChange={(e) => setFilters({...filters, crop: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 bg-white placeholder-gray-400" placeholder="Search by crop..." />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center"><Bug className="w-4 h-4 mr-1 text-red-500"/> Disease (e.g., Blight)</label>
                  {/* 🔥 FIX: Added text-gray-900 bg-white */}
                  <input value={filters.disease} onChange={(e) => setFilters({...filters, disease: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 bg-white placeholder-gray-400" placeholder="Search by disease..." />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={clearFilters} className="flex-1 py-3.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition">Clear All</button>
                <button onClick={handleApplyFilters} className="flex-1 py-3.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition">Apply Filters</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-emerald-600" /></div>
      ) : products.length === 0 ? (
        <div className="bg-white border text-center py-16 rounded-3xl">
          <Leaf className="w-12 h-12 text-emerald-200 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-gray-900">No products found</h3>
          <p className="text-gray-500 mt-1">Try adjusting your filters to see more results.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((p: any) => (
            <motion.div key={p._id} whileHover={{ y: -4 }} className="bg-white rounded-[2rem] overflow-hidden shadow-lg shadow-emerald-900/5 border border-emerald-50 flex flex-col cursor-pointer" onClick={() => setSelectedProduct(p)}>
              <div className="h-48 bg-gray-100 relative">
                {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex flex-col items-center justify-center text-emerald-200 bg-emerald-50"><Store className="w-12 h-12 mb-2" /><span className="text-xs font-bold uppercase tracking-wider">No Image Provided</span></div>}
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3.5 py-1.5 rounded-full font-black text-emerald-900 shadow-xl shadow-black/10 flex items-center"><IndianRupee className="w-4 h-4 mr-0.5" /> {p.price}</div>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-black text-xl text-emerald-950 mb-1">{p.name}</h3>
                <p className="text-sm font-medium text-emerald-600/70 flex items-center mb-4"><MapPin className="w-3.5 h-3.5 mr-1" /> {p.location.district}, {p.location.state}</p>
                <div className="space-y-2 mb-6 flex-1">
                  <div className="flex flex-wrap gap-1.5">
                    {p.cropSuitability?.slice(0, 3).map((c: string, i: number) => <span key={i} className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg flex items-center border border-emerald-100"><Leaf className="w-3 h-3 mr-1"/> {c}</span>)}
                    {p.cropSuitability?.length > 3 && <span className="px-2 py-1 bg-gray-50 text-gray-500 text-xs font-bold rounded-lg">+{p.cropSuitability.length - 3}</span>}
                  </div>
                </div>
                <button className="w-full bg-emerald-50 text-emerald-700 font-bold py-3 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300"><FileText className="w-4 h-4 mr-2" /> View Details</button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedProduct(null)} />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10 shadow-2xl custom-scrollbar flex flex-col md:flex-row">
              <div className="w-full md:w-2/5 h-64 md:h-auto bg-gray-100 sticky top-0">
                {selectedProduct.image ? <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-200"><Store className="w-20 h-20" /></div>}
                <button onClick={() => setSelectedProduct(null)} className="md:hidden absolute top-4 right-4 bg-white/50 backdrop-blur-md p-2 rounded-full"><X className="w-5 h-5"/></button>
              </div>
              <div className="w-full md:w-3/5 p-6 md:p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                     <h2 className="text-3xl font-black text-emerald-950 mb-2">{selectedProduct.name}</h2>
                     <div className="flex items-center text-gray-500 font-medium text-sm"><MapPin className="w-4 h-4 mr-1 text-emerald-600" /> {selectedProduct.location.district}, {selectedProduct.location.state}</div>
                  </div>
                  <button onClick={() => setSelectedProduct(null)} className="hidden md:block text-gray-400 hover:text-gray-900 bg-gray-100 p-2 rounded-full transition"><X className="w-5 h-5"/></button>
                </div>
                <div className="flex items-center space-x-4 mb-8">
                   <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl font-black text-xl flex items-center border border-emerald-100"><IndianRupee className="w-5 h-5 mr-1" /> {selectedProduct.price}</div>
                   <div className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-600/20 flex items-center cursor-pointer hover:bg-emerald-700 transition"><Phone className="w-4 h-4 mr-2" /> Contact Provider</div>
                </div>
                
                {selectedProduct.providerId && (
                  <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between mb-8 border border-gray-100">
                    <div className="flex items-center">
                       <div className="w-10 h-10 bg-emerald-200 text-emerald-800 rounded-full flex items-center justify-center font-bold text-lg mr-3">{selectedProduct.providerId.name.charAt(0)}</div>
                       <div><p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5">Sold By</p><p className="font-bold text-emerald-950">{selectedProduct.providerId.name}</p></div>
                    </div>
                    <a href={`tel:${selectedProduct.providerId.phone}`} className="text-emerald-600 font-bold bg-emerald-100 px-4 py-2 rounded-lg flex items-center"><Phone className="w-4 h-4 mr-2" /> Call Now</a>
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center"><Leaf className="w-5 h-5 mr-2 text-emerald-600"/> Suitable Crops</h3>
                    <div className="flex flex-wrap gap-2">{selectedProduct.cropSuitability?.map((c: string, i: number) => <span key={i} className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-bold border border-emerald-100">{c}</span>)}</div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center"><Bug className="w-5 h-5 mr-2 text-red-500"/> Diseases Treated</h3>
                    <div className="flex flex-wrap gap-2">{selectedProduct.diseaseTreats?.map((d: string, i: number) => <span key={i} className="bg-red-50 text-red-700 px-3 py-1.5 rounded-lg text-sm font-bold border border-red-100">{d}</span>)}</div>
                  </div>
                  <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100 mt-6">
                    <h3 className="text-lg font-bold text-amber-900 mb-2 flex items-center"><ShieldAlert className="w-5 h-5 mr-2 text-amber-500"/> Usage Instructions & Safety</h3>
                    {selectedProduct.usageInstructions && <div className="mb-4"><p className="font-bold text-amber-800 text-sm mb-1">How to use:</p><p className="text-amber-700 text-sm leading-relaxed">{selectedProduct.usageInstructions}</p></div>}
                    {selectedProduct.safetyWarnings && <div><p className="font-bold text-amber-800 text-sm mb-1">Safety Warning:</p><p className="text-amber-700 text-sm leading-relaxed flex items-start"><AlertTriangle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" /> {selectedProduct.safetyWarnings}</p></div>}
                  </div>
                  {selectedProduct.benefits && <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100"><h3 className="text-lg font-bold text-blue-900 mb-2 flex items-center"><ShieldCheck className="w-5 h-5 mr-2 text-blue-500"/> Benefits</h3><p className="text-blue-800 text-sm leading-relaxed">{selectedProduct.benefits}</p></div>}
                  
                  {/* Reviews Section */}
                  <div className="pt-8 border-t border-gray-100">
                    <h3 className="text-2xl font-black text-emerald-950 mb-6 flex items-center"><MessageSquare className="w-6 h-6 mr-2 text-emerald-600"/> Farmer Reviews</h3>
                    <form onSubmit={handleSubmitReview} className="bg-gray-50 rounded-2xl p-6 border border-gray-200 mb-8">
                      <h4 className="font-bold text-gray-900 mb-4">Write a Review</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center">Rating <Star className="w-4 h-4 ml-1 text-amber-400 fill-amber-400" /></label>
                          <select required value={newReview.rating} onChange={(e) => setNewReview({...newReview, rating: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 bg-white">
                            <option value="5">5 - Excellent</option><option value="4">4 - Very Good</option><option value="3">3 - Good</option><option value="2">2 - Fair</option><option value="1">1 - Poor</option>
                          </select>
                        </div>
                        <div>
                           <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center"><CheckCircle className="w-4 h-4 mr-1 text-emerald-600"/> Effectiveness (Optional)</label>
                           <input value={newReview.effectiveness} onChange={(e) => setNewReview({...newReview, effectiveness: e.target.value})} placeholder="e.g. Cleared blight in 3 days" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 bg-white placeholder-gray-400" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1.5">Feedback</label>
                          <textarea required value={newReview.feedback} onChange={(e) => setNewReview({...newReview, feedback: e.target.value})} placeholder="Share your experience..." rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none resize-none text-gray-900 bg-white placeholder-gray-400" />
                        </div>
                        <button disabled={isSubmittingReview} type="submit" className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition flex items-center disabled:opacity-75">
                          {isSubmittingReview ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : 'Submit Review'}
                        </button>
                      </div>
                    </form>
                    <div className="space-y-4">
                      {reviews.length === 0 ? <p className="text-gray-500 font-medium text-center py-6">No reviews yet. Be the first to review!</p> : reviews.map((r: any, i: number) => (
                        <div key={i} className="border border-gray-100 rounded-2xl p-5 shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h5 className="font-bold text-gray-900">{r.farmerId?.name || 'Anonymous Farmer'}</h5>
                              <div className="flex items-center mt-1">{[...Array(5)].map((_, idx) => <Star key={idx} className={`w-3.5 h-3.5 ${idx < r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />)}</div>
                            </div>
                            <span className="text-xs text-gray-400 font-bold">{new Date(r.createdAt).toLocaleDateString()}</span>
                          </div>
                          {r.effectiveness && <div className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded inline-block mb-3">Result: {r.effectiveness}</div>}
                          <p className="text-gray-600 text-sm leading-relaxed">{r.feedback}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}