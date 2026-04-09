'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { 
  Upload, ShieldCheck, AlertTriangle, 
  Loader2, CheckCircle, Leaf, Activity, X, Camera, Store, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { requestKrishiSarthi } from '@/lib/krishiSarthi';
import { getAiLanguage } from '@/lib/localeToLanguage';

interface ScanResult {
  disease: string;
  confidence: number;
  harm: string;
  solutions: string[];
  severity?: 'HIGH' | 'MEDIUM' | 'LOW';
}

export default function DiseaseDetection() {
  const t = useTranslations('DiseaseDetection');
  const locale = useLocale();
  const initialLang = getAiLanguage(locale);

  const [mode, setMode] = useState<'upload' | 'live'>('upload');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const cameraAbortRef = useRef<boolean>(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/auth/me', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) setCurrentUser(data.user);
        }
      } catch (err) { console.error(err); }
    };
    fetchUser();
    return () => stopCamera();
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (mode !== 'live') {
      stopCamera();
      return;
    }

    cameraAbortRef.current = false;

    const initCamera = async () => {
      setError('');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: true
        });

        if (cameraAbortRef.current) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        if (cameraAbortRef.current) return;
        console.error('Camera error:', err.name, err.message);
        if (err.name === 'NotAllowedError') {
          setError('Camera permission denied. Please allow camera access in your browser settings and reload.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found. Please connect a camera and try again.');
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setError('Camera is in use by another app. Close Zoom, Teams, or other camera apps and try again.');
        } else {
          setError(`Camera error: ${err.message}`);
        }
      }
    };

    initCamera();

    return () => {
      cameraAbortRef.current = true;
      stopCamera();
    };
  }, [mode, stopCamera]);

  const triggerBioRadar = async (analysis: any) => {
    console.log("1. Attempting to trigger BioRadar...");

    // HACKATHON SAFETY NET: A mathematically valid hex ID ensures no crashes!
    const userIdToUse = currentUser?._id || "507f191e810c19729de860ea"; 

    try {
      console.log("2. Sending POST request to /api/scans...");
      const res = await fetch('/api/scans', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userIdToUse,
          aiResult: {
            diseaseName: analysis.disease,
            severity: 'HIGH', // Forcing HIGH for guaranteed n8n trigger
            confidence: analysis.confidence,
            solution: analysis.solutions ? analysis.solutions[0] : 'No specific solution provided.',
            prevention: analysis.harm
          }
        })
      });

      const data = await res.json();
      console.log("3. BioRadar Backend Response:", data);
    } catch (err) {
      console.error('BioRadar Trigger Failed', err);
    }
  };
  
  const fetchRecommendedProducts = async (disease: string, district: string) => {
    try {
      const query = new URLSearchParams();
      if (district) query.append('district', district);
      query.append('disease', disease);
      const res = await fetch(`/api/products?${query.toString()}`);
      const data = await res.json();
      if (data.success) setRecommendedProducts(data.products.slice(0, 3));
    } catch (err) {
      console.error('Failed to fetch recommended products', err);
    }
  };

  const handleModeSwitch = (newMode: 'upload' | 'live') => {
    if (newMode === mode) return;
    setMode(newMode);
    clearImage();
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
    setRecommendedProducts([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUploadScan = async () => {
    if (!selectedFile) return;
    setIsScanning(true);
    setError('');
    setRecommendedProducts([]);

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
        body: JSON.stringify({ imageUrl, language: initialLang }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI Scan failed');

      setResult(data.analysis);
      await triggerBioRadar(data.analysis);
      await fetchRecommendedProducts(data.analysis.disease, '');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    const audioStream = new MediaStream(streamRef.current.getAudioTracks());
    const mediaRecorder = new MediaRecorder(audioStream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      setIsScanning(true);
      setRecommendedProducts([]);
      const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
      const audioReader = new FileReader();
      const canvas = document.createElement('canvas');

      if (videoRef.current) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      }

      const imageBase64 = canvas.toDataURL('image/jpeg', 0.8);
      audioReader.readAsDataURL(audioBlob);

      audioReader.onloadend = async () => {
        const audioBase64 = audioReader.result as string;
        try {
          const res = await fetch('/api/disease-detection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64, audioBase64, audioMimeType: audioBlob.type, language: initialLang }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'AI Scan failed');

          setResult(data.analysis);
          const userDistrict = currentUser?.district || '';
          await triggerBioRadar(data.analysis);
          await fetchRecommendedProducts(data.analysis.disease, userDistrict);
          stopCamera();

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

  const container: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120 } } };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-5xl mx-auto">
      <motion.div variants={item} className="mb-6 md:mb-8">
        <div className="rounded-[28px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-50 px-5 py-6 md:p-0 md:border-0 md:bg-transparent text-center md:text-left shadow-xl shadow-emerald-900/5 md:shadow-none">
          <div className="flex md:inline-flex items-center justify-center gap-1.5 rounded-full bg-emerald-100/70 border border-emerald-200 px-3 py-1 text-[11px] font-black text-emerald-800 uppercase tracking-widest w-max mx-auto md:mx-0">
            <ShieldCheck className="w-3.5 h-3.5" /> Smart Scan
          </div>
          <h1 className="mt-4 text-[1.8rem] md:text-4xl font-black text-agri-900 tracking-tight leading-tight">
            {t('title')}
          </h1>
          <p className="text-gray-600 mt-2.5 font-medium text-[13px] sm:text-sm md:text-base leading-relaxed max-w-sm sm:max-w-md md:max-w-lg mx-auto md:mx-0">
            {t('subtitle')}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-white text-emerald-800 text-[11px] font-black border border-emerald-100 shadow-sm shrink-0">📷 Photo</span>
            <span className="px-3 py-1.5 rounded-xl bg-white text-emerald-800 text-[11px] font-black border border-emerald-100 shadow-sm shrink-0">📹 Live Scan</span>
            <span className="px-3 py-1.5 rounded-xl bg-white text-emerald-800 text-[11px] font-black border border-emerald-100 shadow-sm shrink-0">✨ Instant Remedies</span>
          </div>
        </div>
      </motion.div>

      <motion.div variants={item} className="w-full mb-6 bg-emerald-50/70 border border-emerald-100 p-1.5 rounded-2xl inline-flex">
        <button onClick={() => handleModeSwitch('upload')} className={`flex-1 px-4 py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${mode === 'upload' ? 'bg-white shadow-sm text-agri-900' : 'text-emerald-700/70 hover:text-agri-800'}`}>
          <Upload className="w-4 h-4 mr-2" /> Upload Photo
        </button>
        <button onClick={() => handleModeSwitch('live')} className={`flex-1 px-4 py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${mode === 'live' ? 'bg-white shadow-sm text-agri-900' : 'text-emerald-700/70 hover:text-agri-800'}`}>
          <Camera className="w-4 h-4" /> Live Scanner
        </button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div variants={item} className="bg-white p-5 md:p-6 rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100 flex flex-col min-h-[420px] md:min-h-[500px]">
          <div className="flex-1 relative w-full min-h-[260px] md:min-h-[300px] mb-4 rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 overflow-hidden flex flex-col items-center justify-center">

            {mode === 'upload' && !selectedImage && (
              <div className="text-center p-6 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Leaf className="w-8 h-8 text-agri-400" />
                </div>
                <p className="text-agri-900 font-bold">{t('uploadPrompt')}</p>
                <p className="text-xs text-agri-700/70 mt-1">JPG or PNG • Clear leaf photo</p>
              </div>
            )}

            {mode === 'upload' && selectedImage && (
              <div className="absolute inset-0">
                <img src={selectedImage} alt="Crop" className="w-full h-full object-cover" />
                <button onClick={clearImage} className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/jpeg, image/png" className="hidden" />

            {mode === 'live' && (
              <div className="absolute inset-0 bg-black">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                {isRecording && (
                  <div className="absolute top-4 left-4 flex items-center bg-red-500/80 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse backdrop-blur-md">
                    <div className="w-2 h-2 bg-white rounded-full mr-2" /> Recording Audio
                  </div>
                )}
                {!isRecording && (
                  <div className="absolute bottom-4 left-4 right-4 text-xs font-semibold text-white/80 bg-black/40 rounded-full px-3 py-2 text-center backdrop-blur-sm">
                    Hold to talk while scanning the leaf
                  </div>
                )}
              </div>
            )}

            {isScanning && (
              <>
                <div className="absolute inset-0 bg-agri-900/50 backdrop-blur-[2px] z-10" />
                <div className="absolute inset-0 flex flex-col items-center justify-center z-30">
                  <Activity className="w-12 h-12 text-agri-400 animate-pulse mb-3" />
                  <span className="bg-agri-900/80 text-agri-100 px-4 py-1.5 rounded-full font-bold text-sm">Analyzing Crop & Voice...</span>
                </div>
              </>
            )}
          </div>

          {mode === 'upload' ? (
            <button
              onClick={handleUploadScan}
              disabled={!selectedImage || isScanning || !!result}
              className="w-full py-3.5 md:py-4 rounded-2xl font-black text-white bg-agri-900 hover:bg-agri-800 disabled:opacity-50"
            >
              {isScanning ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Analyze Image'}
            </button>
          ) : (
            <div className="space-y-2">
              <button
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                disabled={isScanning || !!result}
                className={`w-full py-3.5 md:py-4 rounded-2xl font-black text-white transition-all flex items-center justify-center select-none ${isRecording ? 'bg-red-500 scale-95 shadow-inner' : 'bg-agri-900 hover:bg-agri-800'} disabled:opacity-50`}
              >
                {isScanning
                  ? <Loader2 className="w-6 h-6 animate-spin" />
                  : isRecording
                    ? <>Release to Send to KrishiSarthi</>
                    : <>Hold to Talk to KrishiSarthi</>
                }
              </button>
              <button
                type="button"
                onClick={() =>
                  requestKrishiSarthi({
                    prompt: 'KrishiSarthi, disease scan mein madad karo.',
                    context: {
                      module: 'disease-detection',
                      summary: 'User is checking crop disease from image/voice and needs symptom + remedy guidance.'
                    }
                  })
                }
                className="w-full py-3 rounded-2xl border border-emerald-200 text-emerald-900 bg-emerald-50 hover:bg-emerald-100 font-black shadow-sm"
              >
                Ask KrishiSarthi (Voice)
              </button>
            </div>
          )}
        </motion.div>

        <div className="h-full flex flex-col">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 bg-emerald-50/60 border-2 border-dashed border-emerald-100 rounded-3xl flex flex-col items-center justify-center p-8 text-center min-h-[420px] md:min-h-[500px]"
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
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 bg-agri-900 rounded-3xl p-6 md:p-8 shadow-2xl text-white flex flex-col"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-black border border-emerald-500/30 uppercase tracking-widest">
                    Analysis Complete
                  </div>
                  <div className="text-agri-400 font-black">{Math.round(result.confidence * 100)}% Match</div>
                </div>

                <div className="text-3xl font-black mb-4">{result.disease}</div>

                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl mb-6">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-amber-400 mr-3 shrink-0 mt-1" />
                    <div>
                      <div className="text-xs font-black text-white/40 uppercase tracking-widest mb-1">Impact & Symptoms</div>
                      <p className="text-sm text-white/80 font-medium leading-relaxed">{result.harm}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="text-xs font-black text-white/40 uppercase tracking-widest flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-agri-400" /> Recommended Solutions
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {result.solutions.map((sol, i) => (
                      <div key={i} className="bg-white/10 p-3 rounded-xl text-sm font-bold border border-white/5">{sol}</div>
                    ))}
                  </div>
                </div>

                {recommendedProducts.length > 0 && (
                  <div className="space-y-4 mb-8">
                    <div className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center">
                      <Store className="w-4 h-4 mr-2" /> Recommended Treatments
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {recommendedProducts.map((p, i) => (
                        <div key={i} className="bg-emerald-950/50 p-3 rounded-xl border border-emerald-900 flex items-center justify-between">
                          <div className="flex items-center">
                            {p.image ? (
                              <img src={p.image} alt={p.name} className="w-12 h-12 rounded-lg object-cover mr-3" />
                            ) : (
                              <div className="w-12 h-12 bg-emerald-900 rounded-lg flex items-center justify-center mr-3">
                                <Store className="w-6 h-6 text-emerald-700" />
                              </div>
                            )}
                            <div>
                              <h4 className="font-bold text-white text-sm">{p.name}</h4>
                              <p className="text-xs text-emerald-400/80 mt-0.5 font-medium">₹{p.price} • {p.location?.district}</p>
                            </div>
                          </div>
                          <Link href={`/${locale}/dashboard/products`} className="flex-shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg p-2 transition">
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => { clearImage(); setMode('live'); }}
                  className="mt-auto py-4 bg-white text-agri-900 rounded-2xl font-black hover:bg-agri-50 transition-colors shadow-lg shadow-black/20"
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