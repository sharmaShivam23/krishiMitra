// 'use client';

// import React, { useState, useEffect } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { 
//   Tractor, Wrench, MapPin, Search, Filter, 
//   IndianRupee, User, ShieldCheck, PlusCircle, 
//   Loader2, AlertCircle, Phone, MessageCircle 
// } from 'lucide-react';
// import Link from 'next/link';
// import ListingContactFooter from '@/components/ListingContactFooter';

// /* =========================================
//    TYPES
// ========================================= */
// interface Provider {
//   _id: string;
//   name: string;
//   phone: string;
//   profileImage?: string;
// }

// interface Listing {
//   _id: string;
//   listingType: 'rent' | 'service';
//   title: string;
//   description: string;
//   category: string;
//   pricing: { rate: number; unit: string };
//   equipment: { name: string; condition: string };
//   serviceDetails?: { operatorIncluded: boolean; jobType: string; estimatedCapacity: string };
//   location: { state: string; district: string; village?: string };
//   images: string[];
//   providerId: Provider;
//   createdAt: string;
// }

// const CATEGORIES = ['All Equipment', 'Tractor', 'Harvester', 'Sprayer', 'Cultivator', 'Seeder', 'Other'];

// /* =========================================
//    MAIN COMPONENT
// ========================================= */
// export default function EquipmentExchange() {
//   const [listings, setListings] = useState<Listing[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState('');

//   // Filters & Toggles
//   const [activeTab, setActiveTab] = useState<'rent' | 'service'>('rent');
//   const [searchQuery, setSearchQuery] = useState('');
//   const [debouncedSearch, setDebouncedSearch] = useState('');
//   const [selectedCategory, setSelectedCategory] = useState('All Equipment');
//   const [districtFilter, setDistrictFilter] = useState('');

//   // Debounce search input
//   useEffect(() => {
//     const handler = setTimeout(() => setDebouncedSearch(searchQuery), 500);
//     return () => clearTimeout(handler);
//   }, [searchQuery]);

//   /* =========================================
//      FETCH DATA FROM BACKEND
//   ========================================= */
//   useEffect(() => {
//     const fetchListings = async () => {
//       setIsLoading(true);
//       setError('');
      
//       try {
//         const params = new URLSearchParams({ type: activeTab });
//         if (debouncedSearch) params.append('search', debouncedSearch);
//         if (selectedCategory !== 'All Equipment') params.append('category', selectedCategory);
//         if (districtFilter) params.append('district', districtFilter);

//         // 🛠️ Ensure this matches your backend API route exactly
//         const res = await fetch(`/api/listing?${params.toString()}`);
        
//         const textData = await res.text();
//         let data;
//         try {
//           data = JSON.parse(textData);
//         } catch (err) {
//           throw new Error('API Route not found. Server returned HTML instead of JSON.');
//         }

//         if (!res.ok || !data.success) {
//           throw new Error(data.message || 'Error fetching data.');
//         }
        
//         setListings(data.listings);
//       } catch (err: any) {
//         setError(err.message);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchListings();
//   }, [activeTab, debouncedSearch, selectedCategory, districtFilter]);

//   /* =========================================
//      RENDER
//   ========================================= */
//   return (
//     <div className="min-h-screen bg-gray-50/50 pb-20 font-sans selection:bg-emerald-400 selection:text-emerald-950">
      
//       {/* 1. HERO HEADER */}
//       <div className="bg-emerald-950 relative overflow-hidden pt-12 pb-24 px-6 lg:px-8 border-b-[6px] border-emerald-500">
//         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
//         <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/20 rounded-full mix-blend-screen filter blur-[80px]"></div>
        
//         <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
//           <div>
//             <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-widest mb-4">
//               <Tractor className="w-4 h-4" /> <span>Krishi Exchange</span>
//             </div>
//             <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
//               Machinery & <span className="text-emerald-400">Services</span>
//             </h1>
//             <p className="text-emerald-100/80 mt-2 text-lg max-w-xl font-medium">
//               Rent high-quality agricultural equipment or hire verified professionals with machinery for your farm.
//             </p>
//           </div>

