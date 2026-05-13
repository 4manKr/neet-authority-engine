import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICutoff extends Document {
  collegeId: mongoose.Types.ObjectId;
  year: number;
  category: string;
  quota: string;
  round: number;
  closingRank: number;
  score?: number;
  createdAt: Date;
  updatedAt: Date;
}

const CutoffSchema: Schema = new Schema({
  collegeId: { type: Schema.Types.ObjectId, ref: 'College', required: true, index: true },
  year: { type: Number, required: true, index: true }, // e.g., 2023, 2024, 2025
  category: { type: String, required: true, index: true }, // UR, OBC, SC, ST, etc.
  quota: { type: String, required: true }, // AIQ, State, Management
  round: { type: Number, required: true },
  closingRank: { type: Number, required: true },
  score: { type: Number }
}, { timestamps: true });

export const Cutoff: Model<ICutoff> = mongoose.models.Cutoff || mongoose.model<ICutoff>('Cutoff', CutoffSchema);
