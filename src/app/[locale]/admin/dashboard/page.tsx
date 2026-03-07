'use client';

import React, { useState, useEffect } from 'react';
import { motion , Variants } from 'framer-motion';
import { 
  Users, Activity, ShieldCheck, ShoppingCart, 
  MessageSquare, Leaf, MapPin, Smartphone, Loader2, TrendingUp, Sprout
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

// --- Types ---
interface DashboardData {
  summaryCards: {
    totalFarmers: number;
    activeUsersToday: number;
    totalScans: number;
    totalListings: number;
    communityPosts: number;
    mostSearchedCrop: string;
    topState: string;
    smsSentToday: number;
  };
  charts: {
    registrationsPerDay: { date: string; registrations: number }[];
    diseaseChartData: { name: string; count: number }[];
    mandiViewsData: { market: string; views: number }[];
  };
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch('/api/admin/dashboard');
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-[#f4f7f5] flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-6 animate-pulse">
          <Sprout className="w-10 h-10 text-emerald-600" />
        </div>
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-4" />
        <h2 className="text-xl font-black text-emerald-950 tracking-tight">Loading Command Center...</h2>
      </div>
    );
  }

  const { summaryCards, charts } = data;

  // Animation variants
  const container : Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item : Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120 } } };

  return (
    <div className="min-h-screen bg-[#f4f7f5] p-6 lg:p-10 font-sans">
      <div className="max-w-[1400px] mx-auto">
        
        {/* 🌟 HEADER */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-emerald-500/10 text-emerald-700 px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase mb-3 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live System Status
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-emerald-950 tracking-tight">
              Krishi<span className="text-emerald-500">Mitra</span> Command
            </h1>
            <p className="text-emerald-900/60 font-medium mt-2 text-lg">Platform analytics and ecosystem health overview.</p>
          </div>
          <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-stone-200 flex items-center space-x-4">
            <div className="text-right">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Server Time</p>
              <p className="text-emerald-950 font-black">{new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
            </div>
            <ClockIcon />
          </div>
        </motion.div>

        <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
          
          {/* 🌟 TOP METRICS ROW (Primary Stats) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard title="Total Farmers" value={summaryCards.totalFarmers} icon={<Users />} color="emerald" trend="+12% this week" />
            <MetricCard title="Active Today" value={summaryCards.activeUsersToday} icon={<Activity />} color="blue" trend="High engagement" />
            <MetricCard title="AI Scans Run" value={summaryCards.totalScans} icon={<ShieldCheck />} color="amber" trend="System nominal" />
            <MetricCard title="SMS Alerts Sent" value={summaryCards.smsSentToday} icon={<Smartphone />} color="purple" trend="Delivered instantly" />
          </div>

          {/* 🌟 CHARTS ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Area Chart: Registrations */}
            <motion.div variants={item} className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100 lg:col-span-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-[80px] pointer-events-none -z-10" />
              <div className="mb-6 flex justify-between items-end">
                <div>
                  <h3 className="text-xl font-black text-emerald-950">Farmer Growth</h3>
                  <p className="text-sm font-medium text-stone-500">New registrations over the last 7 days</p>
                </div>
                <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-sm font-bold flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" /> Expanding
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts.registrationsPerDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12, fontWeight: 600}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12, fontWeight: 600}} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="registrations" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorReg)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Pie Chart: Diseases */}
            <motion.div variants={item} className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100 flex flex-col">
              <div className="mb-2">
                <h3 className="text-xl font-black text-emerald-950">Disease AI Telemetry</h3>
                <p className="text-sm font-medium text-stone-500">Breakdown of recent crop scans</p>
              </div>
              <div className="flex-1 min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={charts.diseaseChartData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="count" stroke="none">
                      {charts.diseaseChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: '#4b5563' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* 🌟 BOTTOM METRICS ROW & BAR CHART */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Secondary Insights */}
            <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:col-span-1">
              <InsightCard title="Most Searched Crop" value={summaryCards.mostSearchedCrop} icon={<Leaf className="text-emerald-500" />} />
              <InsightCard title="Top Active State" value={summaryCards.topState} icon={<MapPin className="text-blue-500" />} />
              <InsightCard title="Community Posts" value={summaryCards.communityPosts.toString()} icon={<MessageSquare className="text-amber-500" />} />
              <InsightCard title="Market Listings" value={summaryCards.totalListings.toString()} icon={<ShoppingCart className="text-purple-500" />} />
            </motion.div>

            {/* Bar Chart: Mandi Views */}
            <motion.div variants={item} className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100 lg:col-span-2">
               <div className="mb-6">
                <h3 className="text-xl font-black text-emerald-950">Mandi Market Engagement</h3>
                <p className="text-sm font-medium text-stone-500">Most viewed APMC locations</p>
              </div>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.mandiViewsData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={40}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="market" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12, fontWeight: 600}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12, fontWeight: 600}} />
                    <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="views" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* =========================================
   UI SUB-COMPONENTS
========================================= */

function MetricCard({ title, value, icon, color, trend }: { title: string, value: number, icon: React.ReactNode, color: 'emerald'|'blue'|'amber'|'purple', trend: string }) {
  const colorMap = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100 flex flex-col justify-between group hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-300">
      <div className="flex justify-between items-start mb-6">
        <div className={`p-3 rounded-2xl ${colorMap[color]}`}>
         {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-6 h-6' })}
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 bg-stone-100 px-2 py-1 rounded-md">{trend}</span>
      </div>
      <div>
        <p className="text-sm font-bold text-stone-500 mb-1">{title}</p>
        <h4 className="text-4xl font-black text-emerald-950 tracking-tight">{value.toLocaleString()}</h4>
      </div>
    </motion.div>
  );
}

function InsightCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-stone-100 flex flex-col justify-center items-start group hover:-translate-y-1 transition-transform">
      <div className="mb-3 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
        {icon}
      </div>
      <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">{title}</p>
      <h4 className="text-xl font-black text-emerald-950 leading-tight">{value}</h4>
    </div>
  );
}

function ClockIcon() {
  return (
    <div className="w-10 h-10 rounded-full bg-[#041a13] flex items-center justify-center shadow-inner">
      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_2px_rgba(52,211,153,0.8)]" />
    </div>
  );
}