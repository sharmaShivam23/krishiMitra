'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import {
  Landmark, Search, Filter, ExternalLink, Sparkles,
  CheckCircle2, FileText, IndianRupee, ShieldCheck, AlertCircle, Loader2,
  Volume2, VolumeX, ChevronDown
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { requestKrishiSarthi } from '@/lib/krishiSarthi';

interface SchemeData {
  _id: string;
  name?: string;
  category?: string;
  state?: string;
  benefits?: string;
  eligibility?: string[];
  deadline?: string;
  link?: string;
}

type SupportedTtsLocale = 'en' | 'hi' | 'pa' | 'mr' | 'bn' | 'te' | 'ta' | 'gu' | 'kn' | 'ml' | 'or' | 'ur';

const stateToLocaleMap: Record<string, SupportedTtsLocale> = {
  punjab: 'pa',
  haryana: 'hi',
  'uttar pradesh': 'hi',
  bihar: 'hi',
  rajasthan: 'hi',
  delhi: 'hi',
  maharashtra: 'mr',
  gujarat: 'gu',
  'west bengal': 'bn',
  telangana: 'te',
  'andhra pradesh': 'te',
  tamilnadu: 'ta',
  'tamil nadu': 'ta',
  karnataka: 'kn',
  kerala: 'ml',
  odisha: 'or',
  orissa: 'or'
};

const normalizeLocaleForTts = (locale: string): SupportedTtsLocale => {
  const base = locale.toLowerCase().split('-')[0];
  const supported: SupportedTtsLocale[] = ['en', 'hi', 'pa', 'mr', 'bn', 'te', 'ta', 'gu', 'kn', 'ml', 'or', 'ur'];
  return (supported.includes(base as SupportedTtsLocale) ? base : 'hi') as SupportedTtsLocale;
};

const localeMessages: Record<SupportedTtsLocale, {
  benefits: string;
  eligibility: string;
  deadline: string;
  ongoing: string;
  apply: string;
}> = {
  en: { benefits: 'Benefits', eligibility: 'Eligibility', deadline: 'Deadline', ongoing: 'Ongoing', apply: 'Apply through official portal or local agriculture office.' },
  hi: { benefits: 'मुख्य लाभ', eligibility: 'पात्रता', deadline: 'अंतिम तिथि', ongoing: 'चालू', apply: 'आवेदन आधिकारिक पोर्टल या स्थानीय कृषि कार्यालय से करें।' },
  pa: { benefits: 'ਮੁੱਖ ਫਾਇਦੇ', eligibility: 'ਯੋਗਤਾ', deadline: 'ਆਖਰੀ ਮਿਤੀ', ongoing: 'ਜਾਰੀ', apply: 'ਆਫੀਸ਼ਲ ਪੋਰਟਲ ਜਾਂ ਸਥਾਨਕ ਖੇਤੀ ਦਫ਼ਤਰ ਰਾਹੀਂ ਅਰਜ਼ੀ ਕਰੋ।' },
  mr: { benefits: 'मुख्य लाभ', eligibility: 'पात्रता', deadline: 'अंतिम तारीख', ongoing: 'सुरू', apply: 'अधिकृत पोर्टल किंवा स्थानिक कृषी कार्यालयातून अर्ज करा.' },
  bn: { benefits: 'মূল সুবিধা', eligibility: 'যোগ্যতা', deadline: 'শেষ তারিখ', ongoing: 'চলমান', apply: 'অফিশিয়াল পোর্টাল বা স্থানীয় কৃষি অফিসের মাধ্যমে আবেদন করুন।' },
  te: { benefits: 'ప్రధాన ప్రయోజనాలు', eligibility: 'అర్హత', deadline: 'చివరి తేదీ', ongoing: 'కొనసాగుతోంది', apply: 'అధికారిక పోర్టల్ లేదా స్థానిక వ్యవసాయ కార్యాలయం ద్వారా దరఖాస్తు చేయండి.' },
  ta: { benefits: 'முக்கிய நன்மைகள்', eligibility: 'தகுதி', deadline: 'கடைசி தேதி', ongoing: 'நடைமுறை', apply: 'அதிகாரப்பூர்வ தளம் அல்லது உள்ளூர் வேளாண்மை அலுவலகம் மூலம் விண்ணப்பிக்கவும்.' },
  gu: { benefits: 'મુખ્ય લાભ', eligibility: 'પાત્રતા', deadline: 'અંતિમ તારીખ', ongoing: 'ચાલુ', apply: 'અધિકૃત પોર્ટલ અથવા સ્થાનિક કૃષિ કચેરી દ્વારા અરજી કરો.' },
  kn: { benefits: 'ಮುಖ್ಯ ಲಾಭಗಳು', eligibility: 'ಅರ್ಹತೆ', deadline: 'ಕೊನೆಯ ದಿನಾಂಕ', ongoing: 'ನಡೆಯುತ್ತಿದೆ', apply: 'ಅಧಿಕೃತ ಪೋರ್ಟಲ್ ಅಥವಾ ಸ್ಥಳೀಯ ಕೃಷಿ ಕಚೇರಿಯ ಮೂಲಕ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.' },
  ml: { benefits: 'പ്രധാന ഗുണങ്ങള്‍', eligibility: 'അര്‍ഹത', deadline: 'അവസാന തീയതി', ongoing: 'തുടരുന്നു', apply: 'ഔദ്യോഗിക പോർട്ടൽ അല്ലെങ്കിൽ പ്രാദേശിക കൃഷി ഓഫീസിലൂടെ അപേക്ഷിക്കുക.' },
  or: { benefits: 'ମୁଖ୍ୟ ଲାଭ', eligibility: 'ଯୋଗ୍ୟତା', deadline: 'ଶେଷ ତାରିଖ', ongoing: 'ଚାଲୁଛି', apply: 'ଅଧିକାରିକ ପୋର୍ଟାଲ୍ କିମ୍ବା ସ୍ଥାନୀୟ କୃଷି କାର୍ଯ୍ୟାଳୟ ମାଧ୍ୟମରେ ଆବେଦନ କରନ୍ତୁ।' },
  ur: { benefits: 'اہم فوائد', eligibility: 'اہلیت', deadline: 'آخری تاریخ', ongoing: 'جاری', apply: 'درخواست آفیشل پورٹل یا مقامی زرعی دفتر سے کریں۔' }
};

