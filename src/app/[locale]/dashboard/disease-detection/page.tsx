'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { 
  Upload, ShieldCheck, AlertTriangle, 
  Loader2, CheckCircle, Leaf, Activity, X, Info, Languages, ChevronDown
} from 'lucide-react';

// 🚀 UPDATED INTERFACE to match new AI response
interface ScanResult {
  disease: string;
  confidence: number;
  harm: string;
  solutions: string[];
}

const LANGUAGES = [
  { code: 'English', name: 'English' },
  { code: 'Hindi', name: 'हिन्दी (Hindi)' },
  { code: 'Punjabi', name: 'ਪੰਜਾਬੀ (Punjabi)' },
  { code: 'Marathi', name: 'मराठी (Marathi)' },
  { code: 'Gujarati', name: 'ગુજરાતી (Gujarati)' },
  { code: 'Telugu', name: 'తెలుగు (Telugu)' },
  { code: 'Tamil', name: 'தமிழ் (Tamil)' },
];

export default function DiseaseDetection() {
  const t = useTranslations('DiseaseDetection');
  const locale = useLocale();

  // Set default language based on Next.js locale
  const defaultLangMap: Record<string, string> = { en: 'English', hi: 'Hindi', pa: 'Punjabi' };
  const initialLang = defaultLangMap[locale] || 'English';

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState(initialLang); // 🌟 Language State
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120 } }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      setSelectedFile(file);
      setResult(null);
      setError('');
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleScan = async () => {
    if (!selectedFile) return;

    if (selectedFile.size > 5 * 1024 * 1024) { 
      setError(t('errorSize'));
      return;
    }

    setIsScanning(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

      if (!uploadPreset || !cloudName) {
        throw new Error("Cloudinary environment variables are missing.");
      }

      formData.append('upload_preset', uploadPreset);

      const cloudinaryRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const cloudinaryData = await cloudinaryRes.json();

      if (!cloudinaryRes.ok) {
        throw new Error(cloudinaryData.error?.message || 'Failed to upload image to Cloudinary');
      }

      const imageUrl = cloudinaryData.secure_url;

      const res = await fetch('/api/disease-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // 🌟 Passing the selected language to the backend
        body: JSON.stringify({ imageUrl, language: selectedLanguage }), 
      });

      const rawText = await res.text(); 
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (parseError) {
        console.error(`🚨 Server returned HTML:\n`, rawText);
        throw new Error(`Server Error (${res.status}). Check your console for details.`);
      }

      if (!res.ok) throw new Error(data.error || 'AI Scan failed');
      
      setResult(data.analysis);

    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-5xl mx-auto">
      
      <motion.div variants={item} className="mb-8 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-black text-agri-900 tracking-tight flex items-center justify-center md:justify-start">
          <ShieldCheck className="w-8 h-8 mr-3 text-agri-600" />
          {t('title')}
        </h1>
        <p className="text-gray-500 mt-2 font-medium">
          {t('subtitle')}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Upload & Scanner Interface */}
        <motion.div variants={item} className="bg-white p-6 rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100 flex flex-col min-h-[500px]">
          <h2 className="text-lg font-bold text-agri-900 mb-4 flex items-center">
            <Upload className="w-5 h-5 mr-2 text-agri-400" /> {t('imageInputTitle')}
          </h2>

          <div className="flex-1 relative w-full min-h-[250px] mb-4 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden flex flex-col items-center justify-center transition-colors hover:bg-gray-100 group">
            
            {!selectedImage && (
              <div className="text-center p-6 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                  <Leaf className="w-8 h-8 text-agri-400" />
                </div>
                <p className="text-agri-900 font-bold">{t('uploadPrompt')}</p>
                <p className="text-sm text-gray-400 mt-1">{t('uploadSub')}</p>
              </div>
            )}

            {selectedImage && (
              <div className="absolute inset-0 w-full h-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedImage} alt="Crop Leaf" className="w-full h-full object-cover" />
                
                {!isScanning && !result && (
                  <button onClick={clearImage} className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-md transition-colors z-20">
                    <X className="w-5 h-5" />
                  </button>
                )}

                {isScanning && (
                  <>
                    <div className="absolute inset-0 bg-agri-900/50 backdrop-blur-[2px] z-10"></div>
                    <motion.div 
                      initial={{ top: '0%' }}
                      animate={{ top: '100%' }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      className="absolute left-0 w-full h-1 bg-agri-400 shadow-[0_0_20px_5px_rgba(52,211,153,0.8)] z-20"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-30">
                      <Activity className="w-12 h-12 text-agri-400 animate-pulse mb-3" />
                      <span className="bg-agri-900/80 text-agri-100 px-4 py-1.5 rounded-full font-bold text-sm backdrop-blur-md border border-agri-400/30 shadow-lg">
                        {t('uploadingStatus')}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}

            <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/jpeg, image/png" className="hidden" />
          </div>

          {/* 🌟 Language Selection Dropdown */}
          <div className="mb-2">
            <label className="text-sm font-bold text-gray-700 mb-1.5 block">{t('language')}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Languages className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                disabled={isScanning || !!result}
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-agri-500/20 outline-none text-sm font-bold cursor-pointer appearance-none disabled:opacity-50"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-3.5 pointer-events-none" />
            </div>
          </div>

          <button 
            onClick={handleScan}
            disabled={!selectedImage || isScanning || !!result}
            className="mt-4 w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-agri-900/20 text-lg font-bold text-white bg-agri-900 hover:bg-agri-800 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isScanning ? (
              <><Loader2 className="w-6 h-6 animate-spin mr-2" /> {t('btnAnalyzing')}</>
            ) : result ? (
              <><CheckCircle className="w-6 h-6 mr-2 text-agri-400" /> {t('btnComplete')}</>
            ) : (
              t('btnInitialize')
            )}
          </button>
        </motion.div>

        {/* 🚀 UPGRADED Results Panel */}
        <div className="h-full flex flex-col">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex-1 bg-agri-50 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center p-8 text-center min-h-[500px]"
              >
                <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <Activity className="w-10 h-10 text-gray-300" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-400">
                  {error ? t('systemNotice') : t('awaitingTelemetry')}
                </h3>
                <p className={`text-sm mt-2 max-w-xs ${error ? 'text-amber-600 font-bold' : 'text-gray-400'}`}>
                  {error || t('awaitingDesc')}
                </p>
              </motion.div>
            ) : (
              <motion.div 
                key="results"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="flex-1 bg-agri-900 rounded-3xl p-6 md:p-8 shadow-2xl shadow-agri-900/30 text-white flex flex-col relative overflow-hidden"
              >
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-agri-600 rounded-full filter blur-[70px] opacity-40"></div>

                <div className="relative z-10 flex-1">
                  
                  {/* Top Bar: Confidence & Status */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-agri-400/20 border border-agri-400/30 text-agri-400 text-xs font-bold uppercase tracking-wider">
                      <CheckCircle className="w-4 h-4" /> <span>{t('analysisComplete')}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-agri-100/60 font-medium uppercase tracking-widest block mb-0.5">{t('confidenceTitle')}</span>
                      <span className="text-lg font-bold text-agri-400">{(result.confidence * 100).toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* Disease Title */}
                  <h3 className="text-sm text-agri-100/60 font-medium uppercase tracking-widest mb-1">{t('detectedCondition')}</h3>
                  <div className="text-3xl font-black text-white mb-6 flex items-center leading-tight">
                    {result.disease.toLowerCase().includes('healthy') ? (
                      <CheckCircle className="w-8 h-8 mr-3 text-agri-400 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-8 h-8 mr-3 text-red-400 flex-shrink-0" />
                    )}
                    {result.disease}
                  </div>

                  {/* Threat Analysis Box */}
                  <div className={`border rounded-2xl p-4 md:p-5 backdrop-blur-sm mb-4 ${
                    result.disease.toLowerCase().includes('healthy')
                    ? 'bg-emerald-500/10 border-emerald-500/20' 
                    : 'bg-red-500/10 border-red-500/20'
                  }`}>
                    <h4 className={`text-sm font-bold uppercase tracking-widest mb-2 flex items-center ${
                      result.disease.toLowerCase().includes('healthy') ? 'text-emerald-300' : 'text-red-300'
                    }`}>
                      {result.disease.toLowerCase().includes('healthy') ? (
                        <><ShieldCheck className="w-4 h-4 mr-1.5" /> {t('cropStatus')}</>
                      ) : (
                        <><Info className="w-4 h-4 mr-1.5" /> {t('potentialHarm')}</>
                      )}
                    </h4>
                    <p className="text-agri-50 leading-relaxed font-medium text-sm md:text-base">
                      {result.harm}
                    </p>
                  </div>

                  {/* Solutions Array Box */}
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 md:p-5 backdrop-blur-sm">
                    <h4 className="text-sm text-blue-300 font-bold uppercase tracking-widest mb-3 flex items-center">
                      <Activity className="w-4 h-4 mr-1.5" /> {t('actionPlan')}
                    </h4>
                    <ul className="space-y-3">
                      {result.solutions.map((solution, idx) => (
                        <li key={idx} className="text-blue-50 text-sm md:text-base font-medium flex items-start">
                          <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 text-xs font-bold text-blue-300">
                            {idx + 1}
                          </div>
                          <span className="flex-1 leading-snug">{solution}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>
                
                <button onClick={clearImage} className="relative z-10 mt-6 w-full py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors border border-white/10 flex items-center justify-center">
                  {t('scanAnotherBtn')}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}