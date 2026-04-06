"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Mic, MicOff, Send, X, Loader2, ArrowUpRight } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';
import { IntentResult, processVoiceCommand } from '@/lib/intentEngine';
import { KRISHI_SARTHI_START_EVENT, KrishiSarthiPageContext, KrishiSarthiStartDetail } from '@/lib/krishiSarthi';

type MessageRole = 'user' | 'assistant' | 'system';

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  actionPath?: string;
}

const ListeningWave = () => (
  <div className="flex items-end gap-1 h-4" aria-hidden="true">
    {[0, 1, 2, 3, 4].map((index) => (
      <motion.span
        key={index}
        className="w-1 rounded-full bg-current"
        animate={{
          height: ['20%', '100%', '35%', '80%', '25%']
        }}
        transition={{
          duration: 0.9,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: index * 0.08
        }}
      />
    ))}
  </div>
);

const greetingByLocale: Record<string, string> = {
  en: 'Namaste! I am KrishiSarthi. Ask me about mandi prices, weather, diseases, or schemes.',
  hi: 'नमस्ते! मैं KrishiSarthi हूँ। आप मुझसे मंडी भाव, मौसम, बीमारी या योजनाओं के बारे में पूछ सकते हैं।',
  pa: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ KrishiSarthi ਹਾਂ। ਮੰਡੀ ਭਾਵ, ਮੌਸਮ, ਬਿਮਾਰੀ ਜਾਂ ਯੋਜਨਾ ਬਾਰੇ ਪੁੱਛੋ।',
  mr: 'नमस्कार! मी KrishiSarthi आहे. मंडी भाव, हवामान, रोग किंवा योजना विचारा.',
  bn: 'নমস্কার! আমি KrishiSarthi। আপনি বাজারদর, আবহাওয়া, রোগ বা স্কিম নিয়ে জানতে পারেন।',
  te: 'నమస్కారం! నేను KrishiSarthi. మార్కెట్ ధరలు, వాతావరణం, వ్యాధులు, పథకాల గురించి అడగండి.',
  ta: 'வணக்கம்! நான் KrishiSarthi. சந்தை விலை, வானிலை, நோய், திட்டங்கள் பற்றி கேளுங்கள்.'
};

const fallbackPromptByLocale: Record<string, string> = {
  en: 'Try saying: Mandi, Weather, Schemes, Disease Scan, Community.',
  hi: 'ऐसे बोलकर देखें: मंडी, मौसम, योजना, बीमारी स्कैन, कम्युनिटी।',
  pa: 'ਇਹ ਕਹਿ ਕੇ ਵੇਖੋ: ਮੰਡੀ, ਮੌਸਮ, ਯੋਜਨਾ, ਬਿਮਾਰੀ ਸਕੈਨ, ਕਮਿਊਨਿਟੀ।'
};

const quickPromptsByLocale: Record<string, string[]> = {
  en: ['Today mandi prices', 'Today weather', 'Best government schemes', 'Crop disease help'],
  hi: ['आज का मंडी भाव', 'आज का मौसम', 'सरकारी योजनाएं बताओ', 'फसल बीमारी में मदद'],
  pa: ['ਅੱਜ ਦਾ ਮੰਡੀ ਭਾਅ', 'ਅੱਜ ਦਾ ਮੌਸਮ', 'ਸਰਕਾਰੀ ਯੋਜਨਾਵਾਂ ਦੱਸੋ', 'ਫਸਲ ਬਿਮਾਰੀ ਵਿੱਚ ਮਦਦ']
};

