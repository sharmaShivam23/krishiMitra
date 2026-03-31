'use client';

import React, { useState, useRef } from 'react';
import { Upload, Link2, X, Image as ImageIcon, Loader2, CheckCircle2 } from 'lucide-react';

interface Props {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

export default function CloudinaryImageUpload({ value, onChange, label = 'Product Image' }: Props) {
  const [tab, setTab] = useState<'upload' | 'url'>('upload');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState(value.startsWith('http') ? value : '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadToCloudinary = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }
    setUploading(true);
    setProgress(10);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', UPLOAD_PRESET);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 15, 85));
      }, 300);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: 'POST', body: fd }
      );
      clearInterval(progressInterval);
      setProgress(100);

      if (!res.ok) throw new Error('Cloudinary upload failed');
      const data = await res.json();
      onChange(data.secure_url);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Image upload failed. Please try again.');
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 800);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadToCloudinary(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadToCloudinary(file);
  };

  const handleUrlConfirm = () => {
    if (urlInput.trim()) onChange(urlInput.trim());
  };

  const handleClear = () => {
    onChange('');
    setUrlInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-bold text-gray-700 flex items-center gap-1.5">
        <ImageIcon className="w-4 h-4 text-emerald-600" />
        {label}
      </label>

      {/* Tab switcher */}
      <div className="flex bg-gray-100 p-1 rounded-xl w-fit gap-1">
        <button
          type="button"
          onClick={() => setTab('upload')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            tab === 'upload' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Upload className="w-3.5 h-3.5" /> Upload Photo
        </button>
        <button
          type="button"
          onClick={() => setTab('url')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            tab === 'url' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Link2 className="w-3.5 h-3.5" /> Paste URL
        </button>
      </div>

      {/* Upload Tab */}
      {tab === 'upload' && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-emerald-400 bg-emerald-50 scale-[1.01]'
              : 'border-gray-200 bg-gray-50 hover:border-emerald-300 hover:bg-emerald-50/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          {uploading ? (
            <div className="space-y-3">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-emerald-700">Uploading to Cloudinary...</p>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 font-medium">{progress}%</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="bg-emerald-100 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-sm font-bold text-gray-700">
                Click to upload <span className="text-gray-400 font-normal">or drag & drop</span>
              </p>
              <p className="text-xs text-gray-400">PNG, JPG, WEBP up to 10MB</p>
            </div>
          )}
        </div>
      )}

      {/* URL Tab */}
      {tab === 'url' && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2 className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
            <input
              type="url"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 outline-none text-sm font-medium text-gray-900"
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleUrlConfirm())}
            />
          </div>
          <button
            type="button"
            onClick={handleUrlConfirm}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" /> Use
          </button>
        </div>
      )}

      {/* Preview */}
      {value && (
        <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-gray-200 group shadow-sm">
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
            <button
              type="button"
              onClick={handleClear}
              className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white p-2 rounded-xl shadow-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Image set
          </div>
        </div>
      )}
    </div>
  );
}
