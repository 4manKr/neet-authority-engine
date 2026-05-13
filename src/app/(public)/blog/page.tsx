import Link from 'next/link';
import dbConnect from '@/lib/db/mongoose';
import { Blog } from '@/lib/db/models/Blog';
import { BlogCard } from '@/components/BlogCard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SearchBar } from '@/components/SearchBar';
import { CategoryBadge } from '@/components/CategoryBadge';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NEET Counselling Blog — Latest Updates, Cutoffs & Guides | NEET Counselling Info',
  description: 'Read expert articles on NEET UG counselling, cutoff analysis, state-wise guides, and medical college admission strategies for 2026.',
};

const CATEGORIES = ['AIQ', 'State Counselling', 'Private Colleges', 'Cutoffs', 'Guides', 'News'];

interface BlogPageProps {
  searchParams: Promise<{ page?: string; category?: string; tag?: string }>;
}

export default async function BlogListingPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const category = params.category;
  const tag = params.tag;
  const limit = 12;

  let serialized: any[] = [];
  let total = 0;
  let totalPages = 0;

  try {
    await dbConnect();

    const filter: any = { status: 'published' };
    if (category) filter.category = category;
    if (tag) filter.tags = tag;

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
    // DB not available — render empty state
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumbs items={[
            { label: 'Home', href: '/' },
            { label: 'Blog' },
          ]} />
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4 mb-2">
            {category ? `${category} Articles` : 'NEET Counselling Blog'}
          </h1>
          <p className="text-gray-500 mb-6">
            {total} article{total !== 1 ? 's' : ''} {category ? `in ${category}` : ''} — Expert insights for NEET aspirants
          </p>
          <SearchBar className="max-w-lg" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {serialized.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {serialized.map((blog: any) => (
                  <BlogCard key={blog._id} {...blog} publishedAt={blog.publishedAt} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-gray-400 text-lg">No articles found{category ? ` in ${category}` : ''}.</p>
                <Link href="/blog" className="text-blue-600 hover:underline mt-2 inline-block">Browse all articles</Link>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                {page > 1 && (
                  <Link href={`/blog?page=${page - 1}${category ? `&category=${category}` : ''}`} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                    ← Previous
                  </Link>
                )}
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = page <= 3 ? i + 1 : page - 2 + i;
                  if (p > totalPages || p < 1) return null;
                  return (
                    <Link key={p} href={`/blog?page=${p}${category ? `&category=${category}` : ''}`}
                      className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 hover:bg-gray-50'}`}>
                      {p}
                    </Link>
                  );
                })}
                {page < totalPages && (
                  <Link href={`/blog?page=${page + 1}${category ? `&category=${category}` : ''}`} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                    Next →
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Categories */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Categories</h3>
              <div className="space-y-2">
                {CATEGORIES.map((cat) => (
                  <Link key={cat} href={`/blog?category=${encodeURIComponent(cat)}`}
                    className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${category === cat ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                    {cat}
                  </Link>
                ))}
                {category && (
                  <Link href="/blog" className="block px-3 py-2 text-sm text-blue-600 hover:underline">
                    Clear filter ×
                  </Link>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
              <h3 className="font-bold mb-3">Need Expert Help?</h3>
              <p className="text-blue-100 text-sm mb-4">Our counsellors can guide you through the admission process.</p>
              <Link href="/free-neet-counselling" className="block text-center px-4 py-2.5 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-colors text-sm">
                Get Free Counselling →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
