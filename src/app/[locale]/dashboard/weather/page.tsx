'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, Variants } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { 
  CloudSun, CloudRain, Sun, Wind, Droplets, 
  ThermometerSun, AlertTriangle, CheckCircle2, 
  MapPin, CalendarDays, Activity, 
  Loader2, CloudLightning, Cloud, Search, X, Volume2, VolumeX
} from 'lucide-react';

interface WeatherData {
  temp: number;
  conditionKey: string;
  humidity: number;
  windSpeed: number;
  precipitationChance: number;
  uvIndex: number;
  lastUpdated: string;
}

interface ForecastDay {
  day: string;
  date: string;
  tempMax: number;
  tempMin: number;
  conditionKey: string;
  icon: React.ReactNode;
}

interface Recommendation {
  type: 'warning' | 'success' | 'info';
  titleKey: string;
  descKey: string;
  icon: React.ReactNode;
  dynamicVar?: { [key: string]: string | number };
}

interface GeoLocation {
  name: string;
  lat: number;
  lon: number;
}

const getWeatherDetails = (code: number) => {
  if (code === 0) return { key: 'clearSky', hindiText: 'saaf aasman', icon: <Sun className="w-8 h-8 text-amber-400" /> };
  if (code >= 1 && code <= 3) return { key: 'partlyCloudy', hindiText: 'halke baadal', icon: <CloudSun className="w-8 h-8 text-gray-200" /> };
  if (code === 45 || code === 48) return { key: 'foggy', hindiText: 'kohra', icon: <Cloud className="w-8 h-8 text-gray-400" /> };
  if (code >= 51 && code <= 55) return { key: 'drizzle', hindiText: 'boondabandi', icon: <CloudRain className="w-8 h-8 text-blue-300" /> };
  if (code >= 61 && code <= 65) return { key: 'rain', hindiText: 'baarish', icon: <CloudRain className="w-8 h-8 text-blue-500" /> };
  if (code >= 71 && code <= 77) return { key: 'snow', hindiText: 'baraf', icon: <CloudRain className="w-8 h-8 text-white" /> };
  if (code >= 80 && code <= 82) return { key: 'heavyRain', hindiText: 'bhari baarish', icon: <CloudRain className="w-8 h-8 text-blue-700" /> };
  if (code >= 95) return { key: 'thunderstorm', hindiText: 'toofan aur bijli', icon: <CloudLightning className="w-8 h-8 text-purple-500" /> };
  return { key: 'unknown', hindiText: 'samanya', icon: <CloudSun className="w-8 h-8 text-gray-400" /> };
};

