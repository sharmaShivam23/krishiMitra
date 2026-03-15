'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Landmark, Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminSchemesManager() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | '', message: string }>({ type: '', message: '' });

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'Financial Support',
    state: 'All India',
    benefits: '',
    eligibilityText: '', 
    deadline: 'Ongoing',
    link: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    // Convert bullet points/newlines into an array of strings
    const eligibilityArray = formData.eligibilityText
      .split('\n')
      .map(item => item.trim())
      .filter(item => item.length > 0);

    const payload = {
      name: formData.name,
      category: formData.category,
      state: formData.state,
      benefits: formData.benefits,
      eligibility: eligibilityArray,
      deadline: formData.deadline,
      link: formData.link
    };

    try {
      const res = await fetch('/api/admin/schemes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Failed to upload scheme');

      setStatus({ type: 'success', message: 'Scheme successfully published to the database!' });
      
      // Reset form
      setFormData({
        name: '', category: 'Financial Support', state: 'All India', 
        benefits: '', eligibilityText: '', deadline: 'Ongoing', link: ''
      });

    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
      
      <div className="mb-8">
        <h1 className="text-3xl font-black text-emerald-950 flex items-center">
          <Landmark className="w-8 h-8 mr-3 text-emerald-600" />
          Government Schemes Manager
        </h1>
        <p className="text-stone-500 font-medium mt-2">Add new schemes to keep the farmer database updated.</p>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-stone-200 p-8">
        
        {status.message && (
          <div className={`p-4 rounded-xl mb-6 flex items-center font-bold text-sm ${
            status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Scheme Name *</label>
              <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-stone-900 placeholder:text-stone-400" placeholder="e.g. PM-Kisan Samman Nidhi" />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Category *</label>
              <select name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-stone-900">
                <option>Financial Support</option>
                <option>Insurance</option>
                <option>Credit & Loans</option>
                <option>Equipment Subsidy</option>
              </select>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Applicable State *</label>
              <input required type="text" name="state" value={formData.state} onChange={handleChange} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-stone-900 placeholder:text-stone-400" placeholder="e.g. All India, Punjab, Maharashtra" />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Deadline</label>
              <input type="text" name="deadline" value={formData.deadline} onChange={handleChange} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-stone-900 placeholder:text-stone-400" placeholder="e.g. Ongoing, 31-Dec-2024" />
            </div>
          </div>

          {/* Benefits */}
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-2">Core Benefits *</label>
            <textarea required name="benefits" rows={3} value={formData.benefits} onChange={handleChange} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium resize-none text-stone-900 placeholder:text-stone-400" placeholder="Explain the exact financial or material benefits..." />
          </div>

          {/* Eligibility */}
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-1">Eligibility Criteria</label>
            <p className="text-xs text-stone-400 font-medium mb-2">Put each requirement on a new line.</p>
            <textarea name="eligibilityText" rows={4} value={formData.eligibilityText} onChange={handleChange} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium resize-none text-stone-900 placeholder:text-stone-400" placeholder="Must own less than 2 hectares of land&#10;Must have a valid Aadhaar card..." />
          </div>

          {/* Official Link */}
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-2">Official Portal Link</label>
            <input type="url" name="link" value={formData.link} onChange={handleChange} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-stone-900 placeholder:text-stone-400" placeholder="https://..." />
          </div>

          <button disabled={loading} type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center transition-all disabled:opacity-50">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Upload className="w-5 h-5 mr-2" /> Publish Scheme</>}
          </button>
        </form>
      </div>

    </motion.div>
  );
}