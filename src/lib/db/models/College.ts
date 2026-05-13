import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICollege extends Document {
  name: string;
  slug: string;
  description?: string;
  location: {
    state: string;
    city: string;
  };
  ownership: 'Govt' | 'Private' | 'Deemed' | 'Central';
  fees?: {
    tuition?: number;
    hostel?: number;
  };
  facilities?: string[];
  contact?: {
    website?: string;
    phone?: string;
    email?: string;
  };
  isDataComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CollegeSchema: Schema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  description: { type: String },
  location: {
    state: { type: String, required: true },
    city: { type: String, required: true },
  },
  ownership: { type: String, enum: ['Govt', 'Private', 'Deemed', 'Central'], required: true },
  fees: {
    tuition: { type: Number },
    hostel: { type: Number }
  },
  facilities: [{ type: String }],
  contact: {
    website: String,
    phone: String,
    email: String
  },
  isDataComplete: { type: Boolean, default: false }
}, { timestamps: true });

export const College: Model<ICollege> = mongoose.models.College || mongoose.model<ICollege>('College', CollegeSchema);
