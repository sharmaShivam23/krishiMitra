'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { IntentResult, processVoiceCommand } from '@/lib/intentEngine';
import { useLocale } from 'next-intl';

type SpeechRecognitionCtor = new () => {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
};

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

// Fallback language codes if primary doesn't work
const LANG_FALLBACKS: Record<string, string[]> = {
  hi: ['hi-IN', 'hi', 'hin', 'hin-IND'],
  pa: ['pa-IN', 'pa', 'pan', 'pan-IND'],
  en: ['en-IN', 'en-US', 'en'],
  mr: ['mr-IN', 'mr', 'mar'],
  bn: ['bn-IN', 'bn', 'ben'],
  te: ['te-IN', 'te', 'tel'],
  ta: ['ta-IN', 'ta', 'tam'],
  gu: ['gu-IN', 'gu', 'guj'],
  kn: ['kn-IN', 'kn', 'kan'],
  ml: ['ml-IN', 'ml', 'mal'],
  or: ['or-IN', 'or', 'ory'],
  ur: ['ur-IN', 'ur', 'urd']
};

const getPreferredLocaleClient = (fallbackLocale: string) => {
  if (typeof window === 'undefined') return fallbackLocale;
  const preferred = window.localStorage.getItem('preferredLocale') || '';
  return preferred || fallbackLocale;
};

// Get the best supported language code for Web Speech API
const getBestLanguageCode = (locale: string) => {
  const baseLocale = locale.split('-')[0];
  const fallbacks = LANG_FALLBACKS[baseLocale] || LANG_FALLBACKS.hi;
  
  // Check which fallback is supported
  if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
    // For Chrome/Safari, just use the first one (they're generally flexible)
    return fallbacks[0];
  }
  
  return fallbacks[0];
};

const getSupportedSpeechLocale = (locale: string) => {
  const baseLocale = locale.split('-')[0].toLowerCase();
  return baseLocale in LANG_FALLBACKS ? baseLocale : 'hi';
};

const pickVoiceForLocale = (locale: string) => {
  const voices = window.speechSynthesis.getVoices();
  const lang = LANG_MAP[locale] || 'hi-IN';
  const baseLang = lang.split('-')[0];

  const exactMatch = voices.find((voice) => voice.lang.toLowerCase() === lang.toLowerCase());
  if (exactMatch) return exactMatch;

  const baseMatch = voices.find((voice) => voice.lang.toLowerCase().startsWith(baseLang.toLowerCase()));
  if (baseMatch) return baseMatch;

  if (locale === 'pa') {
    const hindiFallback = voices.find((voice) => voice.lang.toLowerCase().startsWith('hi'));
    if (hindiFallback) return hindiFallback;
  }

  if (locale === 'en') {
    return voices.find((voice) => voice.lang.toLowerCase().startsWith('en')) || voices[0];
  }

  return undefined;
};

interface StartListeningOptions {
  autoNavigate?: boolean;
  autoSpeak?: boolean;
  onTranscript?: (transcript: string) => void;
  onIntentResolved?: (intent: IntentResult) => void;
  keepAlive?: boolean;
}

