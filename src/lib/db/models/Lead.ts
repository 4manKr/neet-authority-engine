import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILead extends Document {
  name: string;
  email: string;
  phone: string;
  neetRank?: number;
  neetScore?: number;
  category?: string;
  source: string;
  state?: string;
  budget?: string;
  reportViewed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  neetRank: { type: Number },
  neetScore: { type: Number },
  category: { type: String },
  source: { type: String, enum: ['rank-predictor', 'free-counselling', 'book-consultation', 'blog-pdf', 'newsletter'], default: 'rank-predictor', index: true },
  state: { type: String },
  budget: { type: String },
  reportViewed: { type: Boolean, default: false }
}, { timestamps: true });

export const Lead: Model<ILead> = mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);
