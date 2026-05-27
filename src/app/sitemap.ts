import type { MetadataRoute } from 'next';
import dbConnect from '@/lib/db/mongoose';
import { Blog } from '@/lib/db/models/Blog';

// Always regenerate from DB — never serve a stale cached sitemap to Google
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://neetcounselling.info').replace(/\/$/, '');

// Valid slug: lowercase letters, digits, hyphens only — no spaces or special chars
const VALID_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Category slugs used in the URL — must match the [category] route segment
const CATEGORIES: { label: string; slug: string }[] = [
  { label: 'AIQ',              slug: 'AIQ' },
  { label: 'State Counselling',slug: 'State%20Counselling' },
  { label: 'Private Colleges', slug: 'Private%20Colleges' },
  { label: 'Cutoffs',          slug: 'Cutoffs' },
  { label: 'Guides',           slug: 'Guides' },
  { label: 'News',             slug: 'News' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticUrls: MetadataRoute.Sitemap = [
    { url: SITE_URL,                                   changeFrequency: 'daily'   as const, priority: 1.0 },
    { url: `${SITE_URL}/blog`,                         changeFrequency: 'daily'   as const, priority: 0.9 },
    { url: `${SITE_URL}/free-neet-counselling`,        changeFrequency: 'monthly' as const, priority: 0.9 },
    { url: `${SITE_URL}/book-consultation`,            changeFrequency: 'monthly' as const, priority: 0.8 },
  ];

  // Category pages
  const categoryUrls: MetadataRoute.Sitemap = CATEGORIES.map(({ slug }) => ({
    url: `${SITE_URL}/blog/category/${slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  try {
    await dbConnect();
    const blogs = await Blog.find({ status: 'published' }, { slug: 1, updatedAt: 1 }).lean();

    const blogUrls: MetadataRoute.Sitemap = blogs
      // Only include blogs with valid URL-safe slugs
      .filter((blog) => blog.slug && VALID_SLUG.test(blog.slug))
      .map((blog) => ({
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
