



'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import {
  Sprout, MapPin, CloudSun, Loader2, ArrowRight, Target,
  AlertCircle, Droplets, Calendar, TrendingUp, Sparkles, Map,
  CheckCircle2, Database, ChevronDown, ExternalLink
} from 'lucide-react';
import { translateDBText } from '@/utils/dbTranslator';
import { getAiLanguage } from '@/lib/localeToLanguage';
import Link from 'next/link';

/* ======================================================
   TYPES & MAPPINGS
====================================================== */

interface Crop {
  _id: string;
  name: string;
  localName?: string;
  imageUrl?: string;
  season?: string;
  harvestTimeDays?: number;
  soilType?: string[];
  waterRequirements?: string;
  estimatedYield?: string;
}

interface IntelligenceResult {
  crop: Crop;
  aiAdvice: string;
}

interface RegionSuggestion {
  id: number;
  name: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
}





const weatherCodeMap: Record<number, string> = {
  0: 'Clear',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Foggy',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  80: 'Rain showers',
  81: 'Rain showers',
  82: 'Heavy showers',
  95: 'Thunderstorm'
};



export default function CropIntelligence() {
  const t = useTranslations('CropIntelligence');
  const locale = useLocale();


  const initialLang = getAiLanguage(locale);

  const [availableCrops, setAvailableCrops] = useState<Crop[]>([]);
  const [isLoadingCrops, setIsLoadingCrops] = useState(true);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<IntelligenceResult | null>(null);

  const [formData, setFormData] = useState({
    crop: '',
    location: '',
    stateRegion: '',
    weather: '',
  });

  const [isCropDropdownOpen, setIsCropDropdownOpen] = useState(false);
  const cropDropdownRef = useRef<HTMLDivElement>(null);

  const [regionSuggestions, setRegionSuggestions] = useState<any[]>([]);
  const [isSearchingRegion, setIsSearchingRegion] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  const [isAutoFillingRegionData, setIsAutoFillingRegionData] = useState(false);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
  const [weatherCoords, setWeatherCoords] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    async function fetchCrops() {
      try {
        const res = await fetch('/api/crops');
        if (!res.ok) throw new Error('Failed to fetch crops');
        const data = await res.json();
        if (data.success && data.crops) setAvailableCrops(data.crops);
      } catch (err) {
        setError('Unable to load crop database. Please check your connection.');
      } finally {
        setIsLoadingCrops(false);
      }
    }
    fetchCrops();
  }, []);

  useEffect(() => {
    if (formData.location.trim().length < 2 || !showSuggestions) {
      setRegionSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setIsSearchingRegion(true);
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${formData.location}&count=5&language=en&format=json`);
        const data = await res.json();
        setRegionSuggestions((data.results || []) as RegionSuggestion[]);
      } catch (err) { console.error("Geocoding error:", err); } 
      finally { setIsSearchingRegion(false); }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [formData.location, showSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (cropDropdownRef.current && !cropDropdownRef.current.contains(event.target as Node)) {
        setIsCropDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const autoFillRegionDetails = async (
    latitude?: number,
    longitude?: number
  ) => {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') return;
    setWeatherCoords({ lat: latitude, lon: longitude });
    setIsFetchingWeather(true);
    try {
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`
      );
      const weatherData = await weatherRes.json();
      const current = weatherData?.current;
      if (!current) return;
      const condition = weatherCodeMap[current.weather_code as number] || 'Weather update available';
      const temp = typeof current.temperature_2m === 'number' ? `${Math.round(current.temperature_2m)}°C` : '';
      const humidity = typeof current.relative_humidity_2m === 'number' ? `Humidity ${current.relative_humidity_2m}%` : '';
      const wind = typeof current.wind_speed_10m === 'number' ? `Wind ${Math.round(current.wind_speed_10m)} km/h` : '';
      const weatherSummary = [condition, temp, humidity, wind].filter(Boolean).join(', ');
      setFormData(prev => ({ ...prev, weather: weatherSummary }));
    } catch (err) {
      console.error('Weather auto-fill failed:', err);
    } finally {
      setIsFetchingWeather(false);
    }
  };

  const refreshWeather = async () => {
    if (!weatherCoords) return;
    await autoFillRegionDetails(weatherCoords.lat, weatherCoords.lon);
  };

  const handleRegionSelect = async (city: RegionSuggestion) => {
    setIsAutoFillingRegionData(true);
    setFormData(prev => ({
      ...prev,
      location: `${city.name}, ${city.admin1 ? city.admin1 + ', ' : ''}${city.country}`,
      stateRegion: city.admin1 || '',
      weather: '',
    }));
    setShowSuggestions(false);
    await autoFillRegionDetails(city.latitude, city.longitude);
    setIsAutoFillingRegionData(false);
  };

  // Auto-fill region + weather from the user's DB profile on mount
  useEffect(() => {
    const autoFillFromDB = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        if (!data.success || !data.user) return;
        const { state, district } = data.user;
        if (!state) return;

        const locationLabel = district ? `${district}, ${state}, India` : `${state}, India`;
        setFormData(prev => ({
          ...prev,
          location: locationLabel,
          stateRegion: state,
        }));

        setIsAutoFillingRegionData(true);
        try {
          const geoRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationLabel)}&count=1&language=en&format=json`
          );
          const geoData = await geoRes.json();
          const first = geoData?.results?.[0] as RegionSuggestion | undefined;
          await autoFillRegionDetails(first?.latitude, first?.longitude);
        } catch (err) {
          console.error('Geo lookup failed:', err);
        } finally {
          setIsAutoFillingRegionData(false);
        }
      } catch (err) {
        console.error('Profile fetch failed:', err);
      }
    };
    void autoFillFromDB();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCropSelect = (cropName: string) => {
    setFormData(prev => ({ ...prev, crop: cropName }));
    setIsCropDropdownOpen(false);
  };



  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (e.target.name === 'location') setShowSuggestions(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.crop) return setError('Please select a target crop from the database.');

    setIsAnalyzing(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/crops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'intelligence', language: initialLang, ...formData })
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Server failed to generate intelligence');

      setResult({ crop: data.crop, aiAdvice: data.aiAdvice });
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderAdvice = (text: string) => {
    return text
      .split('\n')
      .filter(line => line.trim())
      .map((line, i) => (
        <motion.div 
          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} key={i} 
          className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-50 flex items-start gap-4"
        >
          <div className="bg-emerald-100 p-2 rounded-full shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-gray-700 font-medium leading-relaxed">
            {line.replace(/^[-•*]\s*/, '').trim()}
          </p>
        </motion.div>
      ));
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50/50 py-8 px-1 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-350 mx-auto">
        
        {/* HEADER */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200/60 pb-6">
          <div className="flex items-center gap-4">
            <div className="bg-cover to-teal-600 p-3 rounded-xl shadow-lg shadow-emerald-500/20">
              <img src="/favicon.ico" className='h-16 w-16 bg-cover' alt="" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('title')}</h1>
              <p className="text-gray-500 text-sm mt-1">{t('subtitle')}</p>
            </div>
          </div>
          {result && (
            <button onClick={() => setResult(null)} className="text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-lg transition-all shadow-sm flex items-center gap-2">
              <Database className="w-4 h-4" /> {t('viewDirectory')}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ================= LEFT FORM ================= */}
          <div className="lg:col-span-4 bg-white rounded-2xl p-6 shadow-sm border border-gray-200/60 lg:sticky lg:top-8">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center">
              <Map className="w-4 h-4 mr-2" /> {t('formTitle')}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Target Crop Dropdown */}
              <div ref={cropDropdownRef} className="relative">
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">{t('targetCrop')} <span className="text-red-500">*</span></label>
                <div onClick={() => setIsCropDropdownOpen(!isCropDropdownOpen)} className={`w-full flex items-center justify-between px-4 py-3 bg-white border cursor-pointer rounded-xl transition-all ${isCropDropdownOpen ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-gray-200 hover:border-gray-300'}`}>
  <div className="flex items-center gap-3">
    <Target className="h-4 w-4 text-gray-400" />
    <span className={formData.crop ? "text-gray-900 font-medium text-sm" : "text-gray-400 text-sm"}>
      {formData.crop ? translateDBText(formData.crop, locale) : t('selectCrop')}
    </span>
  </div>
  <ChevronDown className="w-4 h-4 text-gray-400" />
</div>

                <AnimatePresence>
                  {isCropDropdownOpen && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute top-full mt-2 left-0 right-0 bg-white border border-gray-200 shadow-xl rounded-xl z-50 max-h-60 overflow-y-auto custom-scrollbar">
                      {availableCrops.map((c) => (
                        <div key={c._id} onClick={() => handleCropSelect(c.name)} className="px-4 py-3 text-sm cursor-pointer hover:bg-emerald-50 text-gray-700 flex justify-between items-center border-b border-gray-50 last:border-0">
                          {/* <span className="font-medium">{c.name} {c.localName && <span className="text-gray-400 font-normal ml-1">({c.localName})</span>}</span> */}
                          <span className="font-medium">
  {/* 🌟 FIX: Added translateDBText here! */}
  {translateDBText(c.name, locale)} 
  {c.localName && <span className="text-gray-400 font-normal ml-1">({c.localName})</span>}
</span>
                          {formData.crop === c.name && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Region Input */}
              <div ref={suggestionRef} className="relative">
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">{t('region')} <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MapPin className="h-4 w-4 text-gray-400" />
                  </div>
                  <input required type="text" name="location" placeholder={t('regionPlaceholder')} value={formData.location} onChange={handleInputChange} autoComplete="off" className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-medium" />
                  {isSearchingRegion && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {showSuggestions && regionSuggestions.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 shadow-xl rounded-xl z-40 overflow-hidden divide-y divide-gray-100">
                      {regionSuggestions.map((city) => (
                        <div key={city.id} onClick={() => handleRegionSelect(city)} className="px-4 py-2.5 hover:bg-emerald-50 cursor-pointer flex flex-col">
                          <span className="font-medium text-gray-900 text-sm">{city.name}</span>
                          <span className="text-xs text-gray-500">{city.admin1 ? `${city.admin1}, ` : ''}{city.country}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Weather — auto-fetched display */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CloudSun className="w-3.5 h-3.5 text-sky-500" />
                    {t('weather')}
                  </span>
                  {weatherCoords && (
                    <button
                      type="button"
                      onClick={refreshWeather}
                      disabled={isFetchingWeather}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 disabled:opacity-50"
                    >
                      <Loader2 className={`w-3 h-3 ${isFetchingWeather ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                  )}
                </label>

                {isFetchingWeather ? (
                  <div className="w-full py-3 px-4 bg-sky-50 border border-sky-200 rounded-xl flex items-center gap-3 text-sky-700">
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span className="text-sm font-semibold">Fetching live weather...</span>
                  </div>
                ) : formData.weather ? (
                  <div className="w-full py-3 px-4 bg-sky-50 border border-sky-200 rounded-xl flex items-center gap-3">
                    <CloudSun className="w-5 h-5 text-sky-500 shrink-0" />
                    <span className="text-sm font-semibold text-sky-900">{formData.weather}</span>
                  </div>
                ) : (
                  <div className="w-full py-3 px-4 bg-gray-50 border border-dashed border-gray-300 rounded-xl flex items-center gap-3 text-gray-400">
                    <CloudSun className="w-4 h-4 shrink-0" />
                    <span className="text-sm font-medium">Select a region above to auto-fetch weather</span>
                  </div>
                )}
              </div>



            


              {/* ─── Lifecycle CTA ─── */}
              {formData.crop && (
                <Link
                  href={`/${locale}/dashboard/crop-lifecycle`}
                  className="group w-full mt-1 flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white px-5 py-4 rounded-xl shadow-lg shadow-emerald-900/20 transition-all"
                >
                  <div className="bg-white/20 p-2 rounded-lg shrink-0">
                    <Sprout className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-black leading-tight">Track {formData.crop}'s Lifecycle</p>
                    <p className="text-emerald-200 text-xs font-medium mt-0.5">Get a day-by-day AI farming plan →</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-emerald-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
                </Link>
              )}

              {!formData.crop && (
                <Link
                  href={`/${locale}/dashboard/crop-lifecycle`}
                  className="group w-full mt-1 flex items-center gap-3 border-2 border-dashed border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 text-emerald-700 px-5 py-4 rounded-xl transition-all"
                >
                  <Sprout className="w-5 h-5 shrink-0" />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold">Start Crop Lifecycle Tracker</p>
                    <p className="text-emerald-500 text-xs mt-0.5">AI day-by-day farming schedule</p>
                  </div>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
                </Link>
              )}

              <button disabled={isAnalyzing} className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3.5 rounded-xl flex justify-center items-center transition-all shadow-md active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed">
                {isAnalyzing ? <><Loader2 className="animate-spin w-4 h-4 mr-2" /> {t('analyzing')}</> : <>{t('runAnalysis')} <ArrowRight className="w-4 h-4 ml-2" /></>}
              </button>
            </form>
          </div>

        
          <div className="lg:col-span-8 h-full min-h-150">
            <AnimatePresence mode="wait">

            
              {!result && !isAnalyzing && !error && (
                <motion.div key="db-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col bg-white rounded-2xl p-6 shadow-sm border border-gray-200/60">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center">
                      <Database className="w-5 h-5 mr-2 text-emerald-600" />
                      {t('directoryTitle')}
                    </h3>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200/50">
                      {availableCrops.length} {t('registered')}
                    </span>
                  </div>

                  {isLoadingCrops ? (
                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 min-h-100">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
                      <p className="text-gray-500 font-medium text-sm">{t('loadingDb')}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-150 overflow-y-auto custom-scrollbar pr-2 pb-4">
                      {availableCrops.map((crop) => (
                        <div key={crop._id} onClick={() => setFormData({...formData, crop: crop.name})} className="bg-gray-50 p-5 rounded-xl border border-gray-200/60 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group flex flex-col h-full relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-bold text-gray-900 text-lg group-hover:text-emerald-700 transition-colors leading-tight">
                                {translateDBText(crop.name, locale)}
                              </h4>
                              {crop.localName && <p className="text-xs font-semibold text-gray-400 mt-0.5">{crop.localName}</p>}
                            </div>
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center group-hover:bg-emerald-100 transition-colors shrink-0 shadow-sm">
                              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600" />
                            </div>
                          </div>

                          <div className="space-y-2.5 mb-4 flex-1">
                            {crop.harvestTimeDays && (
                              <div className="flex items-center text-sm font-medium text-gray-600">
                                <Calendar className="w-4 h-4 mr-2 text-amber-500" /> {crop.harvestTimeDays} {t('cycle')}
                              </div>
                            )}
                            {crop.estimatedYield && (
                              <div className="flex items-center text-sm font-medium text-gray-600">
                                <TrendingUp className="w-4 h-4 mr-2 text-emerald-500" /> {crop.estimatedYield}
                              </div>
                            )}
                            {crop.waterRequirements && (
                              <div className="flex items-center text-sm font-medium text-gray-600">
                                <Droplets className="w-4 h-4 mr-2 text-blue-500" /> {crop.waterRequirements}
                              </div>
                            )}
                          </div>

                          {crop.soilType && crop.soilType.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-auto pt-4 border-t border-gray-200/60">
                              {crop.soilType.slice(0, 3).map((soil, i) => (
                                <span key={i} className="text-[10px] font-bold px-2 py-1 bg-white border border-gray-200 text-gray-500 rounded-md">
                                  {soil}
                                </span>
                              ))}
                              {crop.soilType.length > 3 && <span className="text-[10px] font-bold px-2 py-1 text-gray-400">+{crop.soilType.length - 3}</span>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

           
              {isAnalyzing && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full min-h-150 flex flex-col justify-center items-center bg-gray-900 text-white rounded-2xl p-8 text-center relative overflow-hidden shadow-2xl">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                  <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="bg-emerald-500/20 p-6 rounded-full backdrop-blur-md mb-6 relative z-10 border border-emerald-500/30">
                    <Loader2 className="w-12 h-12 animate-spin text-emerald-400" />
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-2 relative z-10">{t('loadingAiTitle')}</h3>
                  <p className="text-gray-400 font-medium max-w-sm relative z-10 text-sm">
                    {t('loadingAiDesc', { crop: formData.crop })}
                  </p>
                </motion.div>
              )}

              {error && (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full min-h-150 flex flex-col justify-center items-center bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
                  <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                  </div>
                  <h3 className="text-lg font-bold text-red-900 mb-1">{t('errorTitle')}</h3>
                  <p className="text-red-700 font-medium text-sm">{error}</p>
                </motion.div>
              )}

        
              {result && (
                <motion.div key="result" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  
                  
                  <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-200/60 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-emerald-50 text-emerald-700 font-bold text-xs px-4 py-2 rounded-bl-xl flex items-center border-b border-l border-emerald-100">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> {t('dbMatch')}
                    </div>

                    <h3 className="text-2xl font-black text-gray-900 mb-1">{result.crop.name}</h3>
                    {result.crop.localName && (
                       <p className="text-gray-400 font-semibold text-sm mb-6">{t('localName')}: {result.crop.localName}</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      {result.crop.harvestTimeDays && (
                        <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100 flex flex-col justify-center">
                          <div className="flex items-center text-amber-600 mb-1.5">
                            <Calendar className="w-4 h-4 mr-1.5" /> <span className="text-xs font-bold uppercase tracking-wider">{t('cycle')}</span>
                          </div>
                          <span className="text-lg font-black text-amber-900">{result.crop.harvestTimeDays} Days</span>
                        </div>
                      )}

                      {result.crop.estimatedYield && (
                        <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100 flex flex-col justify-center">
                          <div className="flex items-center text-emerald-600 mb-1.5">
                            <TrendingUp className="w-4 h-4 mr-1.5" /> <span className="text-xs font-bold uppercase tracking-wider">{t('estYield')}</span>
                          </div>
                          <span className="text-lg font-black text-emerald-900">{result.crop.estimatedYield}</span>
                        </div>
                      )}

                      {result.crop.waterRequirements && (
                        <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 flex flex-col justify-center">
                          <div className="flex items-center text-blue-600 mb-1.5">
                            <Droplets className="w-4 h-4 mr-1.5" /> <span className="text-xs font-bold uppercase tracking-wider">{t('waterNeed')}</span>
                          </div>
                          <span className="text-sm font-black text-blue-900 leading-tight">{result.crop.waterRequirements}</span>
                        </div>
                      )}
                    </div>

                    {result.crop.soilType && result.crop.soilType.length > 0 && (
                      <div className="pt-5 border-t border-gray-100">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t('compatibleSoil')}</p>
                        <div className="flex flex-wrap gap-2">
                          {result.crop.soilType.map((soil, i) => (
                            <span key={i} className="bg-gray-50 text-gray-600 border border-gray-200 text-xs font-bold px-3 py-1.5 rounded-lg">
                              {soil}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* AI Advice Section */}
                  <div className="bg-linear-to-br from-emerald-50 to-teal-50/50 rounded-2xl p-6 md:p-8 border border-emerald-100 shadow-inner">
                    <h4 className="font-bold text-emerald-900 mb-6 flex items-center text-lg">
                      <Sparkles className="w-5 h-5 mr-2 text-emerald-600" />
                      {t('aiPlanTitle')}
                    </h4>
                    
                    <div className="space-y-3">
                      {renderAdvice(result.aiAdvice)}
                    </div>
                  </div>

                  {/* ─── Lifecycle CTA Banner (Result Panel) ─── */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 p-6 shadow-xl"
                  >
                    {/* decorative blobs */}
                    <div className="absolute -top-8 -right-8 w-32 h-32 bg-emerald-400/10 rounded-full pointer-events-none" />
                    <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-teal-400/10 rounded-full pointer-events-none" />

                    <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                      <div className="bg-emerald-400/20 backdrop-blur-sm p-3 rounded-xl border border-emerald-400/20 shrink-0">
                        <Sprout className="w-8 h-8 text-emerald-300" />
                      </div>

                      <div className="flex-1">
                        <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Next Step</p>
                        <h3 className="text-xl font-black text-white leading-tight">
                          Start tracking <span className="text-emerald-300">{result.crop.name}</span>
                        </h3>
                        <p className="text-emerald-300/80 text-sm font-medium mt-1">
                          Let AI build a day-by-day schedule for your field
                          {formData.location ? ` in ${formData.stateRegion || formData.location}` : ''}.
                        </p>
                      </div>

                      <Link
                        href={`/${locale}/dashboard/crop-lifecycle`}
                        className="group shrink-0 flex items-center gap-2.5 bg-emerald-400 hover:bg-emerald-300 active:scale-95 text-emerald-950 font-black px-5 py-3 rounded-xl transition-all shadow-lg shadow-emerald-900/40 whitespace-nowrap"
                      >
                        <Sprout className="w-4 h-4" />
                        Open Lifecycle Tracker
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </motion.div>

                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}