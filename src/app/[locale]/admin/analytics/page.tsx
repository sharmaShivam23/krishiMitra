'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Activity, Target, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

export default function AnalyticsDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/admin/analytics');
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-emerald-950 flex items-center">
          <ShieldCheck className="w-8 h-8 mr-3 text-emerald-600" />
          AI Disease Analytics
        </h1>
        <p className="text-stone-500 font-medium mt-2">Monitor crop health trends and AI performance across the platform.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Metric Cards */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-200 flex items-center">
          <div className="p-4 bg-emerald-50 rounded-2xl mr-6">
            <Activity className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-stone-500 mb-1">Total AI Scans</p>
            <h4 className="text-4xl font-black text-emerald-950 tracking-tight">{data?.totalScans || 0}</h4>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-200 flex items-center">
          <div className="p-4 bg-blue-50 rounded-2xl mr-6">
            <Target className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-stone-500 mb-1">Average AI Confidence</p>
            <h4 className="text-4xl font-black text-emerald-950 tracking-tight">{data?.avgConfidence || 0}%</h4>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-stone-200 lg:col-span-1">
          <h3 className="text-xl font-black text-emerald-950 mb-6">Threat Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data?.diseaseDistribution || []} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="count" stroke="none">
                  {(data?.diseaseDistribution || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: '#4b5563' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Scans Table */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-stone-200 lg:col-span-2 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-stone-100">
            <h3 className="text-xl font-black text-emerald-950">Live Telemetry</h3>
          </div>
          <div className="overflow-x-auto flex-1 p-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-stone-100 text-stone-400 text-sm">
                  <th className="pb-3 font-bold uppercase tracking-wider">Date</th>
                  <th className="pb-3 font-bold uppercase tracking-wider">Disease Detected</th>
                  <th className="pb-3 font-bold uppercase tracking-wider">Confidence</th>
                  <th className="pb-3 font-bold uppercase tracking-wider">Farmer State</th>
                </tr>
              </thead>
              <tbody className="text-stone-700 font-medium">
                {data?.recentScans?.map((scan: any) => (
                  <tr key={scan._id} className="border-b border-stone-50 hover:bg-stone-50 transition-colors">
                    <td className="py-4">{new Date(scan.createdAt).toLocaleDateString()}</td>
                    <td className="py-4 font-bold text-emerald-900">{scan.disease}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${scan.confidence > 0.85 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {(scan.confidence * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-4 text-stone-500">{scan.userId?.state || 'Unknown'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!data?.recentScans || data.recentScans.length === 0) && (
              <p className="text-center text-stone-400 font-medium mt-6">No scans recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}