

// // import mongoose, { model, Schema } from 'mongoose';

// // // --- USER MODEL ---
// // const UserSchema = new Schema({
// //   name: { type: String, required: true },
// //   phone: { type: String, required: true, unique: true },
// //   password: { type: String, required: true },
// //   role: { type: String, enum: ['farmer', 'admin'], default: 'farmer' },
// //   state: { type: String },
// //   preferredLanguage: { type: String, default: 'hi' }
// // }, { timestamps: true });


// // const CropSchema = new Schema(
// //   {
// //     name: { type: String, required: true, unique: true },
// //     image: String,

// //     season: String,
// //     durationDays: Number,

// //     soilTypes: [String],
// //     waterRequirement: String,

// //     fertilizers: [
// //       {
// //         stage: String,
// //         recommendation: String,
// //       },
// //     ],

// //     diseases: [
// //       {
// //         name: String,
// //         symptoms: String,
// //         treatment: String,
// //       },
// //     ],

// //     expectedYield: Number,
// //     avgCostPerAcre: Number,

// //     suitableStates: [String],
// //   },
// //   { timestamps: true }
// // );



// // // --- MANDI PRICE MODEL ---
// // const MandiPriceSchema = new Schema({
// //   cropId: { type: Schema.Types.ObjectId, ref: 'Crop' },
// //   state: { type: String, required: true },
// //   market: { type: String, required: true },
// //   minPrice: { type: Number },
// //   maxPrice: { type: Number },
// //   modalPrice: { type: Number },
// //   date: { type: Date, default: Date.now }
// // });

// // // --- POST (COMMUNITY) MODEL ---
// // const PostSchema = new Schema({
// //   author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
// //   title: { type: String, required: true },
// //   content: { type: String, required: true },
// //   state: { type: String, required: true }, // Added so users can tag the region of the issue
// //   upvotes: { type: Number, default: 0 },
// //   comments: { type: Number, default: 0 },  // Added for the UI counter
// //   isResolved: { type: Boolean, default: false }, // Added for the UI checkmark
// //   tags: [{ type: String }]
// // }, { timestamps: true });

// // // --- COMMENT MODEL ---
// // const CommentSchema = new Schema({
// //   post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
// //   author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
// //   text: { type: String, required: true },
// // }, { timestamps: true });

// // // Add this below your existing schemas

// // const SchemeSchema = new mongoose.Schema({
// //   name: { type: String, required: true },
// //   category: { type: String, required: true }, // e.g., 'Financial Support', 'Insurance', 'Credit & Loans'
// //   state: { type: String, required: true },    // e.g., 'Central', 'Uttar Pradesh', 'Maharashtra'
// //   benefits: { type: String, required: true },
// //   eligibility: [{ type: String }],            // Array of strings
// //   deadline: { type: String, default: 'Ongoing' },
// //   link: { type: String }                      // URL for the "Apply Now" button
// // }, { timestamps: true });

// // export const Scheme = mongoose.models.Scheme || mongoose.model('Scheme', SchemeSchema);
// // export const Comment = mongoose.models.Comment || mongoose.model('Comment', CommentSchema);
// // export const User = mongoose.models.User || mongoose.model('User', UserSchema);
// // export const Crop = mongoose.models.Crop || mongoose.model('Crop', CropSchema);
// // export const MandiPrice = mongoose.models.MandiPrice || mongoose.model('MandiPrice', MandiPriceSchema);
// // export const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);
// // // export default models.Crop || model("Crop", CropSchema);


// import mongoose, { Schema } from 'mongoose';

// // 1. USER MODEL
// const UserSchema = new Schema({
//   name: { type: String, required: true },
//   phone: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   role: { type: String, enum: ['farmer', 'admin'], default: 'farmer' },
//   state: { type: String },
//   preferredLanguage: { type: String, default: 'hi' }
// }, { timestamps: true });

// // 2. CROP MODEL
// const CropSchema = new Schema({
//   name: { type: String, required: true, unique: true },
//   image: String,
//   season: String,
//   durationDays: Number,
//   soilTypes: [String],
//   waterRequirement: String,
//   fertilizers: [{ stage: String, recommendation: String }],
//   diseases: [{ name: String, symptoms: String, treatment: String }],
//   expectedYield: Number,
//   avgCostPerAcre: Number,
//   suitableStates: [String],
// }, { timestamps: true });

