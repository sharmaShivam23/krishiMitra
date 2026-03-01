

'use client';

import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { 
  CloudSun, Droplets, Wind, TrendingUp, 
  ShieldCheck, ArrowRight, MapPin, Activity,
  Loader2, Sun, Cloud, CloudRain, CloudLightning, Scale, IndianRupee , CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

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

// Convert WMO weather codes to text
const getWeatherDetails = (code: number) => {
  if (code === 0) return { text: 'Clear Sky', icon: <Sun className="w-6 h-6 text-blue-200" /> };
  if (code >= 1 && code <= 3) return { text: 'Partly Cloudy', icon: <CloudSun className="w-6 h-6 text-blue-200" /> };
  if (code === 45 || code === 48) return { text: 'Foggy', icon: <Cloud className="w-6 h-6 text-blue-200" /> };
  if (code >= 51 && code <= 65) return { text: 'Rain', icon: <CloudRain className="w-6 h-6 text-blue-200" /> };
  if (code >= 80 && code <= 82) return { text: 'Heavy Rain', icon: <CloudRain className="w-6 h-6 text-blue-200" /> };
  if (code >= 95) return { text: 'Thunderstorm', icon: <CloudLightning className="w-6 h-6 text-blue-200" /> };
  return { text: 'Partly Cloudy', icon: <CloudSun className="w-6 h-6 text-blue-200" /> };
};

/* ======================================================
   COMPONENT
====================================================== */

export default function DashboardOverview() {
  const [locationName, setLocationName] = useState('Meerut, Uttar Pradesh');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherIcon, setWeatherIcon] = useState<React.ReactNode>(<CloudSun className="w-6 h-6 text-blue-200" />);
  
  const [mandiAlerts, setMandiAlerts] = useState<MandiAlert[]>([]);
  const [isLoadingMandi, setIsLoadingMandi] = useState(true);

  // Animation configurations
  const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120 } }
  };

  /* ======================================================
     1. FETCH REAL-TIME WEATHER & LOCATION
  ====================================================== */
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

        // Optional: Reverse Geocode to get City Name
        const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
        const geoData = await geoRes.json();
        if (geoData.city || geoData.locality) {
          setLocationName(`${geoData.city || geoData.locality}, ${geoData.principalSubdivision}`);
        }
      } catch (error) {
        console.error("Weather fetch failed:", error);
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => fetchWeather(position.coords.latitude, position.coords.longitude),
        () => fetchWeather(28.9845, 77.7064) // Default to Meerut if blocked
      );
    } else {
      fetchWeather(28.9845, 77.7064);
    }
  }, []);

  /* ======================================================
     2. FETCH LIVE MANDI PRICES FROM YOUR BACKEND
  ====================================================== */
  useEffect(() => {
    const fetchMandi = async () => {
      try {
        const res = await fetch('/api/mandi');
        const data = await res.json();
        if (data.prices && data.prices.length > 0) {
          // Grab the top 3 records for the dashboard overview
          setMandiAlerts(data.prices.slice(0, 3));
        }
      } catch (error) {
        console.error("Mandi fetch failed:", error);
      } finally {
        setIsLoadingMandi(false);
      }
    };

    fetchMandi();
  }, []);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 overflow-x-hidden max-w-7xl mx-auto">
      
      {/* Header Section */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-emerald-900 tracking-tight">
            Welcome back, Shivam.
          </h1>
          <p className="text-gray-500 mt-2 flex items-center font-medium">
            <MapPin className="w-4 h-4 mr-1 text-emerald-600" /> 
            {locationName} • System Status: <span className="text-emerald-600 ml-1 flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-400 mr-1 animate-pulse"></span>Online</span>
          </p>
        </div>
        <Link href="/dashboard/disease-detection" className="hidden md:flex items-center space-x-2 bg-emerald-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-800 transition shadow-lg shadow-emerald-900/20 active:scale-95">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Run AI Scan</span>
        </Link>
      </motion.div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Weather Card */}
        <motion.div variants={item} className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-[2rem] p-6 text-white shadow-xl shadow-blue-900/10 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 p-4 opacity-10 pointer-events-none">
            <CloudSun className="w-48 h-48" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-blue-100">Live Micro-Climate</h3>
                {weatherIcon}
              </div>
              {weatherData ? (
                <>
                  <div className="text-5xl font-black tracking-tighter mb-1">{weatherData.temp}</div>
                  <div className="text-blue-100 font-medium mb-6">{weatherData.condition}</div>
                </>
              ) : (
                <div className="py-6 flex items-center text-blue-100">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" /> Connecting to satellite...
                </div>
              )}
            </div>
            
            <div className="flex space-x-4 text-sm font-medium bg-white/10 p-3 rounded-xl backdrop-blur-sm w-max border border-white/20 mt-auto">
              <div className="flex items-center"><Droplets className="w-4 h-4 mr-1.5 text-blue-200"/> {weatherData?.humidity || '--%'}</div>
              <div className="flex items-center"><Wind className="w-4 h-4 mr-1.5 text-blue-200"/> {weatherData?.wind || '-- km/h'}</div>
            </div>
          </div>
        </motion.div>

        {/* Active Crop Status */}
        <motion.div variants={item} className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-xl shadow-gray-200/40 col-span-1 md:col-span-2 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full filter blur-[40px] opacity-60"></div>
          
          <div className="relative z-10 flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold text-emerald-900">Active Deployment</h3>
              <p className="text-sm text-gray-500 font-medium">Current cycle intelligence</p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200/50">Day 42 of 120</span>
          </div>
          
          <div className="relative z-10 flex items-center space-x-6 my-2">
            <div className="w-20 h-20 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center flex-shrink-0">
               <Activity className="w-10 h-10 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-emerald-900">Wheat (HD 3086)</h2>
              <p className="text-emerald-600 font-bold mt-1 flex items-center text-sm">
                <CheckCircle2 className="w-4 h-4 mr-1" /> Health Status: Optimal
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-auto">
            <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }} animate={{ width: '35%' }} transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
                className="bg-emerald-500 h-2.5 rounded-full"
              ></motion.div>
            </div>
            <p className="text-xs text-gray-400 font-bold text-right uppercase tracking-wider">35% to Harvest</p>
          </div>
        </motion.div>
      </div>

      {/* Secondary Grid (Market & Quick Actions) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Live Mandi Prices Tracker */}
        <motion.div variants={item} className="bg-white rounded-[2rem] p-6 md:p-8 border border-gray-100 shadow-xl shadow-gray-200/40 flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-emerald-900 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-emerald-500" /> Local APMC Telemetry
            </h3>
            <Link href="/dashboard/mandi-prices" className="text-sm font-bold text-emerald-600 hover:text-emerald-800 flex items-center bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          <div className="space-y-4 flex-1">
            {isLoadingMandi ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3 py-8">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                <span className="text-sm font-medium">Fetching live national prices...</span>
              </div>
            ) : mandiAlerts.length > 0 ? (
              mandiAlerts.map((alert, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-emerald-200 hover:bg-white transition-all group">
                  <div>
                    <h4 className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">{alert.commodity}</h4>
                    <p className="text-xs text-gray-500 font-medium mt-0.5 flex items-center">
                      <MapPin className="w-3 h-3 mr-1 text-emerald-400" /> {alert.market}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-gray-900 text-lg flex items-center justify-end">
                      <IndianRupee className="w-4 h-4 mr-0.5 text-emerald-600" /> {alert.modalPrice}
                    </div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-end mt-1">
                      <Scale className="w-3 h-3 mr-1" /> ₹{alert.minPrice} - ₹{alert.maxPrice}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-8">
                <span className="text-sm font-medium">No live market data available at this moment.</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* System Intelligence Panel */}
        <motion.div variants={item} className="bg-emerald-950 rounded-[2rem] p-6 md:p-8 text-white shadow-xl shadow-emerald-900/20 flex flex-col justify-between relative overflow-hidden h-full">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-600 rounded-full filter blur-[100px] opacity-30 pointer-events-none"></div>
          
          <div className="relative z-10 flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <h3 className="text-xl font-bold">Krishi AI Assistant</h3>
            </div>
            <p className="text-emerald-100/70 text-sm font-medium mb-8">Your fields are currently protected. System intelligence is actively monitoring weather variables.</p>
            
            <div className="space-y-3">
              {/* Dynamic Notification based on live weather data */}
              {weatherData && parseInt(weatherData.humidity) > 75 ? (
                 <div className="bg-amber-500/10 backdrop-blur-md border border-amber-500/20 rounded-2xl p-4 flex items-start space-x-3">
                   <div className="bg-amber-500/20 p-2 rounded-lg mt-0.5">
                     <Droplets className="w-4 h-4 text-amber-400" />
                   </div>
                   <div>
                     <h4 className="text-sm font-bold text-amber-100">Fungal Warning: High Humidity</h4>
                     <p className="text-xs text-amber-100/70 mt-1 leading-relaxed">Current humidity is {weatherData.humidity}. Delay urea application and monitor lower leaves for rust or powdery mildew.</p>
                   </div>
                 </div>
              ) : (
                <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-start space-x-3">
                  <div className="bg-emerald-400/20 p-2 rounded-lg mt-0.5">
                    <CloudSun className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Conditions Optimal</h4>
                    <p className="text-xs text-emerald-100/70 mt-1 leading-relaxed">Current weather patterns present low risk for pests. Standard irrigation scheduling is safe to proceed.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
     <Link href="/dashboard/mandi-prices/mandi-advisor">
          <button className="relative z-10 mt-8 w-full bg-emerald-400 text-emerald-950 font-bold py-4 rounded-xl hover:bg-white transition-colors shadow-[0_0_20px_-5px_rgba(52,211,153,0.4)] flex justify-center items-center active:scale-95">
            Acknowledge System Status
          </button>
          </Link>
        </motion.div>
      </div>

    </motion.div>
  );
}