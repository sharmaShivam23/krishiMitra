'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const COLOR_MAP: Record<string, { ring: string; glow: string; text: string }> = {
  excellent: { ring: '#10b981', glow: 'rgba(16,185,129,0.25)', text: 'text-emerald-600' },
  good: { ring: '#f59e0b', glow: 'rgba(245,158,11,0.25)', text: 'text-amber-600' },
  moderate: { ring: '#f97316', glow: 'rgba(249,115,22,0.25)', text: 'text-orange-600' },
  poor: { ring: '#ef4444', glow: 'rgba(239,68,68,0.25)', text: 'text-rose-600' },
};

const getRatingKey = (score: number) => {
  if (score >= 75) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 45) return 'moderate';
  return 'poor';
};

type Props = {
  score: number;
  rating: string;
  size?: number;
};

export default function SoilScoreGauge({ score, rating, size = 160 }: Props) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const ratingKey = getRatingKey(score);
  const colors = COLOR_MAP[ratingKey] || COLOR_MAP.poor;

  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;
  const center = size / 2;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Glow */}
        <div
          className="absolute inset-2 rounded-full blur-xl opacity-60"
          style={{ backgroundColor: colors.glow }}
        />

        <svg width={size} height={size} className="relative -rotate-90">
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          {/* Score arc */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={colors.ring}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-3xl font-black text-emerald-950"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            {animatedScore}
          </motion.span>
          <span className="text-[10px] font-bold text-emerald-700/60 uppercase tracking-wider">
            out of 100
          </span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="text-center"
      >
        <span className={`inline-block rounded-full px-4 py-1.5 text-sm font-black ${colors.text} bg-white/80 border border-current/20`}>
          {rating}
        </span>
      </motion.div>
    </div>
  );
}
