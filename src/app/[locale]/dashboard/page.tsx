'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, Variants, animate, useInView } from 'framer-motion';
import {
  TrendingUp, TrendingDown,
  ArrowRight, MapPin,
  Loader2, IndianRupee,
  CheckCircle2, Sprout, Brain, Microscope, BarChart3, Leaf,
  AlertTriangle, Thermometer, Camera, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

/* ════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════ */
interface MandiAlert {
  commodity: string;
  market: string;
  modalPrice: number | string;
  minPrice: number | string;
  maxPrice: number | string;
}

/* ════════════════════════════════════════════════════════
   WEATHER CODE MAP
═══════════════════════════════════════════════════════ */
const WEATHER_CODES: Record<number, { label: string; emoji: string }> = {
  0:  { label: 'Clear Sky',      emoji: '☀️' },
  1:  { label: 'Mainly Clear',   emoji: '🌤️' },
  2:  { label: 'Partly Cloudy',  emoji: '⛅' },
  3:  { label: 'Overcast',       emoji: '☁️' },
  45: { label: 'Foggy',          emoji: '🌫️' },
  48: { label: 'Foggy',          emoji: '🌫️' },
  51: { label: 'Light Drizzle',  emoji: '🌦️' },
  61: { label: 'Light Rain',     emoji: '🌧️' },
  63: { label: 'Rain',           emoji: '🌧️' },
  65: { label: 'Heavy Rain',     emoji: '🌩️' },
  80: { label: 'Rain Showers',   emoji: '🌦️' },
  95: { label: 'Thunderstorm',   emoji: '⛈️' },
};

/* ════════════════════════════════════════════════════════
   FARMING UTILS
═══════════════════════════════════════════════════════ */
const getCurrentSeason = () => {
  const m = new Date().getMonth() + 1;
  if (m >= 6 && m <= 10) return { key: 'kharif', emoji: '🌧️', color: 'bg-blue-900/60 text-blue-300 border-blue-500/30' };
  if (m >= 11 || m <= 3)  return { key: 'rabi',   emoji: '❄️', color: 'bg-indigo-900/60 text-indigo-300 border-indigo-500/30' };
  return { key: 'zaid', emoji: '☀️', color: 'bg-amber-900/60 text-amber-300 border-amber-500/30' };
};


/* ════════════════════════════════════════════════════════
   QUICK ACCESS TILES
═══════════════════════════════════════════════════════ */
const QUICK_TILES = [
  {
    id: 'mandi',
    labelKey: 'tiles.mandi.label',
    subKey: 'tiles.mandi.sub',
    icon: BarChart3,
    href: '/dashboard/mandi-prices',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800&auto=format&fit=crop',
    accent: 'from-amber-500/70 to-orange-600/70',
    glow: 'shadow-amber-900/40',
    chipKey: 'tiles.mandi.chip',
  },
  {
    id: 'disease',
    labelKey: 'tiles.disease.label',
    subKey: 'tiles.disease.sub',
    icon: Microscope,
    href: '/dashboard/disease-detection',
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=800&auto=format&fit=crop',
    accent: 'from-emerald-600/70 to-green-700/70',
    glow: 'shadow-emerald-900/40',
    chipKey: 'tiles.disease.chip',
  },
  {
    id: 'lifecycle',
    labelKey: 'tiles.lifecycle.label',
    subKey: 'tiles.lifecycle.sub',
    icon: Sprout,
    href: '/dashboard/crop-lifecycle',
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?q=80&w=800&auto=format&fit=crop',
    accent: 'from-green-600/70 to-teal-700/70',
    glow: 'shadow-green-900/40',
    chipKey: 'tiles.lifecycle.chip',
  },
  {
    id: 'advisor',
    labelKey: 'tiles.advisor.label',
    subKey: 'tiles.advisor.sub',
    icon: Brain,
    href: '/dashboard/mandi-prices/mandi-advisor2',
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=800&auto=format&fit=crop',
    accent: 'from-violet-600/70 to-purple-700/70',
    glow: 'shadow-violet-900/40',
    chipKey: 'tiles.advisor.chip',
  },
];




/* ════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════ */
export default function DashboardOverview() {
  const t = useTranslations('DashboardOverview');
  const locale = useLocale();

  const [userName, setUserName] = useState('');
  const [locationName, setLocationName] = useState('Meerut, Uttar Pradesh');
  const [formattedDate, setFormattedDate] = useState('');
  const [mandiAlerts, setMandiAlerts] = useState<MandiAlert[]>([]);
  const [isLoadingMandi, setIsLoadingMandi] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState<{ temp: number; condition: string; emoji: string; humidity: number; wind: number } | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);

  const season = getCurrentSeason();
  const seasonName = t(`seasons.${season.key}`);

  /* ── Format date consistently (client-side only) ── */
  const formatDateConsistently = (date: Date) => {
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const dayName = days[date.getDay()];
    const dayNum = date.getDate();
    const monthName = months[date.getMonth()];
    return `${dayName} ${dayNum} ${monthName}`;
  };

  /* ── Clock tick ── */
  useEffect(() => {
    setFormattedDate(formatDateConsistently(new Date()));
    const id = setInterval(() => {
      setCurrentTime(new Date());
      setFormattedDate(formatDateConsistently(new Date()));
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const greeting = () => {
    const h = currentTime.getHours();
    if (h < 12) return t('greetings.morning');
    if (h < 17) return t('greetings.afternoon');
    return t('greetings.evening');
  };


  const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.09 } }
  };
  const item: Variants = {
    hidden: { opacity: 0, y: 22 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 110, damping: 18 } }
  };

  /* ── Fetch user ── */
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.success && d.user?.name) setUserName(d.user.name.split(' ')[0]);
    }).catch(() => {});
  }, []);

  /* ── Resolve location + weather ── */
  useEffect(() => {
    const fetchLocationAndWeather = async (lat: number, lon: number) => {
      setIsLoadingWeather(true);
      
      // 1. Fetch Weather Data (Priority)
      try {
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`);
        if (weatherRes.ok) {
          const weatherData = await weatherRes.json();
          const cur = weatherData?.current;
          
          if (cur) {
            const info = WEATHER_CODES[cur.weather_code as number] ?? { label: 'Clear Sky', emoji: '🌡️' };
            setWeather({ 
              temp: Math.round(cur.temperature_2m), 
              condition: info.label, 
              emoji: info.emoji, 
              humidity: cur.relative_humidity_2m, 
              wind: Math.round(cur.wind_speed_10m) 
            });
          }
        }
      } catch (weatherErr) {
        // Changed to warn so Next.js doesn't throw a full screen error if blocked by adblocker
        console.warn("⚠️ Weather API blocked or failed.", weatherErr);
      }

      // 2. Fetch Location Name (Secondary)
      try {
        const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData.city || geoData.locality) {
            setLocationName(`${geoData.city || geoData.locality}, ${geoData.principalSubdivision || ''}`);
          }
        }
      } catch (geoErr) {
        // Changed to warn so Next.js doesn't throw a full screen error if blocked by adblocker
        console.warn("⚠️ Location Name API blocked or failed. Using fallback.", geoErr);
      }

      setIsLoadingWeather(false);
    };

    // Ask browser for location
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchLocationAndWeather(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          console.warn("⚠️ Location access denied. Using fallback location.");
          fetchLocationAndWeather(28.9845, 77.7064); // Fallback to Meerut
        },
        { timeout: 5000 }
      );
    } else {
      fetchLocationAndWeather(28.9845, 77.7064);
    }
  }, [locale]);

  /* ── Fetch mandi ── */
  useEffect(() => {
    fetch('/api/mandi').then(r => r.json()).then(d => {
      if (d.prices) setMandiAlerts(d.prices.slice(0, 3));
    }).catch(() => {}).finally(() => setIsLoadingMandi(false));
  }, []);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5 md:space-y-7 overflow-x-hidden max-w-7xl mx-auto">

      {/* ══════════════════════════════════════════════════════
         HERO GREETING BANNER
      ═════════════════════════════════════════════════════ */}
      <motion.div variants={item} className="relative rounded-2xl overflow-hidden min-h-[150px] md:min-h-[180px]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2064&auto=format&fit=crop')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950/90 via-gray-900/75 to-gray-900/40" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 md:p-8 h-full">
          <div>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border mb-3 ${season.color}`}>
              <span>{season.emoji}</span> {t('seasonBadge', { season: seasonName })}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
              {greeting()},{' '}
              <span className="text-emerald-400">
                {userName ? `${userName}` : t('greetings.fallbackName')}
              </span>
            </h1>
            <p className="text-white/50 mt-1.5 flex items-center gap-1.5 text-sm">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              {locationName} · {currentTime.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>

          <Link
            href={`/${locale}/dashboard/disease-detection`}
            className="hidden md:flex items-center gap-2 bg-white text-gray-900 px-5 py-2.5 rounded-xl font-semibold hover:bg-emerald-400 hover:text-emerald-950 transition-colors shrink-0 text-sm"
          >
            <Camera className="w-4 h-4" />
            <span>{t('runScan')}</span>
          </Link>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════
         QUICK ACCESS TILES
      ═════════════════════════════════════════════════════ */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {QUICK_TILES.map(tile => (
          <Link
            key={tile.id}
            href={`/${locale}${tile.href}`}
            className="relative overflow-hidden rounded-xl group hover:shadow-lg transition-shadow duration-200 min-h-[120px]"
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${tile.image})` }}
            />
            <div className={`absolute inset-0 bg-gradient-to-br ${tile.accent}`} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

            <div className="relative z-10 p-4 h-full flex flex-col justify-between">
              <span className="self-start text-[10px] font-medium bg-white/15 px-2 py-0.5 rounded-full text-white">
                {t(tile.chipKey)}
              </span>
              <div>
                <tile.icon className="w-5 h-5 text-white/90 mb-1" />
                <div className="text-white font-semibold text-[14px] leading-tight">{t(tile.labelKey)}</div>
                <div className="text-white/60 text-[11px] mt-0.5">{t(tile.subKey)}</div>
              </div>
            </div>
          </Link>
        ))}
      </motion.div>

      {/* ══════════════════════════════════════════════════════
         SOIL INTELLIGENCE + CROP STATUS
      ═════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">

        {/* ── Live Weather Card ── */}
        <motion.div variants={item} className="relative overflow-hidden rounded-3xl text-white shadow-[0_18px_50px_-22px_rgba(14,34,84,0.85)] border border-sky-700/40" style={{ background: 'linear-gradient(135deg, #0c4a6e 0%, #1e3a5f 40%, #312e81 100%)' }}>
          {/* Ambient glow */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-sky-400/8 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />

          <div className="relative z-10 p-6 flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-sky-300/80 uppercase tracking-wider">Live Weather</span>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[12px] text-sky-200/60 flex items-center gap-1 mb-4">
              <MapPin className="w-3 h-3" /> {locationName}
            </p>

            {isLoadingWeather ? (
              <div className="flex-1 flex items-center justify-center py-6">
                <Loader2 className="w-7 h-7 animate-spin text-sky-300/50" />
              </div>
            ) : weather ? (
              <>
                {/* Main temp */}
                <div className="flex items-start gap-3 mb-5">
                  <span className="text-5xl leading-none select-none">{weather.emoji}</span>
                  <div>
                    <div className="text-[3rem] font-black leading-none tracking-tight">
                      {weather.temp}<span className="text-2xl font-semibold text-sky-300/70">°C</span>
                    </div>
                    <p className="text-[13px] text-sky-200/80 font-medium mt-0.5">{weather.condition}</p>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex gap-3 mt-auto">
                  <div className="flex-1 bg-white/8 rounded-xl px-3 py-2.5 border border-white/5">
                    <span className="text-[10px] text-sky-300/60 block">Humidity</span>
                    <span className="text-[15px] font-semibold">{weather.humidity}%</span>
                  </div>
                  <div className="flex-1 bg-white/8 rounded-xl px-3 py-2.5 border border-white/5">
                    <span className="text-[10px] text-sky-300/60 block">Wind</span>
                    <span className="text-[15px] font-semibold">{weather.wind} km/h</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-4 text-sky-300/50">
                <Thermometer className="w-8 h-8 mb-2" />
                <span className="text-[12px]">Weather unavailable</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Active Crop Card ── */}
        {/* ── Active Crop Card ── */}
        <motion.div variants={item} className="bg-white rounded-2xl border border-gray-200 col-span-1 md:col-span-2">
          <div className="p-6 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{t('deployment.title')}</h3>
                <p className="text-[13px] text-gray-400 mt-0.5">{t('deployment.subtitle')}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-medium rounded-lg">
                  {t('deployment.dayTracker', { current: 42, total: 120 })}
                </span>
                <span className={`px-2 py-1 text-[10px] font-medium rounded-lg border ${season.color}`}>
                  {season.emoji} {seasonName}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <Leaf className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {t('deployment.cropName')}
                </h2>
                <p className="text-emerald-600 font-medium mt-0.5 flex items-center gap-1 text-sm">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {t('deployment.healthLabel')}: {t('deployment.healthValue')}
                </p>
              </div>
            </div>

            <div className="mt-auto">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[11px] text-gray-400 font-medium">{t('growthProgress')}</span>
                <span className="text-[11px] font-medium text-emerald-600">{t('deployment.harvestProgress', { percent: 35 })}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '35%' }}
                  transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
                  className="h-2 rounded-full bg-emerald-500"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ══════════════════════════════════════════════════════
         MANDI + AI INTELLIGENCE
      ═════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">

        {/* ── Mandi Tracker ── */}
        <motion.div variants={item} className="bg-white rounded-2xl p-5 md:p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-gray-400" />
              {t('mandi.title')}
            </h3>
            <Link
              href={`/${locale}/dashboard/mandi-prices`}
              className="text-[12px] font-medium text-emerald-600 hover:text-emerald-700 flex items-center transition-colors"
            >
              {t('mandi.viewAll')} <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          <div className="space-y-1">
            {isLoadingMandi ? (
              <div className="py-8 flex flex-col items-center text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin text-gray-300 mb-2" />
                <span className="text-[12px]">{t('mandi.loading')}</span>
              </div>
            ) : mandiAlerts.map((alert, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-3 px-1 border-b border-gray-100 last:border-0"
              >
                <div>
                  <h4 className="font-medium text-gray-900 text-[14px]">{alert.commodity}</h4>
                  <p className="text-[11px] text-gray-400 flex items-center gap-0.5 mt-0.5">
                    <MapPin className="w-2.5 h-2.5" /> {alert.market}
                  </p>
                </div>
                <div className="text-right flex items-center gap-2">
                  <div>
                    <div className="font-semibold text-gray-900 text-[15px]">
                      ₹{alert.modalPrice}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      ₹{alert.minPrice}–₹{alert.maxPrice}
                    </div>
                  </div>
                  {idx === 0
                    ? <TrendingUp className="w-4 h-4 text-emerald-500" />
                    : idx === 1
                    ? <TrendingDown className="w-4 h-4 text-red-400" />
                    : <TrendingUp className="w-4 h-4 text-emerald-500" />}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── AI Intelligence Panel ── */}
        <motion.div variants={item} className="bg-gray-900 rounded-2xl p-5 md:p-6 text-white relative overflow-hidden border border-gray-800">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="text-[15px] font-semibold">{t('aiAssistant.title')}</h3>
              </div>
            </div>
            <p className="text-gray-400 text-[13px] mb-5">{t('aiPanel.intro')}</p>

            <div className="space-y-2.5">
              <div className="bg-white/5 border border-white/8 rounded-xl p-3.5 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-[13px] font-medium text-amber-200">{t('aiPanel.alertTitle')}</h4>
                  <p className="text-[12px] text-gray-400 mt-1 leading-relaxed">
                    {t('aiPanel.alertDesc')}
                  </p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/8 rounded-xl p-3.5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Brain className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-[11px] font-medium text-violet-300 uppercase tracking-wider">{t('aiPanel.insightLabel')}</span>
                </div>
                <p className="text-[12px] text-gray-400 leading-relaxed">
                  {t('aiPanel.insightDesc')}
                </p>
              </div>
            </div>

            <Link href={`/${locale}/dashboard/soil-intelligence`}>
              <button className="mt-5 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-[13px]">
                <Brain className="w-4 h-4" />
                {t('aiPanel.cta')}
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}