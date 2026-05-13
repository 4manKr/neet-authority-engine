import dbConnect from '@/lib/db/mongoose';
import { Blog } from '@/lib/db/models/Blog';
import { notFound } from 'next/navigation';
import { parseMarkdown, extractTOC, addHeadingIds, calculateReadTime } from '@/lib/markdown';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { TableOfContents } from '@/components/TableOfContents';
import { ShareButtons } from '@/components/ShareButtons';
import { BlogCard } from '@/components/BlogCard';
import { CategoryBadge } from '@/components/CategoryBadge';
import { NewsletterForm } from '@/components/NewsletterForm';
import Link from 'next/link';
import type { Metadata } from 'next';

export const revalidate = 3600;

interface BlogPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { slug } = await params;
  await dbConnect();
  const blog = await Blog.findOne({ slug, status: 'published' }).lean();
  if (!blog) return { title: 'Blog Not Found' };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://neetcounselling.info';

  return {
    title: blog.metaTitle || blog.title,
    description: blog.metaDescription || blog.excerpt,
    keywords: blog.keywords,
    openGraph: {
      title: blog.ogTitle || blog.metaTitle || blog.title,
      description: blog.ogDescription || blog.metaDescription || blog.excerpt,
      type: 'article',
      publishedTime: blog.publishedAt?.toISOString(),
      authors: [blog.author],
      images: blog.ogImage || blog.featuredImage ? [{ url: blog.ogImage || blog.featuredImage || '' }] : [],
    },
    alternates: {
      canonical: blog.canonicalUrl || `${siteUrl}/blog/${slug}`,
    },
  };
}

export async function generateStaticParams() {
  try {
    await dbConnect();
    const blogs = await Blog.find({ status: 'published' }, { slug: 1 }).limit(200).lean();
    return blogs.map((b) => ({ slug: b.slug }));
  } catch {
    return [];
  }
}

export default async function BlogDetailPage({ params }: BlogPageProps) {
  const { slug } = await params;
  await dbConnect();

  const blog = await Blog.findOneAndUpdate(
    { slug, status: 'published' },
    { $inc: { viewCount: 1 } },
    { new: true }
  ).lean();

  if (!blog) notFound();

  // Parse content
  const toc = extractTOC(blog.content);
  const rawHtml = parseMarkdown(blog.content);
  const html = addHeadingIds(rawHtml);
  const readTime = calculateReadTime(blog.content);

  // Get related posts
  const relatedBlogs = await Blog.find({
    status: 'published',
    _id: { $ne: blog._id },
    category: blog.category,
  })
    .select('title slug excerpt category featuredImage author publishedAt viewCount tags')
    .sort({ publishedAt: -1 })
    .limit(3)
    .lean();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://neetcounselling.info';
  const blogUrl = `${siteUrl}/blog/${slug}`;

  const date = blog.publishedAt
    ? new Date(blog.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  // Article Schema
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: blog.title,
    description: blog.metaDescription || blog.excerpt,
    image: blog.featuredImage || blog.ogImage || undefined,
    datePublished: blog.publishedAt?.toISOString(),
    dateModified: blog.updatedAt?.toISOString(),
    author: { '@type': 'Person', name: blog.author },
    publisher: {
      '@type': 'Organization',
      name: 'NEET Counselling Info',
      url: siteUrl,
    },
    mainEntityOfPage: blogUrl,
  };

  // FAQ Schema
  const faqSchema = blog.faqs && blog.faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: blog.faqs.map((faq: any) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  } : null;

  const serializedRelated = JSON.parse(JSON.stringify(relatedBlogs));

  return (
    <main className="min-h-screen bg-white">
      <JsonLd data={articleSchema} />
      {faqSchema && <JsonLd data={faqSchema} />}

      {/* Header */}
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumbs items={[
            { label: 'Home', href: '/' },
            { label: 'Blog', href: '/blog' },
            { label: blog.category, href: `/blog?category=${encodeURIComponent(blog.category)}` },
            { label: blog.title },
          ]} />

          <div className="mt-6">
            <CategoryBadge category={blog.category} clickable />
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mt-3 mb-4 leading-tight">
              {blog.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span>By <strong className="text-gray-700">{blog.author}</strong></span>
              {date && <span>📅 {date}</span>}
              <span>⏱️ {readTime} min read</span>
              <span>👁️ {blog.viewCount?.toLocaleString() || 0} views</span>
            </div>

            {/* Tags */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {blog.tags.map((tag: string) => (
                  <Link key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`}
                    className="text-xs px-2.5 py-1 bg-white border border-gray-200 rounded-full text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors">
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* TOC Sidebar */}
          <aside className="hidden lg:block">
            <TableOfContents items={toc} />
            <div className="mt-8">
              <ShareButtons url={blogUrl} title={blog.title} />
            </div>
          </aside>

          {/* Article Body */}
          <article className="lg:col-span-3">
            {/* Featured Image */}
            {blog.featuredImage && (
              <img src={blog.featuredImage} alt={blog.title} className="w-full rounded-2xl mb-8 shadow-sm" />
            )}

            {/* Mobile Share */}
            <div className="lg:hidden mb-6">
              <ShareButtons url={blogUrl} title={blog.title} />
            </div>

            {/* Blog Content */}
            <div
              className="prose prose-lg prose-blue max-w-none prose-headings:scroll-mt-24 prose-h2:text-2xl prose-h2:font-bold prose-h2:border-b prose-h2:border-gray-100 prose-h2:pb-3 prose-h2:mt-10 prose-h3:text-xl prose-a:text-blue-600 prose-img:rounded-xl prose-table:border prose-th:bg-blue-50 prose-th:px-4 prose-th:py-2 prose-td:px-4 prose-td:py-2"
              dangerouslySetInnerHTML={{ __html: html }}
            />

            {/* FAQ Section */}
            {blog.faqs && blog.faqs.length > 0 && (
              <section className="mt-12 pt-8 border-t border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">❓ Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {blog.faqs.map((faq: any, i: number) => (
                    <details key={i} className="group bg-gray-50 rounded-xl border border-gray-100">
                      <summary className="cursor-pointer p-5 font-semibold text-gray-900 flex items-center justify-between list-none">
                        {faq.question}
                        <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="px-5 pb-5 text-gray-600 leading-relaxed">{faq.answer}</div>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {/* Lead CTA */}
            <div className="mt-12 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white text-center">
              <h3 className="text-2xl font-bold mb-3">Need Personalized NEET Counselling?</h3>
              <p className="text-blue-100 mb-6 max-w-lg mx-auto">Talk to our experts and get a personalized college admission strategy based on your rank.</p>
              <Link href="/free-neet-counselling" className="inline-block px-8 py-3.5 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-lg">
                Get Free Consultation →
              </Link>
            </div>

            {/* Newsletter */}
            <div className="mt-10">
              <NewsletterForm variant="card" />
            </div>

            {/* Related Posts */}
            {serializedRelated.length > 0 && (
              <section className="mt-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">📚 Related Articles</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {serializedRelated.map((blog: any) => (
                    <BlogCard key={blog._id} {...blog} publishedAt={blog.publishedAt} />
                  ))}
                </div>
              </section>
            )}
          </article>
        </div>
      </div>
    </main>
  );
}
