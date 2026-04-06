'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, ChevronUp, Search, PenSquare, 
  Clock, MapPin, CheckCircle2, TrendingUp, Users, X, Loader2, Send,
  Truck, IndianRupee, Volume2, VolumeX, SlidersHorizontal, FilterX
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { STATES_DISTRICTS } from '@/utils/indiaStates';
import { requestKrishiSarthi } from '@/lib/krishiSarthi';
import { addToQueue } from '@/lib/offlineQueue';

interface Reply {
  _id: string;
  author: string;
  text: string;
  createdAt: string;
}

interface Post {
  _id: string;
  author: string;
  state: string;
  district: string; // <-- New Field
  title: string;
  content: string;
  upvotes: number;
  comments: number;
  createdAt: string;
  tags: string[];
  isResolved: boolean;
  userHasUpvoted?: boolean;
}

export default function CommunityForum() {
  const t = useTranslations('CommunityForum');
  const locale = useLocale();
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStateFilter, setSelectedStateFilter] = useState('All');
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState('All'); // <-- New Filter State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [replies, setReplies] = useState<{ [key: string]: Reply[] }>({});
  const [loadingReplies, setLoadingReplies] = useState<{ [key: string]: boolean }>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [submittingReplyId, setSubmittingReplyId] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newState, setNewState] = useState('');
  const [newDistrict, setNewDistrict] = useState(''); // <-- New District Input State
  const [newTags, setNewTags] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'upvotes' | 'resolved'>('recent');

  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch('/api/community');
        const data = await res.json();
        if (data.success) setPosts(data.posts);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleAudio = (id: string, title: string, content: string) => {
    if (!('speechSynthesis' in window)) return;
    if (playingId === id) {
      window.speechSynthesis.cancel();
      setPlayingId(null);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`${title}. ${content}`);
      utterance.onend = () => setPlayingId(null);
      utterance.onerror = () => setPlayingId(null);
      window.speechSynthesis.speak(utterance);
      setPlayingId(id);
    }
  };

  const handleUpvote = async (postId: string) => {
    const postToUpdate = posts.find(p => p._id === postId);
    if (!postToUpdate) return;
    const isUpvoting = !postToUpdate.userHasUpvoted;

    setPosts(currentPosts => 
      currentPosts.map(post => post._id === postId ? { ...post, upvotes: isUpvoting ? post.upvotes + 1 : post.upvotes - 1, userHasUpvoted: isUpvoting } : post)
    );

    try {
      await fetch('/api/community', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, action: isUpvoting ? 'upvote' : 'remove_upvote' })
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim() || !newState || !newDistrict.trim()) return;
    setIsSubmitting(true);

    const tagsArray = newTags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    const body = { title: newTitle, content: newContent, state: newState, district: newDistrict, tags: tagsArray };

    // Helper: add an optimistic (temporary) post to the UI so the user sees feedback immediately
    const addTempPost = () => {
      const tempPost: Post = {
        _id: `offline_${Date.now()}`,
        author: 'You',
        title: newTitle,
        content: newContent,
        state: newState,
        district: newDistrict,
        tags: tagsArray,
        upvotes: 0,
        comments: 0,
        createdAt: new Date().toISOString(),
        isResolved: false,
      };
      setPosts((prev: Post[]) => [tempPost, ...prev]);
    };

    // --- OFFLINE: device has no internet ---
    if (!navigator.onLine) {
      addToQueue('community', '/api/community', 'POST', body);
      addTempPost();
      setIsModalOpen(false);
      setNewTitle(''); setNewContent(''); setNewState(''); setNewDistrict(''); setNewTags('');
      setIsSubmitting(false);
      return;
    }

    // --- ONLINE: try to submit normally ---
    try {
      const res = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        setPosts([data.post, ...posts]);
        setIsModalOpen(false);
        setNewTitle(''); setNewContent(''); setNewState(''); setNewDistrict(''); setNewTags('');
      }
    } catch (error) {
      // Network failed even though navigator.onLine was true — queue for later
      console.error(error);
      addToQueue('community', '/api/community', 'POST', body);
      addTempPost();
      setIsModalOpen(false);
      setNewTitle(''); setNewContent(''); setNewState(''); setNewDistrict(''); setNewTags('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // When the offline queue syncs a community post, re-fetch so temp posts are replaced by real ones
  useEffect(() => {
    const handler = async (e: Event) => {
      const { feature } = (e as CustomEvent<{ feature: string }>).detail;
      if (feature !== 'community') return;
      try {
        const res = await fetch('/api/community');
        const data = await res.json();
        if (data.success) setPosts(data.posts);
      } catch (err) { console.error(err); }
    };
    window.addEventListener('krishimitra:synced', handler);
    return () => window.removeEventListener('krishimitra:synced', handler);
  }, []);

  const toggleReplies = async (postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
      return;
    }
    
    setExpandedPostId(postId);
    
    if (!replies[postId]) {
      setLoadingReplies(prev => ({ ...prev, [postId]: true }));
      try {
        const res = await fetch(`/api/community/comments?postId=${postId}`);
        const data = await res.json();
        if (data.success) {
          setReplies(prev => ({ ...prev, [postId]: data.comments }));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingReplies(prev => ({ ...prev, [postId]: false }));
      }
    }
  };

  const handleSubmitReply = async (postId: string) => {
    const draft = replyDrafts[postId]?.trim() || '';
    if (!draft) return;
    setSubmittingReplyId(postId);

    try {
      const res = await fetch('/api/community/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, text: draft })
      });
      
      const data = await res.json();
      if (data.success) {
        setReplies(prev => ({ ...prev, [postId]: [...(prev[postId] || []), data.comment] }));
        setPosts(currentPosts => currentPosts.map(post => 
          post._id === postId ? { ...post, comments: post.comments + 1 } : post
        ));
        setReplyDrafts(prev => ({ ...prev, [postId]: '' }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSubmittingReplyId(null);
    }
  };

  const communityStats = useMemo(() => {
    const resolved = posts.filter((post) => post.isResolved).length;
    const authors = new Set(posts.map((post) => post.author)).size;
    return {
      totalPosts: posts.length,
      resolved,
      activeAuthors: authors
    };
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const base = posts.filter(post => {
      const matchesSearch = 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesState = selectedStateFilter === 'All' || post.state === selectedStateFilter;
      const matchesDistrict = selectedDistrictFilter === 'All' || post.district === selectedDistrictFilter;

      return matchesSearch && matchesState && matchesDistrict;
    });

    if (sortBy === 'upvotes') {
      return [...base].sort((a, b) => b.upvotes - a.upvotes);
    }

    if (sortBy === 'resolved') {
      return [...base].sort((a, b) => Number(b.isResolved) - Number(a.isResolved) || b.upvotes - a.upvotes);
    }

    return [...base].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [posts, searchQuery, selectedStateFilter, selectedDistrictFilter, sortBy]);

  const hasActiveFilters = Boolean(searchQuery.trim()) || selectedStateFilter !== 'All' || selectedDistrictFilter !== 'All';

  const trendingTags = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    posts.forEach(post => {
      post.tags.forEach(tag => {
        const cleanTag = tag.trim().replace(/^#/, ''); 
        if (cleanTag) {
          const formattedTag = cleanTag.charAt(0).toUpperCase() + cleanTag.slice(1).toLowerCase();
          tagCounts[formattedTag] = (tagCounts[formattedTag] || 0) + 1;
        }
      });
    });

    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [posts]);

  const topContributors = useMemo(() => {
    const authorCounts: Record<string, number> = {};
    posts.forEach(post => {
      authorCounts[post.author] = (authorCounts[post.author] || 0) + 1;
    });

    return Object.entries(authorCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [posts]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 md:mb-8">
        <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-50 p-4 md:p-0 md:border-0 md:bg-transparent">
          <h1 className="text-[1.85rem] leading-[1.05] md:text-4xl font-black text-agri-900 tracking-tight flex items-center">
            <Users className="w-7 h-7 md:w-8 md:h-8 mr-2.5 md:mr-3 text-agri-600" />
            {t('title')}
          </h1>
          <p className="text-gray-600 mt-2 font-semibold text-sm md:text-base">{t('subtitle')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full md:w-auto">
          <button
            onClick={() =>
              requestKrishiSarthi({
                prompt: 'KrishiSarthi, community mein sawal kaise poochna hai batao.',
                context: {
                  module: 'community',
                  summary: 'User is in farmer community section and needs help asking or engaging in discussions.'
                }
              })
            }
            className="flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-900 px-5 py-3 rounded-2xl font-black hover:bg-emerald-100 transition shadow-sm"
          >
            <Users className="w-5 h-5" />
            <span>Ask KrishiSarthi</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-agri-600 text-white px-5 py-3 rounded-2xl font-black hover:bg-agri-700 transition shadow-lg shadow-agri-600/30"
          >
            <PenSquare className="w-5 h-5" />
            <span>{t('newDiscussion')}</span>
          </button>
        </div>
      </div>

      <div className="flex md:grid md:grid-cols-3 gap-2 md:gap-3 mb-6 overflow-x-auto md:overflow-visible pb-1 -mx-1 px-1">
        <div className="min-w-[140px] md:min-w-0 rounded-2xl border border-agri-200 bg-agri-50 px-3 py-3">
          <p className="text-[11px] font-black uppercase tracking-wide text-agri-700">Discussions</p>
          <p className="mt-1 text-xl md:text-2xl font-black text-agri-900">{communityStats.totalPosts}</p>
        </div>
        <div className="min-w-[140px] md:min-w-0 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3">
          <p className="text-[11px] font-black uppercase tracking-wide text-emerald-700">Resolved</p>
          <p className="mt-1 text-xl md:text-2xl font-black text-emerald-800">{communityStats.resolved}</p>
        </div>
        <div className="min-w-[140px] md:min-w-0 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3">
          <p className="text-[11px] font-black uppercase tracking-wide text-amber-700">Contributors</p>
          <p className="mt-1 text-xl md:text-2xl font-black text-amber-800">{communityStats.activeAuthors}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 text-black space-y-6">
          
          {/* SEARCH, STATE AND DISTRICT FILTER BAR */}
          <div className="flex flex-col gap-3 rounded-2xl border border-agri-100 bg-white/95 p-3 shadow-sm md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none">
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-agri-900 inline-flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-agri-600" />
                Smart Filters
              </p>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedStateFilter('All');
                    setSelectedDistrictFilter('All');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-agri-700 hover:border-agri-300 hover:bg-agri-50 transition"
                >
                  <FilterX className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-2">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input 
                type="text" 
                placeholder={t('searchPlaceholder')} 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="block w-full pl-11 pr-4 py-3.5 md:py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-agri-400 font-medium transition-all outline-none" 
              />
            </div>
            
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-agri-500" />
              </div>
              <select
                value={selectedStateFilter}
                onChange={(e) => { setSelectedStateFilter(e.target.value); setSelectedDistrictFilter('All'); }}
                className="block w-full pl-11 pr-10 py-3.5 md:py-4 bg-white text-agri-900 border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-agri-400 font-bold transition-all outline-none appearance-none cursor-pointer text-ellipsis"
              >
                <option value="All">All States</option>
                {Object.keys(STATES_DISTRICTS).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-agri-500" />
              </div>
              <select
                value={selectedDistrictFilter}
                onChange={(e) => setSelectedDistrictFilter(e.target.value)}
                disabled={selectedStateFilter === 'All'}
                className="block w-full pl-11 pr-10 py-3.5 md:py-4 bg-white text-agri-900 border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-agri-400 font-bold transition-all outline-none appearance-none cursor-pointer disabled:opacity-50 text-ellipsis"
              >
                <option value="All">All Districts</option>
                {selectedStateFilter !== 'All' && (STATES_DISTRICTS as any)[selectedStateFilter]?.map((d: string) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="relative sm:w-40">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'recent' | 'upvotes' | 'resolved')}
                className="block w-full px-4 py-3.5 md:py-4 bg-white text-agri-900 border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-agri-400 font-bold transition-all outline-none appearance-none cursor-pointer"
              >
                <option value="recent">Recent</option>
                <option value="upvotes">Top Voted</option>
                <option value="resolved">Resolved First</option>
              </select>
            </div>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="md:hidden w-full h-11 rounded-xl bg-agri-600 text-white font-black inline-flex items-center justify-center gap-2 shadow-lg shadow-agri-600/30"
            >
              <PenSquare className="w-4 h-4" />
              <span>{t('newDiscussion')}</span>
            </button>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-agri-600" /></div>
            ) : (
              <AnimatePresence>
                {filteredPosts.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-12 text-center text-gray-500 font-medium bg-white rounded-3xl border border-gray-100">
                    {t('noPosts')}
                  </motion.div>
                ) : (
                  filteredPosts.map((post) => (
                    <motion.div key={post._id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-4 md:p-6 shadow-xl shadow-gray-200/40 border border-gray-100 flex flex-col transition-all hover:border-agri-300">
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <div className="flex flex-row sm:flex-col items-center space-x-3 sm:space-x-0 sm:space-y-2">
                          <button onClick={() => handleUpvote(post._id)} className={`p-2 rounded-xl transition-colors border ${post.userHasUpvoted ? 'bg-agri-100 text-agri-600 border-agri-200 shadow-sm' : 'bg-gray-50 text-gray-400 hover:bg-agri-50 hover:text-agri-500 border-gray-100'}`}>
                            <ChevronUp className="w-6 h-6" />
                          </button>
                          <span className={`font-black ${post.userHasUpvoted ? 'text-agri-600' : 'text-agri-900'}`}>{post.upvotes}</span>
                        </div>

                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2 text-xs font-bold text-gray-500">
                            <span className="flex items-center text-agri-900"><div className="w-5 h-5 rounded-full bg-agri-200 mr-1.5 flex items-center justify-center text-[10px] text-agri-800 uppercase">{post.author.charAt(0)}</div>{post.author}</span>
                            <span>•</span>
                            <span className="flex items-center">
                              <MapPin className="w-3.5 h-3.5 mr-0.5 text-agri-400" /> 
                              {/* Display District along with State */}
                              {post.district ? `${post.district}, ${post.state}` : post.state}
                            </span>
                            <span>•</span>
                            <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-0.5" /> {new Date(post.createdAt).toLocaleDateString()}</span>
                          </div>

                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="text-lg md:text-xl font-black text-agri-900 leading-tight pr-2">{post.title}</h3>
                            <button 
                              onClick={() => toggleAudio(post._id, post.title, post.content)}
                              className={`p-1.5 rounded-full transition-colors shrink-0 ${playingId === post._id ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400 hover:bg-agri-50 hover:text-agri-600'}`}
                            >
                              {playingId === post._id ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                            </button>
                          </div>

                          <p className="text-gray-600 text-sm font-medium line-clamp-3 mb-4 leading-relaxed whitespace-pre-wrap">{post.content}</p>

                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-2">
                              {post.tags.map((tag, i) => (
                                <span key={i} className="px-2.5 py-1 bg-agri-50 text-agri-700 text-xs font-bold rounded-lg border border-agri-200/50">{tag}</span>
                              ))}
                            </div>
                            
                            <div className="flex items-center space-x-4 text-sm font-bold text-gray-500">
                              <button onClick={() => toggleReplies(post._id)} className={`flex items-center px-3 py-1.5 rounded-lg transition-colors ${expandedPostId === post._id ? 'bg-agri-50 text-agri-600' : 'hover:bg-gray-50 hover:text-agri-600'}`}>
                                <MessageSquare className="w-4 h-4 mr-1.5" /> {post.comments} {t('replies')}
                              </button>
                              {post.isResolved && (<span className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg"><CheckCircle2 className="w-4 h-4 mr-1.5" /> {t('resolved')}</span>)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Replies Section */}
                      <AnimatePresence>
                        {expandedPostId === post._id && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-4 pt-4 border-t text-black border-gray-100">
                            <div className="pl-4 pr-2 sm:pl-12 sm:pr-4 space-y-4 mb-4">
                              {loadingReplies[post._id] ? (
                                <Loader2 className="w-5 h-5 animate-spin text-gray-400 mx-auto my-4" />
                              ) : replies[post._id]?.length > 0 ? (
                                replies[post._id].map(reply => (
                                  <div key={reply._id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs font-bold text-agri-900 flex items-center">
                                        <div className="w-4 h-4 rounded-full bg-agri-200 mr-1.5 flex items-center justify-center text-[8px] text-agri-800 uppercase">{reply.author.charAt(0)}</div>
                                        {reply.author}
                                      </span>
                                      <span className="text-[10px] font-bold text-black">{new Date(reply.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm font-medium text-black leading-relaxed">{reply.text}</p>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-center font-medium text-black py-4">{t('noReplies')}</p>
                              )}
                            </div>

                            <div className="pl-4 pr-2 sm:pl-12 sm:pr-4 flex gap-2">
                              <input 
                                type="text" 
                                value={replyDrafts[post._id] || ''}
                                onChange={(e) => setReplyDrafts(prev => ({ ...prev, [post._id]: e.target.value }))}
                                onKeyDown={(e) => e.key === 'Enter' && handleSubmitReply(post._id)}
                                placeholder={t('replyPlaceholder')}
                                className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-agri-400 outline-none"
                              />
                              <button 
                                onClick={() => handleSubmitReply(post._id)}
                                disabled={!(replyDrafts[post._id] || '').trim() || submittingReplyId === post._id}
                                className="bg-agri-600 text-white p-2.5 rounded-xl hover:bg-agri-700 transition disabled:opacity-50"
                              >
                                {submittingReplyId === post._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <div className="bg-linear-to-br from-amber-500 to-orange-600 rounded-3xl p-6 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 text-white/10 pointer-events-none">
              <Truck className="w-32 h-32" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-4 border-b border-white/20 pb-4">
                <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                  <Users className="w-6 h-6 text-amber-50" />
                </div>
                <div>
                  <h3 className="text-xl font-black leading-tight">{t('mandiPool')}</h3>
                  <p className="text-xs text-amber-100 font-bold uppercase tracking-wider">{t('groupPower')}</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-start text-amber-50 text-sm bg-black/10 p-3 rounded-xl border border-white/10">
                  <X className="w-4 h-4 text-red-300 mr-2 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{t('sellAlone')}</p>
                </div>
                <div className="flex items-start text-amber-50 text-sm bg-black/10 p-3 rounded-xl border border-white/10">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 mr-2 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{t('sellTogether')}</p>
                </div>
              </div>
              <Link href={`/${locale}/dashboard/selling-pool`}>
              <button className="w-full bg-white text-orange-600 font-bold py-3.5 rounded-xl hover:bg-amber-50 hover:shadow-lg transition-all flex items-center justify-center active:scale-95 group">
                <IndianRupee className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" /> {t('startPool')}
              </button>
              </Link>
            </div>
          </div>
          
          <div className="bg-agri-900 rounded-3xl p-6 text-white shadow-xl shadow-agri-900/20 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-agri-600 rounded-full filter blur-[50px] opacity-30 pointer-events-none"></div>
             <h3 className="text-lg font-bold flex items-center mb-6 relative z-10">
               <TrendingUp className="w-5 h-5 mr-2 text-agri-400" /> {t('trending')}
             </h3>
             <div className="space-y-4 relative z-10">
               {trendingTags.length > 0 ? trendingTags.map((item, idx) => (
                 <div key={idx} onClick={() => setSearchQuery(item.tag)} className="flex items-center justify-between group cursor-pointer">
                   <span className="font-bold text-agri-100 group-hover:text-agri-400 transition-colors">
                     #{item.tag}
                   </span>
                   <span className="text-xs text-agri-100/50 bg-white/10 px-2 py-1 rounded-lg">
                     {item.count} {t('posts')}
                   </span>
                 </div>
               )) : (
                 <p className="text-sm text-agri-100/50">{t('noData')}</p>
               )}
             </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/40 border border-gray-100">
             <h3 className="text-lg font-bold text-agri-900 mb-6 flex items-center">
               {t('topContributors')}
             </h3>
             <div className="space-y-4">
               {topContributors.length > 0 ? topContributors.map((contributor, idx) => (
                 <div key={idx} className="flex items-center space-x-3 cursor-pointer group">
                   <div className="w-10 h-10 rounded-full bg-agri-100 border border-agri-200 flex items-center justify-center font-bold text-agri-700 group-hover:bg-agri-600 group-hover:text-white transition-colors shrink-0 uppercase">
                     {contributor.name.charAt(0)}
                   </div>
                   <div className="flex-1 overflow-hidden">
                     <p className="font-bold text-sm text-agri-900 group-hover:text-agri-600 transition-colors truncate">
                       {contributor.name}
                     </p>
                     <p className="text-xs font-medium text-gray-500">
                       {contributor.count} {t('discussions')}
                     </p>
                   </div>
                   {idx === 0 && (
                     <div className="bg-amber-100 text-amber-600 p-1.5 rounded-full" title="Top Contributor">
                       <CheckCircle2 className="w-3 h-3" />
                     </div>
                   )}
                 </div>
               )) : (
                 <p className="text-sm text-gray-400">{t('beFirst')}</p>
               )}
             </div>
          </div>
        </div>
      </div>

      {/* New Post Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 text-black bg-agri-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl shadow-2xl shadow-black/40 w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-xl font-black text-agri-900 flex items-center"><PenSquare className="w-5 h-5 mr-2 text-agri-600" /> {t('modalTitle')}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmitPost} className="p-6 overflow-y-auto custom-scrollbar">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-agri-900 mb-1.5">{t('qTitle')}</label>
                    <input type="text" required placeholder={t('qPlaceholder')} value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full px-4 py-3 bg-gray-50 text-black border border-gray-200 rounded-xl focus:ring-2 focus:ring-agri-400 font-medium outline-none" />
                  </div>
                  
                  {/* Updated Form Grid with District */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-agri-900 mb-1.5">{t('state')}</label>
                      <select required value={newState} onChange={(e) => { setNewState(e.target.value); setNewDistrict(''); }} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-agri-400 text-black font-medium outline-none cursor-pointer">
                        <option value="" disabled>{t('selectState')}</option>
                        {Object.keys(STATES_DISTRICTS).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-agri-900 mb-1.5">District</label>
                      <select required value={newDistrict} disabled={!newState} onChange={(e) => setNewDistrict(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-agri-400 text-black font-medium outline-none cursor-pointer disabled:opacity-50">
                        <option value="" disabled>Select District</option>
                        {newState && (STATES_DISTRICTS as any)[newState]?.map((d: string) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-agri-900 mb-1.5">{t('tags')}</label>
                    <input type="text" placeholder={t('tagsPlaceholder')} value={newTags} onChange={(e) => setNewTags(e.target.value)} className="w-full px-4 py-3 bg-gray-50 text-black border border-gray-200 rounded-xl focus:ring-2 focus:ring-agri-400 font-medium outline-none" />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-agri-900 mb-1.5">{t('desc')}</label>
                    <textarea required rows={5} placeholder={t('descPlaceholder')} value={newContent} onChange={(e) => setNewContent(e.target.value)} className="w-full px-4 py-3 bg-gray-50 text-black border border-gray-200 rounded-xl focus:ring-2 focus:ring-agri-400 font-medium outline-none resize-none"></textarea>
                  </div>
                </div>
                <div className="mt-8 flex justify-end gap-3 pt-5 border-t text-black border-gray-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">{t('cancel')}</button>
                  <button type="submit" disabled={isSubmitting} className="flex items-center px-8 py-3 rounded-xl font-bold text-black bg-agri-600 hover:bg-agri-700 transition-colors disabled:opacity-70">
                    {isSubmitting && <Loader2 className="w-5 text-white h-5 mr-2 animate-spin" />} {isSubmitting ? t('publishing') : t('publish')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}