const pickLocaleForScheme = (appLocale: string, schemeState?: string): SupportedTtsLocale => {
  const normalizedState = (schemeState || '').toLowerCase().trim();
  for (const [stateKey, mappedLocale] of Object.entries(stateToLocaleMap)) {
    if (normalizedState.includes(stateKey)) {
      return mappedLocale;
    }
  }
  return normalizeLocaleForTts(appLocale);
};

const makeSchemeSummary = (scheme: SchemeData, locale: SupportedTtsLocale) => {
  const labels = localeMessages[locale] || localeMessages.hi;
  const name = scheme.name?.trim() || 'Scheme';
  const benefits = scheme.benefits?.trim() || '';
  const eligibility = (scheme.eligibility || []).filter(Boolean).slice(0, 2).join(', ');
  const deadline = scheme.deadline?.trim() || labels.ongoing;

  return `${name}. ${labels.benefits}: ${benefits}. ${labels.eligibility}: ${eligibility || labels.ongoing}. ${labels.deadline}: ${deadline}. ${labels.apply}`;
};

export default function GovernmentSchemes() {
  const t = useTranslations('GovernmentSchemes');
  const locale = useLocale();
  const [schemes, setSchemes] = useState<SchemeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSchemeId, setActiveSchemeId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const reelsRef = useRef<HTMLDivElement | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        const res = await fetch(`/api/schemes?locale=${encodeURIComponent(locale)}`);
        const data = await res.json(); 
        if (!res.ok || !data.success) {
          throw new Error(data.message || t('errorTitle'));
        }
        const fetchedSchemes = data.schemes || [];
        setSchemes(fetchedSchemes);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : t('errorTitle'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchSchemes();

    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
      }
    };
  }, [locale, t]);

  const toggleAudio = async (scheme: SchemeData) => {
    if (playingId === scheme._id) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
      }
      setPlayingId(null);
      return;
    }

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }

    setPlayingId(scheme._id);

    try {
      const targetLocale = pickLocaleForScheme(locale, scheme.state);
      const text = makeSchemeSummary(scheme, targetLocale);

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, locale: targetLocale })
      });

      if (!response.ok) {
        throw new Error('Failed to generate scheme summary audio.');
      }

      const data = await response.json();
      const audioBase64 = typeof data?.audioBase64 === 'string' ? data.audioBase64 : null;
      const mimeType = typeof data?.mimeType === 'string' ? data.mimeType : 'audio/wav';

      if (!audioBase64) {
        throw new Error('Invalid audio response.');
      }

      const audio = new Audio(`data:${mimeType};base64,${audioBase64}`);
      currentAudioRef.current = audio;
      audio.onended = () => {
        if (currentAudioRef.current === audio) {
          currentAudioRef.current = null;
        }
        setPlayingId(null);
      };
      audio.onerror = () => {
        if (currentAudioRef.current === audio) {
          currentAudioRef.current = null;
        }
        setPlayingId(null);
      };

      await audio.play();
    } catch (audioError) {
      console.error('[Schemes TTS] Sarvam summary playback failed:', audioError);
      setPlayingId(null);
    }
  };

  const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120 } }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'Financial Support':
        return <IndianRupee className="w-6 h-6 text-emerald-500" />;
      case 'Insurance':
        return <ShieldCheck className="w-6 h-6 text-blue-500" />;
      case 'Credit & Loans':
        return <Landmark className="w-6 h-6 text-amber-500" />;
      default:
        return <FileText className="w-6 h-6 text-gray-500" />;
    }
  };

  const categories = useMemo(() => {
    const unique = Array.from(new Set(schemes.map(s => s.category || t('general'))));
    return ['All', ...unique];
  }, [schemes, t]);

  const filteredSchemes = useMemo(() => {
    return schemes.filter(scheme => {
      const safeName = (scheme.name || '').toLowerCase();
      const safeBenefits = (scheme.benefits || '').toLowerCase();
      const safeSearch = searchQuery.toLowerCase();

      const matchesSearch = safeName.includes(safeSearch) || safeBenefits.includes(safeSearch);
      const matchesCategory = activeCategory === 'All' || scheme.category === activeCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [schemes, searchQuery, activeCategory]);

  useEffect(() => {
    setActiveReelIndex(0);
    if (reelsRef.current) {
      reelsRef.current.scrollTop = 0;
    }
  }, [searchQuery, activeCategory]);

  const handleReelsScroll = () => {
    const container = reelsRef.current;
    if (!container) return;

    const itemHeight = container.clientHeight;
    if (itemHeight <= 0) return;

    const nextIndex = Math.round(container.scrollTop / itemHeight);
    if (nextIndex !== activeReelIndex) {
      setActiveReelIndex(nextIndex);
    }
  };

  const activeScheme = filteredSchemes[Math.min(activeReelIndex, Math.max(filteredSchemes.length - 1, 0))];

  const buildAskAiPrompt = useCallback(() => {
    const scheme = activeScheme;
    const benefits = scheme?.benefits?.trim();
    const eligibility = (scheme?.eligibility || []).filter(Boolean).slice(0, 3).join('; ');
    const filters = [
      activeCategory !== 'All' ? `Category filter: ${activeCategory}.` : '',
      searchQuery ? `Search query: ${searchQuery}.` : ''
    ].filter(Boolean).join(' ');

    const schemeBlock = scheme
      ? `Active scheme: ${scheme.name || 'unknown'}. State: ${scheme.state || 'unknown'}. ${benefits ? `Benefits: ${benefits}.` : ''} ${eligibility ? `Eligibility: ${eligibility}.` : ''}`
      : 'No specific scheme is selected.';

    return `I am on the Government Schemes page. ${filters} ${schemeBlock} Please explain who is eligible, required documents, and how to apply in short steps. If something important is missing, ask one short follow-up question. Use saved farmer profile if available.`;
  }, [activeScheme, activeCategory, searchQuery]);

  const handleAskAi = useCallback(() => {
    requestKrishiSarthi({
      prompt: buildAskAiPrompt(),
      autoSend: true,
      context: {
        module: 'schemes',
        route: '/dashboard/schemes',
        summary: 'User is exploring schemes. Prioritize eligibility, documents, and application steps for the active scheme or filtered list.'
      }
    });
  }, [buildAskAiPrompt]);

  const jumpToReel = (index: number) => {
    const container = reelsRef.current;
    if (!container) return;
    container.scrollTo({ top: container.clientHeight * index, behavior: 'smooth' });
  };

  const renderSchemeCard = (scheme: SchemeData, mode: 'grid' | 'reel' = 'grid') => {
    const isReel = mode === 'reel';
    const isExpanded = !isReel && activeSchemeId === scheme._id;

    if (!isReel) {
      /* ── GRID MODE: accordion card ── */
      return (
        <motion.div
          key={scheme._id}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.22 }}
          className={`bg-white rounded-3xl border shadow-lg shadow-gray-200/40 overflow-hidden transition-all cursor-pointer ${isExpanded ? 'border-agri-200 shadow-xl shadow-agri-900/10' : 'border-gray-100 hover:border-agri-100 hover:shadow-xl'}`}
          onClick={() => setActiveSchemeId(isExpanded ? null : scheme._id)}
        >
          {/* Always-visible header — only icon + title + audio + chevron */}
          <div className="flex items-center gap-3 p-5">
            <div className="p-2.5 bg-gray-50 rounded-2xl border border-gray-100 shrink-0">
              {getCategoryIcon(scheme.category)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-black text-agri-900 leading-tight">{scheme.name || t('unnamed')}</h3>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); toggleAudio(scheme); }}
                className={`p-2 rounded-full transition-colors ${playingId === scheme._id ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400 hover:bg-agri-50 hover:text-agri-600'}`}
              >
                {playingId === scheme._id ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <div className={`p-1.5 rounded-full transition-all ${isExpanded ? 'bg-agri-100 text-agri-700' : 'bg-gray-100 text-gray-400'}`}>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
              </div>
            </div>
          </div>

          {/* Expandable body */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
                  <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
                    <h4 className="text-sm font-bold text-emerald-900 mb-1 flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" /> {t('primaryBenefits')}
                    </h4>
                    <p className="text-emerald-800 text-sm font-medium leading-relaxed">{scheme.benefits || t('noDetails')}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                      <FileText className="w-4 h-4 mr-1.5 text-gray-400" /> {t('eligibility')}
                    </h4>
                    <ul className="space-y-1.5">
                      {(scheme.eligibility || []).slice(0, 6).map((criterion, idx) => (
                        <li key={idx} className="text-sm text-gray-600 font-medium flex items-start">
                          <span className="w-1.5 h-1.5 rounded-full mt-1.5 mr-2 shrink-0 bg-agri-400" />
                          {criterion}
                        </li>
                      ))}
                      {(!scheme.eligibility || scheme.eligibility.length === 0) && (
                        <li className="text-sm text-gray-500 italic">{t('noEligibility')}</li>
                      )}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">{t('deadline')}</p>
                      <p className="font-black text-agri-900">{scheme.deadline || t('ongoing')}</p>
                    </div>
                    {scheme.link ? (
                      <a
                        href={scheme.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center text-sm font-bold text-agri-900 bg-agri-400 hover:bg-agri-500 px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-agri-400/30 group"
                      >
                        {t('applyNow')} <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </a>
                    ) : (
                      <button onClick={(e) => e.stopPropagation()} className="flex items-center text-sm font-bold text-gray-500 bg-gray-100 px-5 py-2.5 rounded-xl cursor-not-allowed">
                        {t('checkLocal')}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      );
    }

    /* ── REEL MODE: unchanged ── */
    return (
      <motion.div
        key={scheme._id}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.22 }}
        className="relative bg-linear-to-br from-[#04241d] via-[#07513c] to-[#0b6a50] text-white rounded-none pl-5 pr-16 pt-44 pb-20 shadow-[0_18px_50px_-26px_rgba(2,44,34,0.9)] flex flex-col min-h-full overflow-hidden"
      >
        <div className="absolute -right-12 -top-10 h-44 w-44 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute -left-14 bottom-12 h-44 w-44 rounded-full bg-lime-300/15 blur-3xl" />
        <div className="absolute inset-0 bg-linear-to-t from-black/40 via-black/15 to-black/20" />

        <div className="relative z-10 flex flex-wrap items-center gap-2 mb-4">
          <span className="text-[11px] font-bold text-emerald-100 bg-white/10 px-2.5 py-1 rounded-lg border border-white/20">
            {scheme.category || t('general')}
          </span>
          <span className="text-[11px] font-bold text-white/90 bg-white/10 px-2.5 py-1 rounded-lg border border-white/20">
            {scheme.state || t('allStates')}
          </span>
        </div>

        <div className="relative z-10 flex-1 space-y-4 my-1">
          <div className="bg-black/25 p-4 rounded-2xl border border-white/25 backdrop-blur-md">
            <h4 className="text-sm font-bold text-emerald-100 mb-1 flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-300" /> {t('primaryBenefits')}
            </h4>
            <p className="text-white text-sm font-semibold leading-relaxed">{scheme.benefits || t('noDetails')}</p>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-2 flex items-center">
              <FileText className="w-4 h-4 mr-1.5 text-emerald-200" /> {t('eligibility')}
            </h4>
            <ul className="space-y-2">
              {(scheme.eligibility || []).slice(0, 4).map((criterion, idx) => (
                <li key={idx} className="text-sm text-white/95 font-semibold flex items-start">
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 mr-2 shrink-0 bg-emerald-300" />
                  {criterion}
                </li>
              ))}
              {(!scheme.eligibility || scheme.eligibility.length === 0) && (
                <li className="text-sm text-white/70 italic">{t('noEligibility')}</li>
              )}
            </ul>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between pt-4 mt-auto border-t border-white/20">
          <div>
            <p className="text-[11px] text-white/70 font-bold uppercase tracking-wider mb-0.5">{t('deadline')}</p>
            <p className="font-black text-emerald-100">{scheme.deadline || t('ongoing')}</p>
          </div>
          {scheme.link ? (
            <a href={scheme.link} target="_blank" rel="noopener noreferrer"
              className="flex items-center text-sm font-bold text-agri-900 bg-emerald-300 hover:bg-emerald-200 px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-emerald-900/20 group">
              {t('applyNow')} <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          ) : (
            <button className="flex items-center text-sm font-bold text-white/80 bg-white/10 px-4 py-2.5 rounded-xl cursor-not-allowed border border-white/20">
              {t('checkLocal')}
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-7xl mx-auto md:px-0">
      <motion.div variants={item} className="hidden md:block mb-6 md:mb-8">
        <h1 className="text-[2.05rem] leading-[1.05] md:text-4xl font-black text-agri-900 tracking-tight flex items-center">
          <Landmark className="w-8 h-8 mr-3 text-agri-600" />
          {t('title')}
        </h1>
        <p className="text-gray-600 mt-2 font-semibold max-w-2xl">
          {t('subtitle')}
        </p>
        <button
          type="button"
          onClick={handleAskAi}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-agri-300 bg-agri-100 text-agri-900 font-black hover:bg-agri-200 transition shadow-sm"
        >
          <Landmark className="w-4 h-4" />
          Ask Sarthi
        </button>
      </motion.div>

      <motion.div variants={item} className="hidden md:flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-11 pr-4 py-3.5 bg-white border text-black border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-agri-400 font-medium transition-all"
          />
        </div>
        
        {categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
            {categories.map((category, index) => (
              <button
                key={index}
                onClick={() => setActiveCategory(category)}
                className={`px-5 py-3.5 rounded-2xl font-bold whitespace-nowrap transition-all flex items-center ${
                  activeCategory === category 
                    ? 'bg-agri-900 text-white shadow-lg shadow-agri-900/20' 
                    : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {category === 'All' ? <Filter className="w-4 h-4 mr-2" /> : null}
                {category === 'All' ? t('categories.All') : category}
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-agri-600 mb-4" />
          <p className="text-gray-500 font-medium">{t('syncing')}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 p-6 rounded-2xl flex flex-col items-center justify-center text-red-700 mb-6 py-12">
          <AlertCircle className="w-10 h-10 mb-3" />
          <span className="font-bold text-lg">{t('errorTitle')}</span>
          <span className="text-sm">{error}</span>
        </div>
      )}

      {!isLoading && !error && (
        <>
          <div className="md:hidden">
            <AnimatePresence>
              {filteredSchemes.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-10 text-center text-gray-500 font-medium bg-white rounded-3xl border border-gray-100"
                >
                  {t('noSchemes')}
                </motion.div>
              ) : (
                <>
                  <div className="relative mx-0 border-y border-black/10 bg-[#021c17] overflow-hidden" style={{ height: 'calc(100dvh - 6.4rem)' }}>
                    <div className="absolute top-0 left-0 right-0 z-20 p-3">
                      <div className="rounded-2xl border border-white/20 bg-black/35 backdrop-blur-md px-3 py-2.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="text-xl font-black text-white leading-tight">{t('title')}</h2>
                            {activeScheme && (
                              <p className="mt-0.5 text-sm font-bold text-emerald-100/95 line-clamp-1">{activeScheme.name || t('unnamed')}</p>
                            )}
                          </div>
                          <p className="text-sm font-black text-emerald-100">{Math.min(activeReelIndex + 1, filteredSchemes.length)} / {filteredSchemes.length}</p>
                        </div>

                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={handleAskAi}
                            className="h-10 px-3 rounded-xl border border-emerald-200/30 bg-emerald-300/20 text-emerald-50 font-black text-sm inline-flex items-center gap-1.5"
                          >
                            <Sparkles className="w-4 h-4" />
                            Ask
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowSearchPanel((prev) => !prev)}
                            className="h-10 px-3 rounded-xl border border-white/25 bg-white/10 text-white font-bold text-sm inline-flex items-center gap-1.5"
                          >
                            <Search className="w-4 h-4" />
                            Search
                          </button>
                        </div>

                        <AnimatePresence>
                          {showSearchPanel && (
                            <motion.div
                              initial={{ opacity: 0, y: -8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              className="mt-2 space-y-2"
                            >
                              <div className="relative">
                                <Search className="w-4 h-4 text-white/60 absolute left-3 top-3" />
                                <input
                                  type="text"
                                  placeholder={t('searchPlaceholder')}
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  className="w-full h-10 rounded-xl pl-9 pr-3 bg-white/10 text-white placeholder:text-white/55 border border-white/25 outline-none"
                                />
                              </div>

                              {categories.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
                                  {categories.map((category, index) => (
                                    <button
                                      key={index}
                                      onClick={() => setActiveCategory(category)}
                                      className={`h-9 px-3.5 rounded-xl text-sm font-black whitespace-nowrap border inline-flex items-center gap-1.5 ${
                                        activeCategory === category
                                          ? 'bg-emerald-300 text-[#06352a] border-emerald-200'
                                          : 'bg-white/10 text-white border-white/20'
                                      }`}
                                    >
                                      {category === 'All' ? <Filter className="w-3.5 h-3.5" /> : null}
                                      {category === 'All' ? t('categories.All') : category}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => activeScheme && toggleAudio(activeScheme)}
                        className={`w-11 h-11 rounded-full border inline-flex items-center justify-center ${activeScheme && playingId === activeScheme._id ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-white/15 text-white border-white/25 backdrop-blur-sm'}`}
                      >
                        {activeScheme && playingId === activeScheme._id ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      </button>

                      {activeScheme?.link ? (
                        <a
                          href={activeScheme.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-11 h-11 rounded-full bg-emerald-400 text-agri-900 border border-emerald-200 inline-flex items-center justify-center"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </a>
                      ) : (
                        <span className="w-11 h-11 rounded-full bg-white/12 border border-white/20 inline-flex items-center justify-center text-white/60">
                          <ExternalLink className="w-5 h-5" />
                        </span>
                      )}

                      <div className="mt-2 flex flex-col items-center gap-1.5">
                        {filteredSchemes.map((_, idx) => (
                          <button
                            key={`dot-${idx}`}
                            type="button"
                            onClick={() => jumpToReel(idx)}
                            className={`rounded-full transition-all ${idx === activeReelIndex ? 'h-6 w-1.5 bg-emerald-300' : 'h-2 w-2 bg-white/45'}`}
                            aria-label={`Go to scheme ${idx + 1}`}
                          />
                        ))}
                      </div>
                    </div>

                  <div
                    ref={reelsRef}
                    onScroll={handleReelsScroll}
                    className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide"
                  >
                    {filteredSchemes.map((scheme) => (
                      <div key={`reel-${scheme._id}`} className="snap-start h-full">
                        {renderSchemeCard(scheme, 'reel')}
                      </div>
                    ))}
                  </div>

                  </div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="hidden md:flex md:flex-col gap-6">
            <AnimatePresence>
              {filteredSchemes.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="col-span-full p-12 text-center text-gray-500 font-medium bg-white rounded-3xl border border-gray-100"
                >
                  {t('noSchemes')}
                </motion.div>
              ) : (
                filteredSchemes.map((scheme) => renderSchemeCard(scheme, 'grid'))
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </motion.div>
  );
}