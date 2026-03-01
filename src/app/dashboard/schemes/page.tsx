'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { 
  Landmark, Search, Filter, ExternalLink, 
  CheckCircle2, FileText, IndianRupee, ShieldCheck, AlertCircle, Loader2
} from 'lucide-react';

// Define the interface based on our MongoDB schema
interface SchemeData {
  _id: string;
  name?: string;
  category?: string;
  state?: string;
  benefits?: string;
  eligibility?: string[];
  deadline?: string;
  link?: string;
}

export default function GovernmentSchemes() {
  const [schemes, setSchemes] = useState<SchemeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        const res = await fetch('/api/schemes');
        const data = await res.json(); 

        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Failed to load schemes');
        }

        // Safely extract the array. 
        const fetchedSchemes = data.schemes || [];
        
        // Update the state
        setSchemes(fetchedSchemes);
        
      } catch (err: any) {
        console.error("Fetch Error:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchemes();
  }, []);

  // ADD THIS LINE RIGHT HERE (before your return statement)
  // This will prove to us whether React is holding the state properly
  console.log("Current React State:", schemes);

  // Animation Variants
  const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120 } }
  };

  // Helper: Assign icons dynamically based on category text from DB
  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'Financial Support':
        return <IndianRupee className="w-6 h-6 text-emerald-500" />;
      case 'Insurance':
        return <ShieldCheck className="w-6 h-6 text-blue-500" />;
      case 'Credit & Loans':
        return <Landmark className="w-6 h-6 text-amber-500" />;
      default:
        return <FileText className="w-6 h-6 text-gray-500" />;
    }
  };

  // Extract unique categories dynamically from the fetched database records safely
  const categories = useMemo(() => {
    const unique = Array.from(new Set(schemes.map(s => s.category || 'Other')));
    return ['All', ...unique];
  }, [schemes]);

  // Filter Logic with Safety Checks
  const filteredSchemes = useMemo(() => {
    return schemes.filter(scheme => {
      const safeName = (scheme.name || '').toLowerCase();
      const safeBenefits = (scheme.benefits || '').toLowerCase();
      const safeSearch = searchQuery.toLowerCase();

      const matchesSearch = safeName.includes(safeSearch) || safeBenefits.includes(safeSearch);
      const matchesCategory = activeCategory === 'All' || scheme.category === activeCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [schemes, searchQuery, activeCategory]);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-7xl mx-auto">
      
      {/* Header */}
      <motion.div variants={item} className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-agri-900 tracking-tight flex items-center">
          <Landmark className="w-8 h-8 mr-3 text-agri-600" />
          Government Schemes
        </h1>
        <p className="text-gray-500 mt-2 font-medium max-w-2xl">
          Discover eligible central and state agricultural subsidies, insurance policies, and financial aid programs.
        </p>
      </motion.div>

      {/* Controls: Search and Categories */}
      <motion.div variants={item} className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search schemes by name or benefit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-11 pr-4 py-3.5 bg-white border text-black border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-agri-400 font-medium transition-all"
          />
        </div>
        
        {categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
            {categories.map((category, index) => (
              <button
                key={index}
                onClick={() => setActiveCategory(category)}
                className={`px-5 py-3.5 rounded-2xl font-bold whitespace-nowrap transition-all flex items-center ${
                  activeCategory === category 
                    ? 'bg-agri-900 text-white shadow-lg shadow-agri-900/20' 
                    : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {category === 'All' ? <Filter className="w-4 h-4 mr-2" /> : null}
                {category}
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Loading & Error States */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-agri-600 mb-4" />
          <p className="text-gray-500 font-medium">Synchronizing with government mandates...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 p-6 rounded-2xl flex flex-col items-center justify-center text-red-700 mb-6 py-12">
          <AlertCircle className="w-10 h-10 mb-3" />
          <span className="font-bold text-lg">Failed to retrieve data</span>
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Schemes Grid */}
     {/* Schemes Grid */}
      {!isLoading && !error && (
        // Removed the conflicting variants={container} from this wrapper
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatePresence>
            {filteredSchemes.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="col-span-full p-12 text-center text-gray-500 font-medium bg-white rounded-3xl border border-gray-100"
              >
                No schemes found matching your criteria.
              </motion.div>
            ) : (
              filteredSchemes.map((scheme) => (
                <motion.div 
                  key={scheme._id} 
                  // Removed variants={item}, using only explicit animations for layout lists
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/40 border border-gray-100 flex flex-col h-full hover:shadow-2xl hover:shadow-agri-900/10 transition-all"
                >
                  
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                        {getCategoryIcon(scheme.category)}
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-agri-900 leading-tight pr-2">{scheme.name || 'Unnamed Scheme'}</h3>
                        <div className="flex flex-wrap items-center mt-2 gap-2">
                          <span className="text-xs font-bold text-agri-600 bg-agri-50 px-2.5 py-1 rounded-lg border border-agri-200">
                            {scheme.category || 'General'}
                          </span>
                          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200">
                            {scheme.state || 'All States'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 space-y-5 my-4">
                    <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
                      <h4 className="text-sm font-bold text-emerald-900 mb-1 flex items-center">
                        <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" /> Primary Benefits
                      </h4>
                      <p className="text-emerald-800 text-sm font-medium leading-relaxed">
                        {scheme.benefits || 'Details not provided.'}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                        <FileText className="w-4 h-4 mr-1.5 text-gray-400" /> Eligibility Criteria
                      </h4>
                      <ul className="space-y-1.5">
                        {(scheme.eligibility || []).map((criterion, idx) => (
                          <li key={idx} className="text-sm text-gray-600 font-medium flex items-start">
                            <span className="w-1.5 h-1.5 rounded-full bg-agri-400 mt-1.5 mr-2 flex-shrink-0"></span>
                            {criterion}
                          </li>
                        ))}
                        {(!scheme.eligibility || scheme.eligibility.length === 0) && (
                          <li className="text-sm text-gray-500 italic">No specific eligibility listed.</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-5 border-t border-gray-100 mt-auto">
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Application Deadline</p>
                      <p className="font-black text-agri-900">{scheme.deadline || 'Ongoing'}</p>
                    </div>
                    {scheme.link ? (
                      <a 
                        href={scheme.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-sm font-bold text-agri-900 bg-agri-400 hover:bg-agri-500 px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-agri-400/30 group"
                      >
                        Apply Now <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </a>
                    ) : (
                       <button className="flex items-center text-sm font-bold text-gray-500 bg-gray-100 px-5 py-2.5 rounded-xl cursor-not-allowed">
                         Check Local Portal
                       </button>
                    )}
                  </div>

                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}