'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Tractor, Wrench, MapPin, IndianRupee, 
  FileText, Tag, ShieldCheck, Loader2, 
  AlertCircle, CheckCircle2, ArrowLeft, Settings
} from 'lucide-react';
import Link from 'next/link';

const CATEGORIES = ['Tractor', 'Harvester', 'Sprayer', 'Cultivator', 'Seeder', 'Other'];
const STATES = ['Uttar Pradesh', 'Punjab', 'Haryana', 'Maharashtra', 'Madhya Pradesh', 'Gujarat', 'Rajasthan'];

export default function PostListing() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    listingType: 'rent', // 'rent' or 'service'
    title: '',
    description: '',
    category: 'Tractor',
    pricing: { rate: '', unit: 'per day' },
    equipment: { name: '', condition: 'Good' },
    serviceDetails: { jobType: '', estimatedCapacity: '' },
    location: { state: '', district: '', village: '' },
    images: [] // Empty array for now, can add image upload later
  });

  // Handlers
  const handleTypeChange = (type: 'rent' | 'service') => {
    setFormData({ 
      ...formData, 
      listingType: type,
      // Automatically adjust the default pricing unit based on the type
      pricing: { ...formData.pricing, unit: type === 'rent' ? 'per day' : 'per acre' }
    });
  };

  const handleBasicChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNestedChange = (section: 'pricing' | 'equipment' | 'serviceDetails' | 'location', field: string, value: string) => {
    setFormData({
      ...formData,
      [section]: { ...formData[section], [field]: value }
    });
  };

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Basic validation
      if (!formData.title || !formData.pricing.rate || !formData.equipment.name || !formData.location.state || !formData.location.district) {
        throw new Error('Please fill in all required fields.');
      }

      const payload = {
        ...formData,
        pricing: { ...formData.pricing, rate: Number(formData.pricing.rate) }
      };

      // 🛠️ THE FIX: Ensure this matches your exact backend folder name (listing vs listings)
      const res = await fetch('/api/listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // 🛠️ BETTER ERROR HANDLING: Read as text first to prevent the "<!DOCTYPE" crash
      const textData = await res.text();
      let data;
      try {
        data = JSON.parse(textData);
      } catch (err) {
        console.error("HTML Error Response:", textData);
        throw new Error(`API Route not found or Server crashed. Check terminal.`);
      }

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to create listing.');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/Services');
        router.refresh();
      }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-1 sm:px-6 lg:px-8 font-sans pb-24">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/Services" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-emerald-600 transition-colors mb-4">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Exchange
          </Link>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
            Create a New Listing
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
            Offer your equipment for rent or provide agricultural services to other farmers.
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/40 border border-gray-100 overflow-hidden"
        >
          {/* TYPE TOGGLE */}
          <div className="flex border-b border-gray-100">
            <button
              type="button"
              onClick={() => handleTypeChange('rent')}
              className={`flex-1 py-5 text-center font-bold text-sm sm:text-base flex justify-center items-center space-x-2 transition-colors ${
                formData.listingType === 'rent' 
                  ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-500' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Tractor className="w-5 h-5" /> <span>Rent Equipment</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('service')}
              className={`flex-1 py-5 text-center font-bold text-sm sm:text-base flex justify-center items-center space-x-2 transition-colors ${
                formData.listingType === 'service' 
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Wrench className="w-5 h-5" /> <span>Offer a Service</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-8">
            
            {/* Notifications */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start text-sm font-bold">
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" /> {error}
                </motion.div>
              )}
              {success && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl flex items-start text-sm font-bold">
                  <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" /> Listing deployed successfully! Redirecting...
                </motion.div>
              )}
            </AnimatePresence>

            {/* 1. BASIC DETAILS */}
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Basic Details</h3>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Listing Title *</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                  <input required name="title" value={formData.title} onChange={handleBasicChange} placeholder={formData.listingType === 'rent' ? "e.g. Mahindra 575 DI for Rent" : "e.g. Heavy Cultivator Ploughing Service"} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all font-medium text-gray-900" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Category *</label>
                  <div className="relative">
                    <Tag className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <select required name="category" value={formData.category} onChange={handleBasicChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all font-bold text-gray-900 appearance-none cursor-pointer">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Condition *</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <select required value={formData.equipment.condition} onChange={(e) => handleNestedChange('equipment', 'condition', e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all font-bold text-gray-900 appearance-none cursor-pointer">
                      <option value="Excellent">Excellent (New/Well Maintained)</option>
                      <option value="Good">Good (Working Perfectly)</option>
                      <option value="Fair">Fair (Needs Minor Fixes)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Description</label>
                <textarea required name="description" value={formData.description} onChange={handleBasicChange} rows={3} placeholder="Describe the equipment, features, rules, or what exactly your service includes..." className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all font-medium text-gray-900 resize-none" />
              </div>
            </section>

            {/* 2. SPECIFIC DETAILS */}
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Technical Details</h3>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Specific Equipment Name/Model *</label>
                <div className="relative">
                  <Settings className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                  <input required value={formData.equipment.name} onChange={(e) => handleNestedChange('equipment', 'name', e.target.value)} placeholder="e.g. John Deere 5310 55HP" className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all font-medium text-gray-900" />
                </div>
              </div>

              {/* Conditional Service Fields */}
              <AnimatePresence>
                {formData.listingType === 'service' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden">
                    <div className="pt-4">
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">Type of Job</label>
                      <input required value={formData.serviceDetails.jobType} onChange={(e) => handleNestedChange('serviceDetails', 'jobType', e.target.value)} placeholder="e.g. Ploughing, Sowing" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all font-medium text-gray-900" />
                    </div>
                    <div className="pt-4">
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">Estimated Capacity</label>
                      <input required value={formData.serviceDetails.estimatedCapacity} onChange={(e) => handleNestedChange('serviceDetails', 'estimatedCapacity', e.target.value)} placeholder="e.g. 10 acres per day" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all font-medium text-gray-900" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* 3. PRICING & LOCATION */}
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Pricing & Location</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Rate / Price *</label>
                  <div className="flex">
                    <div className="relative flex-1">
                      <IndianRupee className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                      <input type="number" required value={formData.pricing.rate} onChange={(e) => handleNestedChange('pricing', 'rate', e.target.value)} placeholder="0.00" className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-l-xl focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all font-bold text-gray-900" />
                    </div>
                    <select value={formData.pricing.unit} onChange={(e) => handleNestedChange('pricing', 'unit', e.target.value)} className="bg-gray-100 border border-l-0 border-gray-200 rounded-r-xl px-4 py-3 font-bold text-gray-700 outline-none cursor-pointer">
                      <option value="per day">per day</option>
                      <option value="per hour">per hour</option>
                      <option value="per acre">per acre</option>
                      <option value="per hectare">per hectare</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">State *</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <select required value={formData.location.state} onChange={(e) => handleNestedChange('location', 'state', e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all font-bold text-gray-900 appearance-none cursor-pointer">
                      <option value="" disabled>Select State</option>
                      {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">District *</label>
                  <input required value={formData.location.district} onChange={(e) => handleNestedChange('location', 'district', e.target.value)} placeholder="e.g. Meerut" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all font-medium text-gray-900" />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Village / Area (Optional)</label>
                  <input value={formData.location.village} onChange={(e) => handleNestedChange('location', 'village', e.target.value)} placeholder="e.g. Modinagar" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all font-medium text-gray-900" />
                </div>
              </div>
            </section>

            {/* Actions */}
            <div className="pt-6 flex flex-col-reverse md:flex-row items-center justify-end gap-4 border-t border-gray-100">
              <Link href="/dashboard/Services" className="w-full md:w-auto px-6 py-3.5 font-bold text-gray-500 hover:text-gray-900 transition-colors text-center">
                Cancel
              </Link>
              <button 
                type="submit" disabled={loading || success}
                className={`w-full md:w-auto px-8 py-3.5 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 flex justify-center items-center ${
                  formData.listingType === 'rent' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'
                } disabled:opacity-70 disabled:cursor-not-allowed`}
              >
                {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Publishing...</> : 'Publish Listing'}
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </div>
  );
}