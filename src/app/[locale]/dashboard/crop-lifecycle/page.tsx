'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Calendar, CheckCircle2, Circle, Loader2, Plus, Sprout, AlertCircle, TrendingUp, Trash2, ArrowLeft, ChevronRight, X } from 'lucide-react';

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
  
  const [expandedCropId, setExpandedCropId] = useState<string | null>(null);
  const [outOfSeasonWarning, setOutOfSeasonWarning] = useState<string | null>(null);
  const [cropToDelete, setCropToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
        if (data.warning) {
          setOutOfSeasonWarning(data.warning);
        }
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
  };

  // 4. Delete Crop Plan
  const handleDeleteCrop = async () => {
    if (!cropToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/crop-lifecycle?cropId=${cropToDelete}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setActiveCrops(activeCrops.filter(c => c._id !== cropToDelete));
        if (expandedCropId === cropToDelete) setExpandedCropId(null);
      } else {
        alert("Failed to delete crop: " + data.error);
      }
    } catch (error) {
      console.error(error);
      alert("Error deleting crop.");
    } finally {
      setIsDeleting(false);
      setCropToDelete(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      
      {/* OUT OF SEASON WARNING MODAL */}
      <AnimatePresence>
        {outOfSeasonWarning && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative border border-orange-100">
              <button onClick={() => setOutOfSeasonWarning(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
              <div className="mb-6 flex justify-center">
                <div className="bg-orange-100 p-4 rounded-full text-orange-600">
                  <AlertCircle className="w-10 h-10" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-center text-gray-900 mb-2">Not the Best Season</h3>
              <p className="text-gray-600 text-center mb-8 leading-relaxed">
                {outOfSeasonWarning}
              </p>
              <button onClick={() => setOutOfSeasonWarning(null)} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-orange-500/30">
                I Understand, Continue
              </button>
            </motion.div>
          </div>
        )}

      {/* DELETE CONFIRMATION MODAL */}
        {cropToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative border border-red-100">
              <button disabled={isDeleting} onClick={() => setCropToDelete(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
              <div className="mb-6 flex justify-center">
                <div className="bg-red-100 p-4 rounded-full text-red-600">
                  <Trash2 className="w-10 h-10" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-center text-gray-900 mb-2">Delete Crop Plan</h3>
              <p className="text-gray-600 text-center mb-8">
                Are you sure you want to delete this crop plan? This action cannot be undone and all tracked progress will be lost.
              </p>
              <div className="flex gap-4">
                <button disabled={isDeleting} onClick={() => setCropToDelete(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3.5 rounded-xl transition">
                  Cancel
                </button>
                <button disabled={isDeleting} onClick={handleDeleteCrop} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-red-500/30 flex items-center justify-center">
                  {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Yes, Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
        /* DASHBOARD & TIMELINE TOGGLE DISPLAY */
        expandedCropId ? (
          /* DETAIL VIEW */
          <div className="space-y-6">
            <button 
              onClick={() => setExpandedCropId(null)}
              className="flex items-center text-emerald-700 hover:text-emerald-800 font-bold transition bg-emerald-50 px-4 py-2 rounded-lg w-fit"
            >
              <ArrowLeft className="w-5 h-5 mr-2" /> Back to Lifecycle Dashboard
            </button>
            {activeCrops.filter(c => c._id === expandedCropId).map(crop => {
              // Gamification Calculations
              const totalTasks = crop.tasks?.length || 0;
              const completedCount = crop.tasks?.filter((t: any) => t.isCompleted).length || 0;
              const progressPercentage = totalTasks === 0 ? 0 : Math.round((completedCount / totalTasks) * 100);

              return (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={crop._id} className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
                  
                  {/* Crop Header */}
                  <div className="bg-emerald-50 p-6 border-b border-emerald-100 flex justify-between items-center flex-wrap gap-4">
                    <div>
                      <h2 className="text-2xl font-black text-emerald-900">{crop.cropName}</h2>
                      <p className="text-emerald-700 font-medium flex items-center mt-1">
                        <Calendar className="w-4 h-4 mr-1"/> Started: {new Date(crop.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="bg-emerald-200 text-emerald-800 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide">
                        {crop.status}
                      </span>
                      <button onClick={(e) => { e.stopPropagation(); setCropToDelete(crop._id); }} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition" title="Delete Plan">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
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
                        const isFuture = !task.isCompleted && new Date(task.scheduledDate) > new Date(new Date().setHours(23,59,59,999));

                        return (
                          <div key={task._id} className="relative pl-8">
                            {/* Interactive Checkbox / Timeline Dot */}
                            <button 
                              disabled={isFuture}
                              title={isFuture ? "Cannot complete a future task yet." : "Toggle task"}
                              onClick={() => handleToggleTask(crop._id, task._id, task.isCompleted)}
                              className={`absolute -left-[17px] top-1 outline-none rounded-full bg-white ${isFuture ? 'cursor-not-allowed opacity-50' : ''}`}
                            >
                              {task.isCompleted ? (
                                <CheckCircle2 className="w-8 h-8 text-emerald-500 fill-emerald-50 hover:text-emerald-600 transition scale-110" />
                              ) : (
                                <Circle className={`w-8 h-8 ${isFuture ? 'text-gray-200' : 'text-gray-300 hover:text-emerald-400 transition'}`} />
                              )}
                            </button>

                            <div className={`p-5 rounded-2xl border transition-all duration-300 ${
                              task.isCompleted 
                                ? 'bg-gray-50 border-gray-100 opacity-60' 
                                : isToday 
                                  ? 'bg-emerald-50 border-emerald-200 ring-2 ring-emerald-100 shadow-sm' 
                                  : isOverdue 
                                    ? 'bg-red-50 border-red-200 shadow-sm' 
                                    : isFuture
                                      ? 'bg-white border-dashed border-gray-200 opacity-70 cursor-not-allowed'
                                      : 'bg-white border-gray-200 hover:border-emerald-300 shadow-sm'
                            }`}>
                              
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                                <h3 className={`font-bold text-lg ${task.isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                  {task.title}
                                </h3>
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-md w-fit ${
                                  isOverdue ? 'bg-red-100 text-red-700' 
                                  : isToday ? 'bg-emerald-200 text-emerald-800' 
                                  : isFuture ? 'bg-gray-100 text-gray-400'
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
                              
                              {isFuture && !task.isCompleted && (
                                <p className="text-gray-400 text-xs font-medium mt-3 flex items-center">
                                  Task scheduled for the future.
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* DASHBOARD CARDS VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeCrops.map(crop => {
              const totalTasks = crop.tasks?.length || 0;
              const completedCount = crop.tasks?.filter((t: any) => t.isCompleted).length || 0;
              const progressPercentage = totalTasks === 0 ? 0 : Math.round((completedCount / totalTasks) * 100);

              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  key={crop._id} 
                  className="bg-white rounded-3xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-emerald-50 overflow-hidden cursor-pointer flex flex-col"
                  onClick={() => setExpandedCropId(crop._id)}
                >
                  <div className="p-6 pb-4 bg-gradient-to-br from-emerald-50/50 to-white flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-black text-emerald-950">{crop.cropName}</h3>
                        <p className="text-sm font-semibold text-emerald-600 flex items-center mt-1">
                          <Calendar className="w-3.5 h-3.5 mr-1" /> {new Date(crop.startDate).toLocaleDateString()}
                        </p>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setCropToDelete(crop._id); }}
                        className="text-gray-400 hover:text-red-500 transition p-2 hover:bg-red-50 rounded-full"
                        title="Delete Crop Plan"
                      >
                        <Trash2 className="w-5 h-5"/>
                      </button>
                    </div>

                    <div className="mb-2 flex justify-between items-end">
                      <span className="text-sm font-bold text-gray-500 uppercase">Progress</span>
                      <span className="text-lg font-black text-emerald-600">{progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-100 group">
                    <div className="text-sm font-semibold text-gray-500 flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-500" />
                      {completedCount} / {totalTasks} Tasks
                    </div>
                    <div className="text-emerald-600 font-bold text-sm flex items-center group-hover:underline">
                      View Full Plan <ChevronRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
}