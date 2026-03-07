'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, ChevronUp, Search, PenSquare, 
  Clock, MapPin, CheckCircle2, TrendingUp, Users, X, Loader2, Send,
  Truck, IndianRupee, Volume2, VolumeX
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

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
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [replies, setReplies] = useState<{ [key: string]: Reply[] }>({});
  const [loadingReplies, setLoadingReplies] = useState<{ [key: string]: boolean }>({});
  const [newReplyText, setNewReplyText] = useState('');

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newState, setNewState] = useState('');
  const [newTags, setNewTags] = useState('');

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
    if (!newTitle.trim() || !newContent.trim() || !newState) return;
    setIsSubmitting(true);
    
    const tagsArray = newTags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

    try {
      const res = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, content: newContent, state: newState, tags: tagsArray })
      });
      const data = await res.json();
      if (data.success) {
        setPosts([data.post, ...posts]);
        setIsModalOpen(false);
        setNewTitle(''); setNewContent(''); setNewState(''); setNewTags('');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
    if (!newReplyText.trim()) return;

    try {
      const res = await fetch('/api/community/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, text: newReplyText })
      });
      
      const data = await res.json();
      if (data.success) {
        setReplies(prev => ({ ...prev, [postId]: [...(prev[postId] || []), data.comment] }));
        setPosts(currentPosts => currentPosts.map(post => 
          post._id === postId ? { ...post, comments: post.comments + 1 } : post
        ));
        setNewReplyText('');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-agri-900 tracking-tight flex items-center">
            <Users className="w-8 h-8 mr-3 text-agri-600" />
            {t('title')}
          </h1>
          <p className="text-gray-500 mt-2 font-medium">{t('subtitle')}</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center space-x-2 bg-agri-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-agri-700 transition shadow-lg shadow-agri-600/30 w-full md:w-auto">
          <PenSquare className="w-5 h-5" /><span>{t('newDiscussion')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 text-black space-y-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Search className="h-5 w-5 text-black" /></div>
            <input type="text" placeholder={t('searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="block w-full pl-11 pr-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-agri-400 font-medium transition-all outline-none" />
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
                    <motion.div key={post._id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/40 border border-gray-100 flex flex-col transition-all hover:border-agri-300">
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center space-y-2">
                          <button onClick={() => handleUpvote(post._id)} className={`p-2 rounded-xl transition-colors border ${post.userHasUpvoted ? 'bg-agri-100 text-agri-600 border-agri-200 shadow-sm' : 'bg-gray-50 text-gray-400 hover:bg-agri-50 hover:text-agri-500 border-gray-100'}`}>
                            <ChevronUp className="w-6 h-6" />
                          </button>
                          <span className={`font-black ${post.userHasUpvoted ? 'text-agri-600' : 'text-agri-900'}`}>{post.upvotes}</span>
                        </div>

                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2 text-xs font-bold text-gray-500">
                            <span className="flex items-center text-agri-900"><div className="w-5 h-5 rounded-full bg-agri-200 mr-1.5 flex items-center justify-center text-[10px] text-agri-800 uppercase">{post.author.charAt(0)}</div>{post.author}</span>
                            <span>•</span>
                            <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-0.5 text-agri-400" /> {post.state}</span>
                            <span>•</span>
                            <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-0.5" /> {new Date(post.createdAt).toLocaleDateString()}</span>
                          </div>

                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-xl font-bold text-agri-900 leading-tight pr-2">{post.title}</h3>
                            <button 
                              onClick={() => toggleAudio(post._id, post.title, post.content)}
                              className={`p-1.5 rounded-full transition-colors flex-shrink-0 ${playingId === post._id ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400 hover:bg-agri-50 hover:text-agri-600'}`}
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

                      <AnimatePresence>
                        {expandedPostId === post._id && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-4 pt-4 border-t text-black border-gray-100">
                            
                            <div className="pl-12 pr-4 space-y-4 mb-4">
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

                            <div className="pl-12 pr-4 flex gap-2">
                              <input 
                                type="text" 
                                value={newReplyText}
                                onChange={(e) => setNewReplyText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSubmitReply(post._id)}
                                placeholder={t('replyPlaceholder')}
                                className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-agri-400 outline-none"
                              />
                              <button 
                                onClick={() => handleSubmitReply(post._id)}
                                disabled={!newReplyText.trim()}
                                className="bg-agri-600 text-white p-2.5 rounded-xl hover:bg-agri-700 transition disabled:opacity-50"
                              >
                                <Send className="w-4 h-4" />
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

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-6 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden">
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
                  <X className="w-4 h-4 text-red-300 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{t('sellAlone')}</p>
                </div>
                <div className="flex items-start text-amber-50 text-sm bg-black/10 p-3 rounded-xl border border-white/10">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{t('sellTogether')}</p>
                </div>
              </div>
              <Link href="/dashboard/selling-pool">
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
                   <div className="w-10 h-10 rounded-full bg-agri-100 border border-agri-200 flex items-center justify-center font-bold text-agri-700 group-hover:bg-agri-600 group-hover:text-white transition-colors flex-shrink-0 uppercase">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-agri-900 mb-1.5">{t('state')}</label>
                      <select required value={newState} onChange={(e) => setNewState(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-agri-400 text-black font-medium outline-none cursor-pointer">
                        <option value="" disabled>{t('selectState')}</option>
                        <option value="Uttar Pradesh">Uttar Pradesh</option>
                        <option value="Punjab">Punjab</option>
                        <option value="Haryana">Haryana</option>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Madhya Pradesh">Madhya Pradesh</option>
                        <option value="Gujarat">Gujarat</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-agri-900 mb-1.5">{t('tags')}</label>
                      <input type="text" placeholder={t('tagsPlaceholder')} value={newTags} onChange={(e) => setNewTags(e.target.value)} className="w-full px-4 py-3 bg-gray-50 text-black border border-gray-200 rounded-xl focus:ring-2 focus:ring-agri-400 font-medium outline-none" />
                    </div>
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