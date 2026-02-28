

import mongoose, { model, Schema } from 'mongoose';

// --- USER MODEL ---
const UserSchema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['farmer', 'admin'], default: 'farmer' },
  state: { type: String },
  preferredLanguage: { type: String, default: 'hi' }
}, { timestamps: true });


const CropSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    image: String,

    season: String,
    durationDays: Number,

    soilTypes: [String],
    waterRequirement: String,

    fertilizers: [
      {
        stage: String,
        recommendation: String,
      },
    ],

    diseases: [
      {
        name: String,
        symptoms: String,
        treatment: String,
      },
    ],

    expectedYield: Number,
    avgCostPerAcre: Number,

    suitableStates: [String],
  },
  { timestamps: true }
);



// --- MANDI PRICE MODEL ---
const MandiPriceSchema = new Schema({
  cropId: { type: Schema.Types.ObjectId, ref: 'Crop' },
  state: { type: String, required: true },
  market: { type: String, required: true },
  minPrice: { type: Number },
  maxPrice: { type: Number },
  modalPrice: { type: Number },
  date: { type: Date, default: Date.now }
});

// --- POST (COMMUNITY) MODEL ---
const PostSchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  state: { type: String, required: true }, // Added so users can tag the region of the issue
  upvotes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },  // Added for the UI counter
  isResolved: { type: Boolean, default: false }, // Added for the UI checkmark
  tags: [{ type: String }]
}, { timestamps: true });

// --- COMMENT MODEL ---
const CommentSchema = new Schema({
  post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
}, { timestamps: true });

// Add this below your existing schemas

const SchemeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true }, // e.g., 'Financial Support', 'Insurance', 'Credit & Loans'
  state: { type: String, required: true },    // e.g., 'Central', 'Uttar Pradesh', 'Maharashtra'
  benefits: { type: String, required: true },
  eligibility: [{ type: String }],            // Array of strings
  deadline: { type: String, default: 'Ongoing' },
  link: { type: String }                      // URL for the "Apply Now" button
}, { timestamps: true });

export const Scheme = mongoose.models.Scheme || mongoose.model('Scheme', SchemeSchema);
export const Comment = mongoose.models.Comment || mongoose.model('Comment', CommentSchema);
export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const Crop = mongoose.models.Crop || mongoose.model('Crop', CropSchema);
export const MandiPrice = mongoose.models.MandiPrice || mongoose.model('MandiPrice', MandiPriceSchema);
export const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);
// export default models.Crop || model("Crop", CropSchema);