// // 3. MANDI PRICE MODEL
// const MandiPriceSchema = new Schema({
//   cropId: { type: Schema.Types.ObjectId, ref: 'Crop' },
//   state: { type: String, required: true },
//   market: { type: String, required: true },
//   minPrice: { type: Number },
//   maxPrice: { type: Number },
//   modalPrice: { type: Number },
//   date: { type: Date, default: Date.now }
// });

// // 4. POST (COMMUNITY) MODEL
// const PostSchema = new Schema({
//   author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
//   title: { type: String, required: true },
//   content: { type: String, required: true },
//   state: { type: String, required: true },
//   upvotes: { type: Number, default: 0 },
//   comments: { type: Number, default: 0 },  
//   isResolved: { type: Boolean, default: false }, 
//   tags: [{ type: String }]
// }, { timestamps: true });

// // 5. COMMENT MODEL
// const CommentSchema = new Schema({
//   post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
//   author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
//   text: { type: String, required: true },
// }, { timestamps: true });

// // 6. SCHEME MODEL
// const SchemeSchema = new Schema({
//   name: { type: String, required: true },
//   category: { type: String, required: true }, 
//   state: { type: String, required: true },    
//   benefits: { type: String, required: true },
//   eligibility: [{ type: String }],            
//   deadline: { type: String, default: 'Ongoing' },
//   link: { type: String }                      
// }, { timestamps: true });

// // 7. LISTING (EQUIPMENT/SERVICE) MODEL
// const ListingSchema = new Schema({
//   providerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
//   listingType: { type: String, enum: ['rent', 'service'], required: true },
//   title: { type: String, required: true, trim: true },
//   description: { type: String, required: true },
//   category: { type: String, required: true }, 
//   pricing: {
//     rate: { type: Number, required: true },
//     unit: { type: String, required: true } 
//   },
//   equipment: {
//     name: { type: String, required: true }, 
//     condition: { type: String, enum: ['Excellent', 'Good', 'Fair'], default: 'Good' },
//   },
//   serviceDetails: {
//     operatorIncluded: { type: Boolean, default: false }, 
//     jobType: { type: String }, 
//     estimatedCapacity: { type: String } 
//   },
//   location: {
//     state: { type: String, required: true },
//     district: { type: String, required: true },
//     village: { type: String },
//   },
//   images: [{ type: String }], 
//   isActive: { type: Boolean, default: true },
// }, { timestamps: true });
// // Add this to your models.ts file
// const SubscriberSchema = new mongoose.Schema({
//   phone: { type: String, required: true, unique: true },
//   district: { type: String }, // To send them localized data
//   state: { type: String },
//   isActive: { type: Boolean, default: true }
// }, { timestamps: true });


// export interface IPoolMember {
//   farmerName: string;
//   phone: string;
//   quantity: number;
//   joinedAt: Date;
// }

// export interface ISellingPool extends Document {
//   creatorName: string;
//   commodity: string;
//   mandi: string;
//   targetQuantity: number;
//   currentQuantity: number;
//   priceExpectation: number;
//   closingDate: Date;
//   status: 'Open' | 'Closed' | 'Sold';
//   members: IPoolMember[];
//   createdAt: Date;
// }

// const SellingPoolSchema: Schema = new Schema({
//   creatorName: { type: String, required: true },
//   commodity: { type: String, required: true },
//   mandi: { type: String, required: true },
//   targetQuantity: { type: Number, required: true },
//   currentQuantity: { type: Number, required: true },
//   priceExpectation: { type: Number, required: true }, 
//   closingDate: { type: Date, required: true },
//   status: { type: String, enum: ['Open', 'Closed', 'Sold'], default: 'Open' },
//   members: [
//     {
//       farmerName: { type: String, required: true },
//       phone: { type: String, required: true },
//       quantity: { type: Number, required: true },
//       joinedAt: { type: Date, default: Date.now },
//     }
//   ],
//   createdAt: { type: Date, default: Date.now }
// });