//           <Link 
//             href="/dashboard/Services/post" 
//             className="flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-6 py-3.5 rounded-xl font-bold transition-all shadow-[0_0_30px_-5px_rgba(16,185,129,0.4)] active:scale-95 group"
//           >
//             <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform" />
//             <span>Post a Listing</span>
//           </Link>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        
//         {/* 2. TAB TOGGLE (Rent vs Service) */}
//         <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-2 flex flex-col sm:flex-row items-center justify-between mb-8 border border-gray-100">
//           <div className="flex w-full sm:w-auto bg-gray-100 p-1.5 rounded-xl">
//             <button
//               onClick={() => setActiveTab('rent')}
//               className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
//                 activeTab === 'rent' 
//                   ? 'bg-white text-emerald-700 shadow-sm' 
//                   : 'text-gray-500 hover:text-gray-700'
//               }`}
//             >
//               <Tractor className="w-4 h-4" /> <span>Rent Equipment</span>
//             </button>
//             <button
//               onClick={() => setActiveTab('service')}
//               className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
//                 activeTab === 'service' 
//                   ? 'bg-white text-blue-700 shadow-sm' 
//                   : 'text-gray-500 hover:text-gray-700'
//               }`}
//             >
//               <Wrench className="w-4 h-4" /> <span>Hire Service</span>
//             </button>
//           </div>

//           {/* Filters inside the same bar on desktop */}
//           <div className="w-full sm:w-auto mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3 pr-2">
//              <div className="relative">
//                 <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
//                 <input 
//                   type="text" placeholder="Search listings..." 
//                   value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
//                   className="w-full sm:w-64 pl-9 pr-4 py-2.5 bg-gray-50 border text-black border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none"
//                 />
//              </div>
//              <div className="relative">
//                 <Filter className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
//                 <select 
//                   value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
//                   className="w-full sm:w-48 pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-emerald-500/20 outline-none appearance-none cursor-pointer"
//                 >
//                   {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
//                 </select>
//              </div>
//           </div>
//         </div>

//         {/* 3. LISTING GRID */}
//         <AnimatePresence mode="wait">
//           {isLoading ? (
//             <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-32">
//               <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mb-4" />
//               <p className="text-gray-500 font-medium">Loading marketplace...</p>
//             </motion.div>
//           ) : error ? (
//             <motion.div key="error" className="bg-red-50 border border-red-100 rounded-2xl p-10 text-center flex flex-col items-center">
//               <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
//               <h3 className="text-lg font-bold text-red-900">Failed to load listings</h3>
//               <p className="text-red-700 text-sm mt-1">{error}</p>
//             </motion.div>
//           ) : listings.length === 0 ? (
//             <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-gray-200 border-dashed rounded-[2rem] p-16 text-center flex flex-col items-center">
//               <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
//                 <Tractor className="w-10 h-10 text-gray-300" />
//               </div>
//               <h3 className="text-xl font-bold text-gray-900 mb-2">No listings found</h3>
//               <p className="text-gray-500 max-w-md mx-auto">We couldn't find any {activeTab === 'rent' ? 'equipment' : 'services'} matching your filters in this area.</p>
//             </motion.div>
//           ) : (
//             <motion.div key="grid" initial="hidden" animate="show" variants={{
//               hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } }
//             }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
//               {listings.map((listing) => (
//                 <motion.div 
//                   key={listing._id} 
//                   variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
//                   className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-300 flex flex-col group overflow-hidden"
//                 >
                  
//                   {/* Image Placeholder */}
//                   <div className="h-48 bg-slate-100 relative overflow-hidden flex items-center justify-center">
//                     {listing.images && listing.images.length > 0 ? (
//                       <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
//                     ) : (
//                       <div className={`w-full h-full flex flex-col items-center justify-center ${activeTab === 'rent' ? 'bg-emerald-50 text-emerald-200' : 'bg-blue-50 text-blue-200'}`}>
//                         {activeTab === 'rent' ? <Tractor className="w-20 h-20 mb-2" /> : <Wrench className="w-20 h-20 mb-2" />}
//                       </div>
//                     )}
                    
