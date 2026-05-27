import { notFound } from 'next/navigation';
import dbConnect from '@/lib/db/mongoose';
import { Blog } from '@/lib/db/models/Blog';
import type { Metadata } from 'next';
import { MarkdownRenderer } from './MarkdownRenderer';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Blog Preview — Pending Approval' };

interface Props {
  params: Promise<{ token: string }>;
}

export default async function BlogPreviewPage({ params }: Props) {
  const { token } = await params;

  await dbConnect();
  const blog = await Blog.findOne({ approvalToken: token }).lean();

  if (!blog) notFound();

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://neetcounselling.info').replace(/\/$/, '');
  const approveUrl = `${siteUrl}/api/blog/approve?token=${token}`;
  const rejectUrl  = `${siteUrl}/api/blog/reject?token=${token}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Approval bar */}
      <div className="sticky top-0 z-50 bg-amber-50 border-b-2 border-amber-300 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-200 text-amber-800 text-xs font-semibold rounded-full mb-1">
              ⏳ Pending Approval
            </span>
            <p className="text-sm text-amber-900 font-medium">
              Review this AI-generated blog below, then approve or reject.
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <a
              href={approveUrl}
              className="px-5 py-2.5 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            >
              ✅ Approve &amp; Publish
            </a>
            <a
              href={rejectUrl}
              className="px-5 py-2.5 bg-white text-red-600 border border-red-300 text-sm font-semibold rounded-lg hover:bg-red-50 transition-colors"
            >
              ✕ Reject
            </a>
          </div>
        </div>
      </div>

      {/* Blog content */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Meta info */}
        <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200 text-sm text-gray-600 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Category</p>
            <p className="font-medium text-gray-800">{blog.category}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Keywords</p>
            <p className="font-medium text-gray-800 truncate">{blog.keywords?.slice(0, 3).join(', ')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Tags</p>
            <p className="font-medium text-gray-800 truncate">{blog.tags?.slice(0, 3).join(', ')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Slug</p>
            <p className="font-medium text-gray-800 truncate">/{blog.slug}</p>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Meta Description</p>
          <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
            {blog.metaDescription}
          </p>
        </div>

        {/* Article */}
        <article className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-8 sm:px-10 sm:py-12">
          <MarkdownRenderer content={blog.content ?? ''} />

          {/* FAQs */}
          {blog.faqs && blog.faqs.length > 0 && (
            <div className="mt-10 pt-8 border-t border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {blog.faqs.map((faq: any, i: number) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-4">
                    <p className="font-semibold text-gray-800 mb-1">{faq.question}</p>
                    <p className="text-gray-600 text-sm">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* Bottom action bar */}
        <div className="mt-8 flex gap-4 justify-center">
          <a
            href={approveUrl}
            className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-md text-lg"
          >
            ✅ Approve &amp; Publish
          </a>
          <a
            href={rejectUrl}
            className="px-8 py-3 bg-white text-red-600 border-2 border-red-300 font-semibold rounded-xl hover:bg-red-50 transition-colors text-lg"
          >
            ✕ Reject
          </a>
        </div>
      </div>
    </div>
  );
}
