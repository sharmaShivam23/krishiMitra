'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, MapPin, IndianRupee, Tractor, Wrench, ShieldCheck, User,
  Calendar, Phone, MessageCircle, Loader2, AlertCircle, Star, Clock
} from 'lucide-react';
import Link from 'next/link';
import RentalRequestModal from '@/components/rental/RentalRequestModal';

interface Provider {
  _id: string;
  name: string;
  phone: string;
  state?: string;
  district?: string;
}

interface ListingDetail {
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
  providerId: Provider | null;
  createdAt: string;
  isActive: boolean;
}

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBooking, setShowBooking] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ _id: string } | null>(null);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/listings/${id}`);
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Not found');
        setListing(data.listing);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();

    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.user) setCurrentUser(d.user); })
      .catch(() => {});
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Listing Not Found</h2>
        <p className="text-gray-500 mb-4">{error}</p>
        <Link href="/dashboard/Services" className="text-emerald-600 font-bold hover:underline">← Back to listings</Link>
      </div>
    );
  }

  const provider = listing.providerId;
  const isOwner = currentUser && provider && provider._id === currentUser._id;
  const isRent = listing.listingType === 'rent';

  const conditionColors: Record<string, string> = {
    Excellent: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    Good: 'bg-blue-100 text-blue-700 border-blue-300',
    Fair: 'bg-amber-100 text-amber-700 border-amber-300'
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24 font-sans">
      {/* Back nav */}
      <div className="max-w-5xl mx-auto px-4 pt-4">
        <Link href="/dashboard/Services" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-emerald-600 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Equipment
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Images */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Main Image */}
              <div className="aspect-[4/3] bg-gray-100 relative">
                {listing.images.length > 0 ? (
                  <img src={listing.images[activeImage] || listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full flex flex-col items-center justify-center ${isRent ? 'bg-emerald-50 text-emerald-300' : 'bg-blue-50 text-blue-300'}`}>
                    {isRent ? <Tractor className="w-24 h-24" /> : <Wrench className="w-24 h-24" />}
                    <span className="text-sm font-bold mt-2">No photo uploaded</span>
                  </div>
                )}

                {/* Condition badge */}
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${conditionColors[listing.equipment.condition] || conditionColors.Good} flex items-center gap-1 bg-white/90 backdrop-blur-sm`}>
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    {listing.equipment.condition}
                  </span>
                </div>
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${isRent ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'}`}>
                    {isRent ? 'For Rent' : 'Service'}
                  </span>
                </div>
              </div>

              {/* Thumbnails */}
              {listing.images.length > 1 && (
                <div className="p-2 flex gap-2">
                  {listing.images.map((img, i) => (
                    <button key={i} onClick={() => setActiveImage(i)}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${activeImage === i ? 'border-emerald-500' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-4">
              <h3 className="font-bold text-gray-900 mb-3">Description</h3>
              <p className="text-gray-600 text-sm font-medium leading-relaxed whitespace-pre-wrap">{listing.description}</p>
            </div>

            {/* Service details */}
            {listing.listingType === 'service' && listing.serviceDetails && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-4">
                <h3 className="font-bold text-gray-900 mb-3">Service Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-400 font-medium">Job Type</span><br /><span className="font-bold">{listing.serviceDetails.jobType || 'General'}</span></div>
                  <div><span className="text-gray-400 font-medium">Capacity</span><br /><span className="font-bold">{listing.serviceDetails.estimatedCapacity || 'N/A'}</span></div>
                  <div><span className="text-gray-400 font-medium">Operator</span><br /><span className="font-bold">{listing.serviceDetails.operatorIncluded ? 'Included ✓' : 'Not included'}</span></div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Details & CTA */}
          <div className="lg:col-span-2 space-y-4">
            {/* Title & Price */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">{listing.category}</span>
              <h1 className="text-2xl font-black text-gray-900 mt-1 leading-tight">{listing.title}</h1>

              <div className="flex items-center gap-2 mt-2 text-gray-500 text-sm font-medium">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>{listing.location.district}, {listing.location.state}</span>
                {listing.location.village && <span className="text-gray-400">• {listing.location.village}</span>}
              </div>

              <div className="mt-5 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Rental Rate</span>
                <div className="flex items-baseline">
                  <IndianRupee className="w-6 h-6 text-emerald-600" />
                  <span className="text-3xl font-black text-gray-900">{listing.pricing.rate}</span>
                  <span className="text-sm font-bold text-gray-500 ml-1.5">/ {listing.pricing.unit}</span>
                </div>
              </div>

              {/* Equipment Info */}
              <div className="mt-5 space-y-3">
                <div className="flex items-center text-sm">
                  <span className="text-gray-400 font-medium w-28 shrink-0">Equipment</span>
                  <span className="text-gray-900 font-bold">{listing.equipment.name}</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-gray-400 font-medium w-28 shrink-0">Condition</span>
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${conditionColors[listing.equipment.condition] || ''}`}>
                    {listing.equipment.condition}
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-gray-400 font-medium w-28 shrink-0">Listed</span>
                  <span className="text-gray-700 font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(listing.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Owner Card */}
            {provider && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Equipment Owner</h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-lg">
                    {provider.name?.charAt(0)?.toUpperCase() || 'F'}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{provider.name}</p>
                    <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {provider.district || listing.location.district}, {provider.state || listing.location.state}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <a href={`https://wa.me/91${provider.phone}?text=${encodeURIComponent(`Hi ${provider.name}, I'm interested in renting your "${listing.title}" on KrishiMitra.`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 flex items-center justify-center gap-1.5 transition-all">
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </a>
                  <a href={`tel:${provider.phone}`}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 flex items-center justify-center gap-1.5 transition-all">
                    <Phone className="w-4 h-4" /> Call
                  </a>
                </div>
              </div>
            )}

            {/* Book CTA */}
            {!isOwner && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowBooking(true)}
                className="w-full py-4 rounded-2xl font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 text-base active:scale-95"
              >
                <Calendar className="w-5 h-5" />
                Book This Equipment
              </motion.button>
            )}

            {isOwner && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                <p className="text-amber-700 text-sm font-bold">This is your own listing</p>
              </div>
            )}

            {/* My Rentals link */}
            <Link href="/dashboard/Services/rentals"
              className="block w-full text-center py-3 rounded-xl text-sm font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all">
              View My Rental Orders →
            </Link>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBooking && listing && (
        <RentalRequestModal
          listing={listing}
          onClose={() => setShowBooking(false)}
          onSuccess={() => {
            setShowBooking(false);
            router.push('/dashboard/Services/rentals');
          }}
        />
      )}
    </div>
  );
}