//                     {/* Condition/Operator Badge */}
//                     <div className="absolute top-4 left-4">
//                       {activeTab === 'rent' ? (
//                         <span className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center shadow-sm">
//                           <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-500" /> Condition: {listing.equipment.condition}
//                         </span>
//                       ) : (
//                         <span className="bg-blue-600/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center shadow-sm">
//                           <User className="w-3.5 h-3.5 mr-1" /> Operator Included
//                         </span>
//                       )}
//                     </div>
//                   </div>

//                   {/* Content */}
//                   <div className="p-6 flex-1 flex flex-col">
//                     <div className="flex justify-between items-start mb-2">
//                       <h3 className="text-xl font-black text-gray-900 leading-tight line-clamp-2 pr-2 group-hover:text-emerald-700 transition-colors">
//                         {listing.title}
//                       </h3>
//                     </div>
                    
//                     <p className="text-sm text-gray-500 font-medium mb-4 flex items-center">
//                       <MapPin className="w-4 h-4 mr-1 text-gray-400" />
//                       {listing.location.district}, {listing.location.state}
//                     </p>

//   <div className="flex items-center mb-4 bg-gray-50/80 w-max px-3 py-1.5 rounded-lg border border-gray-100">
//                       <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center mr-2 text-emerald-700 font-bold text-xs">
//                         {listing.providerId?.name ? listing.providerId.name.charAt(0).toUpperCase() : <User className="w-3 h-3" />}
//                       </div>
//                       <p className="text-xs font-semibold text-gray-500">
//                         Owner <span className="text-gray-900 font-bold">{listing.providerId?.name || 'Verified Farmer'}</span>
//                       </p>
//                     </div>

//                     <div className="space-y-2 mt-auto">
//                       <div className="flex items-center text-sm">
//                         <span className="text-gray-400 font-medium w-24">Equipment:</span>
//                         <span className="text-gray-800 font-bold truncate">{listing.equipment.name}</span>
//                       </div>
                      
//                       {activeTab === 'service' && listing.serviceDetails && (
//                         <div className="flex items-center text-sm">
//                           <span className="text-gray-400 font-medium w-24">Job Type:</span>
//                           <span className="text-gray-800 font-bold truncate">{listing.serviceDetails.jobType || 'General'}</span>
//                         </div>
//                       )}
//                     </div>

//                     <hr className="my-5 border-gray-100" />

//                     {/* Footer: Price & Contact Buttons */}
//                     <div className="flex items-end justify-between">
//                       <div>
//                         <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-0.5">Rate</p>
//                         <div className="flex items-baseline text-gray-900">
//                           <IndianRupee className="w-5 h-5 mr-0.5 text-emerald-600" />
//                           <span className="text-2xl font-black">{listing.pricing.rate}</span>
//                           <span className="text-xs font-bold text-gray-500 ml-1">/ {listing.pricing.unit}</span>
//                         </div>
//                       </div>

//                       {/* 🟢 THE DUAL CONTACT BUTTONS (WhatsApp + Call) */}
//                       <div className="flex gap-2">
//                         {/* WhatsApp Button */}
//                         <a 
//                           href={`https://wa.me/91${listing.providerId.phone}?text=Hi ${listing.providerId.name}, I am interested in your "${listing.title}" listed on KrishiMitra.`}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                           title="Message on WhatsApp"
//                           className="w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-sm bg-green-50 text-green-600 hover:bg-green-600 hover:text-white active:scale-95"
//                         >
//                           <MessageCircle className="w-5 h-5" /> 
//                         </a>

//                         {/* Standard Phone Call Button */}
//                         <a 
//                           href={`tel:${listing.providerId.phone}`}
//                           title={`Call ${listing.providerId.name}`}
//                           className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95 ${
//                             activeTab === 'rent' 
//                               ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white' 
//                               : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'
//                           }`}
//                         >
//                           <Phone className="w-5 h-5" />
//                         </a>
//                       </div>

//                       <ListingContactFooter 
//   title={listing.title}
//   pricing={listing.pricing}
//   provider={{ 
//     name: listing.providerId?.name || 'Farmer', 
//     phone: listing.providerId?.phone || '' 
//   }}
//   type={activeTab}
// />

