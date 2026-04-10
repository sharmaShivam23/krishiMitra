import mongoose, { Schema, Document } from 'mongoose';

const UserSchema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['farmer', 'provider', 'admin'], default: 'farmer' }, // <-- UPDATED
  state: { type: String },
  district: { type: String },
  preferredLanguage: { type: String, default: 'hi' },
  lastLocale: { type: String },
  lastActiveModule: { type: String },
  lastActiveRoute: { type: String },
  lastContextSummary: { type: String },
  lastIntent: { type: String },
  lastQuestion: { type: String },
  lastSeenAt: { type: Date },
  soilProfile: {
    source: { type: String, enum: ['report', 'kit', 'lab'] },
    landName: { type: String },
    areaAcres: { type: Number },
    landRecord: {
      surveyNumber: { type: String },
      khasraNumber: { type: String },
      khataNumber: { type: String },
      khewatNumber: { type: String },
      pattaNumber: { type: String },
      tehsil: { type: String }
    },
    ph: { type: Number },
    moisture: { type: Number },
    n: { type: Number },
    p: { type: Number },
    k: { type: Number },
    ec: { type: Number },
    organicCarbon: { type: Number },
    soilType: { type: String },
    updatedAt: { type: Date },
    status: { type: String },
    stage: { type: Number },
    progress: { type: Number },
    lastTestedAt: { type: Date },
    retestRequestedAt: { type: Date },
    location: {
      state: { type: String },
      district: { type: String },
      village: { type: String }
    }
  },
  soilKitOrder: {
    status: {
      type: String,
      enum: ['ordered', 'packed', 'shipped', 'out-for-delivery', 'delivered'],
      default: 'ordered'
    },
    trackingId: { type: String },
    trackingUrl: { type: String },
    trackingSteps: [{ type: String }],
    orderedAt: { type: Date },
    eta: { type: String },
    item: {
      title: { type: String },
      description: { type: String }
    },
    payment: {
      mode: { type: String },
      status: { type: String },
      label: { type: String }
    },
    price: {
      amount: { type: Number },
      currency: { type: String },
      label: { type: String }
    },
    address: {
      name: { type: String },
      phone: { type: String },
      line1: { type: String },
      line2: { type: String },
      village: { type: String },
      district: { type: String },
      state: { type: String },
      pincode: { type: String }
    }
  },
  soilKitReport: {
    imageUrl: { type: String },
    values: {
      ph: { type: Number },
      moisture: { type: Number },
      n: { type: Number },
      p: { type: Number },
      k: { type: Number },
      ec: { type: Number },
      organicCarbon: { type: Number }
    },
    updatedAt: { type: Date }
  },
  soilGovtReport: {
    imageUrl: { type: String },
    values: {
      ph: { type: Number },
      moisture: { type: Number },
      n: { type: Number },
      p: { type: Number },
      k: { type: Number },
      ec: { type: Number },
      organicCarbon: { type: Number }
    },
    updatedAt: { type: Date }
  },
  shopName: { type: String },
  licenseNumber: { type: String },
  gstNumber: { type: String },
  licenseImage: { type: String },
  isVerifiedProvider: { type: Boolean, default: false },
  providerStatus: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' }
}, { timestamps: true });

const CropSchema = new Schema({
  name: { type: String, required: true, unique: true },
  image: String,
  season: String,
  durationDays: Number,
  soilTypes: [String],
  waterRequirement: String,
  fertilizers: [{ stage: String, recommendation: String }],
  diseases: [{ name: String, symptoms: String, treatment: String }],
  expectedYield: Number,
  avgCostPerAcre: Number,
  suitableStates: [String],
}, { timestamps: true });

const MandiPriceSchema = new Schema({
  cropId: { type: Schema.Types.ObjectId, ref: 'Crop' },
  state: { type: String, required: true },
  market: { type: String, required: true },
  minPrice: { type: Number },
  maxPrice: { type: Number },
  modalPrice: { type: Number },
  date: { type: Date, default: Date.now }
});

const PostSchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  state: { type: String, required: true },
  district: { type: String },
  upvotes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },  
  isResolved: { type: Boolean, default: false }, 
  tags: [{ type: String }]
}, { timestamps: true });

