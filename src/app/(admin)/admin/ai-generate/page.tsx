'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AIGeneratePage() {
  const [keyword, setKeyword] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    if (!keyword.trim()) return;
    setGenerating(true);
    setResult(null);

    try {
      const res = await fetch('/api/blog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword }),
      });
      const data = await res.json();

      if (data.success && data.data) {
        setResult(data.data);
      } else if (data.raw) {
        setResult({ title: keyword, content: data.content, slug: keyword.toLowerCase().replace(/\s+/g, '-') });
      } else {
        alert(data.error || 'Generation failed');
      }
    } catch {
      alert('Failed to generate. Check your API key.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...result, status: 'draft' }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/admin/blogs/${data.data._id}/edit`);
      } else {
        alert(data.error || 'Failed to save');
      }
    } catch {
      alert('Error saving draft');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishDirectly = async () => {
    if (!result) return;
    setPublishing(true);
    try {
      const res = await fetch('/api/admin/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...result, status: 'published' }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Blog published successfully!');
        router.push(`/admin/blogs`);
      } else {
        alert(data.error || 'Failed to publish');
      }
    } catch {
      alert('Error publishing blog');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-2">🤖 AI Blog Generator</h1>
      <p className="text-gray-400 mb-8">Enter a keyword to generate a full SEO-optimized blog post with AI.</p>

      {/* Input */}
      <div className="flex gap-3 mb-8">
        <input
          type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="e.g. NEET cutoff 2026 for OBC category"
          className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
        />
        <button onClick={handleGenerate} disabled={generating || !keyword.trim()}
          className="px-6 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 whitespace-nowrap">
          {generating ? '⏳ Generating...' : '✨ Generate'}
        </button>
      </div>

      {/* Loading */}
      {generating && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-300 font-medium">AI is writing your blog post...</p>
          <p className="text-gray-500 text-sm mt-2">This may take 15-30 seconds</p>
        </div>
      )}

      {/* Result */}
      {result && !generating && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-green-400 font-medium">✅ Blog generated successfully!</p>
            <div className="flex gap-3">
              <button onClick={handlePublishDirectly} disabled={saving || publishing}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
                {publishing ? 'Publishing...' : '🚀 Publish Directly'}
              </button>
              <button onClick={handleSaveDraft} disabled={saving || publishing}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : '💾 Save as Draft & Edit'}
              </button>
              <button onClick={() => { setResult(null); setKeyword(''); }}
                className="px-4 py-2 bg-gray-800 text-gray-300 text-sm rounded-lg hover:bg-gray-700">
                Start Over
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
              <h2 className="text-xl font-bold text-white">{result.title}</h2>
              <p className="text-gray-400 text-sm">{result.slug && `/${result.slug}`}</p>
              <div className="bg-gray-800 rounded-lg p-4 max-h-[500px] overflow-y-auto">
                <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono">{result.content}</pre>
              </div>
            </div>

            <div className="space-y-4">
              {/* Meta */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-3">
                <h3 className="text-sm font-bold text-white">SEO Meta</h3>
                <div><span className="text-xs text-gray-500">Meta Title:</span><p className="text-gray-300 text-sm">{result.metaTitle}</p></div>
                <div><span className="text-xs text-gray-500">Meta Description:</span><p className="text-gray-300 text-sm">{result.metaDescription}</p></div>
                <div><span className="text-xs text-gray-500">Category:</span><p className="text-gray-300 text-sm">{result.category}</p></div>
                <div><span className="text-xs text-gray-500">Keywords:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {result.keywords?.map((k: string) => (
                      <span key={k} className="text-xs px-2 py-0.5 bg-gray-800 text-gray-400 rounded-full">{k}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* FAQs */}
              {result.faqs?.length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-sm font-bold text-white mb-3">FAQs ({result.faqs.length})</h3>
                  <div className="space-y-2">
                    {result.faqs.map((faq: any, i: number) => (
                      <div key={i} className="bg-gray-800/50 rounded-lg p-3">
                        <p className="text-xs text-white font-medium">{faq.question}</p>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
