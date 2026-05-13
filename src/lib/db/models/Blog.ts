import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFAQ {
  question: string;
  answer: string;
}

export interface IBlog extends Document {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  canonicalUrl?: string;
  category: string;
  tags: string[];
  featuredImage?: string;
  author: string;
  status: 'draft' | 'published' | 'archived';
  isFeatured: boolean;
  isTrending: boolean;
  faqs: IFAQ[];
  relatedPosts: mongoose.Types.ObjectId[];
  viewCount: number;
  publishedAt?: Date;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FAQSchema = new Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
}, { _id: false });

const BlogSchema: Schema = new Schema({
  title: { type: String, required: true, index: true },
  slug: { type: String, required: true, unique: true, index: true },
  content: { type: String, required: true },
  excerpt: { type: String, required: true, maxlength: 1000 },
  metaTitle: { type: String, required: true, maxlength: 200 },
  metaDescription: { type: String, required: true, maxlength: 500 },
  keywords: [{ type: String }],
  canonicalUrl: { type: String },
  category: {
    type: String,
    required: true,
    default: 'Guides',
    index: true,
  },
  tags: [{ type: String, index: true }],
  featuredImage: { type: String },
  author: { type: String, default: 'NEET Counselling Team' },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    index: true,
  },
  isFeatured: { type: Boolean, default: false, index: true },
  isTrending: { type: Boolean, default: false, index: true },
  faqs: [FAQSchema],
  relatedPosts: [{ type: Schema.Types.ObjectId, ref: 'Blog' }],
  viewCount: { type: Number, default: 0 },
  publishedAt: { type: Date, index: true },
  ogTitle: { type: String },
  ogDescription: { type: String },
  ogImage: { type: String },
}, { timestamps: true });

// Compound indexes for common queries
BlogSchema.index({ status: 1, publishedAt: -1 });
BlogSchema.index({ status: 1, category: 1, publishedAt: -1 });
BlogSchema.index({ title: 'text', content: 'text', tags: 'text' });

export const Blog: Model<IBlog> = mongoose.models.Blog || mongoose.model<IBlog>('Blog', BlogSchema);
