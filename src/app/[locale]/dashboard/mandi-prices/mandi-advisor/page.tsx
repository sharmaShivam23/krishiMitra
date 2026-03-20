


'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Loader2, TrendingUp, TrendingDown, 
  AlertTriangle, IndianRupee, MapPin, Wheat, 
  Scale, Calculator, Clock, Target, Bot, 
  Terminal, Zap, Sparkles, Cpu, ChevronRight , Icon
} from 'lucide-react';


interface PredictionResult {
  currentPrice: number;
  expectedPrice: number;
  priceRange: string;
  trend: string;
  suggestion: string;
  bestSellTime: string;
  riskLevel: string;
  estimatedValue: number;
}


const TypewriterText = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 20); // Typing speed
    return () => clearInterval(timer);
  }, [text]);

  return (
    <span>
      {displayedText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ repeat: Infinity, duration: 0.8 }}
        className="inline-block w-2 h-4 bg-emerald-500 ml-1 translate-y-1"
      />
    </span>
  );
};


export default function MandiAdvisor() {
  const [formData, setFormData] = useState({
    commodity: '',
    state: '',
    district: '',
    quantity: ''
  });

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState('');

  // Bot thinking steps
  const thinkingSteps = [
    "Initializing neural networks...",
    "Connecting to data.gov.in APMC databases...",
    "Analyzing historical price fluctuations...",
    "Calculating volatility and risk margins...",
    "Formatting final projection..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < thinkingSteps.length - 1 ? prev + 1 : prev));
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.commodity || !formData.state) {
      setError("Commodity and State are required fields.");
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/mandi-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      
      const textData = await res.text();
      
      let data;
      try {
        data = JSON.parse(textData); // Try to convert it to JSON
      } catch (e) {
        console.error("Server sent HTML instead of JSON:", textData);
        throw new Error("Server configuration error. Ensure the route file is in the exact correct folder.");
      }

      if (!res.ok) throw new Error(data.error || 'Prediction failed');

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Unable to analyze market.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-200 selection:text-emerald-900 pb-12">
      
      {/* TOP NAVIGATION BAR */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 shadow-md">
              <Bot className="text-emerald-400 w-6 h-6 z-10" />
              <div className="absolute inset-0 bg-emerald-500 rounded-xl blur-md opacity-20 animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                Krishi<span className="text-emerald-600">AI</span> 
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-widest border border-emerald-200">v2.0 Active</span>
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: INPUT TERMINAL */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200 p-6 md:p-8 relative overflow-hidden"
          >
          
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-10 opacity-50"></div>
            
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Terminal className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Input Parameters</h2>
                <p className="text-xs text-slate-500 font-medium">Configure prediction engine</p>
              </div>
            </div>

            <form onSubmit={handlePredict} className="space-y-6 relative z-10">
              <div className="space-y-4">
                <InputField 
                  icon={<Wheat />} label="Crop / Commodity" name="commodity" 
                  placeholder="e.g. Wheat, Rice, Cotton" value={formData.commodity} 
                  onChange={handleChange} required 
                />
                <InputField 
                  icon={<MapPin />} label="Operating State" name="state" 
                  placeholder="e.g. Uttar Pradesh" value={formData.state} 
                  onChange={handleChange} required 
                />
                <InputField 
                  icon={<MapPin />} label="District (Optional)" name="district" 
                  placeholder="e.g. Meerut" value={formData.district} 
                  onChange={handleChange} 
                />
                <InputField 
                  icon={<Scale />} label="Yield Quantity (Quintals)" name="quantity" 
                  placeholder="e.g. 50" type="number" value={formData.quantity} 
                  onChange={handleChange} 
                />
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full mt-8 bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-bold shadow-lg shadow-slate-900/20 transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center group relative overflow-hidden"
              >
                <div className="absolute inset-0 w-full h-full bg-emerald-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                <span className="relative flex items-center">
                  {loading ? (
                    <><Loader2 className="w-5 h-5 animate-spin mr-2 text-emerald-400"/> Processing...</>
                  ) : (
                    <><Cpu className="w-5 h-5 mr-2 text-emerald-400 group-hover:rotate-12 transition-transform"/> Initialize AI Engine</>
                  )}
                </span>
              </button>
            </form>
          </motion.div>

          {/* RIGHT: AI RESULTS CONSOLE */}
          <div className="lg:col-span-8 h-full">
            <AnimatePresence mode="wait">
              
              {/* IDLE STATE */}
              {!result && !loading && !error && (
                <motion.div 
                  key="empty" 
                  initial={{opacity:0, scale:0.95}} 
                  animate={{opacity:1, scale:1}} 
                  exit={{opacity:0, scale:0.95}} 
                  className="h-full min-h-[500px] flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-[2rem] bg-slate-100/50 p-8 text-center"
                >
                  <div className="relative mb-6">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg border border-slate-100">
                      <Bot className="w-10 h-10 text-slate-400" />
                    </div>
                    <div className="absolute top-0 right-0 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white animate-pulse"></div>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">Awaiting Parameters</h3>
                  <p className="text-slate-500 font-medium text-base max-w-md">
                    Hello! I am your AI Mandi Advisor. Feed me your crop details and location, and I will generate a highly accurate market forecast for you.
                  </p>
                </motion.div>
              )}

              {/* ROBOT THINKING STATE */}
              {loading && (
                <motion.div 
                  key="loading" 
                  initial={{opacity:0}} 
                  animate={{opacity:1}} 
                  exit={{opacity:0}} 
                  className="h-full min-h-[500px] flex flex-col items-center justify-center bg-slate-900 rounded-[2rem] p-8 text-center relative overflow-hidden shadow-2xl border border-slate-800"
                >
                  {/* Hacker/Terminal background effect */}
                  <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]"></div>
                  
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="relative w-24 h-24 mb-8">
                      <div className="absolute inset-0 border-t-2 border-emerald-500 rounded-full animate-spin"></div>
                      <div className="absolute inset-2 border-r-2 border-emerald-300 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Brain className="w-8 h-8 text-emerald-400 animate-pulse" />
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-black text-white mb-6">AI Processing</h3>
                    
                    <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 w-full max-w-md text-left font-mono text-sm h-32 flex flex-col justify-end">
                      {thinkingSteps.map((step, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: idx <= loadingStep ? 1 : 0, x: idx <= loadingStep ? 0 : -10 }}
                          className={`flex items-center gap-2 mb-2 ${idx === loadingStep ? 'text-emerald-400' : 'text-slate-600'}`}
                        >
                          <ChevronRight className="w-4 h-4" />
                          <span>{step}</span>
                        </motion.div>
                      ))}
                      <span className="w-2 h-4 bg-emerald-500 animate-pulse mt-1 ml-6"></span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ERROR STATE */}
              {error && (
                <motion.div 
                  key="error" 
                  initial={{opacity:0}} 
                  animate={{opacity:1}} 
                  exit={{opacity:0}} 
                  className="h-full min-h-[500px] flex flex-col items-center justify-center bg-red-50 border border-red-200 rounded-[2rem] p-8 text-center shadow-lg shadow-red-100/50"
                >
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg border border-red-100 mb-6">
                    <AlertTriangle className="w-10 h-10 text-red-500" />
                  </div>
                  <h3 className="text-xl font-black text-red-900 mb-2">System Error</h3>
                  <p className="text-red-700 text-base font-medium max-w-md">{error}</p>
                  <button onClick={() => setError('')} className="mt-6 px-6 py-2 bg-white text-red-600 border border-red-200 rounded-lg font-bold hover:bg-red-50 transition-colors">
                    Acknowledge & Retry
                  </button>
                </motion.div>
              )}

              {/* AI RESULT STATE */}
              {result && (
                <motion.div 
                  key="result" 
                  initial={{opacity:0, y:20}} 
                  animate={{opacity:1, y:0}} 
                  className="space-y-6"
                >
                  
                  {/* AI Message Bubble */}
                  <div className="bg-emerald-950 rounded-[2rem] p-6 md:p-8 shadow-2xl relative overflow-hidden border border-emerald-900">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    
                    <div className="flex items-start gap-4 relative z-10">
                      <div className="w-12 h-12 bg-emerald-900 rounded-full flex items-center justify-center border border-emerald-700 flex-shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                        <Bot className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-emerald-400 font-bold">KrishiBot</h3>
                          <span className="text-emerald-700 text-xs font-mono border border-emerald-800/50 px-2 py-0.5 rounded">SYSTEM_LOG_492</span>
                        </div>
                        <p className="text-emerald-50 text-lg leading-relaxed font-medium">
                          <TypewriterText text={result.suggestion} />
                        </p>
                        
                        <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-emerald-800/50 pt-5">
                          <div className="flex items-center gap-2 text-emerald-200">
                            <Clock className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm font-bold text-slate-400">Optimum Action Window:</span>
                            <span className="text-sm font-black bg-emerald-500 text-emerald-950 px-3 py-1 rounded-md">
                              {result.bestSellTime}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Prediction Numbers Banner */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100">
                        <Sparkles className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-slate-500 text-sm font-bold mb-1 uppercase tracking-wider">7-Day AI Forecast (/Quintal)</p>
                        <h3 className="text-4xl font-black text-slate-900 tracking-tight">₹{result.expectedPrice}</h3>
                      </div>
                    </div>
                    <div className="h-12 w-px bg-slate-200 hidden md:block"></div>
                    <div className="text-left md:text-right w-full md:w-auto bg-slate-50 md:bg-transparent p-4 md:p-0 rounded-xl">
                      <p className="text-slate-500 text-xs font-bold mb-1 uppercase tracking-wider">Expected Price Range</p>
                      <p className="font-mono text-lg font-bold text-slate-800 bg-white md:bg-slate-100 px-3 py-1 rounded border border-slate-200">{result.priceRange}</p>
                    </div>
                  </div>

                  {/* Data Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard 
                      icon={<IndianRupee />} title="Current Rate" 
                      value={`₹${result.currentPrice}`} subtext="Per Quintal"
                      color="emerald" 
                    />
                    <StatCard 
                      icon={<Calculator />} title="Total Value" 
                      value={`₹${result.estimatedValue.toLocaleString()}`} subtext="Based on input"
                      color="blue" 
                    />
                    <StatCard 
                      icon={result.trend === 'Increasing' ? <TrendingUp/> : result.trend === 'Decreasing' ? <TrendingDown/> : <TrendingUp className="rotate-90"/>} 
                      title="Market Trend" value={result.trend} subtext="Next 7 Days"
                      color={result.trend === 'Increasing' ? 'emerald' : result.trend === 'Decreasing' ? 'red' : 'slate'} 
                    />
                    <StatCard 
                      icon={<Zap />} title="Volatility Risk" 
                      value={result.riskLevel} subtext="Market Stability"
                      color={result.riskLevel === 'High' ? 'red' : result.riskLevel === 'Medium' ? 'amber' : 'emerald'} 
                    />
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================
   UI HELPERS
========================================= */

function InputField({ icon, label, ...props }: any) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">{label}</label>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
          {React.cloneElement(icon, { className: 'w-5 h-5' })}
        </div>
        <input 
          {...props}
          className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm font-semibold transition-all text-slate-900 placeholder:font-medium placeholder:text-slate-400" 
        />
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, subtext, color }: { icon: React.ReactNode; title: string; value: string; subtext: string; color: 'emerald' | 'blue' | 'red' | 'amber' | 'slate' }) {
  const colorMap = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-200 shadow-blue-100',
    red: 'bg-red-50 text-red-600 border-red-200 shadow-red-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-200 shadow-amber-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-200 shadow-slate-100',
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl border shadow-sm ${colorMap[color]}`}>
      {React.cloneElement(icon as React.ReactElement)}
    </div>
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <p className="text-xl font-black text-slate-900 mb-1 truncate">{value}</p>
        <p className="text-xs font-semibold text-slate-500">{subtext}</p>
      </div>
    </div>
  );
}