export default function WeatherIntelligence() {
  const t = useTranslations('WeatherIntelligence');
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInitialSpeakDone, setIsInitialSpeakDone] = useState(false);

  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  
  const [activeLocation, setActiveLocation] = useState<GeoLocation>({ name: '', lat: 28.9845, lon: 77.7064 });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [weatherCode, setWeatherCode] = useState<number>(0);

  const searchRef = useRef<HTMLDivElement>(null);

  const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120 } }
  };

  useEffect(() => {
    setActiveLocation(prev => ({ ...prev, name: t('locating') }));
    
    const initLocation = async (lat: number, lon: number) => {
      try {
        const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
        const geoData = await geoRes.json();
        const locName = `${geoData.city || geoData.locality || 'Unknown Area'}, ${geoData.principalSubdivision || 'India'}`;
        setActiveLocation({ name: locName, lat, lon });
      } catch (error) {
        setActiveLocation({ name: 'Meerut, Uttar Pradesh', lat: 28.9845, lon: 77.7064 });
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => initLocation(position.coords.latitude, position.coords.longitude),
        () => initLocation(28.9845, 77.7064)
      );
    } else {
      initLocation(28.9845, 77.7064);
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [t]);

  useEffect(() => {
    const fetchWeather = async () => {
      setIsLoading(true);
      try {
        const { lat, lon } = activeLocation;
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max&timezone=auto`
        );
        const weatherData = await weatherRes.json();

        const current = weatherData.current;
        const daily = weatherData.daily;

        setWeatherCode(current.weather_code);

        setCurrentWeather({
          temp: Math.round(current.temperature_2m),
          conditionKey: getWeatherDetails(current.weather_code).key,
          humidity: current.relative_humidity_2m,
          windSpeed: Math.round(current.wind_speed_10m),
          precipitationChance: daily.precipitation_probability_max[0],
          uvIndex: Math.round(daily.uv_index_max[0]),
          lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });

        const forecastArray = daily.time.map((time: string, index: number) => {
          const dateObj = new Date(time);
          return {
            day: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
            date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            tempMax: Math.round(daily.temperature_2m_max[index]),
            tempMin: Math.round(daily.temperature_2m_min[index]),
            conditionKey: getWeatherDetails(daily.weather_code[index]).key,
            icon: getWeatherDetails(daily.weather_code[index]).icon,
          };
        });
        setForecast(forecastArray);

        const newRecs: Recommendation[] = [];

        if (daily.precipitation_probability_max[1] > 60 || daily.precipitation_probability_max[2] > 60) {
          newRecs.push({
            type: 'warning',
            titleKey: 'delayIrrigationTitle',
            descKey: 'delayIrrigationDesc',
            icon: <AlertTriangle className="w-5 h-5 text-amber-500" />
          });
        } else {
          newRecs.push({
            type: 'info',
            titleKey: 'irrigationOpenTitle',
            descKey: 'irrigationOpenDesc',
            icon: <Droplets className="w-5 h-5 text-blue-500" />
          });
        }

        if (current.wind_speed_10m > 18) {
          newRecs.push({
            type: 'warning',
            titleKey: 'poorSprayTitle',
            descKey: 'poorSprayDesc',
            dynamicVar: { windSpeed: Math.round(current.wind_speed_10m) },
            icon: <Wind className="w-5 h-5 text-amber-500" />
          });
        } else if (daily.precipitation_probability_max[0] < 30) {
          newRecs.push({
            type: 'success',
            titleKey: 'optimalSprayTitle',
            descKey: 'optimalSprayDesc',
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          });
        }

        if (current.relative_humidity_2m > 75 && current.temperature_2m > 22 && current.temperature_2m < 30) {
          newRecs.push({
            type: 'warning',
            titleKey: 'fungalRiskTitle',
            descKey: 'fungalRiskDesc',
            dynamicVar: { humidity: Math.round(current.relative_humidity_2m) },
            icon: <Activity className="w-5 h-5 text-amber-500" />
          });
        }

        setRecommendations(newRecs);
        setIsLoading(false);

      } catch (error) {
        setIsLoading(false);
      }
    };

    if (activeLocation.name !== t('locating')) {
      fetchWeather();
    }
  }, [activeLocation, t]);

  const toggleAudio = () => {
    if (!('speechSynthesis' in window) || !currentWeather) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      window.speechSynthesis.cancel();

      const conditionHindi = getWeatherDetails(weatherCode).hindiText;
      const rainText = currentWeather.precipitationChance < 30 ? 'baarish hone ki sambhavna kam hai' : 'baarish hone ki aashanka hai';
      const hinglishText = `Aaj ${activeLocation.name} mein mausam ${currentWeather.temp} degree hai. Aasman mein ${conditionHindi} rahegi. Hawa ki raftar ${currentWeather.windSpeed} kilometer prati ghanta hai, aur ${rainText}.`;
      
      const utterance = new SpeechSynthesisUtterance(hinglishText);
      
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    if (currentWeather && !isLoading && !isInitialSpeakDone && ('speechSynthesis' in window)) {
      const timer = setTimeout(() => {
        const conditionHindi = getWeatherDetails(weatherCode).hindiText;
        const rainText = currentWeather.precipitationChance < 30 ? 'baarish hone ki sambhavna kam hai' : 'baarish hone ki aashanka hai';
        const hinglishText = `Aaj ${activeLocation.name} mein mausam ${currentWeather.temp} degree hai. Aasman mein ${conditionHindi} rahegi. Hawa ki raftar ${currentWeather.windSpeed} kilometer prati ghanta hai, aur ${rainText}.`;
        
        const utterance = new SpeechSynthesisUtterance(hinglishText);
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
        setIsInitialSpeakDone(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentWeather, isLoading, isInitialSpeakDone, weatherCode, activeLocation.name]);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${searchQuery}&count=5&language=en&format=json`);
        const data = await res.json();
        setSearchResults(data.results || []);
      } catch (err) {
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        searchResults.length > 0 && setSearchResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchResults.length]);

  const handleCitySelect = (city: any) => {
    setActiveLocation({
      name: `${city.name}, ${city.admin1 || city.country}`,
      lat: city.latitude,
      lon: city.longitude
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  if (isLoading && !currentWeather) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-agri-600 mb-4" />
        <h2 className="text-xl font-bold text-agri-900">{t('calibrating')}</h2>
        <p className="text-gray-500">{t('connecting')}</p>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-7xl mx-auto">
      <motion.div variants={item} className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-agri-900 tracking-tight flex items-center">
          <CloudSun className="w-8 h-8 mr-3 text-agri-600" />
          {t('title')}
        </h1>
        <p className="text-gray-500 mt-2 font-medium max-w-2xl">
          {t('subtitle')}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <motion.div variants={item} className="lg:col-span-2 bg-gradient-to-br from-blue-500 via-blue-600 to-sky-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-900/20 relative overflow-visible z-20">
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-white rounded-full filter blur-[100px] opacity-20 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between h-full">
            <div className="flex flex-col justify-between flex-1 pr-0 md:pr-8">
              
              <div>
                <div className="relative mb-6" ref={searchRef}>
                  <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md w-full max-w-sm px-1 py-1 rounded-xl border border-white/20 transition-all focus-within:bg-white/20 focus-within:border-white/40">
                    <MapPin className="w-5 h-5 text-blue-100 ml-2 flex-shrink-0" />
                    <input 
                      type="text" 
                      placeholder={activeLocation.name}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent border-none outline-none text-white placeholder-blue-100/70 font-bold tracking-wide w-full py-1.5 focus:ring-0"
                    />
                    {isSearching ? (
                      <Loader2 className="w-5 h-5 text-blue-200 animate-spin mr-2" />
                    ) : searchQuery ? (
                      <button onClick={() => setSearchQuery('')} className="mr-2 hover:bg-white/20 rounded-full p-1 transition-colors">
                        <X className="w-4 h-4 text-blue-100" />
                      </button>
                    ) : (
                      <Search className="w-4 h-4 text-blue-200 mr-3" />
                    )}
                  </div>

                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 mt-2 w-full max-w-sm bg-white rounded-xl shadow-2xl overflow-hidden z-50 border border-gray-100 divide-y divide-gray-50">
                      {searchResults.map((city) => (
                        <button
                          key={city.id}
                          onClick={() => handleCitySelect(city)}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex flex-col"
                        >
                          <span className="font-bold text-gray-900">{city.name}</span>
                          <span className="text-xs font-medium text-gray-500">
                            {city.admin1 ? `${city.admin1}, ` : ''}{city.country}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <h2 className="text-7xl font-black tracking-tighter mb-2">
                  {currentWeather?.temp}°<span className="text-5xl text-blue-200">C</span>
                </h2>
                
                <div className="flex items-center mb-8">
                  <p className="text-2xl font-bold text-blue-100">{currentWeather ? t(`weather.${currentWeather.conditionKey}`) : ''}</p>
                  <button 
                    onClick={toggleAudio}
                    title="Play / Pause"
                    className={`ml-4 p-2 rounded-full transition-colors border ${isPlaying ? 'bg-amber-400 border-amber-400 text-white shadow-inner' : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'}`}
                  >
                    {isPlaying ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="text-sm font-medium text-blue-200 flex items-center">
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Activity className="w-4 h-4 mr-2" />}
                {isLoading ? t('synchronizing') : `${t('liveReading')}${currentWeather?.lastUpdated}`}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8 md:mt-0 md:min-w-[280px]">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
                <div className="flex items-center text-blue-200 mb-2">
                  <Droplets className="w-5 h-5 mr-2" /> <span className="text-xs font-bold uppercase tracking-wider">{t('humidity')}</span>
                </div>
                <div className="text-2xl font-black">{currentWeather?.humidity}%</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
                <div className="flex items-center text-blue-200 mb-2">
                  <Wind className="w-5 h-5 mr-2" /> <span className="text-xs font-bold uppercase tracking-wider">{t('wind')}</span>
                </div>
                <div className="text-2xl font-black">{currentWeather?.windSpeed} <span className="text-sm font-medium">km/h</span></div>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
                <div className="flex items-center text-blue-200 mb-2">
                  <CloudRain className="w-5 h-5 mr-2" /> <span className="text-xs font-bold uppercase tracking-wider">{t('rainRisk')}</span>
                </div>
                <div className="text-2xl font-black">{currentWeather?.precipitationChance}%</div>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
                <div className="flex items-center text-blue-200 mb-2">
                  <ThermometerSun className="w-5 h-5 mr-2" /> <span className="text-xs font-bold uppercase tracking-wider">{t('uvIndex')}</span>
                </div>
                <div className="text-2xl font-black">{currentWeather?.uvIndex}</div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/40 border border-gray-100 flex flex-col h-full z-10">
          <h3 className="text-lg font-black text-agri-900 mb-6 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-agri-600" />
            {t('actionPlan')}
          </h3>
          
          {isLoading ? (
             <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-3">
               <Loader2 className="w-8 h-8 animate-spin text-agri-400" />
               <p className="font-medium text-sm">{t('recalculating')}</p>
             </div>
          ) : (
            <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
              {recommendations.length > 0 ? recommendations.map((rec, idx) => (
                <div key={idx} className={`p-4 rounded-2xl border ${
                  rec.type === 'warning' ? 'bg-amber-50/50 border-amber-100' :
                  rec.type === 'success' ? 'bg-emerald-50/50 border-emerald-100' :
                  'bg-blue-50/50 border-blue-100'
                }`}>
                  <div className="flex items-start">
                    <div className="mt-0.5 mr-3 flex-shrink-0">
                      {rec.icon}
                    </div>
                    <div>
                      <h4 className={`text-sm font-bold mb-1 ${
                        rec.type === 'warning' ? 'text-amber-900' :
                        rec.type === 'success' ? 'text-emerald-900' :
                        'text-blue-900'
                      }`}>{t(`recs.${rec.titleKey}`)}</h4>
                      <p className={`text-xs font-medium leading-relaxed ${
                        rec.type === 'warning' ? 'text-amber-800/80' :
                        rec.type === 'success' ? 'text-emerald-800/80' :
                        'text-blue-800/80'
                      }`}>
                        {t(`recs.${rec.descKey}`, rec.dynamicVar)}
                      </p>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-200" />
                  <p className="font-medium text-sm">{t('stableConditions')}</p>
                </div>
              )}
            </div>
          )}
        </motion.div>

      </div>

      <motion.div variants={item} className="bg-white rounded-3xl p-6 md:p-8 shadow-xl shadow-gray-200/40 border border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-black text-agri-900 flex items-center">
            <CalendarDays className="w-5 h-5 mr-2 text-agri-600" />
            {t('predictionModel')}
          </h3>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {forecast.map((day, idx) => (
              <div key={idx} className="flex flex-col items-center p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-agri-50 hover:border-agri-200 transition-all group cursor-pointer">
                <span className="text-sm font-bold text-gray-400 mb-1">{idx === 0 ? t('today') : day.date}</span>
                <span className="text-lg font-black text-agri-900 mb-4">{day.day}</span>
                
                <div className="mb-4 group-hover:scale-110 transition-transform duration-300">
                  {day.icon}
                </div>
                
                <div className="flex items-center space-x-3 w-full justify-center">
                  <span className="text-lg font-black text-agri-900">{day.tempMax}°</span>
                  <span className="text-sm font-bold text-gray-400">{day.tempMin}°</span>
                </div>
                <span className="text-xs font-medium text-gray-500 mt-2 text-center leading-tight">{t(`weather.${day.conditionKey}`)}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

    </motion.div>
  );
}