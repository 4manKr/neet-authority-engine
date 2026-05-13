'use client';

import React, { useState } from 'react';

const CATEGORIES = ['AIQ', 'State Counselling', 'Private Colleges', 'Cutoffs', 'Guides', 'News'];

interface BlogEditorFormProps {
  initialData?: any;
  onSave: (data: any) => void;
  saving: boolean;
}

export function BlogEditorForm({ initialData, onSave, saving }: BlogEditorFormProps) {
  const [form, setForm] = useState({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    content: initialData?.content || '',
    excerpt: initialData?.excerpt || '',
    metaTitle: initialData?.metaTitle || '',
    metaDescription: initialData?.metaDescription || '',
    keywords: initialData?.keywords?.join(', ') || '',
    canonicalUrl: initialData?.canonicalUrl || '',
    category: initialData?.category || 'Guides',
    tags: initialData?.tags?.join(', ') || '',
    featuredImage: initialData?.featuredImage || '',
    author: initialData?.author || 'NEET Counselling Team',
    status: initialData?.status || 'draft',
    isFeatured: initialData?.isFeatured || false,
    isTrending: initialData?.isTrending || false,
    ogTitle: initialData?.ogTitle || '',
    ogDescription: initialData?.ogDescription || '',
    ogImage: initialData?.ogImage || '',
    faqs: initialData?.faqs || [],
  });

  const [showPreview, setShowPreview] = useState(false);

  const generateSlug = () => {
    const slug = form.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 80);
    setForm({ ...form, slug });
  };

  const addFaq = () => {
    setForm({ ...form, faqs: [...form.faqs, { question: '', answer: '' }] });
  };

  const updateFaq = (index: number, field: 'question' | 'answer', value: string) => {
    const faqs = [...form.faqs];
    faqs[index] = { ...faqs[index], [field]: value };
    setForm({ ...form, faqs });
  };

  const removeFaq = (index: number) => {
    setForm({ ...form, faqs: form.faqs.filter((_: any, i: number) => i !== index) });
  };

  const handleSubmit = () => {
    const data = {
      ...form,
      keywords: form.keywords.split(',').map((k: string) => k.trim()).filter(Boolean),
      tags: form.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
    };
    onSave(data);
  };

  const inputClass = 'w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelClass = 'block text-sm font-medium text-gray-300 mb-1.5';

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Main Editor */}
      <div className="xl:col-span-2 space-y-6">
        {/* Title */}
        <div>
          <label className={labelClass}>Title *</label>
          <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Enter blog title..."
            className={inputClass} required />
        </div>

        {/* Slug */}
        <div>
          <label className={labelClass}>
            Slug
            <button type="button" onClick={generateSlug} className="ml-2 text-blue-400 text-xs hover:underline">Auto-generate</button>
          </label>
          <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="url-friendly-slug"
            className={inputClass} />
        </div>

        {/* Content */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-gray-300">Content (Markdown) *</label>
            <button type="button" onClick={() => setShowPreview(!showPreview)} className="text-xs text-blue-400 hover:underline">
              {showPreview ? 'Edit' : 'Preview'}
            </button>
          </div>
          {showPreview ? (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 min-h-[400px] prose prose-invert prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: form.content.replace(/\n/g, '<br>') }} />
          ) : (
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Write your blog in markdown..."
              className={`${inputClass} min-h-[400px] font-mono text-xs leading-relaxed`} required />
          )}
        </div>

        {/* Excerpt */}
        <div>
          <label className={labelClass}>Excerpt</label>
          <textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="Short summary (max 280 chars)..."
            className={`${inputClass} h-20`} maxLength={300} />
          <p className="text-xs text-gray-600 mt-1">{form.excerpt.length}/300</p>
        </div>

        {/* FAQs */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">FAQ Section</h3>
            <button type="button" onClick={addFaq} className="text-xs text-blue-400 hover:underline">+ Add FAQ</button>
          </div>
          <div className="space-y-4">
            {form.faqs.map((faq: any, i: number) => (
              <div key={i} className="bg-gray-800/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">FAQ #{i + 1}</span>
                  <button type="button" onClick={() => removeFaq(i)} className="text-xs text-red-400 hover:underline">Remove</button>
                </div>
                <input type="text" value={faq.question} onChange={(e) => updateFaq(i, 'question', e.target.value)} placeholder="Question..."
                  className={inputClass} />
                <textarea value={faq.answer} onChange={(e) => updateFaq(i, 'answer', e.target.value)} placeholder="Answer..."
                  className={`${inputClass} h-20`} />
              </div>
            ))}
            {form.faqs.length === 0 && <p className="text-sm text-gray-600 text-center py-2">No FAQs added yet</p>}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Publish */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">Publish</h3>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
            className={inputClass}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>

          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
              className="rounded border-gray-600 bg-gray-800" />
            Featured
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input type="checkbox" checked={form.isTrending} onChange={(e) => setForm({ ...form, isTrending: e.target.checked })}
              className="rounded border-gray-600 bg-gray-800" />
            Trending
          </label>

          <button type="button" onClick={handleSubmit} disabled={saving}
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : form.status === 'published' ? 'Publish' : 'Save Draft'}
          </button>
        </div>

        {/* Category & Tags */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">Taxonomy</h3>
          <div>
            <label className={labelClass}>Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={inputClass}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Tags (comma-separated)</label>
            <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="neet, cutoff, 2026"
              className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Author</label>
            <input type="text" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })}
              className={inputClass} />
          </div>
        </div>

        {/* SEO */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">SEO</h3>
          <div>
            <label className={labelClass}>Meta Title</label>
            <input type="text" value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} placeholder="SEO title (max 70 chars)"
              className={inputClass} maxLength={70} />
            <p className="text-xs text-gray-600 mt-1">{form.metaTitle.length}/70</p>
          </div>
          <div>
            <label className={labelClass}>Meta Description</label>
            <textarea value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} placeholder="SEO description (max 160 chars)"
              className={`${inputClass} h-20`} maxLength={160} />
            <p className="text-xs text-gray-600 mt-1">{form.metaDescription.length}/160</p>
          </div>
          <div>
            <label className={labelClass}>Keywords</label>
            <input type="text" value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} placeholder="keyword1, keyword2"
              className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Canonical URL</label>
            <input type="text" value={form.canonicalUrl} onChange={(e) => setForm({ ...form, canonicalUrl: e.target.value })}
              className={inputClass} />
          </div>
        </div>

        {/* Open Graph */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">Open Graph</h3>
          <div>
            <label className={labelClass}>OG Title</label>
            <input type="text" value={form.ogTitle} onChange={(e) => setForm({ ...form, ogTitle: e.target.value })}
              className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>OG Description</label>
            <textarea value={form.ogDescription} onChange={(e) => setForm({ ...form, ogDescription: e.target.value })}
              className={`${inputClass} h-16`} />
          </div>
          <div>
            <label className={labelClass}>Featured Image URL</label>
            <input type="text" value={form.featuredImage} onChange={(e) => setForm({ ...form, featuredImage: e.target.value })}
              className={inputClass} />
          </div>
        </div>
      </div>
    </div>
  );
}
