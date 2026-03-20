'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { processVoiceCommand } from '@/lib/intentEngine';
import { useLocale } from 'next-intl';

export const useVoiceAssistant = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const router = useRouter();
  const locale = useLocale();
  const recognitionRef = useRef<any>(null);

  // Map Next.js locales to Speech API language codes
  const langMap: Record<string, string> = { en: 'en-IN', hi: 'hi-IN', pa: 'pa-IN' };

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // Stop any ongoing speech
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langMap[locale] || 'hi-IN';
    utterance.rate = 0.9; // Slightly slower for better understanding
    window.speechSynthesis.speak(utterance);
  }, [locale]);

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Your browser does not support voice input.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = langMap[locale] || 'hi-IN'; // Listen in user's preferred language

    recognitionRef.current.onstart = () => {
      setIsListening(true);
      setTranscript('');
      // Optional: Play a short beep here to indicate listening started
    };

    recognitionRef.current.onresult = (event: any) => {
      const currentTranscript = event.results[0][0].transcript;
      setTranscript(currentTranscript);
      
      // Pass the text to our Brain
      const result = processVoiceCommand(currentTranscript, locale);
      
      // Speak the response
      speak(result.responseSpeech);

      // Execute Action
      if (result.action === 'navigate' && result.path) {
        setTimeout(() => {
          router.push(result.path!);
        }, 1500); // Wait 1.5s so the user hears the response before the page unmounts
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      if (event.error === 'no-speech') {
        speak(locale === 'pa' ? 'ਕੋਈ ਆਵਾਜ਼ ਨਹੀਂ ਸੁਣੀ, ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।' : 'Koi aawaz nahi aayi, dobara koshish karein.');
      }
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.start();
  }, [locale, router, speak]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    speak
  };
};