export const useVoiceAssistant = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const router = useRouter();
  const locale = useLocale();
  const recognitionRef = useRef<InstanceType<SpeechRecognitionCtor> | null>(null);
  const listeningSessionRef = useRef(0);
  const speakingRequestRef = useRef(0);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const isSupported = typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  const activeLocale = useMemo(() => getPreferredLocaleClient(locale), [locale]);

  const speakAndWait = useCallback((text: string): Promise<void> => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text.trim()) {
      console.warn('[TTS] Cannot speak - browser does not support speech synthesis or text is empty');
      return Promise.resolve();
    }

    const requestId = Date.now();
    speakingRequestRef.current = requestId;
    window.speechSynthesis.cancel();

    return new Promise(async (resolve) => {
      let settled = false;

      const complete = () => {
        if (settled) return;
        settled = true;
        resolve();
      };

      const trySarvamTts = async () => {
        try {
          const response = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text,
              locale: activeLocale
            })
          });

          if (!response.ok) return false;

          const data = await response.json();
          const audioBase64 = typeof data?.audioBase64 === 'string' ? data.audioBase64 : null;
          const mimeType = typeof data?.mimeType === 'string' ? data.mimeType : 'audio/wav';

          if (!audioBase64) return false;

          const audio = new Audio(`data:${mimeType};base64,${audioBase64}`);
          currentAudioRef.current?.pause();
          currentAudioRef.current = audio;

          audio.onended = () => {
            if (currentAudioRef.current === audio) {
              currentAudioRef.current = null;
            }
            complete();
          };

          audio.onerror = () => {
            if (currentAudioRef.current === audio) {
              currentAudioRef.current = null;
            }
            complete();
          };

          await audio.play();
          return true;
        } catch {
          return false;
        }
      };

      const sarvamPlayed = await trySarvamTts();
      if (sarvamPlayed) return;

      const speakNow = () => {
        if (speakingRequestRef.current !== requestId) {
          complete();
          return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        const selectedVoice = pickVoiceForLocale(activeLocale);
        const langCode = getBestLanguageCode(activeLocale);

        utterance.lang = langCode;
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }

        utterance.onstart = () => {
          console.log(`[TTS] ▶ Started speaking in ${activeLocale} (${langCode}), voice: ${selectedVoice?.name || 'system-default'}, text: "${text.substring(0, 40)}${text.length > 40 ? '...' : ''}"`);
        };

        utterance.onend = () => {
          console.log(`[TTS] ✓ Finished speaking in ${activeLocale}`);
          complete();
        };

        utterance.onerror = (event) => {
          console.error(`[TTS] ✗ Error (${event.error}):`, event);
          complete();
        };

        console.log(`[TTS] Queuing speech: ${text.length} chars in ${activeLocale} (lang: ${langCode})`);
        window.speechSynthesis.speak(utterance);
      };

      const existingVoices = window.speechSynthesis.getVoices();
      if (existingVoices.length > 0) {
        speakNow();
        return;
      }

      const timer = setTimeout(() => {
        speakNow();
      }, 200);

      const previousHandler = window.speechSynthesis.onvoiceschanged;
      window.speechSynthesis.onvoiceschanged = () => {
        clearTimeout(timer);
        speakNow();
        window.speechSynthesis.onvoiceschanged = previousHandler;
      };
    });
  }, [activeLocale]);

  const speak = useCallback((text: string) => {
    void speakAndWait(text);
  }, [speakAndWait]);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
  }, []);

  const startListening = useCallback((options: StartListeningOptions = {}) => {
    const {
      autoNavigate = true,
      autoSpeak = true,
      onTranscript,
      onIntentResolved,
      keepAlive = false
    } = options;

    const speechWindow = window as SpeechWindow;
    const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Your browser does not support voice input.");
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const sessionId = Date.now();
    listeningSessionRef.current = sessionId;

    stopSpeaking();

    recognitionRef.current = new SpeechRecognition();
    
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    
    const speechLocale = getSupportedSpeechLocale(activeLocale);
    const langCode = getBestLanguageCode(speechLocale);
    recognitionRef.current.lang = langCode;
    
    // Debug: log the language setting
    console.log(`[SpeechRecognition] Active locale: ${activeLocale}, Speech locale: ${speechLocale}, Language code: ${langCode}`);

    recognitionRef.current.onstart = () => {
      if (listeningSessionRef.current !== sessionId) return;
      setIsListening(true);
      setTranscript('');
      console.log(`[SpeechRecognition] Started listening in ${activeLocale} (${langCode})`);
    };

    recognitionRef.current.onresult = (event) => {
      if (listeningSessionRef.current !== sessionId) return;
      const currentTranscript = event.results[0][0].transcript;
      setTranscript(currentTranscript);
      onTranscript?.(currentTranscript);
      
      const result = processVoiceCommand(currentTranscript, activeLocale);
      onIntentResolved?.(result);
      
      if (autoSpeak) {
        speak(result.responseSpeech);
      }

      // if (autoNavigate && result.action === 'navigate' && result.path) {
      //   setTimeout(() => {
      //     router.push(result.path);
      //   }, 1100);
      // }
      if (autoNavigate && result.action === 'navigate' && result.path) {
  setTimeout(() => {
    if (result.path) {
      router.push(result.path);
    }
  }, 1100);
}

      if (keepAlive && recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };

    recognitionRef.current.onerror = (event) => {
      if (listeningSessionRef.current !== sessionId) return;
      console.warn(`[SpeechRecognition] Error (${activeLocale}):`, event.error);

      setIsListening(false);

      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        if (autoSpeak) {
          speak(activeLocale === 'pa'
            ? 'ਮਾਈਕ ਦੀ ਇਜਾਜ਼ਤ ਨਹੀਂ ਮਿਲੀ। ਕਿਰਪਾ ਕਰਕੇ ਬਰਾਊਜ਼ਰ ਵਿੱਚ ਮਾਈਕ ਦੀ ਇਜਾਜ਼ਤ ਦਿਓ।'
            : activeLocale === 'en'
              ? 'Microphone permission is blocked. Please allow mic access in your browser settings.'
              : 'Microphone permission band hai. Browser settings me mic access allow karein.');
        }
      } else if (event.error === 'no-speech') {
        if (autoSpeak) {
          speak(activeLocale === 'pa'
            ? 'ਕੋਈ ਆਵਾਜ਼ ਨਹੀਂ ਸੁਣੀ, ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।'
            : activeLocale === 'en'
              ? 'I could not hear your voice clearly. Please try again.'
              : 'Koi aawaz clear nahi aayi. KrishiSarthi se baat karne ke liye dobara koshish karein.');
        }
      } else if (event.error === 'network') {
        if (autoSpeak) {
          speak(activeLocale === 'pa'
            ? 'ਵਾਇਸ ਸੇਵਾ ਨਾਲ ਕਨੈਕਸ਼ਨ ਸਮੱਸਿਆ ਆਈ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।'
            : activeLocale === 'en'
              ? 'Voice service connection issue. Please try again.'
              : 'Voice service connection issue aayi hai. Kripya dobara koshish karein.');
        }
      } else {
        // Generic error feedback for other errors
        if (autoSpeak) {
          console.warn(`[SpeechRecognition] Unhandled error: ${event.error}`);
          speak(activeLocale === 'pa'
            ? 'ਮਾਈਕ ਸਮੱਸਿਆ ਆ ਗਈ। ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।'
            : activeLocale === 'en'
              ? 'There was an issue with voice input. Please try again.'
              : 'Voice me problem aa gayi. Dobara koshish karein.');
        }
      }
    };

    recognitionRef.current.onend = () => {
      if (listeningSessionRef.current !== sessionId) return;
      setIsListening(false);
    };

    recognitionRef.current.start();
  }, [activeLocale, isListening, router, speak, stopSpeaking]);

  const stopListening = useCallback(() => {
    listeningSessionRef.current = Date.now();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    startListening,
    stopListening,
    speak,
    speakAndWait,
    stopSpeaking,
    activeLocale
  };
};
