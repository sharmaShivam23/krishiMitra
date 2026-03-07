'use client';

import React, { useState, useEffect } from 'react';
import SplashScreen from '@/components/Splashscreen';
import Navbar from '@/components/common/Navbar';
import Hero from '@/components/landing/HeroSection';
import Features from '@/components/landing/Features';
import TrustSection from '@/components/landing/TrustSection';
import Footer from '@/components/common/Footer';

export default function LandingPage() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <div className="min-h-screen bg-stone-50 font-sans selection:bg-amber-200 selection:text-stone-900 overflow-x-hidden">
      <Navbar />
      <Hero />
      <Features />
      <TrustSection />
      <Footer/>
    </div>
  );
}