'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { 
  Store, Plus, Leaf, Bug, MapPin, IndianRupee, 
  AlertTriangle, ShieldCheck, Loader2, Image as ImageIcon, Trash2
} from 'lucide-react';
import { STATES_DISTRICTS } from '@/utils/indiaStates';
import CloudinaryImageUpload from '@/components/CloudinaryImageUpload';
import StateDistrictSelector from '@/components/StateDistrictSelector';

export default function ProviderPanel() {
  const t = useTranslations('ProviderPanel');
  
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [providerStatus, setProviderStatus] = useState('Pending');
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '', image: '', price: '', cropSuitability: '', diseaseTreats: '',
    usageInstructions: '', benefits: '', safetyWarnings: '', state: '', district: '',
  });
const fetchProducts = async () => {
    setIsLoading(true);
    try {
      // 🚀 Remove the manual localStorage token logic!
      // Just rely on the browser sending the HttpOnly cookie automatically.
      const res = await fetch('/api/provider/products', {
        method: 'GET',
        cache: 'no-store',
        credentials: 'include' // This sends the cookie!
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setProducts(data.products || []);
        setIsVerified(data.isVerifiedProvider || false);
        setProviderStatus(data.providerStatus || 'Pending');
      } else {
        console.error("Fetch returned false:", data.error);
      }
    } catch (err: any) {
      console.error("Failed to fetch products:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        name: formData.name,
        image: formData.image,
        price: Number(formData.price),
        cropSuitability: formData.cropSuitability.split(',').map((s: string) => s.trim()).filter(Boolean),
        diseaseTreats: formData.diseaseTreats.split(',').map((s: string) => s.trim()).filter(Boolean),
        usageInstructions: formData.usageInstructions,
        benefits: formData.benefits,
        safetyWarnings: formData.safetyWarnings,
        location: { state: formData.state, district: formData.district }
      };

      const rawToken = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (rawToken && rawToken !== 'null' && rawToken !== 'undefined') {
        headers['Authorization'] = `Bearer ${rawToken}`;
      }

      const res = await fetch('/api/provider/products', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add product');
      
      setIsAddingMode(false);
      setFormData({ name: '', image: '', price: '', cropSuitability: '', diseaseTreats: '', usageInstructions: '', benefits: '', safetyWarnings: '', state: '', district: '' });
      fetchProducts(); // Refresh the list
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      // We removed the manual header logic just like we did for POST and GET!
      const res = await fetch(`/api/provider/products/${id}`, {
        method: 'DELETE',
        credentials: 'include' // Rely purely on the secure cookie
      });
      
      const data = await res.json();

      if (res.ok && data.success) {
        // ONLY remove from screen if the backend actually deleted it!
        setProducts(products.filter(p => p._id !== id));
      } else {
        alert(data.error || "Failed to delete product from database.");
      }
    } catch (err: any) {
      console.error("Delete failed", err);
      alert("An error occurred while deleting.");
    }
  };
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-emerald-900 flex items-center">
            <Store className="w-8 h-8 mr-3 text-emerald-600" /> Provider Panel
          </h1>
          <p className="text-gray-500 font-medium mt-1">Manage your agricultural products & listings.</p>
        </div>
        <button 
          onClick={() => isVerified && setIsAddingMode(!isAddingMode)}
          disabled={!isVerified}
          className={`px-5 py-2.5 rounded-xl font-bold transition flex items-center shadow-lg ${
            isVerified 
              ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20' 
              : 'bg-stone-200 text-stone-400 cursor-not-allowed opacity-80'
          }`}
        >
          {isAddingMode ? 'Cancel' : <><Plus className="w-5 h-5 mr-1" /> Add New Product</>}
        </button>
      </div>

      {/* WARNINGS LOGIC */}
      {!isVerified && !isLoading && (!providerStatus || providerStatus === 'Pending') && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center shadow-sm">
          <AlertTriangle className="w-6 h-6 text-amber-500 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-amber-900 font-bold">Verification Pending</h3>
            <p className="text-amber-800 text-sm font-medium mt-1">Your account is currently under review by the admin. You will be able to list products once your License & GST details are verified.</p>
          </div>
        </motion.div>
      )}

      {!isVerified && !isLoading && providerStatus === 'Rejected' && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center shadow-sm">
          <AlertTriangle className="w-6 h-6 text-red-500 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-red-900 font-bold">Application Rejected</h3>
            <p className="text-red-800 text-sm font-medium mt-1">Your provider application was rejected. Please contact support to update your documents.</p>
          </div>
        </motion.div>
      )}

      {/* ADD PRODUCT FORM */}
      {isAddingMode && isVerified && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-4">Create New Product Listing</h2>
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-start">
              <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <form onSubmit={handleAddProduct} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Product Name</label>
                  <input required name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Neem Oil Extract" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 bg-white placeholder-gray-400" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center"><IndianRupee className="w-4 h-4 mr-1"/> Price (₹)</label>
                  <input required type="number" name="price" value={formData.price} onChange={handleChange} placeholder="0.00" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 bg-white placeholder-gray-400" />
                </div>
                <CloudinaryImageUpload value={formData.image} onChange={(url) => setFormData(prev => ({ ...prev, image: url }))} label="Product Image" />
                <StateDistrictSelector state={formData.state} district={formData.district} onStateChange={v => setFormData(prev => ({ ...prev, state: v, district: '' }))} onDistrictChange={v => setFormData(prev => ({ ...prev, district: v }))} autoFillFromDB required />
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center"><Leaf className="w-4 h-4 mr-1 text-emerald-600"/> Crop Suitability (comma separated)</label>
                  <input name="cropSuitability" value={formData.cropSuitability} onChange={handleChange} placeholder="Wheat, Rice, Cotton..." className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 bg-white placeholder-gray-400" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center"><Bug className="w-4 h-4 mr-1 text-red-500"/> Diseases it Treats (comma separated)</label>
                  <input name="diseaseTreats" value={formData.diseaseTreats} onChange={handleChange} placeholder="Aphids, Leaf Blight..." className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 bg-white placeholder-gray-400" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Usage Instructions</label>
                  <textarea name="usageInstructions" value={formData.usageInstructions} onChange={handleChange} placeholder="Mix 50ml in 10L water..." rows={2} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none resize-none text-gray-900 bg-white placeholder-gray-400" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
               <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center"><ShieldCheck className="w-4 h-4 mr-1 text-blue-500"/> Benefits</label>
                  <textarea name="benefits" value={formData.benefits} onChange={handleChange} placeholder="Improves yield..." rows={2} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none resize-none text-gray-900 bg-white placeholder-gray-400" />
               </div>
               <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center"><AlertTriangle className="w-4 h-4 mr-1 text-amber-500"/> Safety Warnings</label>
                  <textarea name="safetyWarnings" value={formData.safetyWarnings} onChange={handleChange} placeholder="Keep away from children..." rows={2} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none resize-none text-gray-900 bg-white placeholder-gray-400" />
               </div>
            </div>
            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <button disabled={isSubmitting} type="submit" className="bg-emerald-900 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-emerald-950 transition flex items-center disabled:opacity-75">
                {isSubmitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin"/> Processing...</> : 'Publish Product'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* PRODUCTS LIST */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-6">Your Listed Products</h2>
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>
        ) : products.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center shadow-sm">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4"><Store className="w-8 h-8" /></div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No products yet</h3>
            <p className="text-gray-500 mb-6">You haven't added any products to your catalog yet.</p>
            <button 
              onClick={() => isVerified && setIsAddingMode(true)} 
              disabled={!isVerified}
              className={`font-bold transition-colors ${isVerified ? 'text-emerald-600 hover:underline' : 'text-gray-400 cursor-not-allowed'}`}
            >
              Add your first product
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p: any) => (
              <motion.div key={p._id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 group">
                <div className="h-48 bg-gray-100 relative">
                  {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon className="w-10 h-10" /></div>}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full font-bold text-emerald-900 shadow-sm flex items-center"><IndianRupee className="w-4 h-4 mr-0.5" /> {p.price}</div>
                </div>
                <div className="p-5">
                  <h3 className="font-black text-lg text-gray-900 mb-1">{p.name}</h3>
                  <div className="text-sm font-medium text-gray-500 flex items-center mb-4"><MapPin className="w-3.5 h-3.5 mr-1" /> {p.location?.district || 'Unknown'}, {p.location?.state || 'Unknown'}</div>
                  <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-4">
                     <span className="text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50 px-2 py-1 rounded">ID: {p._id.slice(-6)}</span>
                     <button onClick={() => handleDelete(p._id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}