// export default mongoose.models.SellingPool || mongoose.model<ISellingPool>('SellingPool', SellingPoolSchema);



// ListingSchema.index({ 'location.state': 1, 'location.district': 1, listingType: 1 });
// ListingSchema.index({ title: 'text', description: 'text', category: 'text' });


// // ==========================================
// // EXPORT ALL MODELS SAFELY
// // ==========================================
// export const User = mongoose.models.User || mongoose.model('User', UserSchema);
// export const Crop = mongoose.models.Crop || mongoose.model('Crop', CropSchema);
// export const MandiPrice = mongoose.models.MandiPrice || mongoose.model('MandiPrice', MandiPriceSchema);
// export const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);
// export const Comment = mongoose.models.Comment || mongoose.model('Comment', CommentSchema);
// export const Scheme = mongoose.models.Scheme || mongoose.model('Scheme', SchemeSchema);
// export const Listing = mongoose.models.Listing || mongoose.model('Listing', ListingSchema);
// export const Subscriber = mongoose.models.Subscriber || mongoose.model('Subscriber', SubscriberSchema);



import mongoose, { Schema, Document } from 'mongoose';

// ==========================================
// 1. USER MODEL
// ==========================================
const UserSchema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['farmer', 'admin'], default: 'farmer' },
  state: { type: String },
  preferredLanguage: { type: String, default: 'hi' }
}, { timestamps: true });

// ==========================================
// 2. CROP MODEL
// ==========================================
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

// ==========================================
// 3. MANDI PRICE MODEL
// ==========================================
const MandiPriceSchema = new Schema({
  cropId: { type: Schema.Types.ObjectId, ref: 'Crop' },
  state: { type: String, required: true },
  market: { type: String, required: true },
  minPrice: { type: Number },
  maxPrice: { type: Number },
  modalPrice: { type: Number },
  date: { type: Date, default: Date.now }
});

// ==========================================
// 4. POST (COMMUNITY) MODEL
// ==========================================
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

// ==========================================
// 5. COMMENT MODEL
// ==========================================
const CommentSchema = new Schema({
  post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
}, { timestamps: true });

// ==========================================
// 6. SCHEME MODEL
// ==========================================
const SchemeSchema = new Schema({
  name: { type: String, required: true },
  category: { type: String, required: true }, 
  state: { type: String, required: true },    
  benefits: { type: String, required: true },
  eligibility: [{ type: String }],            
  deadline: { type: String, default: 'Ongoing' },
  link: { type: String }                      
}, { timestamps: true });

// ==========================================
// 7. LISTING (EQUIPMENT/SERVICE) MODEL
// ==========================================
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

// Indexes for faster search
ListingSchema.index({ 'location.state': 1, 'location.district': 1, listingType: 1 });
ListingSchema.index({ title: 'text', description: 'text', category: 'text' });

// ==========================================
// 8. SUBSCRIBER MODEL
// ==========================================
const SubscriberSchema = new Schema({
  phone: { type: String, required: true, unique: true },
  district: { type: String }, 
  state: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// ==========================================
// 9. SELLING POOL MODEL
// ==========================================
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

// ==========================================
// EXPORT ALL MODELS SAFELY
// ==========================================
// We use named exports for all models to keep imports clean and consistent across the app.
export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const Crop = mongoose.models.Crop || mongoose.model('Crop', CropSchema);
export const MandiPrice = mongoose.models.MandiPrice || mongoose.model('MandiPrice', MandiPriceSchema);
export const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);
export const Comment = mongoose.models.Comment || mongoose.model('Comment', CommentSchema);
export const Scheme = mongoose.models.Scheme || mongoose.model('Scheme', SchemeSchema);
export const Listing = mongoose.models.Listing || mongoose.model('Listing', ListingSchema);
export const Subscriber = mongoose.models.Subscriber || mongoose.model('Subscriber', SubscriberSchema);
export const SellingPool = mongoose.models.SellingPool || mongoose.model<ISellingPool>('SellingPool', SellingPoolSchema);