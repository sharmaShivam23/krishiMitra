'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';

export default function FloatingVoiceAssistant() {
  const { isListening, transcript, startListening, stopListening } = useVoiceAssistant();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* Transcript Bubble */}
      <AnimatePresence>
        {isListening && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="mb-4 bg-gray-900/90 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-xl border border-gray-700 max-w-xs"
          >
            <div className="flex items-center space-x-2 mb-1">
              <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Listening...</span>
            </div>
            <p className="text-sm font-medium leading-snug">
              {transcript || "Speak now..."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Mic Button */}
      <div className="relative">
        {/* Pulse Animation Ring */}
        {isListening && (
          <motion.div 
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0 bg-emerald-500 rounded-full"
          />
        )}
        
        <button
          onClick={isListening ? stopListening : startListening}
          className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 ${
            isListening 
              ? 'bg-red-500 text-white hover:bg-red-600' 
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>
      </div>
    </div>
  );
}