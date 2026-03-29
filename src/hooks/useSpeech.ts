'use client';
import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';

const LANG_MAP: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  pa: 'pa-IN',
  mr: 'mr-IN',
  bn: 'bn-IN',
  te: 'te-IN',
  ta: 'ta-IN',
  gu: 'gu-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  or: 'or-IN',
  ur: 'ur-IN'
};

export const useSpeech = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const locale = useLocale();

  const getActiveLocale = () => {
    if (typeof window === 'undefined') return locale;
    return window.localStorage.getItem('preferredLocale') || locale;
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    
    if (typeof window !== 'undefined' && window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const speak = (textToRead: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert("Text-to-speech not supported in this browser.");
      return;
    }

    if (!textToRead.trim()) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    const activeLocale = getActiveLocale();
    const preferredLang = LANG_MAP[activeLocale] || 'hi-IN';
    const preferredBase = preferredLang.split('-')[0];

    const currentVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices();

    const bestVoice = 
      currentVoices.find(v => v.lang === preferredLang) ||
      currentVoices.find(v => v.lang.toLowerCase().startsWith(preferredBase.toLowerCase())) ||
      currentVoices.find(v => v.lang === 'en-IN') || 
      currentVoices[0];

    if (bestVoice) {
      utterance.voice = bestVoice;
      utterance.lang = bestVoice.lang;
    } else {
      utterance.lang = preferredLang;
    }

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  return { speak, stop, isPlaying };
};