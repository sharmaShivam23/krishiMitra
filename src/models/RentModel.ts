import mongoose from 'mongoose';

const ListingSchema = new mongoose.Schema({
  providerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  

  listingType: { 
    type: String, 
    enum: ['rent', 'service'], 
    required: true 
  },
  
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  
  // PRICING LOGIC
  pricing: {
    rate: { type: Number, required: true },
    unit: { type: String, required: true } 
  },

  equipment: {
    name: { type: String, required: true }, 
    condition: { type: String, enum: ['Excellent', 'Good', 'Fair'], default: 'Good' },
  },

  
  serviceDetails: {
    operatorIncluded: { type: Boolean, default: false }, 
    jobType: { type: String },
    estimatedCapacity: { type: String } 
  },

  // LOCATION
  location: {
    state: { type: String, required: true },
    district: { type: String, required: true },
    village: { type: String },
  },
  
  images: [{ type: String }], 
  isActive: { type: Boolean, default: true },
  
}, { timestamps: true });

ListingSchema.index({ 'location.state': 1, 'location.district': 1, listingType: 1 });
ListingSchema.index({ title: 'text', description: 'text', category: 'text' });

export const Listing = mongoose.models.Listing || mongoose.model('Listing', ListingSchema);