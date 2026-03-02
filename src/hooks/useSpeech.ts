'use client';
import { useState, useEffect } from 'react';

export const useSpeech = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    // Fetch voices immediately, and also listen for them to load
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    
    if (typeof window !== 'undefined' && window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const speak = (textToRead: string) => {
    if (!window.speechSynthesis) {
      alert("Text-to-speech not supported in this browser.");
      return;
    }

    window.speechSynthesis.cancel(); // Stop any current audio

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.85; // Slower speed so farmers can understand clearly
    utterance.pitch = 1;

    // Get fresh voices just in case
    const currentVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices();

    // The Magic Hierarchy: Look for Hindi -> then Indian English -> then any Google Voice -> then Default
    const bestVoice = 
      currentVoices.find(v => v.lang === 'hi-IN' || v.lang === 'hi') || 
      currentVoices.find(v => v.lang === 'en-IN') || 
      currentVoices.find(v => v.name.includes('Google हिन्दी')) ||
      currentVoices[0];

    if (bestVoice) {
      utterance.voice = bestVoice;
      utterance.lang = bestVoice.lang; // Force utterance to match the voice's native language
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