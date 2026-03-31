'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { 
  Tractor, Wrench, MapPin, IndianRupee, 
  FileText, Tag, ShieldCheck, Loader2, 
  AlertCircle, CheckCircle2, ArrowLeft, Settings
} from 'lucide-react';
import Link from 'next/link';
import CloudinaryImageUpload from '@/components/CloudinaryImageUpload';
import StateDistrictSelector from '@/components/StateDistrictSelector';

const CATEGORIES = ['Tractor', 'Harvester', 'Sprayer', 'Cultivator', 'Seeder', 'Other'];
const STATES = ['Uttar Pradesh', 'Punjab', 'Haryana', 'Maharashtra', 'Madhya Pradesh', 'Gujarat', 'Rajasthan'];

export default function PostListing() {
  const t = useTranslations('PostListing');
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    listingType: 'rent',
    title: '',
    description: '',
    category: 'Tractor',
    pricing: { rate: '', unit: 'per day' },
    equipment: { name: '', condition: 'Good' },
    serviceDetails: { jobType: '', estimatedCapacity: '' },
    location: { state: '', district: '', village: '' },
    images: [] as string[],
    imageUrl: '',
  });

  const handleTypeChange = (type: 'rent' | 'service') => {
    setFormData({ 
      ...formData, 
      listingType: type,
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
      if (!formData.title || !formData.pricing.rate || !formData.equipment.name || !formData.location.state || !formData.location.district) {
        throw new Error(t('errFillAll'));
      }

      const payload = {
        ...formData,
        pricing: { ...formData.pricing, rate: Number(formData.pricing.rate) },
        images: formData.imageUrl ? [formData.imageUrl] : []
      };

      const res = await fetch('/api/listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const textData = await res.text();
      let data;
      try {
        data = JSON.parse(textData);
      } catch (err) {
        throw new Error(t('errApi'));
      }

      if (!res.ok || !data.success) {
        throw new Error(data.message || t('errFailed'));
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
        
        <div className="mb-8">
          <Link href="/dashboard/Services" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-emerald-600 transition-colors mb-4">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> {t('back')}
          </Link>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
            {t('title')}
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
            {t('subtitle')}
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/40 border border-gray-100 overflow-hidden"
        >
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
              <Tractor className="w-5 h-5" /> <span>{t('rentEquipment')}</span>
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
              <Wrench className="w-5 h-5" /> <span>{t('offerService')}</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-8">
            
            <AnimatePresence mode="wait">
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start text-sm font-bold">
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" /> {error}
                </motion.div>
              )}
              {success && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl flex items-start text-sm font-bold">
                  <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" /> {t('successMsg')}
                </motion.div>
              )}
            </AnimatePresence>

            <section className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">{t('basicDetails')}</h3>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">{t('listingTitle')}</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                  <input required name="title" value={formData.title} onChange={handleBasicChange} placeholder={formData.listingType === 'rent' ? t('titlePlaceholderRent') : t('titlePlaceholderService')} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all font-medium text-gray-900" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">{t('category')}</label>
                  <div className="relative">
                    <Tag className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <select required name="category" value={formData.category} onChange={handleBasicChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all font-bold text-gray-900 appearance-none cursor-pointer">
                      {CATEGORIES.map(c => <option key={c} value={c}>{t(`categories.${c}`)}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">{t('condition')}</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <select required value={formData.equipment.condition} onChange={(e) => handleNestedChange('equipment', 'condition', e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all font-bold text-gray-900 appearance-none cursor-pointer">
                      <option value="Excellent">{t('condExcellent')}</option>
                      <option value="Good">{t('condGood')}</option>
                      <option value="Fair">{t('condFair')}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">{t('description')}</label>
                <textarea required name="description" value={formData.description} onChange={handleBasicChange} rows={3} placeholder={t('descPlaceholder')} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all font-medium text-gray-900 resize-none" />
              </div>
            </section>

            {/* ─── Equipment Photo ─── */}
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                Equipment Photo
                <span className="text-xs font-normal text-gray-400">(optional but recommended)</span>
              </h3>
              <CloudinaryImageUpload
                value={formData.imageUrl}
                onChange={(url) => setFormData(prev => ({ ...prev, imageUrl: url }))}
                label="Upload a clear photo of your equipment"
              />
            </section>

            <section className="space-y-4">

              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">{t('technicalDetails')}</h3>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">{t('equipName')}</label>
                <div className="relative">
                  <Settings className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                  <input required value={formData.equipment.name} onChange={(e) => handleNestedChange('equipment', 'name', e.target.value)} placeholder={t('equipPlaceholder')} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all font-medium text-gray-900" />
                </div>
              </div>

              <AnimatePresence>
                {formData.listingType === 'service' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden">
                    <div className="pt-4">
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">{t('jobType')}</label>
                      <input required value={formData.serviceDetails.jobType} onChange={(e) => handleNestedChange('serviceDetails', 'jobType', e.target.value)} placeholder={t('jobPlaceholder')} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all font-medium text-gray-900" />
                    </div>
                    <div className="pt-4">
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">{t('estCapacity')}</label>
                      <input required value={formData.serviceDetails.estimatedCapacity} onChange={(e) => handleNestedChange('serviceDetails', 'estimatedCapacity', e.target.value)} placeholder={t('capPlaceholder')} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all font-medium text-gray-900" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">{t('pricingLocation')}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">{t('ratePrice')}</label>
                  <div className="flex">
                    <div className="relative flex-1">
                      <IndianRupee className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                      <input type="number" required value={formData.pricing.rate} onChange={(e) => handleNestedChange('pricing', 'rate', e.target.value)} placeholder="0.00" className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-l-xl focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all font-bold text-gray-900" />
                    </div>
                    <select value={formData.pricing.unit} onChange={(e) => handleNestedChange('pricing', 'unit', e.target.value)} className="bg-gray-100 border border-l-0 border-gray-200 rounded-r-xl px-4 py-3 font-bold text-gray-700 outline-none cursor-pointer">
                      <option value="per day">{t('perDay')}</option>
                      <option value="per hour">{t('perHour')}</option>
                      <option value="per acre">{t('perAcre')}</option>
                      <option value="per hectare">{t('perHectare')}</option>
                    </select>
                  </div>
                </div>

                <StateDistrictSelector
                  state={formData.location.state}
                  district={formData.location.district}
                  onStateChange={v => setFormData(prev => ({ ...prev, location: { ...prev.location, state: v, district: '' } }))}
                  onDistrictChange={v => setFormData(prev => ({ ...prev, location: { ...prev.location, district: v } }))}
                  autoFillFromDB
                  required
                />

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">{t('village')}</label>
                  <input value={formData.location.village} onChange={(e) => handleNestedChange('location', 'village', e.target.value)} placeholder={t('villagePlaceholder')} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all font-medium text-gray-900" />
                </div>
              </div>
            </section>

            <div className="pt-6 flex flex-col-reverse md:flex-row items-center justify-end gap-4 border-t border-gray-100">
              <Link href="/dashboard/Services" className="w-full md:w-auto px-6 py-3.5 font-bold text-gray-500 hover:text-gray-900 transition-colors text-center">
                {t('cancel')}
              </Link>
              <button 
                type="submit" disabled={loading || success}
                className={`w-full md:w-auto px-8 py-3.5 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 flex justify-center items-center ${
                  formData.listingType === 'rent' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'
                } disabled:opacity-70 disabled:cursor-not-allowed`}
              >
                {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> {t('publishing')}</> : t('publishListing')}
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </div>
  );
}