export default function FloatingVoiceAssistant() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const listRef = useRef<HTMLDivElement>(null);
  const normalizedPathname = pathname?.toLowerCase() || '';
  const hideLauncherOnMobile =
    normalizedPathname.includes('/dashboard/schemes') ||
    normalizedPathname.includes('/dashboard/community');

  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [isTypingVisible, setIsTypingVisible] = useState(false);
  const [input, setInput] = useState('');
  const shouldAutoListenAfterGreetingRef = useRef(false);
  const greetedInCurrentOpenRef = useRef(false);
  const pageContextOverrideRef = useRef<KrishiSarthiPageContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: `greet-${Date.now()}`,
      role: 'assistant',
      content: greetingByLocale[locale] || greetingByLocale.hi
    }
  ]);

  const {
    speak,
    speakAndWait,
    stopSpeaking,
    activeLocale
  } = useVoiceAssistant();

  const localizeText = useCallback((messagesByLocale: { en: string; hi: string; pa: string }) => {
    if (activeLocale === 'en') return messagesByLocale.en;
    if (activeLocale === 'pa') return messagesByLocale.pa;
    return messagesByLocale.hi;
  }, [activeLocale]);

  const isVoiceInputSupported = typeof window !== 'undefined'
    && typeof MediaRecorder !== 'undefined'
    && !!navigator.mediaDevices?.getUserMedia;

  useEffect(() => {
    setMessages([
      {
        id: `greet-${Date.now()}`,
        role: 'assistant',
        content: greetingByLocale[locale] || greetingByLocale.hi
      }
    ]);
    // Debug: log when locale changes
    console.log(`[FloatingVoiceAssistant] Locale changed to: ${locale}, activeLocale: ${activeLocale}`);
  }, [locale, activeLocale, speak]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      greetedInCurrentOpenRef.current = false;
      shouldAutoListenAfterGreetingRef.current = false;
    }
  }, [isOpen]);

  const lastHistory = useMemo(
    () =>
      messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-8)
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    [messages]
  );

  const appendMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const cleanupRecorder = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.onerror = null;
      mediaRecorderRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    audioChunksRef.current = [];
  }, []);

  const inferredPageContext = useMemo<KrishiSarthiPageContext>(() => {
    const route = pathname || '/';
    const normalizedRoute = route.toLowerCase();

    if (normalizedRoute.includes('/disease-detection')) {
      return {
        module: 'disease-detection',
        route,
        summary: 'User is in disease detection workflow. Prioritize plant symptom, image, and treatment guidance.'
      };
    }

    if (normalizedRoute.includes('/mandi-prices')) {
      return {
        module: 'mandi-prices',
        route,
        summary: 'User is on mandi prices page. Prioritize rates, trend interpretation, and sell/hold suggestions.'
      };
    }

    if (normalizedRoute.includes('/weather')) {
      return {
        module: 'weather',
        route,
        summary: 'User is on weather page. Prioritize irrigation/spray timing and weather-risk advice.'
      };
    }

    if (normalizedRoute.includes('/schemes')) {
      return {
        module: 'schemes',
        route,
        summary: 'User is on schemes page. Prioritize eligibility, documents, and application steps.'
      };
    }

    if (normalizedRoute.includes('/community')) {
      return {
        module: 'community',
        route,
        summary: 'User is on community page. Prioritize community support and how to ask/share details.'
      };
    }

    if (normalizedRoute.includes('/selling-pool')) {
      return {
        module: 'selling-pool',
        route,
        summary: 'User is on selling pool page. Prioritize collective selling strategy and negotiation guidance.'
      };
    }

    return {
      module: 'general-dashboard',
      route,
      summary: 'User is in the KrishiMitra app. Provide practical guidance with app-navigation hints when useful.'
    };
  }, [pathname]);

  const effectivePageContext = useMemo<KrishiSarthiPageContext>(() => {
    return {
      ...inferredPageContext,
      ...(pageContextOverrideRef.current || {})
    };
  }, [inferredPageContext]);

  const resolveIntentFirst = useCallback(
    (text: string): IntentResult => processVoiceCommand(text, activeLocale),
    [activeLocale]
  );

  const getAssistantReply = useCallback(async (text: string) => {
    const intent = resolveIntentFirst(text);

    if (intent.action === 'navigate' && intent.path) {
      const intentMessage: ChatMessage = {
        id: `intent-${Date.now()}`,
        role: 'assistant',
        content: intent.responseSpeech,
        actionPath: intent.path
      };
      appendMessage(intentMessage);
      speak(intent.responseSpeech);
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch('/api/krishisarthi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          locale: activeLocale,
          history: lastHistory,
          pageContext: effectivePageContext
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorText = typeof errorData?.error === 'string'
          ? errorData.error
          : activeLocale === 'pa'
            ? 'KrishiSarthi ਨੂੰ ਤਕਨੀਕੀ ਸਮੱਸਿਆ ਆ ਰਹੀ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।'
            : activeLocale === 'en'
              ? 'KrishiSarthi is facing a technical issue. Please try again.'
              : 'KrishiSarthi अभी तकनीकी समस्या में है. कृपया दोबारा कोशिश करें।';
        
        appendMessage({
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          content: errorText
        });
        speak(errorText);
        return;
      }

      const data = await response.json();
      const replyText = typeof data?.reply === 'string'
        ? data.reply
        : fallbackPromptByLocale[activeLocale] || fallbackPromptByLocale.hi;

      appendMessage({
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: replyText,
        actionPath: typeof data?.actionPath === 'string' ? data.actionPath : undefined
      });

      speak(replyText);
    } catch (error) {
      console.error('KrishiSarthi fetch error:', error);
      appendMessage({
        id: `assistant-error-${Date.now()}`,
        role: 'assistant',
        content: activeLocale === 'pa'
          ? 'नेटवर्क error आया। कनेक्शन चेक करें।'
          : activeLocale === 'en'
            ? 'Network error occurred. Please check your connection.'
            : 'Network error. Connection check karein.'
      });
    } finally {
      setIsSending(false);
    }
  }, [activeLocale, appendMessage, effectivePageContext, lastHistory, resolveIntentFirst, speak]);

  const submitText = useCallback(async (rawText: string) => {
    const text = rawText.trim();
    if (!text || isSending) return;

    appendMessage({ id: `user-${Date.now()}`, role: 'user', content: text });
    await getAssistantReply(text);
  }, [appendMessage, getAssistantReply, isSending]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending) return;
    setInput('');
    await submitText(text);
  };

  const transcribeAudio = useCallback(async (blob: Blob): Promise<string> => {
    const rawMimeType = (blob.type || '').toLowerCase();
    const baseMimeType = rawMimeType.split(';')[0].trim();
    const normalizedMimeType = baseMimeType === 'video/webm'
      ? 'audio/webm'
      : (baseMimeType || 'audio/webm');
    const extension = normalizedMimeType.includes('ogg')
      ? 'ogg'
      : normalizedMimeType.includes('mp4') || normalizedMimeType.includes('m4a')
        ? 'm4a'
        : normalizedMimeType.includes('mpeg') || normalizedMimeType.includes('mp3')
          ? 'mp3'
          : normalizedMimeType.includes('wav')
            ? 'wav'
            : 'webm';

    const normalizedBlob = new Blob([blob], { type: normalizedMimeType });
    const formData = new FormData();
    formData.append('file', normalizedBlob, `voice.${extension}`);
    formData.append('locale', activeLocale);

    const response = await fetch('/api/stt', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(typeof data?.error === 'string' ? data.error : 'Speech recognition failed.');
    }

    return typeof data?.transcript === 'string' ? data.transcript.trim() : '';
  }, [activeLocale]);

  const stopVoiceSession = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      setIsVoiceRecording(false);
      cleanupRecorder();
      return;
    }

    try {
      recorder.stop();
    } catch {
      setIsVoiceRecording(false);
      cleanupRecorder();
    }
  }, [cleanupRecorder]);

  const startVoiceSession = useCallback(async () => {
    if (isVoiceRecording) {
      stopVoiceSession();
      return;
    }

    if (!isVoiceInputSupported) {
      appendMessage({
        id: `system-${Date.now()}`,
        role: 'system',
        content: localizeText({
          en: 'Voice input is not supported in this browser. Use typing mode.',
          hi: 'इस ब्राउज़र में वॉइस इनपुट सपोर्ट नहीं है। टाइपिंग मोड का उपयोग करें।',
          pa: 'ਇਸ ਬ੍ਰਾਊਜ਼ਰ ਵਿੱਚ ਵੌਇਸ ਇਨਪੁੱਟ ਸਹਾਇਕ ਨਹੀਂ ਹੈ। ਟਾਈਪਿੰਗ ਮੋਡ ਵਰਤੋ।'
        })
      });
      return;
    }

    stopSpeaking();
    setIsOpen(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mimeTypes = ['audio/webm', 'audio/mp4', 'audio/ogg'];
      const selectedMimeType = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = selectedMimeType
        ? new MediaRecorder(stream, { mimeType: selectedMimeType })
        : new MediaRecorder(stream);

      audioChunksRef.current = [];
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        appendMessage({
          id: `system-${Date.now()}`,
          role: 'system',
          content: localizeText({
            en: 'Could not capture voice. Please try again.',
            hi: 'आवाज़ कैप्चर नहीं हो पाई। कृपया फिर से कोशिश करें।',
            pa: 'ਆਵਾਜ਼ ਕੈਪਚਰ ਨਹੀਂ ਹੋ ਸਕੀ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।'
          })
        });
        setIsVoiceRecording(false);
        cleanupRecorder();
      };

      recorder.onstop = async () => {
        setIsVoiceRecording(false);
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        cleanupRecorder();

        if (!blob.size || blob.size < 1000) {
          appendMessage({
            id: `system-${Date.now()}`,
            role: 'system',
            content: localizeText({
              en: 'I could not hear that clearly. Please try again.',
              hi: 'मैं स्पष्ट रूप से सुन नहीं पाया। कृपया फिर से बोलें।',
              pa: 'ਮੈਂ ਸਾਫ਼ ਨਹੀਂ ਸੁਣ ਸਕਿਆ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਬੋਲੋ।'
            })
          });
          return;
        }

        setIsSending(true);
        try {
          const spokenText = await transcribeAudio(blob);
          if (!spokenText) {
            appendMessage({
              id: `system-${Date.now()}`,
              role: 'system',
              content: localizeText({
                en: 'I could not hear that clearly. Please try again.',
                hi: 'मैं स्पष्ट रूप से सुन नहीं पाया। कृपया फिर से बोलें।',
                pa: 'ਮੈਂ ਸਾਫ਼ ਨਹੀਂ ਸੁਣ ਸਕਿਆ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਬੋਲੋ।'
              })
            });
            return;
          }

          appendMessage({ id: `voice-user-${Date.now()}`, role: 'user', content: spokenText });
          await getAssistantReply(spokenText);
        } catch (error) {
          console.error('Voice transcription error:', error);
          appendMessage({
            id: `assistant-error-${Date.now()}`,
            role: 'assistant',
            content: activeLocale === 'pa'
              ? 'KrishiSarthi ਨੂੰ ਤਕਨੀਕੀ ਸਮੱਸਿਆ ਆ ਰਹੀ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।'
              : activeLocale === 'en'
                ? 'KrishiSarthi is facing a technical issue. Please try again.'
                : 'KrishiSarthi अभी तकनीकी समस्या में है. कृपया दोबारा कोशिश करें।'
          });
        } finally {
          setIsSending(false);
        }
      };

      recorder.start();
      setIsVoiceRecording(true);
    } catch (error) {
      console.error('Microphone access error:', error);
      appendMessage({
        id: `system-${Date.now()}`,
        role: 'system',
        content: localizeText({
          en: 'Microphone access denied. Please allow microphone permission.',
          hi: 'माइक्रोफोन की अनुमति नहीं मिली। कृपया माइक्रोफोन परमिशन दें।',
          pa: 'ਮਾਈਕ੍ਰੋਫੋਨ ਐਕਸੈੱਸ ਮਨਜ਼ੂਰ ਨਹੀਂ ਹੋਇਆ। ਕਿਰਪਾ ਕਰਕੇ ਮਾਈਕ੍ਰੋਫੋਨ ਪਰਮਿਸ਼ਨ ਦਿਓ।'
        })
      });
      setIsVoiceRecording(false);
      cleanupRecorder();
    }
  }, [activeLocale, appendMessage, cleanupRecorder, getAssistantReply, isVoiceInputSupported, isVoiceRecording, localizeText, stopSpeaking, stopVoiceSession, transcribeAudio]);

  // Speak greeting when widget opens and optionally start listening after it finishes
  useEffect(() => {
    if (isOpen && messages.length === 1 && messages[0]?.role === 'assistant' && !greetedInCurrentOpenRef.current) {
      greetedInCurrentOpenRef.current = true;
      const greetingMsg = messages[0]?.content;
      if (greetingMsg) {
        setTimeout(async () => {
          console.log('[FloatingVoiceAssistant] Speaking greeting message');
          await speakAndWait(greetingMsg);

          if (shouldAutoListenAfterGreetingRef.current && isVoiceInputSupported && !isVoiceRecording) {
            shouldAutoListenAfterGreetingRef.current = false;
            await startVoiceSession();
          }
        }, 300);
      }
    }
  }, [isOpen, isVoiceInputSupported, isVoiceRecording, messages, speakAndWait, startVoiceSession]);

  const handleActionNavigate = (path?: string) => {
    if (!path) return;
    router.push(path);
    stopVoiceSession();
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isVoiceInputSupported) {
      setIsTypingVisible(true);
    }
  }, [isVoiceInputSupported]);

  useEffect(() => {
    return () => {
      cleanupRecorder();
    };
  }, [cleanupRecorder]);

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<KrishiSarthiStartDetail>;
      const prompt = customEvent.detail?.prompt;
      const context = customEvent.detail?.context;
      const autoSend = customEvent.detail?.autoSend;

      pageContextOverrideRef.current = context || null;

      setIsOpen(true);

      if (prompt) {
        setIsTypingVisible(true);
        setInput(prompt);

        if (autoSend) {
          setInput('');
          void submitText(prompt);
          return;
        }
      }

      if (isVoiceInputSupported && !isVoiceRecording) {
        shouldAutoListenAfterGreetingRef.current = true;
      }
    };

    window.addEventListener(KRISHI_SARTHI_START_EVENT, handler);
    return () => window.removeEventListener(KRISHI_SARTHI_START_EVENT, handler);
  }, [isVoiceInputSupported, isVoiceRecording, submitText]);

  const quickPrompts = quickPromptsByLocale[activeLocale] || quickPromptsByLocale.en;
  const hasConversation = messages.length > 1;

  const isAuthPage =
    normalizedPathname.includes('/login') ||
    normalizedPathname.includes('/register') ||
    normalizedPathname.includes('/forgot-password') ||
    normalizedPathname.includes('/auth/');

  const isLandingPage = normalizedPathname === '/' || /^\/[a-z]{2}\/?$/.test(normalizedPathname);

  if (isAuthPage || isLandingPage) return null;

  return (
    <>
      <div className={`${hideLauncherOnMobile ? 'hidden md:block' : 'block'} fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+6.25rem)] md:right-5 md:bottom-5 z-40`}>
        <button
          onClick={() => {
            setIsOpen((prev) => {
              const next = !prev;
              if (!next) {
                shouldAutoListenAfterGreetingRef.current = false;
                stopVoiceSession();
              }
              return next;
            });
          }}
          className="relative w-14 h-14 rounded-full bg-agri-600 hover:bg-agri-800 text-white shadow-2xl flex items-center justify-center active:scale-95 transition"
          aria-label={isOpen ? 'Close KrishiSarthi' : 'Open KrishiSarthi'}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
          {!isOpen && (
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-agri-900 text-[10px] font-bold tracking-wide text-agri-100 whitespace-nowrap">
              KrishiSarthi AI
            </span>
          )}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed z-50 right-2 left-2 bottom-[calc(env(safe-area-inset-bottom)+8rem)] md:bottom-24 md:left-auto md:right-5 md:w-[420px] w-auto h-[78vh] md:h-[74vh] bg-white/80 border border-emerald-200/70 rounded-[28px] shadow-[0_24px_60px_-30px_rgba(16,24,40,0.6)] overflow-hidden flex flex-col backdrop-blur-xl"
          >
            <div className="relative px-5 py-4 border-b border-emerald-100/70 bg-gradient-to-r from-emerald-50 via-white to-emerald-50 flex items-center justify-between">
              <div className="absolute inset-0 opacity-60" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(16,185,129,0.15), transparent 55%)' }} />
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-[0_8px_20px_-12px_rgba(16,185,129,0.7)]">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="relative">
                  <p className="text-sm font-black text-emerald-950">KrishiSarthi</p>
                  <p className="text-[11px] text-emerald-800/70 font-semibold">Farmer AI Assistant</p>
                </div>
              </div>
              <button
                onClick={() => {
                  stopVoiceSession();
                  setIsOpen(false);
                }}
                className="relative p-2 rounded-full hover:bg-emerald-100 text-emerald-800"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gradient-to-b from-white via-emerald-50/40 to-white">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed ${
                      message.role === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-md shadow-[0_10px_20px_-16px_rgba(5,150,105,0.8)]'
                        : message.role === 'system'
                          ? 'bg-amber-50 text-amber-900 rounded-bl-md border border-amber-100'
                          : 'bg-white text-emerald-950 border border-emerald-100/80 rounded-bl-md shadow-[0_8px_18px_-16px_rgba(16,185,129,0.5)]'
                    }`}
                  >
                    {message.content}
                    {message.actionPath && (
                      <button
                        type="button"
                        onClick={() => handleActionNavigate(message.actionPath)}
                        className="mt-2 inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                      >
                        Open Page <ArrowUpRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {!hasConversation && !isSending && (
                <>
                  <div className="bg-white border border-emerald-100 rounded-2xl p-3 text-xs text-emerald-900/70 shadow-[0_8px_16px_-14px_rgba(16,185,129,0.5)]">
                    Tap the green button below and speak in your language.
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {quickPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => submitText(prompt)}
                        disabled={isSending}
                        className="text-left px-3 py-2.5 rounded-xl text-xs font-semibold border border-emerald-100 bg-white text-emerald-900 hover:bg-emerald-50 disabled:opacity-50"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {isSending && (
                <div className="flex justify-start">
                  <div className="bg-white border border-emerald-100 text-emerald-900 rounded-2xl rounded-bl-md px-3 py-2 text-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-emerald-100/70 p-4 bg-white space-y-2.5">
              <button
                type="button"
                onClick={isVoiceRecording ? stopVoiceSession : startVoiceSession}
                className={`w-full h-12 rounded-2xl font-bold transition flex items-center justify-center gap-2 border ${
                  isVoiceRecording
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                }`}
                title={isVoiceRecording ? 'Stop voice chat' : 'Start voice chat'}
              >
                {isVoiceRecording ? (
                  <>
                    <ListeningWave />
                    <span>Listening... Tap again to send</span>
                    <MicOff className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5" />
                    <span>Tap to start speaking</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setIsTypingVisible((prev) => !prev)}
                  className="h-9 px-3 rounded-lg text-xs font-bold border border-emerald-200 text-emerald-900 bg-emerald-50 hover:bg-emerald-100"
                >
                  {isTypingVisible ? 'Hide typing' : 'Type instead'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMessages([
                      {
                        id: `greet-${Date.now()}`,
                        role: 'assistant',
                        content: greetingByLocale[locale] || greetingByLocale.hi
                      }
                    ]);
                  }}
                  className="h-9 px-3 rounded-lg text-xs font-semibold text-emerald-900/60 hover:text-emerald-800"
                >
                  Clear
                </button>
              </div>

              {isTypingVisible && (
                <div className="flex items-end gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Type if needed..."
                    className="flex-1 resize-none rounded-xl border border-emerald-200 px-3 py-2.5 text-sm text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-400 min-h-11 max-h-28"
                    rows={1}
                  />

                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!input.trim() || isSending}
                    className="h-11 w-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center disabled:opacity-50"
                    title="Send"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}

              {!isTypingVisible && isSending && (
                <div className="text-[11px] text-agri-900/60 font-medium flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> KrishiSarthi is responding...
                </div>
              )}

              {!isVoiceInputSupported && (
                <p className="text-[11px] font-medium text-amber-700">
                  Voice input is not supported in this browser. Use typing mode.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
