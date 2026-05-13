import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INewsletter extends Document {
  email: string;
  name?: string;
  isActive: boolean;
  subscribedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NewsletterSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true, index: true },
  name: { type: String },
  isActive: { type: Boolean, default: true },
  subscribedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export const Newsletter: Model<INewsletter> = mongoose.models.Newsletter || mongoose.model<INewsletter>('Newsletter', NewsletterSchema);
