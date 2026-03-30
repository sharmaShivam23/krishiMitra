'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Calendar, CheckCircle2, Circle, Loader2, Plus, Sprout, AlertCircle, TrendingUp } from 'lucide-react';

export default function CropLifecyclePage() {
  const [activeCrops, setActiveCrops] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCropData, setNewCropData] = useState({ 
    cropName: '', 
    startDate: '', 
    state: 'Uttar Pradesh', 
    district: 'Meerut' 
  });

  // 1. Fetch User's Active Crops (CRASH-PROOF & COOKIE-BASED)
  const fetchActiveCrops = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/crop-lifecycle');
      
      // Read the raw text response first to prevent JSON crash on empty body
      const text = await res.text(); 
      if (!text) {
        console.error("Backend returned an empty response!");
        setIsLoading(false);
        return; 
      }

      const data = JSON.parse(text);

      if (data.success) {
        setActiveCrops(data.activeCrops);
      } else {
        console.error("API Error:", data.error);
      }
    } catch (error) {
      console.error("Failed to fetch crops:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveCrops();
  }, []);

  // 2. Generate New Plan via Gemini (COOKIE-BASED)
  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await fetch('/api/crop-lifecycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCropData)
      });
      
      const text = await res.text();
      if (!text) throw new Error("Empty response from server");
      
      const data = JSON.parse(text);

      if (data.success) {
        setActiveCrops([data.activeCrop, ...activeCrops]);
        setShowAddForm(false);
        setNewCropData({ ...newCropData, cropName: '', startDate: '' });
      } else {
        alert(data.error || "Failed to generate plan.");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while generating the plan.");
    } finally {
      setIsGenerating(false);
    }
  };

  // 3. Toggle Task Completion (COOKIE-BASED)
  const handleToggleTask = async (cropId: string, taskId: string, currentStatus: boolean) => {
    // Optimistic UI Update for instant feedback
    const updatedCrops = activeCrops.map(crop => {
      if (crop._id === cropId) {
        return {
          ...crop,
          tasks: crop.tasks.map((t: any) => t._id === taskId ? { ...t, isCompleted: !currentStatus } : t)
        };
      }
      return crop;
    });
    setActiveCrops(updatedCrops);

    // Backend update
    try {
      await fetch('/api/crop-lifecycle/task', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeCropId: cropId, taskId, isCompleted: !currentStatus })
      });
    } catch (error) {
      console.error("Failed to update task", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-emerald-900 text-white p-8 rounded-3xl shadow-xl gap-4">
        <div>
          <h1 className="text-3xl font-black mb-2 flex items-center">
            <Sprout className="w-8 h-8 mr-3 text-emerald-300"/> Smart Crop Manager
          </h1>
          <p className="text-emerald-100 font-medium">AI-powered day-by-day guides tailored to your field.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-emerald-400 hover:bg-emerald-300 text-emerald-950 px-6 py-3 rounded-xl font-bold transition flex items-center shadow-lg whitespace-nowrap"
        >
          {showAddForm ? 'Cancel' : <><Plus className="w-5 h-5 mr-2" /> Add Crop</>}
        </button>
      </div>

      {/* ADD NEW CROP FORM */}
      {showAddForm && (
        <motion.form 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          onSubmit={handleGeneratePlan} 
          className="bg-white p-8 rounded-3xl shadow-lg border border-emerald-50"
        >
          <h2 className="text-xl font-black text-emerald-900 mb-6 flex items-center">
            Configure Your Field
          </h2>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">What are you planting?</label>
              <input required value={newCropData.cropName} onChange={e => setNewCropData({...newCropData, cropName: e.target.value})} placeholder="e.g. Sugarcane, Wheat..." className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Expected Sowing Date</label>
              <input required type="date" value={newCropData.startDate} onChange={e => setNewCropData({...newCropData, startDate: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
          </div>
          <button disabled={isGenerating} type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl flex justify-center items-center transition disabled:opacity-70">
            {isGenerating ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> AI Generating Custom Plan...</> : 'Generate Smart Guide'}
          </button>
        </motion.form>
      )}

      {/* LOADING / EMPTY STATES */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-emerald-600" /></div>
      ) : activeCrops.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <Leaf className="w-16 h-16 text-emerald-100 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-800">No Active Crops</h3>
          <p className="text-gray-500 mt-2">Click 'Add Crop' to let KrishiMitra AI build your first farming schedule.</p>
        </div>
      ) : (
        /* TIMELINE DISPLAY */
        <div className="space-y-12">
          {activeCrops.map(crop => {
            // Gamification Calculations
            const totalTasks = crop.tasks?.length || 0;
            const completedCount = crop.tasks?.filter((t: any) => t.isCompleted).length || 0;
            const progressPercentage = totalTasks === 0 ? 0 : Math.round((completedCount / totalTasks) * 100);

            return (
              <div key={crop._id} className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
                
                {/* Crop Header */}
                <div className="bg-emerald-50 p-6 border-b border-emerald-100 flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-black text-emerald-900">{crop.cropName}</h2>
                    <p className="text-emerald-700 font-medium flex items-center mt-1">
                      <Calendar className="w-4 h-4 mr-1"/> Started: {new Date(crop.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="bg-emerald-200 text-emerald-800 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide">
                    {crop.status}
                  </span>
                </div>

                {/* GAMIFICATION & PROGRESS BAR */}
                <div className="px-8 pt-6 pb-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-3 gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Overall Progress</h4>
                      <p className="text-3xl font-black text-emerald-600 leading-none mt-1">{progressPercentage}%</p>
                    </div>
                    <div className="text-left md:text-right">
                      <span className="inline-flex items-center bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-blue-100">
                        <TrendingUp className="w-3.5 h-3.5 mr-1.5" /> 
                        {Math.min(progressPercentage + 12, 100)}% of farmers in your district are at this stage
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3.5 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden" 
                      style={{ width: `${progressPercentage}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
                    </div>
                  </div>
                </div>

                {/* Tasks Timeline */}
                <div className="p-8 pt-4">
                  <div className="relative border-l-2 border-emerald-100 ml-4 space-y-8">
                    {crop.tasks?.map((task: any) => {
                      const isOverdue = !task.isCompleted && new Date(task.scheduledDate) < new Date(new Date().setHours(0,0,0,0));
                      const isToday = !task.isCompleted && new Date(task.scheduledDate).toDateString() === new Date().toDateString();

                      return (
                        <div key={task._id} className="relative pl-8">
                          {/* Interactive Checkbox / Timeline Dot */}
                          <button 
                            onClick={() => handleToggleTask(crop._id, task._id, task.isCompleted)}
                            className="absolute -left-[17px] top-1 bg-white outline-none"
                          >
                            {task.isCompleted ? (
                              <CheckCircle2 className="w-8 h-8 text-emerald-500 fill-emerald-50 hover:text-emerald-600 transition scale-110" />
                            ) : (
                              <Circle className="w-8 h-8 text-gray-300 hover:text-emerald-400 transition" />
                            )}
                          </button>

                          <div className={`p-5 rounded-2xl border transition-all duration-300 ${
                            task.isCompleted 
                              ? 'bg-gray-50 border-gray-100 opacity-60' 
                              : isToday 
                                ? 'bg-emerald-50 border-emerald-200 ring-2 ring-emerald-100 shadow-sm' 
                                : isOverdue 
                                  ? 'bg-red-50 border-red-200 shadow-sm' 
                                  : 'bg-white border-gray-200 hover:border-emerald-300 shadow-sm'
                          }`}>
                            
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                              <h3 className={`font-bold text-lg ${task.isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                {task.title}
                              </h3>
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-md w-fit ${
                                isOverdue ? 'bg-red-100 text-red-700' 
                                : isToday ? 'bg-emerald-200 text-emerald-800' 
                                : 'bg-gray-100 text-gray-600'
                              }`}>
                                {isToday ? 'Due Today' : `Due: ${new Date(task.scheduledDate).toLocaleDateString()}`}
                              </span>
                            </div>
                            
                            <p className={`text-sm ${task.isCompleted ? 'text-gray-400' : 'text-gray-600'}`}>
                              {task.description}
                            </p>

                            {isOverdue && !task.isCompleted && (
                              <p className="text-red-600 text-xs font-bold mt-3 flex items-center bg-red-100/50 w-fit px-2 py-1 rounded">
                                <AlertCircle className="w-3.5 h-3.5 mr-1" /> Overdue task. Please complete as soon as possible.
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}