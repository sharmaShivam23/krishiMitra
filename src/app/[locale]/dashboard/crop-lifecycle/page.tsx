"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Leaf,
  Calendar,
  CheckCircle2,
  Circle,
  Loader2,
  Plus,
  Sprout,
  AlertCircle,
  TrendingUp,
  Trash2,
  ArrowLeft,
  ChevronRight,
  X,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { STATES_DISTRICTS } from "@/utils/indiaStates";

function CropLifecycleContent() {
  const searchParams = useSearchParams();
  const [activeCrops, setActiveCrops] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCropData, setNewCropData] = useState({
    cropName: "",
    startDate: "",
    state: "Uttar Pradesh",
    district: "Meerut",
  });

  const [expandedCropId, setExpandedCropId] = useState<string | null>(null);
  const [cropToReview, setCropToReview] = useState<any>(null);
  const [cropToDelete, setCropToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  const STATE_LIST = Object.keys(STATES_DISTRICTS).sort();
  const districtList = newCropData.state
    ? STATES_DISTRICTS[newCropData.state] ?? []
    : [];

  // 1. Fetch User's Active Crops (CRASH-PROOF & COOKIE-BASED)
  const fetchActiveCrops = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/crop-lifecycle");
      const text = await res.text();
      if (!text) {
        setIsLoading(false);
        return;
      }
      const data = JSON.parse(text);
      if (data.success) setActiveCrops(data.activeCrops);
    } catch (e) {
      console.error("Failed to fetch crops:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Pre-fill crop from ?crop= URL param (coming from crop-intelligence page)
  useEffect(() => {
    const cropFromParam = searchParams.get("crop");
    if (cropFromParam) {
      setNewCropData((prev) => ({ ...prev, cropName: cropFromParam }));
      setShowAddForm(true);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchActiveCrops();

    // Fetch User Profile locally to know their state
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success) {
          setUserProfile(data.user);
          // Pre-fill state/district from user profile
          const { state, district } = data.user;
          if (state) {
            setNewCropData((prev) => ({
              ...prev,
              state: state,
              district: district || prev.district,
            }));
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchUser();
  }, []);

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await fetch("/api/crop-lifecycle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCropData),
      });
      const text = await res.text();
      if (!text) throw new Error("Empty response");
      const data = JSON.parse(text);
      if (data.success) {
        setActiveCrops((prev) => [data.activeCrop, ...prev]);
        setShowAddForm(false);
        setNewCropData({ ...newCropData, cropName: "", startDate: "" });
        if (data.warning) {
          setCropToReview(data.activeCrop);
        }
      } else {
        alert(data.error || "Failed to generate plan.");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred while generating the plan.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleTask = async (
    cropId: string,
    taskId: string,
    currentStatus: boolean
  ) => {
    setActiveCrops((prev) =>
      prev.map((crop) =>
        crop._id === cropId
          ? {
              ...crop,
              tasks: crop.tasks.map((t: any) =>
                t._id === taskId ? { ...t, isCompleted: !currentStatus } : t
              ),
            }
          : crop
      )
    );
    try {
      await fetch("/api/crop-lifecycle/task", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activeCropId: cropId,
          taskId,
          isCompleted: !currentStatus,
        }),
      });
    } catch (error) {
      console.error("Failed to update task", error);
    }
  };

  // 4. Delete Crop Plan
  const handleDeleteCrop = async () => {
    if (!cropToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/crop-lifecycle?cropId=${cropToDelete}`, {
        method: "DELETE",
      });

      // Check if response is ok and has content
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const text = await res.text();
      if (!text) {
        throw new Error("Empty response from server");
      }

      const data = JSON.parse(text);
      if (data.success) {
        setActiveCrops(activeCrops.filter((c) => c._id !== cropToDelete));
        if (expandedCropId === cropToDelete) setExpandedCropId(null);
        setCropToDelete(null);
      } else {
        alert("Failed to delete crop: " + (data.error || "Unknown error"));
      }
    } catch (error: any) {
      console.error("Delete error:", error);
      alert("Error deleting crop: " + error.message);
    } finally {
      setIsDeleting(false);
      setCropToDelete(null);
    }
  };

  const inputClass =
    "w-full p-4 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 outline-none text-gray-900 font-semibold placeholder:text-gray-400 placeholder:font-normal transition-all";
  const selectClass =
    "w-full p-4 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 outline-none text-gray-900 font-semibold transition-all appearance-none cursor-pointer";

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* OUT OF SEASON WARNING MODAL */}
      <AnimatePresence>
        {cropToReview && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative border border-orange-100"
            >
              <button
                disabled={isDeleting}
                onClick={() => setCropToReview(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="mb-6 flex justify-center">
                <div className="bg-orange-100 p-4 rounded-full text-orange-600">
                  <AlertCircle className="w-10 h-10" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-center text-gray-900 mb-2">
                Not the Best Season
              </h3>
              <p className="text-gray-600 text-center mb-8 leading-relaxed">
                {cropToReview.outOfSeasonWarning}
              </p>
              <div className="flex gap-4">
                <button
                  disabled={isDeleting}
                  onClick={async () => {
                    setIsDeleting(true);
                    try {
                      const res = await fetch(
                        `/api/crop-lifecycle?cropId=${cropToReview._id}`,
                        {
                          method: "DELETE",
                        }
                      );
                      const text = await res.text();
                      if (text) {
                        const d = JSON.parse(text);
                        if (d.success)
                          setActiveCrops((prev) =>
                            prev.filter((c) => c._id !== cropToReview._id)
                          );
                      }
                    } catch (e) {
                      console.error("Delete failed:", e);
                    }
                    setIsDeleting(false);
                    setCropToReview(null);
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3.5 rounded-xl transition"
                >
                  Cancel this crop
                </button>
                <button
                  disabled={isDeleting}
                  onClick={() => setCropToReview(null)}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-orange-500/30"
                >
                  Proceed anyway
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* DELETE CONFIRMATION MODAL */}
        {cropToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative border border-red-100"
            >
              <button
                disabled={isDeleting}
                onClick={() => setCropToDelete(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="mb-6 flex justify-center">
                <div className="bg-red-100 p-4 rounded-full text-red-600">
                  <Trash2 className="w-10 h-10" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-center text-gray-900 mb-2">
                Delete Crop Plan
              </h3>
              <p className="text-gray-600 text-center mb-8">
                Are you sure you want to delete this crop plan? This action
                cannot be undone and all tracked progress will be lost.
              </p>
              <div className="flex gap-4">
                <button
                  disabled={isDeleting}
                  onClick={() => setCropToDelete(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3.5 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  disabled={isDeleting}
                  onClick={handleDeleteCrop}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-red-500/30 flex items-center justify-center"
                >
                  {isDeleting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Yes, Delete"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white p-8 rounded-3xl shadow-xl gap-4">
        <div>
          <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
            <div className="bg-emerald-400/20 p-2 rounded-xl">
              <Sprout className="w-7 h-7 text-emerald-300" />
            </div>
            Smart Crop Manager
          </h1>
          <p className="text-emerald-200 font-medium">
            AI-powered day-by-day guides tailored to your field.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="bg-emerald-400 hover:bg-emerald-300 active:scale-95 text-emerald-950 px-6 py-3 rounded-xl font-bold transition-all flex items-center shadow-lg whitespace-nowrap gap-2"
        >
          {showAddForm ? (
            <>
              <X className="w-5 h-5" /> Cancel
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" /> Add Crop
            </>
          )}
        </button>
      </div>

      {/* ADD CROP FORM */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            key="add-form"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleGeneratePlan}
            className="bg-white p-8 rounded-3xl shadow-xl border border-emerald-100"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-emerald-100 p-2 rounded-xl">
                <Leaf className="w-5 h-5 text-emerald-700" />
              </div>
              <h2 className="text-xl font-black text-gray-900">
                Configure Your Field
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-5 mb-5">
              {/* Crop Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  What are you planting? *
                </label>
                <input
                  required
                  value={newCropData.cropName}
                  onChange={(e) =>
                    setNewCropData((p) => ({ ...p, cropName: e.target.value }))
                  }
                  placeholder="e.g. Wheat, Sugarcane, Rice..."
                  className={inputClass}
                />
              </div>

              {/* Sowing Date */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Expected Sowing Date *
                </label>
                <input
                  required
                  type="date"
                  value={newCropData.startDate}
                  onChange={(e) =>
                    setNewCropData((p) => ({ ...p, startDate: e.target.value }))
                  }
                  className={inputClass}
                />
              </div>

              {/* State */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  State *
                  {userProfile?.state && (
                    <span className="ml-2 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                      from your profile
                    </span>
                  )}
                </label>
                <div className="relative">
                  <select
                    required
                    value={newCropData.state}
                    onChange={(e) =>
                      setNewCropData((p) => ({
                        ...p,
                        state: e.target.value,
                        district: "",
                      }))
                    }
                    className={selectClass}
                  >
                    <option value="">— Select State —</option>
                    {STATE_LIST.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* District */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  District
                  {userProfile?.district && (
                    <span className="ml-2 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                      from your profile
                    </span>
                  )}
                </label>
                <div className="relative">
                  <select
                    value={newCropData.district}
                    onChange={(e) =>
                      setNewCropData((p) => ({
                        ...p,
                        district: e.target.value,
                      }))
                    }
                    disabled={!newCropData.state}
                    className={`${selectClass} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <option value="">— Select District —</option>
                    {districtList.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Info banner */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 mb-5 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <p className="text-sm text-emerald-800 font-medium">
                Krishi LifeCycle AI will generate a personalized day-by-day
                farming schedule based on your crop, location, and sowing date.
              </p>
            </div>

            <button
              disabled={isGenerating}
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold py-4 rounded-xl flex justify-center items-center transition-all shadow-md disabled:opacity-70 gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> AI is building
                  your custom plan...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" /> Generate Smart Guide
                </>
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* LOADING */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
          <p className="text-gray-500 font-semibold">Loading your crops...</p>
        </div>
      ) : activeCrops.length === 0 ? (
        /* EMPTY STATE */
        <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="bg-emerald-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <Leaf className="w-10 h-10 text-emerald-300" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            No Active Crops
          </h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            Click <strong>Add Crop</strong> to let KrishiMitra AI build your
            first farming schedule.
          </p>
        </div>
      ) : /* DASHBOARD & TIMELINE TOGGLE DISPLAY */
      expandedCropId ? (
        /* DETAIL VIEW */
        <div className="space-y-6">
          <button
            onClick={() => setExpandedCropId(null)}
            className="flex items-center text-emerald-700 hover:text-emerald-800 font-bold transition bg-emerald-50 px-4 py-2 rounded-lg w-fit"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Back to Lifecycle Dashboard
          </button>
          {activeCrops
            .filter((c) => c._id === expandedCropId)
            .map((crop) => {
              // Gamification Calculations
              const totalTasks = crop.tasks?.length || 0;
              const completedCount =
                crop.tasks?.filter((t: any) => t.isCompleted).length || 0;
              const progressPercentage =
                totalTasks === 0
                  ? 0
                  : Math.round((completedCount / totalTasks) * 100);

              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={crop._id}
                  className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden"
                >
                  {/* Crop Header */}
                  <div className="bg-emerald-50 p-6 border-b border-emerald-100 flex justify-between items-center flex-wrap gap-4">
                    <div>
                      <h2 className="text-2xl font-black text-emerald-900">
                        {crop.cropName}
                      </h2>
                      <p className="text-emerald-700 font-medium flex items-center mt-1">
                        <Calendar className="w-4 h-4 mr-1" /> Started:{" "}
                        {new Date(crop.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="bg-emerald-200 text-emerald-800 px-4 py-1.5 rounded-full text-sm font-bold uppercase">
                        {crop.status}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCropToDelete(crop._id);
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition"
                        title="Delete Plan"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* NOTE/WARNING */}
                  {crop.outOfSeasonWarning && (
                    <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mx-8 mt-6 rounded-r-lg flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-orange-800 font-bold mb-1">
                          Not Suitable for this Season
                        </h4>
                        <p className="text-orange-700 text-sm">
                          {crop.outOfSeasonWarning}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* GAMIFICATION & PROGRESS BAR */}
                  <div className="px-8 pt-6 pb-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-3 gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                          Overall Progress
                        </h4>
                        <p className="text-3xl font-black text-emerald-600 leading-none mt-1">
                          {progressPercentage}%
                        </p>
                      </div>
                      <div className="text-left md:text-right">
                        <span className="inline-flex items-center bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-blue-100">
                          <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                          {Math.min(progressPercentage + 12, 100)}% of farmers
                          in your district are at this stage
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
                        const isOverdue =
                          !task.isCompleted &&
                          new Date(task.scheduledDate) <
                            new Date(new Date().setHours(0, 0, 0, 0));
                        const isToday =
                          !task.isCompleted &&
                          new Date(task.scheduledDate).toDateString() ===
                            new Date().toDateString();
                        const isFuture =
                          !task.isCompleted &&
                          new Date(task.scheduledDate) >
                            new Date(new Date().setHours(23, 59, 59, 999));

                        return (
                          <div key={task._id} className="relative pl-8">
                            {/* Interactive Checkbox / Timeline Dot */}
                            <button
                              disabled={isFuture}
                              title={
                                isFuture
                                  ? "Cannot complete a future task yet."
                                  : "Toggle task"
                              }
                              onClick={() =>
                                handleToggleTask(
                                  crop._id,
                                  task._id,
                                  task.isCompleted
                                )
                              }
                              className={`absolute -left-[17px] top-1 outline-none rounded-full bg-white ${
                                isFuture ? "cursor-not-allowed opacity-50" : ""
                              }`}
                            >
                              {task.isCompleted ? (
                                <CheckCircle2 className="w-8 h-8 text-emerald-500 fill-emerald-50 hover:text-emerald-600 transition scale-110" />
                              ) : (
                                <Circle
                                  className={`w-8 h-8 ${
                                    isFuture
                                      ? "text-gray-200"
                                      : "text-gray-300 hover:text-emerald-400 transition"
                                  }`}
                                />
                              )}
                            </button>

                            <div
                              className={`p-5 rounded-2xl border transition-all duration-300 ${
                                task.isCompleted
                                  ? "bg-gray-50 border-gray-100 opacity-60"
                                  : isToday
                                  ? "bg-emerald-50 border-emerald-200 ring-2 ring-emerald-100 shadow-sm"
                                  : isOverdue
                                  ? "bg-red-50 border-red-200 shadow-sm"
                                  : isFuture
                                  ? "bg-white border-dashed border-gray-200 opacity-70 cursor-not-allowed"
                                  : "bg-white border-gray-200 hover:border-emerald-300 shadow-sm"
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                                <h3
                                  className={`font-bold text-lg ${
                                    task.isCompleted
                                      ? "text-gray-500 line-through"
                                      : "text-gray-900"
                                  }`}
                                >
                                  {task.title}
                                </h3>
                                <span
                                  className={`text-xs font-bold px-2.5 py-1 rounded-md w-fit ${
                                    isOverdue
                                      ? "bg-red-100 text-red-700"
                                      : isToday
                                      ? "bg-emerald-200 text-emerald-800"
                                      : isFuture
                                      ? "bg-gray-100 text-gray-400"
                                      : "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  {isToday
                                    ? "Due Today"
                                    : `Due: ${new Date(
                                        task.scheduledDate
                                      ).toLocaleDateString()}`}
                                </span>
                              </div>

                              <p
                                className={`text-sm ${
                                  task.isCompleted
                                    ? "text-gray-400"
                                    : "text-gray-600"
                                }`}
                              >
                                {task.description}
                              </p>

                              {isOverdue && !task.isCompleted && (
                                <p className="text-red-600 text-xs font-bold mt-3 flex items-center bg-red-100/50 w-fit px-2 py-1 rounded">
                                  <AlertCircle className="w-3.5 h-3.5 mr-1" />{" "}
                                  Overdue task. Please complete as soon as
                                  possible.
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
        <div className="space-y-12">
          <div>
            <h2 className="text-2xl font-black text-emerald-900 mb-6 flex items-center">
              <Leaf className="w-6 h-6 mr-2 text-emerald-500" /> My Active Crops
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeCrops.map((crop) => {
                const totalTasks = crop.tasks?.length || 0;
                const completedCount =
                  crop.tasks?.filter((t: any) => t.isCompleted).length || 0;
                const progressPercentage =
                  totalTasks === 0
                    ? 0
                    : Math.round((completedCount / totalTasks) * 100);

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={crop._id}
                    className="bg-white rounded-3xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-emerald-50 overflow-hidden cursor-pointer flex flex-col"
                    onClick={() => setExpandedCropId(crop._id)}
                  >
                    <div className="p-6 pb-4 bg-gradient-to-br from-emerald-50/50 to-white flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-black text-emerald-950">
                            {crop.cropName}
                          </h3>
                          <p className="text-sm font-semibold text-emerald-600 flex items-center mt-1">
                            <Calendar className="w-3.5 h-3.5 mr-1" />{" "}
                            {new Date(crop.startDate).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCropToDelete(crop._id);
                          }}
                          className="text-gray-400 hover:text-red-500 transition p-2 hover:bg-red-50 rounded-full"
                          title="Delete Crop Plan"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="mb-2 flex justify-between items-end">
                        <span className="text-sm font-bold text-gray-500 uppercase">
                          Progress
                        </span>
                        <span className="text-lg font-black text-emerald-600">
                          {progressPercentage}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-100 group">
                      <div className="text-sm font-semibold text-gray-500 flex items-center">
                        <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-500" />
                        {completedCount} / {totalTasks} Tasks
                      </div>
                      <div className="text-emerald-600 font-bold text-sm flex items-center group-hover:underline">
                        View Full Plan{" "}
                        <ChevronRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CropLifecyclePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
          <p className="text-gray-500 font-semibold">Loading...</p>
        </div>
      }
    >
      <CropLifecycleContent />
    </Suspense>
  );
}
