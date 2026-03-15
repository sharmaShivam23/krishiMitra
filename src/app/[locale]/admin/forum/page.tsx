'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Search, Loader2, Trash2, AlertTriangle } from 'lucide-react';

export default function AdminForumManager() {
  const [posts, setPosts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/admin/forum');
      const json = await res.json();
      if (json.success) setPosts(json.posts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post? This cannot be undone.")) return;
    
    try {
      const res = await fetch(`/api/admin/forum?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setPosts(posts.filter(p => p._id !== id));
      } else {
        alert(json.message);
      }
    } catch (err) {
      alert("Failed to delete post");
    }
  };

  const filteredPosts = posts.filter(post => 
    (post.title?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (post.author?.name?.toLowerCase() || '').includes(search.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-emerald-950 flex items-center">
            <MessageSquare className="w-8 h-8 mr-3 text-emerald-600" />
            Community Moderation
          </h1>
          <p className="text-stone-500 font-medium mt-2">Monitor discussions and remove inappropriate content.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-stone-400" />
          <input 
            type="text" placeholder="Search titles or authors..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-stone-900 placeholder:text-stone-400 shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-stone-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
        ) : (
          <div className="overflow-x-auto p-6">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b-2 border-stone-100 text-stone-400 text-sm">
                  <th className="pb-4 font-bold uppercase tracking-wider w-1/3">Post Details</th>
                  <th className="pb-4 font-bold uppercase tracking-wider">Author</th>
                  <th className="pb-4 font-bold uppercase tracking-wider">Metrics</th>
                  <th className="pb-4 font-bold uppercase tracking-wider">Date</th>
                  <th className="pb-4 font-bold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-stone-700 font-medium">
                {filteredPosts.map((post: any) => (
                  <tr key={post._id} className="border-b border-stone-50 hover:bg-stone-50 transition-colors">
                    <td className="py-4 pr-4">
                      <p className="font-bold text-emerald-950 mb-1">{post.title}</p>
                      <p className="text-xs text-stone-500 line-clamp-2">{post.content}</p>
                    </td>
                    <td className="py-4">
                      <p className="font-bold text-stone-800">{post.author?.name || 'Unknown'}</p>
                      <p className="text-xs text-stone-400">{post.author?.state || post.state}</p>
                    </td>
                    <td className="py-4">
                      <div className="flex space-x-3 text-sm">
                        <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{post.upvotes} Upvotes</span>
                        <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{post.comments} Replies</span>
                      </div>
                    </td>
                    <td className="py-4 text-stone-500 text-sm">{new Date(post.createdAt).toLocaleDateString()}</td>
                    <td className="py-4 text-right">
                      <button onClick={() => handleDelete(post._id)} className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPosts.length === 0 && (
              <div className="text-center p-10 text-stone-400 font-medium flex flex-col items-center">
                <AlertTriangle className="w-10 h-10 mb-3 text-stone-300" />
                No posts found.
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}