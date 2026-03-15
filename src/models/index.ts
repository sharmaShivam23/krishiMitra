import mongoose, { Schema, Document } from 'mongoose';

const UserSchema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['farmer', 'admin'], default: 'farmer' },
  state: { type: String },
  preferredLanguage: { type: String, default: 'hi' }
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
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export interface IPoolMember {
  farmerName: string;
  phone: string;
  quantity: number;
  joinedAt: Date;
}

export interface ISellingPool extends Document {
  creatorName: string;
  commodity: string;
  mandi: string;
  targetQuantity: number;
  currentQuantity: number;
  priceExpectation: number;
  closingDate: Date;
  status: 'Open' | 'Closed' | 'Sold';
  members: IPoolMember[];
  createdAt: Date;
}

const SellingPoolSchema = new Schema({
  creatorName: { type: String, required: true },
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
      joinedAt: { type: Date, default: Date.now },
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

const ScanSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  disease: { type: String, required: true },
  confidence: { type: Number },
  language: { type: String },
  hasAudio: { type: Boolean, default: false }
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

export const Otp = mongoose.models.Otp || mongoose.model('Otp', otpSchema);
export const RateLimit = mongoose.models.RateLimit || mongoose.model('RateLimit', rateLimitSchema);
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