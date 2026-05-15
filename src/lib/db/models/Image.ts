import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IImage extends Document {
  data: Buffer;
  contentType: string;
  folder: string;
  createdAt: Date;
}

const ImageSchema = new Schema(
  {
    data: { type: Buffer, required: true },
    contentType: { type: String, default: 'image/png' },
    folder: { type: String, default: '' },
  },
  { timestamps: true },
);

export const Image: Model<IImage> =
  mongoose.models.Image || mongoose.model<IImage>('Image', ImageSchema);
