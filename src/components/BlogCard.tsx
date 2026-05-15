import Link from 'next/link';
import { CategoryBadge } from './CategoryBadge';

interface BlogCardProps {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  featuredImage?: string;
  author: string;
  publishedAt: string;
  viewCount?: number;
  tags?: string[];
  isFeatured?: boolean;
  compact?: boolean;
}

export function BlogCard({
  title,
  slug,
  excerpt,
  category,
  featuredImage,
  author,
  publishedAt,
  viewCount,
  isFeatured,
  compact = false,
}: BlogCardProps) {
  const date = new Date(publishedAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Estimate read time from excerpt length (rough heuristic)
  const readTime = Math.max(3, Math.ceil((excerpt?.length || 100) / 40));

  if (compact) {
    return (
      <Link href={`/blog/${slug}`} className="group block">
        <div className="flex gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
              {title}
            </h3>
            <div className="flex items-center gap-2 mt-1.5">
              <CategoryBadge category={category} size="sm" />
              <span className="text-xs text-gray-400">{date}</span>
            </div>
          </div>
          {featuredImage && (
            <img
              src={featuredImage}
              alt={title}
              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
            />
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/blog/${slug}`} className="group block">
      <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300">
        {/* Image */}
        <div className="relative h-48 bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 overflow-hidden">
          {featuredImage ? (
            <img
              src={featuredImage}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
              <svg className="w-12 h-12 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
          )}
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {isFeatured && (
            <div className="absolute top-3 left-3">
              <span className="px-2.5 py-1 bg-amber-500 text-white text-xs font-bold rounded-full shadow-md">
                ⭐ Featured
              </span>
            </div>
          )}
          <div className="absolute top-3 right-3">
            <CategoryBadge category={category} />
          </div>
          {/* Read time pill on hover */}
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="px-2.5 py-1 bg-black/60 text-white text-xs rounded-full backdrop-blur-sm">
              {readTime} min read
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2 leading-snug">
            {title}
          </h3>
          <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed">
            {excerpt}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold">
                {author.charAt(0).toUpperCase()}
              </div>
              <span className="text-gray-500 font-medium text-[11px]">{date}</span>
            </div>
            {typeof viewCount === 'number' && (
              <span className="flex items-center gap-1 text-gray-400">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {viewCount.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Bottom accent line on hover */}
        <div className="h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
      </article>
    </Link>
  );
}