const CommentSchema = new Schema({
  post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
}, { timestamps: true });

const SchemeSchema = new Schema({
  name: { type: String, required: true },
  category: { type: String, required: true }, 
  state: { type: String, required: true },    
  benefits: { type: String, required: true },
  eligibility: [{ type: String }],            
  deadline: { type: String, default: 'Ongoing' },
  link: { type: String }                      
}, { timestamps: true });

const ListingSchema = new Schema({
  providerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  listingType: { type: String, enum: ['rent', 'service'], required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, required: true }, 
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

const SubscriberSchema = new Schema({
  phone: { type: String, required: true, unique: true },
  district: { type: String }, 
  state: { type: String },
  language: { type: String },
  detail: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// --- 🚜 NEW: TRANSPORT INTERFACE & SCHEMA ---
export interface ISharedTransport {
  arrangerName: string;
  arrangerPhone: string;
  vehicle: string;
  departureTime: string;
  costPerFarmer: number;
  capacity: number;
  joinedFarmers: string[];
}

const TransportSchema = new Schema({
  arrangerName: { type: String, required: true },
  arrangerPhone: { type: String, required: true },
  vehicle: { type: String, required: true },
  departureTime: { type: String, required: true },
  costPerFarmer: { type: Number, required: true },
  capacity: { type: Number, required: true },
  joinedFarmers: [{ type: String }] // Array of phone numbers
});

// --- 🌾 UPDATED: POOL INTERFACES ---
export interface IPoolMember {
  farmerName: string;
  phone: string;
  quantity: number;
  district: string; // <-- NEW
  state: string;    // <-- NEW
  joinedAt: Date;
}

export interface ISellingPool extends Document {
  creatorName: string;
  creatorPhone: string; // <-- NEW
  district: string;     // <-- NEW
  state: string;        // <-- NEW
  commodity: string;
  mandi: string;
  targetQuantity: number;
  currentQuantity: number;
  priceExpectation: number;
  closingDate: Date;
  status: 'Open' | 'Closed' | 'Sold';
  members: IPoolMember[];
  transports: ISharedTransport[]; // <-- NEW
  createdAt: Date;
}

// --- 🌾 UPDATED: POOL SCHEMA ---
const SellingPoolSchema = new Schema({
  creatorName: { type: String, required: true },
  creatorPhone: { type: String, required: true }, // <-- NEW
  district: { type: String, required: true },     // <-- NEW
  state: { type: String, required: true },        // <-- NEW
  commodity: { type: String, required: true },
  mandi: { type: String, required: true },
  targetQuantity: { type: Number, required: true },
  currentQuantity: { type: Number, required: true },
  priceExpectation: { type: Number, required: true }, 
  closingDate: { type: Date, required: true },
  status: { type: String, enum: ['Open', 'Closed', 'Sold'], default: 'Open' },
  members: [
    {
      farmerName: { type: String, required: true },
      phone: { type: String, required: true },
      quantity: { type: Number, required: true },
      district: { type: String }, // <-- NEW
      state: { type: String },    // <-- NEW
      joinedAt: { type: Date, default: Date.now },
    }
  ],
  transports: [TransportSchema], // <-- NEW
  createdAt: { type: Date, default: Date.now }
});

// const ScanSchema = new Schema({
//   userId: { type: Schema.Types.ObjectId, ref: 'User' },
//   disease: { type: String, required: true },
//   confidence: { type: Number },
//   language: { type: String },
//   hasAudio: { type: Boolean, default: false }
// }, { timestamps: true });

// Replace your old ScanSchema with this updated one:
const ScanSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  disease: { type: String, required: true },
  confidence: { type: Number },
  language: { type: String },
  hasAudio: { type: Boolean, default: false },
  district: { type: String },
  severity: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM' }
}, { timestamps: true });

const otpSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 } 
});

const rateLimitSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  count: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now, expires: 900 } // 900 seconds = 15 mins
});

const SoilKitCatalogSchema = new Schema({
  isActive: { type: Boolean, default: true },
  item: {
    title: { type: String, required: true },
    description: { type: String }
  },
  payment: {
    mode: { type: String, required: true },
    status: { type: String },
    label: { type: String }
  },
  price: {
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    label: { type: String }
  },
  trackingUrl: { type: String },
  trackingSteps: [{ type: String }]
}, { timestamps: true });


