'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BrainCircuit, TrendingUp, TrendingDown, MapPin, Loader2, ArrowRight, 
  BarChart3, AlertCircle, ShieldCheck, IndianRupee, Clock, Scale,
  Wallet, Percent, Calendar, AlertTriangle, Activity
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';


interface PredictionResponse {
  commodity: string;
  current_rate: number;
  forecast_7day: {
    predicted_price_t7: number;
    change_percent?: number;
    day_wise: {
      day_1: number;
      day_3: number;
      day_7: number;
    };
    expected_range?: {
      min: number;
      max: number;
      avg: number;
    };
  };
  market_analysis: {
    trend: string;
    volatility_risk: string;
    volatility_score?: number;
  };
  financial_projection?: {
    total_current_value: number;
    predicted_value_t7: number;
    expected_profit: number;
    roi: number;
  };
  recommendation: {
    action: string;
    confidence_score: number;
    risk_level?: string;
    best_sell_day?: string;
  };
}

const STATES_OF_INDIA = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", 
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

export default function AIPredictionPage() {
  const [formData, setFormData] = useState({
    commodity: '',
    state: '',
    district: '',
    quantity: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState('');

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/mandi-advisor2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          quantity: Number(formData.quantity)
        })
      });
      
      const json = await res.json();
      
      if (json.success) {
        setResult(json.data);
      } else {
        throw new Error(json.error || 'Prediction failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Transform data for Recharts
  const chartData = result ? [
    { day: 'Today', price: result.current_rate },
    { day: 'Day 1', price: result.forecast_7day.day_wise.day_1 },
    { day: 'Day 3', price: result.forecast_7day.day_wise.day_3 },
    { day: 'Day 7', price: result.forecast_7day.day_wise.day_7 },
  ] : [];

  const priceDiff = result ? result.forecast_7day.predicted_price_t7 - result.current_rate : 0;
  const isPositive = priceDiff >= 0;
  
  // Safely check for negative profit
  const expectedProfit = result?.financial_projection?.expected_profit || priceDiff * Number(formData.quantity || 1);
  const isProfit = expectedProfit >= 0;

  return (
    <div className="max-w-7xl mx-auto space-y-10 font-sans pb-16">
      
      {/* 🌟 PREMIUM HERO SECTION */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-[#041a13] px-8 py-12 md:p-16 shadow-2xl border border-emerald-900/50">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
        <BrainCircuit className="absolute -right-12 -bottom-10 w-80 h-80 text-white/[0.03] pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 text-blue-400 px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase mb-6 border border-blue-500/20">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Machine Learning Engine Active
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-4 tracking-tight">
            AI Mandi <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">Forecasting</span>
          </h1>
          <p className="text-lg text-emerald-100/70 font-medium leading-relaxed max-w-2xl">
            Leverage predictive analytics to anticipate market movements. Enter your crop details below to generate a comprehensive financial and risk trajectory.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 🌟 INPUT FORM (Left Column) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-stone-200 relative overflow-hidden sticky top-6">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-blue-500" />
            <h2 className="text-2xl font-black text-black mb-6 flex items-center">
              <BarChart3 className="w-6 h-6 mr-2 text-emerald-600" /> Parameters
            </h2>
            
            <form onSubmit={handlePredict} className="space-y-5">
              {/* <div className="space-y-1.5">
                <label className="block text-sm font-black text-black">Commodity</label>
                <select required className="w-full px-4 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-black font-bold outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all cursor-pointer appearance-none" onChange={e => setFormData({...formData, commodity: e.target.value})}>
                  <option value="">Select Crop...</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Wheat">Wheat</option>
                  <option value="Paddy">Paddy</option>
                  <option value="Soyabean">Soyabean</option>
                  <option value="Maize">Maize</option>
                  <option value="Mustard">Mustard</option>
                </select>
              </div> */}
              <div className="space-y-1.5">
                <label className="block text-sm font-black text-black">Commodity</label>
                <select 
                  required 
                  className="w-full px-4 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-black font-bold outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all cursor-pointer appearance-none" 
                  onChange={e => setFormData({...formData, commodity: e.target.value})}
                >
                  <option value="">Select Crop...</option>
                  
                  <optgroup label="1. Cereals & Grains">
                    <option value="Paddy">Paddy (Rice)</option>
                    <option value="Wheat">Wheat</option>
                    <option value="Maize">Maize (Corn)</option>
                    <option value="Bajra">Bajra (Pearl Millet)</option>
                    <option value="Jowar">Jowar (Sorghum)</option>
                    <option value="Barley">Barley</option>
                  </optgroup>

                  <optgroup label="2. Pulses">
                    <option value="Bengal Gram">Bengal Gram (Chana)</option>
                    <option value="Red Gram">Red Gram (Tur/Arhar)</option>
                    <option value="Green Gram">Green Gram (Moong)</option>
                    <option value="Black Gram">Black Gram (Urad)</option>
                    <option value="Lentil">Lentil (Masur)</option>
                  </optgroup>

                  <optgroup label="3. Oilseeds">
                    <option value="Soyabean">Soyabean</option>
                    <option value="Mustard">Mustard</option>
                    <option value="Groundnut">Groundnut</option>
                    <option value="Sunflower">Sunflower</option>
                    <option value="Sesamum">Sesamum (Til)</option>
                  </optgroup>

                  <optgroup label="4. Cash Crops">
                    <option value="Cotton">Cotton</option>
                    <option value="Sugarcane">Sugarcane</option>
                    <option value="Jute">Jute</option>
                  </optgroup>

                  <optgroup label="5. Spices & Vegetables">
                    <option value="Onion">Onion</option>
                    <option value="Potato">Potato</option>
                    <option value="Tomato">Tomato</option>
                    <option value="Turmeric">Turmeric</option>
                    <option value="Cumin">Cumin (Jeera)</option>
                    <option value="Red Chilli">Red Chilli</option>
                    <option value="Coriander">Coriander</option>
                  </optgroup>
                </select>
              </div>

              {/* 🌟 UPDATED: State Dropdown with all Indian States */}
              <div className="space-y-1.5">
                <label className="block text-sm font-black text-black">State</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-stone-400" />
                  <select required className="w-full pl-11 pr-4 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-black font-bold outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all cursor-pointer appearance-none" onChange={e => setFormData({...formData, state: e.target.value})}>
                    <option value="">Select State...</option>
                    {STATES_OF_INDIA.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-black text-black">District</label>
                <input required type="text" placeholder="E.g. Ahmedabad" className="w-full px-4 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-black font-bold outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-stone-400 placeholder:font-medium" onChange={e => setFormData({...formData, district: e.target.value})} />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-black text-black">Quantity (Quintals)</label>
                <div className="relative">
                  <Scale className="absolute left-4 top-3.5 w-5 h-5 text-stone-400" />
                  <input required type="number" min="1" placeholder="100" className="w-full pl-11 pr-4 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-black font-bold outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-stone-400 placeholder:font-medium" onChange={e => setFormData({...formData, quantity: e.target.value})} />
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="w-full py-4 mt-4 bg-[#041a13] text-white rounded-2xl font-black text-lg hover:bg-emerald-900 shadow-lg shadow-emerald-900/20 active:scale-[0.98] transition-all flex justify-center items-center disabled:opacity-70 group">
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                  <>Run Analysis <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>

              {error && (
                <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl flex items-start border border-red-100">
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" /> {error}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* 🌟 RESULTS DASHBOARD (Right Column) */}
        <div className="lg:col-span-8">
          
          {/* Empty / Loading States */}
          {!result && !isLoading && (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-stone-50/50 rounded-[2rem] border-2 border-dashed border-stone-200 p-8 text-center">
              <div className="w-20 h-20 bg-white shadow-sm rounded-full flex items-center justify-center mb-6">
                <BrainCircuit className="w-10 h-10 text-stone-300" />
              </div>
              <h3 className="text-2xl font-black text-stone-400 mb-2">Awaiting Parameters</h3>
              <p className="text-stone-500 font-medium max-w-sm">Enter your harvest details on the left to generate an AI-powered financial and market forecast.</p>
            </div>
          )}

          {isLoading && (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-[2rem] border border-stone-200 shadow-sm p-8 text-center">
              <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 border-4 border-emerald-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
                <BrainCircuit className="absolute inset-0 m-auto w-8 h-8 text-emerald-600 animate-pulse" />
              </div>
              <h3 className="text-2xl font-black text-black mb-2">Computing Financial Projections...</h3>
              <p className="text-stone-500 font-medium animate-pulse">Analyzing market volatility and historical data.</p>
            </div>
          )}

          {/* 🌟 SUCCESS RESULT UI */}
          <AnimatePresence>
            {result && !isLoading && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                
                {/* 1. PRIMARY AI RECOMMENDATION BANNER */}
                <div className={`rounded-[2rem] p-6 shadow-sm border flex flex-col md:flex-row items-center justify-between ${!isProfit || result.recommendation.action.toLowerCase().includes('sell') ? 'bg-gradient-to-r from-rose-50 to-red-50 border-rose-200' : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200'}`}>
                  <div className="flex items-center mb-4 md:mb-0">
                    <div className={`p-4 rounded-full mr-5 shadow-sm ${!isProfit ? 'bg-white text-rose-600' : 'bg-white text-emerald-600'}`}>
                      {!isProfit ? <AlertTriangle className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
                    </div>
                    <div>
                      <p className={`text-sm font-bold uppercase tracking-widest mb-1 ${!isProfit ? 'text-rose-600' : 'text-emerald-700'}`}>AI Verdict</p>
                      <h3 className={`text-2xl md:text-3xl font-black ${!isProfit ? 'text-rose-950' : 'text-emerald-950'}`}>
                        {result.recommendation.action}
                      </h3>
                    </div>
                  </div>
                  <div className="flex gap-4 w-full md:w-auto">
                    <div className={`px-4 py-3 rounded-xl flex-1 text-center bg-white/60 border ${!isProfit ? 'border-rose-100' : 'border-emerald-100'}`}>
                      <p className="text-xs font-bold uppercase text-stone-500 mb-0.5">Confidence</p>
                      <p className="text-lg font-black text-black">{result.recommendation.confidence_score}%</p>
                    </div>
                    {result.recommendation.best_sell_day && (
                      <div className={`px-4 py-3 rounded-xl flex-1 text-center bg-white/60 border ${!isProfit ? 'border-rose-100' : 'border-emerald-100'}`}>
                        <p className="text-xs font-bold uppercase text-stone-500 mb-0.5">Best Day</p>
                        <p className="text-lg font-black text-black">{result.recommendation.best_sell_day}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. FINANCIAL PROJECTIONS GRID */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200">
                    <Wallet className="w-5 h-5 text-stone-400 mb-2" />
                    <p className="text-xs font-bold text-stone-500 uppercase">Current Value</p>
                    <p className="text-xl font-black text-black mt-1">₹{result.financial_projection?.total_current_value?.toLocaleString() || (result.current_rate * Number(formData.quantity)).toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200">
                    <Clock className="w-5 h-5 text-blue-400 mb-2" />
                    <p className="text-xs font-bold text-stone-500 uppercase">Value (Day 7)</p>
                    <p className="text-xl font-black text-black mt-1">₹{result.financial_projection?.predicted_value_t7?.toLocaleString() || (result.forecast_7day.predicted_price_t7 * Number(formData.quantity)).toLocaleString()}</p>
                  </div>
                  <div className={`p-5 rounded-2xl shadow-sm border ${isProfit ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                    <IndianRupee className={`w-5 h-5 mb-2 ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`} />
                    <p className={`text-xs font-bold uppercase ${isProfit ? 'text-emerald-700' : 'text-rose-700'}`}>Expected Profit</p>
                    <p className={`text-xl font-black mt-1 ${isProfit ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {isProfit ? '+' : ''}₹{expectedProfit.toLocaleString()}
                    </p>
                  </div>
                  <div className={`p-5 rounded-2xl shadow-sm border ${isProfit ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                    <Percent className={`w-5 h-5 mb-2 ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`} />
                    <p className={`text-xs font-bold uppercase ${isProfit ? 'text-emerald-700' : 'text-rose-700'}`}>ROI (7 Days)</p>
                    <p className={`text-xl font-black mt-1 ${isProfit ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {result.financial_projection?.roi || result.forecast_7day.change_percent}%
                    </p>
                  </div>
                </div>

                {/* 3. MARKET ANALYSIS ROW */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Current vs Projected Rates */}
                  <div className="md:col-span-2 bg-white rounded-[2rem] p-6 shadow-sm border border-stone-200">
                    <p className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-2">Current {result.commodity} Rate</p>
                    <div className="flex items-end space-x-4 mb-4">
                      <h3 className="text-4xl lg:text-5xl font-black text-black flex items-center tracking-tighter">
                        <IndianRupee className="w-8 h-8 mr-1 text-stone-400" />
                        {result.current_rate} <span className="text-lg text-stone-400 font-bold ml-1">/q</span>
                      </h3>
                    </div>
                    <div className="flex gap-3">
                      <div className="bg-stone-50 px-4 py-3 rounded-xl border border-stone-100 flex-1">
                        <p className="text-[10px] font-bold text-stone-400 uppercase">Trend</p>
                        <p className="text-sm font-black text-black flex items-center mt-1">
                          <Activity className="w-4 h-4 mr-1.5 text-blue-500" /> {result.market_analysis.trend}
                        </p>
                      </div>
                      <div className="bg-stone-50 px-4 py-3 rounded-xl border border-stone-100 flex-1">
                        <p className="text-[10px] font-bold text-stone-400 uppercase">Risk / Stability</p>
                        <p className="text-sm font-black text-black flex items-center mt-1">
                          <AlertTriangle className="w-4 h-4 mr-1.5 text-amber-500" /> {result.market_analysis.volatility_risk} 
                          {result.market_analysis.volatility_score && ` (${result.market_analysis.volatility_score})`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Price Range */}
                  {result.forecast_7day.expected_range && (
                    <div className="bg-[#041a13] rounded-[2rem] p-6 shadow-sm flex flex-col justify-center relative overflow-hidden text-white">
                      <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-4">Expected Range</h4>
                      <div className="space-y-4 relative z-10">
                        <div className="flex justify-between items-center pb-2 border-b border-white/10">
                          <span className="text-sm font-medium text-stone-400">Maximum</span>
                          <span className="font-black text-emerald-400">₹{result.forecast_7day.expected_range.max}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-white/10">
                          <span className="text-sm font-medium text-stone-400">Average</span>
                          <span className="font-black">₹{result.forecast_7day.expected_range.avg}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-stone-400">Minimum</span>
                          <span className="font-black text-rose-400">₹{result.forecast_7day.expected_range.min}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. VISUAL CHART SECTION */}
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-stone-200">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <h3 className="text-xl font-black text-black">7-Day Price Trajectory</h3>
                      <p className="text-sm font-medium text-stone-500">Projected closing rates per quintal (₹)</p>
                    </div>
                    <div className="bg-stone-100 text-stone-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center border border-stone-200">
                      <Calendar className="w-3.5 h-3.5 mr-1" /> T+7 Horizon
                    </div>
                  </div>
                  
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={isPositive ? '#10b981' : '#f43f5e'} stopOpacity={0.4}/>
                            <stop offset="95%" stopColor={isPositive ? '#10b981' : '#f43f5e'} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#78716c', fontSize: 12, fontWeight: 700}} dy={10} />
                        <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{fill: '#78716c', fontSize: 12, fontWeight: 700}} tickFormatter={(value) => `₹${value}`} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px 16px' }}
                          itemStyle={{ color: '#000', fontWeight: 900 }}
                          formatter={(value: any) => [`₹${value}`, 'Predicted Price']}
                          labelStyle={{ color: '#78716c', fontWeight: 700, marginBottom: '4px' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="price" 
                          stroke={isPositive ? '#10b981' : '#f43f5e'} 
                          strokeWidth={4} 
                          fillOpacity={1} 
                          fill="url(#colorPrice)" 
                          activeDot={{ r: 8, strokeWidth: 0, fill: isPositive ? '#047857' : '#be123c' }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}