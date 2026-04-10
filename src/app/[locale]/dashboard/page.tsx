'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, Variants, animate, useInView } from 'framer-motion';
import {
  TrendingUp, TrendingDown,
  ShieldCheck, ArrowRight, MapPin, Activity,
  Loader2, IndianRupee,
  CheckCircle2, Sprout, Brain, Microscope, BarChart3, Leaf,
  AlertTriangle, Zap, Thermometer
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
    href: '/dashboard/mandi-prices/mandi-advisor',
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=800&auto=format&fit=crop',
    accent: 'from-violet-600/70 to-purple-700/70',
    glow: 'shadow-violet-900/40',
    chipKey: 'tiles.advisor.chip',
  },
];


/* ════════════════════════════════════════════════════════
   RADAR PULSE (for AI panel)
═══════════════════════════════════════════════════════ */
function RadarPulse() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {[1, 2, 3].map(i => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-emerald-500/20"
          initial={{ width: 40, height: 40, opacity: 0.6 }}
          animate={{ width: 140, height: 140, opacity: 0 }}
          transition={{ duration: 2.5, delay: i * 0.8, repeat: Infinity, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

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
      <motion.div variants={item} className="relative rounded-3xl overflow-hidden min-h-[160px] md:min-h-[190px] shadow-xl">
        {/* Background field image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2064&auto=format&fit=crop')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/95 via-emerald-950/80 to-emerald-900/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/60 to-transparent" />

        {/* Floating leaf particles */}
        {['🌿','🍃','🌾'].map((emoji, i) => (
          <motion.span
            key={i}
            className="absolute text-2xl pointer-events-none select-none"
            style={{ right: `${15 + i * 20}%`, top: `${20 + i * 15}%` }}
            animate={{ y: [0, -10, 0], rotate: [0, 8, -8, 0], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 4 + i, repeat: Infinity, delay: i * 1.2 }}
          >
            {emoji}
          </motion.span>
        ))}

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 md:p-8 h-full">
          <div>
            {/* Season badge */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest border mb-3 ${season.color}`}>
              <span>{season.emoji}</span> {t('seasonBadge', { season: seasonName })}
            </div>

            {/* Greeting */}
            <h1 className="text-2xl md:text-4xl font-black text-white leading-tight">
              {greeting()},{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-amber-400">
                {userName ? `${userName}!` : `${t('greetings.fallbackName')}!`}
              </span>
            </h1>
            <p className="text-emerald-200/70 mt-1.5 flex items-center gap-1.5 font-semibold text-sm">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              {locationName} · {currentTime.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>

          <Link
            href={`/${locale}/dashboard/disease-detection`}
            className="hidden md:flex items-center gap-2 bg-emerald-400 text-emerald-950 px-6 py-3 rounded-2xl font-black hover:bg-amber-400 transition-all shadow-lg active:scale-95 shrink-0 group"
          >
            <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>{t('runScan')}</span>
          </Link>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════
         QUICK ACCESS TILES
      ═════════════════════════════════════════════════════ */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {QUICK_TILES.map(tile => (
          <Link
            key={tile.id}
            href={`/${locale}${tile.href}`}
            className={`relative overflow-hidden rounded-2xl group shadow-lg ${tile.glow} hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 active:scale-95 min-h-[130px]`}
          >
            {/* Bg image */}
            <div
              className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-700"
              style={{ backgroundImage: `url(${tile.image})` }}
            />
            <div className={`absolute inset-0 bg-gradient-to-br ${tile.accent}`} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

            <div className="relative z-10 p-4 h-full flex flex-col justify-between">
              {/* Chip */}
              <span className="self-start text-[10px] font-black bg-white/15 backdrop-blur-sm border border-white/20 px-2 py-0.5 rounded-full text-white">
                {t(tile.chipKey)}
              </span>
              <div>
                <tile.icon className="w-6 h-6 text-white mb-1.5 drop-shadow-md" />
                <div className="text-white font-black text-base leading-tight drop-shadow-md">{t(tile.labelKey)}</div>
                <div className="text-white/70 text-[11px] font-semibold mt-0.5">{t(tile.subKey)}</div>
              </div>
            </div>
          </Link>
        ))}
      </motion.div>

      {/* ══════════════════════════════════════════════════════
         SOIL INTELLIGENCE + CROP STATUS
      ═════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">

        {/* ── Weather Card ── */}
        <motion.div variants={item} className="relative overflow-hidden bg-linear-to-br from-sky-900 via-blue-800 to-indigo-900 rounded-3xl p-6 text-white shadow-[0_18px_50px_-22px_rgba(14,34,84,0.85)] border border-sky-700/40">
          <div className="absolute top-0 right-0 w-48 h-48 bg-sky-300/10 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/10 rounded-full blur-2xl" />

          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold text-emerald-100 text-sm uppercase tracking-wider">{t('soilCard.eyebrow')}</h3>
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                <Thermometer className="w-5 h-5 text-emerald-200" />
              </div>
            </div>

            <div className="text-2xl font-black leading-tight mb-2">
              {t('soilCard.title')}
            </div>
            <p className="text-emerald-100/70 text-sm font-semibold mb-4">
              {t('soilCard.description')}
            </p>

            <div className="flex flex-wrap gap-2 text-[11px] font-bold mb-4">
              <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15">{t('soilCard.tags.ph')}</span>
              <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15">{t('soilCard.tags.npk')}</span>
              <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15">{t('soilCard.tags.soilType')}</span>
            </div>

            <Link
              href={`/${locale}/dashboard/weather`}
              className="mt-auto inline-flex items-center justify-center gap-2 bg-sky-400 text-sky-950 px-4 py-2.5 rounded-2xl font-black hover:bg-sky-300 transition-all shadow-lg active:scale-95"
            >
              {t('soilCard.cta')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

        {/* ── Active Crop Card ── */}
        <motion.div variants={item} className="relative overflow-hidden bg-white rounded-3xl border border-emerald-100 shadow-[0_18px_45px_-28px_rgba(2,44,34,0.35)] col-span-1 md:col-span-2">

          {/* Field bg */}
          <div
            className="absolute inset-0 bg-cover bg-bottom opacity-12"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?q=80&w=800&auto=format&fit=crop')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/70" />

          <div className="relative z-10 p-6 md:p-7 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl md:text-2xl font-black text-emerald-900 leading-tight">{t('deployment.title')}</h3>
                <p className="text-sm text-gray-500 font-semibold mt-0.5">{t('deployment.subtitle')}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-black rounded-xl border border-emerald-200/70">
                  {t('deployment.dayTracker', { current: 42, total: 120 })}
                </span>
                <span className={`px-2.5 py-1 text-[10px] font-black rounded-full border ${season.color}`}>
                  {season.emoji} {seasonName}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-5 my-2">
              {/* Crop icon with field ring */}
              <div className="relative w-20 h-20 shrink-0">
                <div className="absolute inset-0 rounded-2xl overflow-hidden">
                  <div
                    className="w-full h-full bg-cover bg-center opacity-30"
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1466629437334-b4f6603563c5?q=80&w=200&auto=format&fit=crop')" }}
                  />
                </div>
                <div className="absolute inset-0 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center">
                  <Leaf className="w-10 h-10 text-emerald-500" />
                </div>
              </div>
              <div>
                <h2 className="text-[2rem] md:text-[2.1rem] leading-tight font-black text-emerald-900">
                  {t('deployment.cropName')}
                </h2>
                <p className="text-emerald-600 font-black mt-1 flex items-center gap-1 text-base md:text-lg">
                  <CheckCircle2 className="w-4 h-4" />
                  {t('deployment.healthLabel')}: {t('deployment.healthValue')}
                </p>
              </div>
            </div>

            <div className="mt-auto">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">{t('growthProgress')}</span>
                <span className="text-xs font-black text-emerald-600">{t('deployment.harvestProgress', { percent: 35 })}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '35%' }}
                  transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
                  className="h-3 rounded-full bg-gradient-to-r from-emerald-500 to-green-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
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
        <motion.div variants={item} className="bg-white rounded-3xl p-6 md:p-7 border border-emerald-100 shadow-[0_18px_45px_-28px_rgba(2,44,34,0.3)]">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-black text-emerald-900 flex items-center gap-2">
              <div className="p-2 bg-amber-50 rounded-xl border border-amber-100">
                <BarChart3 className="w-4.5 h-4.5 text-amber-600" />
              </div>
              {t('mandi.title')}
            </h3>
            <Link
              href={`/${locale}/dashboard/mandi-prices`}
              className="text-sm font-bold text-emerald-600 hover:text-emerald-800 flex items-center bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-all"
            >
              {t('mandi.viewAll')} <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="space-y-3">
            {isLoadingMandi ? (
              <div className="py-10 flex flex-col items-center text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-2" />
                <span className="text-sm">{t('mandi.loading')}</span>
              </div>
            ) : mandiAlerts.map((alert, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all hover:shadow-sm ${idx % 2 === 0 ? 'bg-stone-50 border-stone-100' : 'bg-emerald-50/40 border-emerald-100/60'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${idx % 2 === 0 ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                    {idx === 0 ? '🌾' : idx === 1 ? '🌽' : '🧅'}
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 text-sm">{alert.commodity}</h4>
                    <p className="text-[11px] text-gray-400 flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5" /> {alert.market}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-gray-900 flex items-center gap-0.5 justify-end">
                    <IndianRupee className="w-3.5 h-3.5" />
                    <span className="text-lg">{alert.modalPrice}</span>
                    {/* Trend indicator — random for now, would come from price history */}
                    {idx === 0
                      ? <TrendingUp className="w-4 h-4 text-emerald-500 ml-1" />
                      : idx === 1
                      ? <TrendingDown className="w-4 h-4 text-red-400 ml-1" />
                      : <TrendingUp className="w-4 h-4 text-emerald-500 ml-1" />}
                  </div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-0.5">
                    ₹{alert.minPrice}–₹{alert.maxPrice}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── AI Intelligence Panel ── */}
        <motion.div variants={item} className="bg-gradient-to-br from-emerald-950 to-[#03261f] rounded-3xl p-6 md:p-7 text-white shadow-[0_18px_50px_-24px_rgba(2,44,34,0.8)] relative overflow-hidden border border-emerald-800/50">

          {/* Field bg overlay */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-10"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=800&auto=format&fit=crop')" }}
          />

          {/* Radar pulse behind icon */}
          <div className="absolute top-8 right-8">
            <RadarPulse />
            <div className="relative z-10 w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-black">{t('aiAssistant.title')}</h3>
            </div>
            <p className="text-emerald-100/60 text-sm mb-6">{t('aiPanel.intro')}</p>

            <div className="space-y-3">
              <div className="bg-white/8 border border-white/10 rounded-2xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-300 mt-0.5" />
                <div>
                  <h4 className="text-sm font-black text-amber-200">{t('aiPanel.alertTitle')}</h4>
                  <p className="text-xs text-emerald-100/60 mt-1">
                    {t('aiPanel.alertDesc')}
                  </p>
                </div>
              </div>

              {/* AI tip card */}
              <div className="bg-white/5 border border-white/8 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-violet-400" />
                  <span className="text-xs font-black text-violet-300 uppercase tracking-wider">{t('aiPanel.insightLabel')}</span>
                </div>
                <p className="text-xs text-emerald-100/70 leading-relaxed">
                  {t('aiPanel.insightDesc')}
                </p>
              </div>
            </div>
          </div>

          <Link href={`/${locale}/dashboard/soil-intelligence`}>
            <button className="relative z-10 mt-6 w-full bg-emerald-400 hover:bg-amber-400 text-emerald-950 font-black py-3.5 rounded-2xl transition-all active:scale-95 shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 group">
              <Brain className="w-4 h-4 group-hover:scale-110 transition-transform" />
              {t('aiPanel.cta')}
            </button>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}