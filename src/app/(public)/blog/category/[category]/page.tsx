import dbConnect from '@/lib/db/mongoose';
import { Blog } from '@/lib/db/models/Blog';
import { BlogCard } from '@/components/BlogCard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import Link from 'next/link';
import type { Metadata } from 'next';

const VALID_CATEGORIES = ['AIQ', 'State Counselling', 'Private Colleges', 'Cutoffs', 'Guides', 'News'];

interface Props {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const decoded = decodeURIComponent(category);
  return {
    title: `${decoded} — NEET Counselling Articles | NEET Counselling Info`,
    description: `Browse all ${decoded} articles. Expert insights on ${decoded.toLowerCase()} for NEET UG 2026 aspirants.`,
  };
}

export async function generateStaticParams() {
  return VALID_CATEGORIES.map((c) => ({ category: encodeURIComponent(c) }));
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { category } = await params;
  const sp = await searchParams;
  const decoded = decodeURIComponent(category);
  const page = parseInt(sp.page || '1');
  const limit = 12;

  let serialized: any[] = [];
  let total = 0;
  let totalPages = 0;

  try {
    await dbConnect();

    const filter = { status: 'published' as const, category: decoded };
    const skip = (page - 1) * limit;

    const [blogs, count] = await Promise.all([
      Blog.find(filter)
        .select('title slug excerpt category tags featuredImage author publishedAt viewCount isFeatured')
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Blog.countDocuments(filter),
    ]);

    total = count;
    totalPages = Math.ceil(total / limit);
    serialized = JSON.parse(JSON.stringify(blogs));
  } catch {
    // DB not available
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumbs items={[
            { label: 'Home', href: '/' },
            { label: 'Blog', href: '/blog' },
            { label: decoded },
          ]} />
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4">{decoded}</h1>
          <p className="text-gray-500 mt-2">{total} article{total !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {serialized.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {serialized.map((blog: any) => (
              <BlogCard key={blog._id} {...blog} publishedAt={blog.publishedAt} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No articles in this category yet.</p>
            <Link href="/blog" className="text-blue-600 hover:underline mt-2 inline-block">Browse all articles</Link>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            {page > 1 && (
              <Link href={`/blog/category/${category}?page=${page - 1}`} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">← Previous</Link>
            )}
            {page < totalPages && (
              <Link href={`/blog/category/${category}?page=${page + 1}`} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">Next →</Link>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