//                     </div>
//                   </div>
//                 </motion.div>
//               ))}

//             </motion.div>
//           )}
//         </AnimatePresence>

        
//       </div>
//     </div>
//   );
// }

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Tractor, Wrench, MapPin, Search, Filter, 
  User, ShieldCheck, PlusCircle, 
  Loader2, AlertCircle 
} from 'lucide-react';
import Link from 'next/link';
import ListingContactFooter from '@/components/ListingContactFooter';

/* =========================================
   TYPES
========================================= */
interface Provider {
  _id: string;
  name: string;
  phone: string;
  profileImage?: string;
}

interface Listing {
  _id: string;
  listingType: 'rent' | 'service';
  title: string;
  description: string;
  category: string;
  pricing: { rate: number; unit: string };
  equipment: { name: string; condition: string };
  serviceDetails?: { operatorIncluded: boolean; jobType: string; estimatedCapacity: string };
  location: { state: string; district: string; village?: string };
  images: string[];
  providerId: Provider;
  createdAt: string;
}

const CATEGORIES = ['All Equipment', 'Tractor', 'Harvester', 'Sprayer', 'Cultivator', 'Seeder', 'Other'];

/* =========================================
   MAIN COMPONENT
========================================= */
export default function EquipmentExchange() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Toggles
  const [activeTab, setActiveTab] = useState<'rent' | 'service'>('rent');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Equipment');
  const [districtFilter, setDistrictFilter] = useState('');

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    const fetchListings = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        const params = new URLSearchParams({ type: activeTab });
        if (debouncedSearch) params.append('search', debouncedSearch);
        if (selectedCategory !== 'All Equipment') params.append('category', selectedCategory);
        if (districtFilter) params.append('district', districtFilter);

        const res = await fetch(`/api/listing?${params.toString()}`);
        
        const textData = await res.text();
        let data;
        try {
          data = JSON.parse(textData);
        } catch (err) {
          throw new Error('API Route not found. Server returned HTML instead of JSON.');
        }

        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Error fetching data.');
        }
        
        setListings(data.listings);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, [activeTab, debouncedSearch, selectedCategory, districtFilter]);

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20 font-sans selection:bg-emerald-400 selection:text-emerald-950">
      
      {/* 1. HERO HEADER */}
      <div className="bg-emerald-950 relative overflow-hidden pt-12 pb-24 px-6 lg:px-8 border-b-[6px] border-emerald-500">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/20 rounded-full mix-blend-screen filter blur-[80px]"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-widest mb-4">
              <Tractor className="w-4 h-4" /> <span>Krishi Exchange</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Machinery & <span className="text-emerald-400">Services</span>
            </h1>
            <p className="text-emerald-100/80 mt-2 text-lg max-w-xl font-medium">
              Rent high-quality agricultural equipment or hire verified professionals with machinery for your farm.
            </p>
          </div>

          <Link 
            href="/dashboard/Services/post" 
            className="flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-6 py-3.5 rounded-xl font-bold transition-all shadow-[0_0_30px_-5px_rgba(16,185,129,0.4)] active:scale-95 group"
          >
            <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            <span>Post a Listing</span>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        
        {/* 2. TAB TOGGLE */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-2 flex flex-col sm:flex-row items-center justify-between mb-8 border border-gray-100">
          <div className="flex w-full sm:w-auto bg-gray-100 p-1.5 rounded-xl">
            <button
              onClick={() => setActiveTab('rent')}
              className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
                activeTab === 'rent' 
                  ? 'bg-white text-emerald-700 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Tractor className="w-4 h-4" /> <span>Rent Equipment</span>
            </button>
            <button
              onClick={() => setActiveTab('service')}
              className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
                activeTab === 'service' 
                  ? 'bg-white text-blue-700 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Wrench className="w-4 h-4" /> <span>Hire Service</span>
            </button>
          </div>

          <div className="w-full sm:w-auto mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3 pr-2">
             <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input 
                  type="text" placeholder="Search listings..." 
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 pl-9 pr-4 py-2.5 bg-gray-50 border text-black border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
             </div>
             <div className="relative">
                <Filter className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <select 
                  value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full sm:w-48 pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-emerald-500/20 outline-none appearance-none cursor-pointer"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
             </div>
          </div>
        </div>

        {/* 3. LISTING GRID */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-32">
              <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mb-4" />
              <p className="text-gray-500 font-medium">Loading marketplace...</p>
            </motion.div>
          ) : error ? (
            <motion.div key="error" className="bg-red-50 border border-red-100 rounded-2xl p-10 text-center flex flex-col items-center">
              <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
              <h3 className="text-lg font-bold text-red-900">Failed to load listings</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </motion.div>
          ) : listings.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-gray-200 border-dashed rounded-[2rem] p-16 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <Tractor className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No listings found</h3>
              <p className="text-gray-500 max-w-md mx-auto">We couldn't find any {activeTab === 'rent' ? 'equipment' : 'services'} matching your filters in this area.</p>
            </motion.div>
          ) : (
            <motion.div key="grid" initial="hidden" animate="show" variants={{
              hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } }
            }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {listings.map((listing) => (
                <motion.div 
                  key={listing._id} 
                  variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                  className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-300 flex flex-col group overflow-hidden"
                >
                  
                  {/* Image Placeholder */}
                  <div className="h-48 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                    {listing.images && listing.images.length > 0 ? (
                      <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className={`w-full h-full flex flex-col items-center justify-center ${activeTab === 'rent' ? 'bg-emerald-50 text-emerald-200' : 'bg-blue-50 text-blue-200'}`}>
                        {activeTab === 'rent' ? <Tractor className="w-20 h-20 mb-2" /> : <Wrench className="w-20 h-20 mb-2" />}
                      </div>
                    )}
                    
                    <div className="absolute top-4 left-4">
                      {activeTab === 'rent' ? (
                        <span className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center shadow-sm">
                          <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-500" /> Condition: {listing.equipment.condition}
                        </span>
                      ) : (
                        <span className="bg-blue-600/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center shadow-sm">
                          <User className="w-3.5 h-3.5 mr-1" /> Operator Included
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-black text-gray-900 leading-tight line-clamp-2 pr-2 group-hover:text-emerald-700 transition-colors">
                        {listing.title}
                      </h3>
                    </div>
                    
                    <p className="text-sm text-gray-500 font-medium mb-4 flex items-center">
                      <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                      {listing.location.district}, {listing.location.state}
                    </p>

                    <div className="flex items-center mb-4 bg-gray-50/80 w-max px-3 py-1.5 rounded-lg border border-gray-100">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center mr-2 text-emerald-700 font-bold text-xs">
                        {listing.providerId?.name ? listing.providerId.name.charAt(0).toUpperCase() : <User className="w-3 h-3" />}
                      </div>
                      <p className="text-xs font-semibold text-gray-500">
                        Owner <span className="text-gray-900 font-bold">{listing.providerId?.name || 'Verified Farmer'}</span>
                      </p>
                    </div>

                    <div className="space-y-2 mt-auto">
                      <div className="flex items-center text-sm">
                        <span className="text-gray-400 font-medium w-24">Equipment:</span>
                        <span className="text-gray-800 font-bold truncate">{listing.equipment.name}</span>
                      </div>
                      
                      {activeTab === 'service' && listing.serviceDetails && (
                        <div className="flex items-center text-sm">
                          <span className="text-gray-400 font-medium w-24">Job Type:</span>
                          <span className="text-gray-800 font-bold truncate">{listing.serviceDetails.jobType || 'General'}</span>
                        </div>
                      )}
                    </div>

                    <hr className="my-5 border-gray-100" />

                    {/* Cleanly imported Footer Component */}
                    <ListingContactFooter 
                      title={listing.title}
                      pricing={listing.pricing}
                      provider={{ 
                        name: listing.providerId?.name || 'Farmer', 
                        phone: listing.providerId?.phone || '' 
                      }}
                      location={listing.location} // <-- Passed the location for voice output!
                      type={activeTab}
                    />

                  </div>
                </motion.div>
              ))}

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}