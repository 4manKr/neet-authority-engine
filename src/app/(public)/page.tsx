import Link from 'next/link';
import dbConnect from '@/lib/db/mongoose';
import { Blog } from '@/lib/db/models/Blog';
import { BlogCard } from '@/components/BlogCard';
import { SearchBar } from '@/components/SearchBar';
import { NewsletterForm } from '@/components/NewsletterForm';
import { RankPredictorWidget } from '@/components/RankPredictorWidget';
import type { Metadata } from 'next';

export const revalidate = 300; // Revalidate homepage every 5 minutes

export const metadata: Metadata = {
  title: 'NEET Counselling Info — Cutoffs, College Predictions & Expert Guidance 2026',
  description: 'India\'s #1 NEET UG counselling guide. Get latest cutoff analysis, college predictions, state-wise counselling updates, and expert admission guidance for 2026.',
  openGraph: {
    title: 'NEET Counselling Info — Your Complete Medical Admission Guide',
    description: 'India\'s #1 NEET UG counselling guide. Cutoff analysis, college predictions, and expert guidance.',
    type: 'website',
  },
};

const categories = [
  { name: 'AIQ', icon: '🏛️', desc: 'All India Quota counselling', color: 'from-violet-500 to-purple-600' },
  { name: 'State Counselling', icon: '📍', desc: 'State-wise counselling guides', color: 'from-emerald-500 to-teal-600' },
  { name: 'Private Colleges', icon: '🏥', desc: 'Private medical colleges info', color: 'from-amber-500 to-orange-600' },
  { name: 'Cutoffs', icon: '📊', desc: 'Previous year cutoff data', color: 'from-rose-500 to-pink-600' },
  { name: 'Guides', icon: '📖', desc: 'Step-by-step admission guides', color: 'from-blue-500 to-indigo-600' },
  { name: 'News', icon: '📰', desc: 'Latest NEET updates', color: 'from-orange-500 to-red-600' },
];

async function getHomeData() {
  try {
    await dbConnect();

    const [featured, latest, trending] = await Promise.all([
      Blog.find({ status: 'published', isFeatured: true })
        .select('title slug excerpt category featuredImage author publishedAt viewCount isFeatured tags')
        .sort({ publishedAt: -1 }).limit(3).lean(),
      Blog.find({ status: 'published' })
        .select('title slug excerpt category featuredImage author publishedAt viewCount tags')
        .sort({ publishedAt: -1 }).limit(6).lean(),
      Blog.find({ status: 'published', isTrending: true })
        .select('title slug excerpt category featuredImage publishedAt viewCount tags')
        .sort({ viewCount: -1 }).limit(5).lean(),
    ]);

    return {
      featured: JSON.parse(JSON.stringify(featured)),
      latest: JSON.parse(JSON.stringify(latest)),
      trending: JSON.parse(JSON.stringify(trending)),
    };
  } catch {
    return { featured: [], latest: [], trending: [] };
  }
}

export default async function HomePage() {
  const { featured, latest, trending } = await getHomeData();

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-blue-400 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-400 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              NEET UG 2026 Counselling Updates Live
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
              Your Complete Guide to
              <span className="block bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent">
                NEET Medical Admissions
              </span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-8">
              Expert cutoff analysis, college predictions, and state-wise counselling guidance. Helping 24+ lakh aspirants secure their dream medical seats.
            </p>
            <SearchBar className="max-w-xl mx-auto mb-8" />
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/free-neet-counselling" className="px-8 py-3.5 bg-white text-blue-900 font-bold rounded-xl hover:bg-blue-50 transition-all shadow-lg shadow-white/20 text-lg">
                Get Free Counselling
              </Link>
              <Link href="/blog" className="px-8 py-3.5 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20 text-lg">
                Browse All Articles →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map((cat) => (
            <Link key={cat.name} href={`/blog/category/${encodeURIComponent(cat.name)}`} className="group">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-center">
                <span className="text-2xl mb-2 block">{cat.icon}</span>
                <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{cat.name}</h3>
                <p className="text-[11px] text-gray-400 mt-1 hidden sm:block">{cat.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Posts */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">⭐ Featured Articles</h2>
            <Link href="/blog?featured=true" className="text-blue-600 hover:text-blue-700 text-sm font-semibold">View All →</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((blog: any) => (
              <BlogCard key={blog._id} {...blog} publishedAt={blog.publishedAt} isFeatured />
            ))}
          </div>
        </section>
      )}

      {/* Latest + Trending Sidebar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Latest */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">📝 Latest Updates</h2>
              <Link href="/blog" className="text-blue-600 hover:text-blue-700 text-sm font-semibold">View All →</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {latest.map((blog: any) => (
                <BlogCard key={blog._id} {...blog} publishedAt={blog.publishedAt} />
              ))}
            </div>
          </div>

          {/* Trending Sidebar */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">🔥 Trending</h2>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
              {trending.length > 0 ? trending.map((blog: any, i: number) => (
                <div key={blog._id} className="flex items-start gap-3 p-4">
                  <span className="text-2xl font-black text-blue-100">{String(i + 1).padStart(2, '0')}</span>
                  <div className="min-w-0">
                    <Link href={`/blog/${blog.slug}`} className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 block">
                      {blog.title}
                    </Link>
                    <span className="text-xs text-gray-400 mt-1 block">{blog.viewCount?.toLocaleString() || 0} views</span>
                  </div>
                </div>
              )) : (
                <div className="p-6 text-center text-sm text-gray-400">No trending posts yet</div>
              )}
            </div>

            {/* Newsletter */}
            <div className="mt-6">
              <NewsletterForm variant="card" />
            </div>
          </div>
        </div>
      </section>

      {/* Rank Predictor Section */}
      <section className="bg-gradient-to-br from-slate-50 to-blue-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">🎯 NEET College Predictor</h2>
            <p className="text-gray-500 max-w-lg mx-auto">Enter your NEET rank and category to discover which medical colleges you can get admission to.</p>
          </div>
          <RankPredictorWidget />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Confused About NEET Counselling?</h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Our expert counsellors have helped thousands of students get into their dream medical colleges. Get personalized guidance today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/free-neet-counselling" className="px-8 py-4 bg-white text-blue-800 font-bold rounded-xl hover:bg-blue-50 transition-all shadow-lg text-lg">
              📞 Book Free Consultation
            </Link>
            <a href="https://wa.me/919876543210?text=Hi%2C%20I%20need%20NEET%20counselling%20help" target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-all shadow-lg text-lg flex items-center gap-2">
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