// --- 📅 NEW: SMART CROP LIFECYCLE SCHEMA ---

const TaskSchema = new Schema({
  dayOffset: { type: Number, required: true }, 
  scheduledDate: { type: Date, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date }
});

const ActiveCropSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  cropName: { type: String, required: true },
  location: {
    state: String,
    district: String
  },
  startDate: { type: Date, required: true },
  status: { type: String, enum: ['Active', 'Harvested', 'Failed'], default: 'Active' },
  outOfSeasonWarning: { type: String }, // <-- NEW
  tasks: [TaskSchema] // Array of AI-generated tasks
}, { timestamps: true });

export const ActiveCrop = mongoose.models.ActiveCrop || mongoose.model('ActiveCrop', ActiveCropSchema);
export const Otp = mongoose.models.Otp || mongoose.model('Otp', otpSchema);
export const RateLimit = mongoose.models.RateLimit || mongoose.model('RateLimit', rateLimitSchema);
export const SoilKitCatalog = mongoose.models.SoilKitCatalog || mongoose.model('SoilKitCatalog', SoilKitCatalogSchema);
export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const Crop = mongoose.models.Crop || mongoose.model('Crop', CropSchema);
export const MandiPrice = mongoose.models.MandiPrice || mongoose.model('MandiPrice', MandiPriceSchema);
export const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);
export const Comment = mongoose.models.Comment || mongoose.model('Comment', CommentSchema);
export const Scheme = mongoose.models.Scheme || mongoose.model('Scheme', SchemeSchema);
export const Listing = mongoose.models.Listing || mongoose.model('Listing', ListingSchema);
export const Subscriber = mongoose.models.Subscriber || mongoose.model('Subscriber', SubscriberSchema);
export const SellingPool = mongoose.models.SellingPool || mongoose.model<ISellingPool>('SellingPool', SellingPoolSchema);
export const Scan = mongoose.models.Scan || mongoose.model('Scan', ScanSchema);


const PesticideProductSchema = new Schema({
  providerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  image: { type: String }, 
  price: { type: Number, required: true },
  cropSuitability: [{ type: String }],
  diseaseTreats: [{ type: String }],
  usageInstructions: { type: String },
  benefits: { type: String },
  safetyWarnings: { type: String },
  location: {
    state: { type: String, required: true },
    district: { type: String, required: true },
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });


const ProductReviewSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'PesticideProduct', required: true },
  farmerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  effectiveness: { type: String },
  feedback: { type: String },
}, { timestamps: true });

export const PesticideProduct = mongoose.models.PesticideProduct || mongoose.model('PesticideProduct', PesticideProductSchema);
export const ProductReview = mongoose.models.ProductReview || mongoose.model('ProductReview', ProductReviewSchema);

// ─── 🚜 RENTAL ORDER SYSTEM ───

const RentalTimelineEntrySchema = new Schema({
  event: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  actor: { type: String }, // 'renter' | 'owner' | 'admin' | 'system'
  actorId: { type: Schema.Types.ObjectId, ref: 'User' },
  note: { type: String }
}, { _id: false });

