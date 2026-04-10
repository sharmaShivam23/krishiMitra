'use client';

import React, { useState } from 'react';
import { Camera, Upload, X, CheckCircle2 } from 'lucide-react';
import CloudinaryImageUpload from '@/components/CloudinaryImageUpload';

interface Props {
  type: 'pre' | 'post';
  existingPhotos?: string[];
  existingCondition?: string;
  existingNotes?: string;
  readOnly?: boolean;
  onSubmit: (data: { photos: string[]; condition: string; notes: string }) => Promise<void>;
  loading?: boolean;
}

const CONDITIONS = [
  { value: 'Excellent', label: 'Excellent', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  { value: 'Good', label: 'Good', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { value: 'Fair', label: 'Fair', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  { value: 'Damaged', label: 'Damaged', color: 'bg-red-100 text-red-700 border-red-300' }
];

export default function InspectionUploader({ type, existingPhotos, existingCondition, existingNotes, readOnly, onSubmit, loading }: Props) {
  const [photos, setPhotos] = useState<string[]>(existingPhotos || []);
  const [condition, setCondition] = useState(existingCondition || 'Good');
  const [notes, setNotes] = useState(existingNotes || '');
  const [currentUpload, setCurrentUpload] = useState('');

  const addPhoto = (url: string) => {
    if (url && photos.length < 6) {
      setPhotos(prev => [...prev, url]);
      setCurrentUpload('');
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (photos.length === 0) return;
    await onSubmit({ photos, condition, notes });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className={`p-4 ${type === 'pre' ? 'bg-blue-50 border-b border-blue-100' : 'bg-amber-50 border-b border-amber-100'}`}>
        <div className="flex items-center gap-2">
          <Camera className={`w-5 h-5 ${type === 'pre' ? 'text-blue-600' : 'text-amber-600'}`} />
          <h3 className="font-black text-gray-900">
            {type === 'pre' ? 'Pre-Handover Inspection' : 'Post-Return Inspection'}
          </h3>
        </div>
        <p className="text-sm text-gray-500 font-medium mt-1">
          {type === 'pre' 
            ? 'Upload photos of equipment condition BEFORE handing it over.' 
            : 'Upload photos of equipment condition AFTER it was returned.'}
        </p>
      </div>

      <div className="p-5 space-y-5">
        {/* Existing photos display */}
        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo, i) => (
              <div key={i} className="relative group rounded-xl overflow-hidden aspect-square bg-gray-100">
                <img src={photo} alt={`Inspection ${i + 1}`} className="w-full h-full object-cover" />
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Upload */}
        {!readOnly && photos.length < 6 && (
          <div>
            <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
              Add Photo ({photos.length}/6)
            </p>
            <CloudinaryImageUpload
              value={currentUpload}
              onChange={(url) => addPhoto(url)}
              label="Upload inspection photo"
            />
          </div>
        )}

        {/* Condition selector */}
        <div>
          <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Equipment Condition</p>
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map((c) => (
              <button
                key={c.value}
                type="button"
                disabled={readOnly}
                onClick={() => setCondition(c.value)}
                className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                  condition === c.value ? c.color : 'border-gray-200 text-gray-500 bg-white'
                } ${readOnly ? 'cursor-default' : 'cursor-pointer hover:shadow-sm'}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Inspection Notes</p>
          {readOnly ? (
            <p className="text-sm text-gray-700 font-medium bg-gray-50 rounded-xl p-3">{notes || 'No notes.'}</p>
          ) : (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Describe the equipment's condition, any scratches, wear, or issues..."
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
            />
          )}
        </div>

        {/* Submit */}
        {!readOnly && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={photos.length === 0 || loading}
            className="w-full py-3 rounded-xl font-black text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
            {loading ? 'Submitting...' : 'Submit Inspection Report'}
          </button>
        )}
      </div>
    </div>
  );
}
