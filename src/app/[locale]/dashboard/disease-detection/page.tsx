


'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { 
  Upload, ShieldCheck, AlertTriangle, 
  Loader2, CheckCircle, Leaf, Activity, X, Info, Languages, ChevronDown, Camera, Mic
} from 'lucide-react';

interface ScanResult {
  disease: string;
  confidence: number;
  harm: string;
  solutions: string[];
}

const LANGUAGES = [
  { code: 'English', name: 'English' },
  { code: 'Hindi', name: 'हिन्दी (Hindi)' },
  { code: 'Punjabi', name: 'ਪੰਜਾਬੀ (Punjabi)' },
  { code: 'Marathi', name: 'मराठी (Marathi)' },
  { code: 'Bengali', name: 'বাংলা (Bengali)' },
  { code: 'Telugu', name: 'తెలుగు (Telugu)' },
  { code: 'Tamil', name: 'தமிழ் (Tamil)' },
];

export default function DiseaseDetection() {
  const t = useTranslations('DiseaseDetection');
  const locale = useLocale();

  const defaultLangMap: Record<string, string> = { en: 'English', hi: 'Hindi', pa: 'Punjabi' };
  const initialLang = defaultLangMap[locale] || 'English';

  const [mode, setMode] = useState<'upload' | 'live'>('upload');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState(initialLang); 
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');
  
  // Media Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  // Clean up camera on unmount
  useEffect(() => {
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: true // Request mic permission early
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied", err);
      setError("Please allow camera and microphone access to use Live mode.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleModeSwitch = (newMode: 'upload' | 'live') => {
    setMode(newMode);
    clearImage();
    if (newMode === 'live') {
      startCamera();
    } else {
      stopCamera();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
      setSelectedFile(file);
      setResult(null);
      setError('');
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- STANDARD UPLOAD SCAN ---
  const handleUploadScan = async () => {
    if (!selectedFile) return;
    setIsScanning(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);

      const cloudinaryRes = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      );
      const cloudinaryData = await cloudinaryRes.json();
      const imageUrl = cloudinaryData.secure_url;

      const res = await fetch('/api/disease-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, language: selectedLanguage }), 
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI Scan failed');
      setResult(data.analysis);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsScanning(false);
    }
  };

  // --- LIVE RECORD & SCAN ---
  const startRecording = () => {
    if (!streamRef.current) return;
    
    // Setup Audio Recorder
    const audioStream = new MediaStream(streamRef.current.getAudioTracks());
    const mediaRecorder = new MediaRecorder(audioStream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      setIsScanning(true);
      
      // 1. Package the Audio
      const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
      const audioReader = new FileReader();
      
      // 2. Capture the Video Frame
      const canvas = document.createElement('canvas');
      if (videoRef.current) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      }
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.8);

      // Read audio blob to base64
      audioReader.readAsDataURL(audioBlob);
      audioReader.onloadend = async () => {
        const audioBase64 = audioReader.result as string;
        
        try {
          // Send BOTH image and audio to our API
          const res = await fetch('/api/disease-detection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              imageBase64, 
              audioBase64, 
              audioMimeType: audioBlob.type,
              language: selectedLanguage 
            }), 
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'AI Scan failed');
          setResult(data.analysis);
          stopCamera(); // Pause camera to show result
        } catch (err: any) {
          setError(err.message);
        } finally {
          setIsScanning(false);
        }
      };
    };

    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const container: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } }};
  const item: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120 } }};

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-5xl mx-auto">
      
      <motion.div variants={item} className="mb-8 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-black text-agri-900 tracking-tight flex items-center justify-center md:justify-start">
          <ShieldCheck className="w-8 h-8 mr-3 text-agri-600" />
          {t('title')}
        </h1>
        <p className="text-gray-500 mt-2 font-medium">{t('subtitle')}</p>
      </motion.div>

      {/* Mode Switcher */}
      <motion.div variants={item} className="flex space-x-2 mb-6 bg-gray-100 p-1 rounded-xl inline-flex">
        <button 
          onClick={() => handleModeSwitch('upload')}
          className={`px-6 py-2 rounded-lg font-bold text-sm flex items-center transition-all ${mode === 'upload' ? 'bg-white shadow-sm text-agri-900' : 'text-gray-500 hover:text-agri-700'}`}
        >
          <Upload className="w-4 h-4 mr-2" /> Upload Photo
        </button>
        <button 
          onClick={() => handleModeSwitch('live')}
          className={`px-6 py-2 rounded-lg font-bold text-sm flex items-center transition-all ${mode === 'live' ? 'bg-white shadow-sm text-agri-900' : 'text-gray-500 hover:text-agri-700'}`}
        >
          <Camera className="w-4 h-4 mr-2" /> Live Scanner
        </button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Input Panel */}
        <motion.div variants={item} className="bg-white p-6 rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100 flex flex-col min-h-[500px]">
          
          <div className="flex-1 relative w-full min-h-[300px] mb-4 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden flex flex-col items-center justify-center">
            
            {/* UPLOAD MODE */}
            {mode === 'upload' && !selectedImage && (
              <div className="text-center p-6 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                  <Leaf className="w-8 h-8 text-agri-400" />
                </div>
                <p className="text-agri-900 font-bold">{t('uploadPrompt')}</p>
              </div>
            )}
            {mode === 'upload' && selectedImage && (
              <div className="absolute inset-0">
                <img src={selectedImage} alt="Crop" className="w-full h-full object-cover" />
                <button onClick={clearImage} className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full"><X className="w-5 h-5" /></button>
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/jpeg, image/png" className="hidden" />

            {/* LIVE MODE */}
            {mode === 'live' && (
              <div className="absolute inset-0 bg-black">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                
                {/* Recording Indicator Overlay */}
                {isRecording && (
                  <div className="absolute top-4 left-4 flex items-center bg-red-500/80 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse backdrop-blur-md">
                    <div className="w-2 h-2 bg-white rounded-full mr-2" /> Recording Audio
                  </div>
                )}
              </div>
            )}

          
            {isScanning && (
              <>
                <div className="absolute inset-0 bg-agri-900/50 backdrop-blur-[2px] z-10"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center z-30">
                  <Activity className="w-12 h-12 text-agri-400 animate-pulse mb-3" />
                  <span className="bg-agri-900/80 text-agri-100 px-4 py-1.5 rounded-full font-bold text-sm">Analyzing Crop & Voice...</span>
                </div>
              </>
            )}
          </div>

          <div className="mb-4">
            <label className="text-sm font-bold text-gray-700 mb-1.5 block">{t('language')}</label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              disabled={isScanning}
              className="w-full px-4 py-3 bg-gray-50 border text-black border-black rounded-xl outline-none font-bold"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>

          {/* Dynamic Action Button */}
          {mode === 'upload' ? (
            <button 
              onClick={handleUploadScan}
              disabled={!selectedImage || isScanning || !!result}
              className="w-full py-4 rounded-xl font-bold text-white bg-agri-900 hover:bg-agri-800 disabled:opacity-50"
            >
              {isScanning ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "Analyze Image"}
            </button>
          ) : (
            <button 
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              disabled={isScanning || !!result}
              className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center select-none ${
                isRecording ? 'bg-red-500 scale-95 shadow-inner' : 'bg-agri-900 hover:bg-agri-800'
              } disabled:opacity-50`}
            >
              {isScanning ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : isRecording ? (
                <>Release to Send</>
              ) : (
                <><Mic className="w-5 h-5 mr-2" /> Hold to Ask Question</>
              )}
            </button>
          )}

        </motion.div>

      
        <div className="h-full flex flex-col">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex-1 bg-agri-50 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center p-8 text-center min-h-[500px]"
              >
                <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <Activity className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-400">
                  {error ? t('systemNotice') : t('awaitingTelemetry')}
                </h3>
                <p className={`text-sm mt-2 max-w-xs ${error ? 'text-amber-600 font-bold' : 'text-gray-400'}`}>
                  {error || t('awaitingDesc')}
                </p>
              </motion.div>
            ) : (
              <motion.div 
                key="results"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="flex-1 bg-agri-900 rounded-3xl p-6 md:p-8 shadow-2xl text-white flex flex-col"
              >
                {/* Include all your existing result UI here */}
                <div className="text-3xl font-black mb-4">{result.disease}</div>
                <p className="mb-4">{result.harm}</p>
                <ul className="space-y-2">
                  {result.solutions.map((s, i) => <li key={i}>• {s}</li>)}
                </ul>
                <button 
                  onClick={() => {
                    clearImage();
                    if (mode === 'live') startCamera();
                  }} 
                  className="mt-auto py-3 bg-white/10 rounded-xl font-bold"
                >
                  {t('scanAnotherBtn')}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </motion.div>
  );
}