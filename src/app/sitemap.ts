import type { MetadataRoute } from 'next';
import dbConnect from '@/lib/db/mongoose';
import { Blog } from '@/lib/db/models/Blog';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://neetcounselling.info';

const CATEGORIES = ['AIQ', 'State Counselling', 'Private Colleges', 'Cutoffs', 'Guides', 'News'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticUrls: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'daily' as const, priority: 1.0 },
    { url: `${SITE_URL}/blog`, changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${SITE_URL}/free-neet-counselling`, changeFrequency: 'monthly' as const, priority: 0.9 },
    { url: `${SITE_URL}/book-consultation`, changeFrequency: 'monthly' as const, priority: 0.8 },
  ];

  // Category pages
  const categoryUrls: MetadataRoute.Sitemap = CATEGORIES.map((cat) => ({
    url: `${SITE_URL}/blog/category/${encodeURIComponent(cat)}`,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  try {
    await dbConnect();
    const blogs = await Blog.find({ status: 'published' }, { slug: 1, updatedAt: 1 }).lean();

    const blogUrls: MetadataRoute.Sitemap = blogs.map((blog) => ({
      url: `${SITE_URL}/blog/${blog.slug}`,
      lastModified: blog.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    return [...staticUrls, ...categoryUrls, ...blogUrls];
  } catch {
    return [...staticUrls, ...categoryUrls];
  }
}
