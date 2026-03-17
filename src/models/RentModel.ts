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
    // Rent units: 'per day', 'per hour' | Service units: 'per acre', 'per hectare', 'per ton'
    unit: { type: String, required: true } 
  },

  // EQUIPMENT DETAILS (Used for both)
  equipment: {
    name: { type: String, required: true }, // e.g., 'Mahindra 575 DI'
    condition: { type: String, enum: ['Excellent', 'Good', 'Fair'], default: 'Good' },
  },

  // SERVICE SPECIFIC DETAILS (Only populated if listingType === 'service')
  serviceDetails: {
    operatorIncluded: { type: Boolean, default: false }, // Always true for 'service'
    jobType: { type: String }, // e.g., 'Ploughing', 'Harvesting', 'Sowing'
    estimatedCapacity: { type: String } // e.g., '10 acres per day'
  },

  // LOCATION
  location: {
    state: { type: String, required: true },
    district: { type: String, required: true },
    village: { type: String },
  },
  
  images: [{ type: String }], // Array of image URLs
  isActive: { type: Boolean, default: true },
  
}, { timestamps: true });

// Indexing for high-performance location and type-based searches
ListingSchema.index({ 'location.state': 1, 'location.district': 1, listingType: 1 });
ListingSchema.index({ title: 'text', description: 'text', category: 'text' });

export const Listing = mongoose.models.Listing || mongoose.model('Listing', ListingSchema);