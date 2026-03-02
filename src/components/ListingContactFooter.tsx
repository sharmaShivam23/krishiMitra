'use client';

import React from 'react';
import { IndianRupee, Volume2, MessageCircle, Phone } from 'lucide-react';
import { useSpeech } from '@/hooks/useSpeech';

interface ListingContactFooterProps {
  title: string;
  pricing: {
    rate: number | string;
    unit: string;
  };
  provider: {
    name: string;
    phone: string;
  };
  location: {
    state: string;
    district: string;
  };
  type?: 'rent' | 'service';
}

export default function ListingContactFooter({
  title,
  pricing,
  provider,
  location,
  type = 'rent'
}: ListingContactFooterProps) {
  
  const { speak } = useSpeech();

  const phoneThemeClass = type === 'rent' 
    ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white' 
    : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white';

  const waMessage = encodeURIComponent(`Hi ${provider.name}, I am interested in your "${title}" listed on KrishiMitra.`);

const handleListen = () => {
    // 1. Convert units to Hinglish
    let unitHinglish = pricing.unit;
    if (pricing.unit.includes('day')) unitHinglish = 'din';
    else if (pricing.unit.includes('hour')) unitHinglish = 'ghanta';
    else if (pricing.unit.includes('acre')) unitHinglish = 'acre';
    
    // 2. Determine action
    const actionText = type === 'rent' ? 'rent par dena chahte hain' : 'service ke liye dena chahte hain';

    // 3. The exact Hinglish sentence you requested
    const hinglishText = `Ye kisan, ${provider.name}, ${location.state} ke ${location.district} se hain. Ye apna ${title} ${actionText}, jiska rate ${pricing.rate} rupees per ${unitHinglish} hai. Inse sampark karne ke liye, hare phone icon par click karein.`;
    
    speak(hinglishText);
  };

  return (
    <div className="flex items-end justify-between">
      <div>
        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-0.5">Rate</p>
        <div className="flex items-baseline text-gray-900">
          <IndianRupee className="w-5 h-5 mr-0.5 text-emerald-600" />
          <span className="text-2xl font-black">{pricing.rate}</span>
          <span className="text-xs font-bold text-gray-500 ml-1">/ {pricing.unit}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button 
          onClick={handleListen}
          title="सुनने के लिए दबाएं (Listen)"
          className="w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white active:scale-95"
        >
          <Volume2 className="w-5 h-5" />
        </button>

        <a 
          href={`https://wa.me/91${provider.phone}?text=${waMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          title={`WhatsApp ${provider.name}`}
          className="w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-sm bg-green-50 text-green-600 hover:bg-green-600 hover:text-white active:scale-95"
        >
          <MessageCircle className="w-5 h-5" /> 
        </a>

        <a 
          href={`tel:${provider.phone}`}
          title={`Call ${provider.name}`}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95 ${phoneThemeClass}`}
        >
          <Phone className="w-5 h-5" />
        </a>
      </div>
    </div>
  );
}