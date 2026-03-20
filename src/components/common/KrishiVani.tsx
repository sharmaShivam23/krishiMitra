'use client';

import React, { useState, useEffect } from 'react';
import { Mic, Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function KrishiVani() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const router = useRouter();

  // Speech Recognition Setup
  const startListening = () => {
    // Check for browser support
 const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Your browser does not support voice search. Please use Google Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN'; // Set to Hindi
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('बोलिए, हम सुन रहे हैं... (Speak now)');
    };

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript.toLowerCase();
      setTranscript(`आपने कहा: "${speechToText}"`);
      
      // Simple routing logic based on Hindi/English keywords
      setTimeout(() => {
        if (speechToText.includes('tractor') || speechToText.includes('machine') || speechToText.includes('ट्रैक्टर') || speechToText.includes('ट्रॅक्टर') || speechToText.includes('ট্র্যাক্টর') || speechToText.includes('ట్రాక్టర్') || speechToText.includes('டிராக்டர்')) {
          router.push('/dashboard/Services?category=Tractor');
        } else if (speechToText.includes('mandi') || speechToText.includes('price') || speechToText.includes('भाव') || speechToText.includes('मंडी') || speechToText.includes('মান্ডি') || speechToText.includes('మండి') || speechToText.includes('மண்டி')) {
          router.push('/dashboard/mandi-prices');
        } else if (speechToText.includes('yojana') || speechToText.includes('scheme') || speechToText.includes('योजना') || speechToText.includes('স্কিম') || speechToText.includes('పధకం') || speechToText.includes('திட்டம்')) {
          router.push('/dashboard/schemes');
        } else {
          setTranscript('क्षमा करें, समझ नहीं आया। (Sorry, didn\'t catch that)');
        }
        setTimeout(() => setIsListening(false), 2000);
      }, 1500);
    };

    recognition.onerror = () => {
      setTranscript('आवाज़ नहीं आ रही है। (No audio detected)');
      setTimeout(() => setIsListening(false), 2000);
    };

    recognition.onend = () => {
      if (transcript === 'बोलिए, हम सुन रहे हैं... (Speak now)') {
        setIsListening(false);
      }
    };

    recognition.start();
  };

  return (
    <>
      {/* Visual Feedback Overlay when listening */}
      <AnimatePresence>
        {isListening && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-28 left-1/2 -translate-x-1/2 bg-emerald-900 text-white px-6 py-4 rounded-3xl shadow-2xl z-50 flex items-center gap-4 w-11/12 max-w-sm border border-emerald-500/50"
          >
            <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
            <p className="font-bold text-sm sm:text-base flex-1">{transcript}</p>
            <button onClick={() => setIsListening(false)} className="bg-emerald-800 p-2 rounded-full"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Global Mic Button */}
      <button
        onClick={startListening}
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 p-5 rounded-full shadow-[0_10px_40px_rgba(16,185,129,0.5)] transition-all transform active:scale-95 flex items-center justify-center border-4 ${
          isListening ? 'bg-red-500 border-red-200 animate-pulse' : 'bg-emerald-500 border-emerald-200 hover:bg-emerald-400'
        }`}
      >
        <Mic className={`w-8 h-8 ${isListening ? 'text-white' : 'text-emerald-950'}`} />
      </button>
    </>
  );
}