const InspectionSchema = new Schema({
  photos: [{ type: String }], // Cloudinary URLs
  condition: { type: String, enum: ['Excellent', 'Good', 'Fair', 'Damaged'], default: 'Good' },
  notes: { type: String },
  inspectedAt: { type: Date },
  inspectedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { _id: false });

const RentalOrderSchema = new Schema({
  // Parties
  listingId: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
  renterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

  // Status lifecycle
  status: {
    type: String,
    enum: [
      'requested',        // Renter submitted a booking request
      'approved',         // Owner approved the request
      'rejected',         // Owner rejected the request
      'agreement_pending',// Waiting for both parties to sign
      'deposit_pending',  // Agreement signed, awaiting deposit
      'active',           // Equipment handed over, rental in progress
      'return_pending',   // Renter initiated return
      'inspecting',       // Post-return inspection in progress
      'completed',        // Rental finished, deposit settled
      'disputed',         // Damage dispute raised
      'cancelled'         // Cancelled by either party
    ],
    default: 'requested'
  },

  // Rental period
  rentalPeriod: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalDays: { type: Number, required: true }
  },

  // Pricing
  pricing: {
    dailyRate: { type: Number, required: true },
    rateUnit: { type: String, default: 'per day' },
    totalAmount: { type: Number, required: true },
    securityDeposit: { type: Number, required: true },
    protectionFee: { type: Number, default: 0 },
    protectionTier: { type: String, enum: ['none', 'basic', 'standard', 'premium'], default: 'none' }
  },

  // Digital Agreement
  agreement: {
    acceptedByRenter: { type: Boolean, default: false },
    acceptedByOwner: { type: Boolean, default: false },
    renterAcceptedAt: { type: Date },
    ownerAcceptedAt: { type: Date },
    terms: [{ type: String }] // Snapshot of T&C at time of booking
  },

  // Pre-inspection (before handover)
  preInspection: InspectionSchema,

  // Post-inspection (after return)
  postInspection: InspectionSchema,

  // Damage report
  damageReport: {
    hasDamage: { type: Boolean, default: false },
    description: { type: String },
    claimAmount: { type: Number, default: 0 },
    photos: [{ type: String }],
    coveredByProtection: { type: Number, default: 0 }, // Amount covered by plan
    renterLiability: { type: Number, default: 0 },     // Amount renter must pay
    status: { type: String, enum: ['none', 'filed', 'accepted', 'disputed', 'resolved'], default: 'none' },
    resolution: { type: String }, // Admin or agreement resolution notes
    resolvedAt: { type: Date },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },

  // Payment tracking (offline — Cash / UPI / Bank)
  payment: {
    method: { type: String, enum: ['cash', 'upi', 'bank_transfer', 'other'], default: 'cash' },
    depositStatus: { type: String, enum: ['pending', 'collected', 'refunded', 'partially_deducted', 'forfeited'], default: 'pending' },
    rentalPaidStatus: { type: String, enum: ['pending', 'paid', 'partial'], default: 'pending' },
    damageDeducted: { type: Number, default: 0 }
  },

  // Cancellation
  cancellation: {
    cancelledBy: { type: String, enum: ['renter', 'owner', 'admin'] },
    reason: { type: String },
    cancelledAt: { type: Date }
  },

  // Renter message (optional note when booking)
  renterMessage: { type: String },

  // Audit trail
  timeline: [RentalTimelineEntrySchema]
}, { timestamps: true });

RentalOrderSchema.index({ renterId: 1, status: 1 });
RentalOrderSchema.index({ ownerId: 1, status: 1 });
RentalOrderSchema.index({ listingId: 1 });
RentalOrderSchema.index({ status: 1, createdAt: -1 });

// ─── RENTAL POLICY (Platform Configuration) ───

const RentalPolicySchema = new Schema({
  isActive: { type: Boolean, default: true },

  protectionTiers: {
    none: { feePercent: { type: Number, default: 0 }, coveragePercent: { type: Number, default: 0 }, label: { type: String, default: 'No Protection' } },
    basic: { feePercent: { type: Number, default: 0 }, coveragePercent: { type: Number, default: 0 }, label: { type: String, default: 'Basic' } },
    standard: { feePercent: { type: Number, default: 5 }, coveragePercent: { type: Number, default: 50 }, label: { type: String, default: 'Standard' } },
    premium: { feePercent: { type: Number, default: 12 }, coveragePercent: { type: Number, default: 90 }, label: { type: String, default: 'Premium' } }
  },

  defaultDepositPercent: { type: Number, default: 25 },
  maxRentalDays: { type: Number, default: 30 },
  cancellationWindowHours: { type: Number, default: 24 },

  termsAndConditions: [{ type: String }]
}, { timestamps: true });

export const RentalOrder = mongoose.models.RentalOrder || mongoose.model('RentalOrder', RentalOrderSchema);
export const RentalPolicy = mongoose.models.RentalPolicy || mongoose.model('RentalPolicy', RentalPolicySchema);

// Re-export Farmland
export { Farmland } from './FarmlandModel';
export type { IFarmland, FarmlandStatus } from './FarmlandModel';