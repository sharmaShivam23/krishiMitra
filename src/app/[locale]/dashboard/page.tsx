'use client';

import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { 
  CloudSun, Droplets, Wind, TrendingUp, 
  ShieldCheck, ArrowRight, MapPin, Activity,
  Loader2, Sun, Cloud, CloudRain, CloudLightning, Scale, IndianRupee, CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

/* ======================================================
    HELPERS & TYPES
====================================================== */

interface WeatherData {
  temp: string;
  condition: string;
  humidity: string;
  wind: string;
}

interface MandiAlert {
  commodity: string;
  market: string;
  modalPrice: number | string;
  minPrice: number | string;
  maxPrice: number | string;
}

export default function DashboardOverview() {
  const t = useTranslations('DashboardOverview');
  const locale = useLocale();

  // 🌟 NEW: State to hold the actual user's name (Fallback is 'Farmer'/'किसान')
  // const [userName, setUserName] = useState(t('defaultName') || 'Farmer'); 
  const [userName, setUserName] = useState('');
  
  const [locationName, setLocationName] = useState('Meerut, Uttar Pradesh');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherIcon, setWeatherIcon] = useState<React.ReactNode>(<CloudSun className="w-6 h-6 text-blue-200" />);
  const [mandiAlerts, setMandiAlerts] = useState<MandiAlert[]>([]);
  const [isLoadingMandi, setIsLoadingMandi] = useState(true);

  const getWeatherDetails = (code: number) => {
    if (code === 0) return { text: t('weather.conditions.clear'), icon: <Sun className="w-6 h-6 text-blue-200" /> };
    if (code >= 1 && code <= 3) return { text: t('weather.conditions.cloudy'), icon: <CloudSun className="w-6 h-6 text-blue-200" /> };
    if (code === 45 || code === 48) return { text: t('weather.conditions.foggy'), icon: <Cloud className="w-6 h-6 text-blue-200" /> };
    if (code >= 51 && code <= 65) return { text: t('weather.conditions.rain'), icon: <CloudRain className="w-6 h-6 text-blue-200" /> };
    if (code >= 80 && code <= 82) return { text: t('weather.conditions.heavyRain'), icon: <CloudRain className="w-6 h-6 text-blue-200" /> };
    if (code >= 95) return { text: t('weather.conditions.thunder'), icon: <CloudLightning className="w-6 h-6 text-blue-200" /> };
    return { text: t('weather.conditions.cloudy'), icon: <CloudSun className="w-6 h-6 text-blue-200" /> };
  };

  const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120 } }
  };

  // 🌟 NEW: Fetch User Data on Mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user?.name) {
            // Get just the first name for a friendlier greeting
            const firstName = data.user.name.split(' ')[0];
            setUserName(firstName);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user", error);
      }
    };
    fetchUser();
  }, []);

  // Weather Fetching
  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`);
        const data = await res.json();
        const details = getWeatherDetails(data.current.weather_code);
        
        setWeatherData({
          temp: `${Math.round(data.current.temperature_2m)}°C`,
          condition: details.text,
          humidity: `${data.current.relative_humidity_2m}%`,
          wind: `${Math.round(data.current.wind_speed_10m)} km/h`
        });
        setWeatherIcon(details.icon);

        const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
        const geoData = await geoRes.json();
        if (geoData.city || geoData.locality) {
          setLocationName(`${geoData.city || geoData.locality}, ${geoData.principalSubdivision}`);
        }
      } catch (error) { console.error("Weather failed", error); }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather(28.9845, 77.7064)
      );
    }
  }, [locale]); // Added locale to re-fetch translated city names if needed

  // Mandi Fetching
  useEffect(() => {
    const fetchMandi = async () => {
      try {
        const res = await fetch('/api/mandi');
        const data = await res.json();
        if (data.prices) setMandiAlerts(data.prices.slice(0, 3));
      } catch (error) { console.error("Mandi failed", error); }
      finally { setIsLoadingMandi(false); }
    };
    fetchMandi();
  }, []);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 md:space-y-8 overflow-x-hidden max-w-7xl mx-auto">
      
      {/* Header Section */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-end justify-between gap-3 md:gap-4">
        <div>
          <h1 className="text-3xl leading-tight md:text-4xl font-black text-emerald-900 tracking-tight">
            {/* 🌟 NEW: Dynamic user name injected here */}
            {t('welcome', { name: userName })}
          </h1>
          <p className="text-gray-600 mt-2 flex items-center font-semibold text-sm md:text-base leading-tight">
            <MapPin className="w-4 h-4 mr-1 text-emerald-600" />
            {locationName}
          </p>
        </div>
        <Link href={`/${locale}/dashboard/disease-detection`} className="hidden md:flex items-center space-x-2 bg-emerald-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-800 transition shadow-lg shadow-emerald-900/20 active:scale-95">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>{t('runScan')}</span>
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
        {/* Weather Card */}
        <motion.div variants={item} className="bg-linear-to-br from-blue-500 via-blue-600 to-blue-700 rounded-4xl p-6 md:p-7 text-white shadow-[0_18px_50px_-22px_rgba(37,99,235,0.85)] border border-blue-300/30">
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-blue-100">{t('weather.title')}</h3>
                {weatherIcon}
              </div>
              {weatherData ? (
                <>
                  <div className="text-[3.4rem] leading-none font-black tracking-tighter mb-2">{weatherData.temp}</div>
                  <div className="text-blue-100 font-medium mb-6">{weatherData.condition}</div>
                </>
              ) : (
                <div className="py-6 flex items-center text-blue-100">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" /> {t('weather.loading')}
                </div>
              )}
            </div>
            <div className="flex space-x-4 text-sm font-semibold bg-white/10 p-3.5 rounded-2xl backdrop-blur-md w-max border border-white/20 mt-auto shadow-inner shadow-white/10">
              <div className="flex items-center"><Droplets className="w-4 h-4 mr-1.5 text-blue-200"/> {weatherData?.humidity || '--%'}</div>
              <div className="flex items-center"><Wind className="w-4 h-4 mr-1.5 text-blue-200"/> {weatherData?.wind || '-- km/h'}</div>
            </div>
          </div>
        </motion.div>

        {/* Active Crop Status */}
        <motion.div variants={item} className="bg-white rounded-4xl p-6 md:p-7 border border-agri-100 shadow-[0_18px_45px_-28px_rgba(2,44,34,0.4)] col-span-1 md:col-span-2 flex flex-col justify-between overflow-hidden">
          <div className="relative z-10 flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl md:text-2xl leading-tight font-black text-emerald-900">{t('deployment.title')}</h3>
              <p className="text-sm md:text-base text-gray-600 font-semibold">{t('deployment.subtitle')}</p>
            </div>
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs md:text-sm font-black rounded-xl border border-emerald-200/70">
                {t('deployment.dayTracker', { current: 42, total: 120 })}
            </span>
          </div>
          
          <div className="relative z-10 flex items-center space-x-6 my-2">
            <div className="w-20 h-20 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center">
                <Activity className="w-10 h-10 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-[2rem] md:text-[2.15rem] leading-tight font-black text-emerald-900">{t('deployment.cropName')}</h2>
              <p className="text-emerald-600 font-black mt-1.5 flex items-center text-base md:text-lg">
                <CheckCircle2 className="w-4 h-4 mr-1" /> {t('deployment.healthLabel')}: {t('deployment.healthValue')}
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-auto">
            <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2 overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: '35%' }} className="bg-emerald-500 h-2.5 rounded-full" />
            </div>
            <p className="text-sm text-gray-500 font-black text-right uppercase tracking-wider">
                {t('deployment.harvestProgress', { percent: 35 })}
            </p>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        {/* Mandi Tracker */}
        <motion.div variants={item} className="bg-white rounded-4xl p-6 md:p-7 border border-agri-100 shadow-[0_18px_45px_-28px_rgba(2,44,34,0.4)]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-emerald-900 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-emerald-500" /> {t('mandi.title')}
            </h3>
            <Link href={`/${locale}/dashboard/mandi-prices`} className="text-sm font-bold text-emerald-600 hover:text-emerald-800 flex items-center bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors">
              {t('mandi.viewAll')} <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="space-y-4">
            {isLoadingMandi ? (
              <div className="py-8 flex flex-col items-center text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-2" />
                <span className="text-sm">{t('mandi.loading')}</span>
              </div>
            ) : mandiAlerts.map((alert, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <div>
                  <h4 className="font-bold text-gray-900">{alert.commodity}</h4>
                  <p className="text-xs text-gray-500 flex items-center"><MapPin className="w-3 h-3 mr-1" /> {alert.market}</p>
                </div>
                <div className="text-right">
                  <div className="font-black text-gray-900 text-lg flex items-center justify-end"><IndianRupee className="w-4 h-4 mr-0.5" /> {alert.modalPrice}</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">₹{alert.minPrice} - ₹{alert.maxPrice}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Intelligence Panel */}
        <motion.div variants={item} className="bg-linear-to-br from-emerald-950 to-[#03261f] rounded-4xl p-6 md:p-7 text-white shadow-[0_18px_50px_-24px_rgba(2,44,34,0.7)] relative overflow-hidden border border-emerald-800/60">
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <h3 className="text-xl font-bold">{t('aiAssistant.title')}</h3>
            </div>
            <p className="text-emerald-100/70 text-sm mb-8">{t('aiAssistant.monitoring')}</p>
            
            <div className="space-y-3">
              {weatherData && parseInt(weatherData.humidity) > 75 ? (
                 <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start space-x-3">
                   <Droplets className="w-5 h-5 text-amber-400 mt-1" />
                   <div>
                     <h4 className="text-sm font-bold text-amber-100">{t('aiAssistant.fungalWarningTitle')}</h4>
                     <p className="text-xs text-amber-100/70 mt-1">{t('aiAssistant.fungalWarningDesc', { humidity: weatherData.humidity })}</p>
                   </div>
                 </div>
              ) : (
                <div className="bg-white/10 border border-white/10 rounded-2xl p-4 flex items-start space-x-3">
                  <CloudSun className="w-5 h-5 text-emerald-400 mt-1" />
                  <div>
                    <h4 className="text-sm font-bold text-white">{t('aiAssistant.optimalTitle')}</h4>
                    <p className="text-xs text-emerald-100/70 mt-1">{t('aiAssistant.optimalDesc')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <Link href={`/${locale}/dashboard/mandi-prices/mandi-advisor`}>
            <button className="relative z-10 mt-8 w-full bg-emerald-400 text-emerald-950 font-bold py-4 rounded-xl active:scale-95 transition-all">
              {t('aiAssistant.button')}
            </button>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}