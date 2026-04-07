import mongoose, { Schema, Document } from 'mongoose';

/* ───── Sub-document types ───── */

export interface IPhMoistureEntry {
  ph: number;
  moisture: number;
  source: 'manual' | 'field-test';
  testedAt: Date;
  testerName?: string;
}

export interface IScheduledTest {
  status: 'none' | 'requested' | 'assigned' | 'in-progress' | 'completed' | 'cancelled';
  requestedAt?: Date;
  preferredDate?: Date;
  assignedTo?: { name: string; phone: string };
  assignedAt?: Date;
  completedAt?: Date;
  notes?: string;
}

export interface ISoilHealthCard {
  cardNumber?: string;
  imageUrl?: string;
  issuedAt?: Date;
  validUntil?: Date;
  values?: {
    n?: number;
    p?: number;
    k?: number;
    ec?: number;
    organicCarbon?: number;
    ph?: number;
    moisture?: number;
  };
  extractedVia?: 'manual' | 'ocr';
  updatedAt?: Date;
}

export interface ISoilIssue {
  parameter: string;
  severity: 'critical' | 'warning' | 'info';
  description: string;
  fix: string;
}

export interface ICropRecommendation {
  cropName: string;
  confidence: number;
  reason: string;
  season?: string;
}

export interface ISoilReport {
  score?: number;
  rating?: string;
  summary?: string;
  generatedAt?: Date;
  insights?: string[];
  cropRecommendations?: ICropRecommendation[];
  issues?: ISoilIssue[];
  fertilizerSchedule?: Array<{
    stage: string;
    instructions: string;
  }>;
}

export type FarmlandStatus =
  | 'draft'
  | 'ph-pending'
  | 'test-scheduled'
  | 'card-pending'
  | 'ready'
  | 'completed'
  | 'retest-due';

export interface IFarmland extends Document {
  userId: mongoose.Types.ObjectId;
  landName: string;
  areaAcres?: number;
  soilType?: string;
  location: {
    state: string;
    district: string;
    village?: string;
    coordinates?: { lat: number; lng: number };
  };
  landRecord?: {
    surveyNumber?: string;
    khasraNumber?: string;
    khataNumber?: string;
    khewatNumber?: string;
    pattaNumber?: string;
    tehsil?: string;
  };
  phMoisture?: {
    ph?: number;
    moisture?: number;
    source?: 'manual' | 'field-test';
    testedAt?: Date;
    nextRetestAt?: Date;
    testerName?: string;
    testerPhone?: string;
  };
  phMoistureHistory: IPhMoistureEntry[];
  scheduledTest: IScheduledTest;
  soilHealthCard?: ISoilHealthCard;
  report?: ISoilReport;
  status: FarmlandStatus;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

/* ───── Schema ───── */

const PhMoistureHistorySchema = new Schema(
  {
    ph: { type: Number },
    moisture: { type: Number },
    source: { type: String, enum: ['manual', 'field-test'] },
    testedAt: { type: Date },
    testerName: { type: String },
  },
  { _id: false }
);

const FarmlandSchema = new Schema<IFarmland>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    /* ── Land Identity ── */
    landName: { type: String, required: true },
    areaAcres: { type: Number },
    soilType: {
      type: String,
      enum: ['Alluvial', 'Black', 'Red', 'Laterite', 'Sandy', 'Clay', 'Loamy'],
    },
    location: {
      state: { type: String, required: true },
      district: { type: String, required: true },
      village: { type: String },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    landRecord: {
      surveyNumber: { type: String },
      khasraNumber: { type: String },
      khataNumber: { type: String },
      khewatNumber: { type: String },
      pattaNumber: { type: String },
      tehsil: { type: String },
    },

    /* ── pH & Moisture (latest) ── */
    phMoisture: {
      ph: { type: Number },
      moisture: { type: Number },
      source: { type: String, enum: ['manual', 'field-test'] },
      testedAt: { type: Date },
      nextRetestAt: { type: Date },
      testerName: { type: String },
      testerPhone: { type: String },
    },

    /* ── pH & Moisture History ── */
    phMoistureHistory: [PhMoistureHistorySchema],

    /* ── Scheduled Field Test ── */
    scheduledTest: {
      status: {
        type: String,
        enum: ['none', 'requested', 'assigned', 'in-progress', 'completed', 'cancelled'],
        default: 'none',
      },
      requestedAt: { type: Date },
      preferredDate: { type: Date },
      assignedTo: {
        name: { type: String },
        phone: { type: String },
      },
      assignedAt: { type: Date },
      completedAt: { type: Date },
      notes: { type: String },
    },

    /* ── Soil Health Card ── */
    soilHealthCard: {
      cardNumber: { type: String },
      imageUrl: { type: String },
      issuedAt: { type: Date },
      validUntil: { type: Date },
      values: {
        n: { type: Number },
        p: { type: Number },
        k: { type: Number },
        ec: { type: Number },
        organicCarbon: { type: Number },
        ph: { type: Number },
        moisture: { type: Number },
      },
      extractedVia: { type: String, enum: ['manual', 'ocr'] },
      updatedAt: { type: Date },
    },

    /* ── Computed Report ── */
    report: {
      score: { type: Number },
      rating: { type: String },
      summary: { type: String },
      generatedAt: { type: Date },
      insights: [{ type: String }],
      cropRecommendations: [
        {
          cropName: { type: String },
          confidence: { type: Number },
          reason: { type: String },
          season: { type: String },
          _id: false,
        },
      ],
      issues: [
        {
          parameter: { type: String },
          severity: { type: String, enum: ['critical', 'warning', 'info'] },
          description: { type: String },
          fix: { type: String },
          _id: false,
        },
      ],
      fertilizerSchedule: [
        {
          stage: { type: String },
          instructions: { type: String },
          _id: false,
        },
      ],
    },

    /* ── Status ── */
    status: {
      type: String,
      enum: ['draft', 'ph-pending', 'test-scheduled', 'card-pending', 'ready', 'completed', 'retest-due'],
      default: 'draft',
    },
    progress: { type: Number, default: 0 },
  },
  { timestamps: true }
);

/* ── Indexes ── */
FarmlandSchema.index({ userId: 1, status: 1 });
FarmlandSchema.index({ 'scheduledTest.status': 1 });
FarmlandSchema.index({ 'phMoisture.nextRetestAt': 1 });

export const Farmland =
  mongoose.models.Farmland || mongoose.model<IFarmland>('Farmland', FarmlandSchema);
