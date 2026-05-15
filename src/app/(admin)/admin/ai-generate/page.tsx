'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type Step = 'input' | 'research' | 'generate';

interface ResearchBrief {
  recentFindings: string[];
  suggestedTitle: string;
  suggestedAngle: string;
  keyTopics: string[];
  questions: Array<{ id: string; question: string; placeholder: string }>;
  sourcesFound: Array<{ uri: string; title: string }>;
  uploadedFileCount: number;
}

interface GeneratedBlog {
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  keywords: string[];
  category: string;
  tags: string[];
  content: string;
  faqs: Array<{ question: string; answer: string }>;
  sourcesUsed: Array<{ uri: string; title: string }>;
}

interface UploadedFile {
  file: File;
  id: string;
  preview?: string; // data-url for images
}

const ACCEPTED_TYPES: Record<string, { label: string; icon: string }> = {
  'application/pdf': { label: 'PDF', icon: '📄' },
  'image/jpeg': { label: 'JPEG', icon: '🖼️' },
  'image/jpg': { label: 'JPEG', icon: '🖼️' },
  'image/png': { label: 'PNG', icon: '🖼️' },
  'image/gif': { label: 'GIF', icon: '🖼️' },
  'image/webp': { label: 'WebP', icon: '🖼️' },
  'text/plain': { label: 'TXT', icon: '📝' },
  'text/csv': { label: 'CSV', icon: '📊' },
};

const ACCEPT_STRING = Object.keys(ACCEPTED_TYPES).join(',');
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB
const MAX_FILES = 5;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AIGeneratePage() {
  const router = useRouter();

  // Step 1 — input
  const [keyword, setKeyword] = useState('');
  const [urls, setUrls] = useState<string[]>(['']);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2 — research
  const [step, setStep] = useState<Step>('input');
  const [researching, setResearching] = useState(false);
  const [brief, setBrief] = useState<ResearchBrief | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Step 3 — generate
  const [generating, setGenerating] = useState(false);
  const [blog, setBlog] = useState<GeneratedBlog | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── URL list helpers ──────────────────────────────────────────────────────
  const addUrl = () => setUrls((u) => [...u, '']);
  const removeUrl = (i: number) => setUrls((u) => u.filter((_, idx) => idx !== i));
  const updateUrl = (i: number, val: string) =>
    setUrls((u) => u.map((v, idx) => (idx === i ? val : v)));
  const validUrls = urls.filter((u) => u.trim());

  // ── File upload helpers ───────────────────────────────────────────────────
  const addFiles = useCallback((incoming: FileList | File[]) => {
    const arr = Array.from(incoming);
    setUploadedFiles((prev) => {
      const remaining = MAX_FILES - prev.length;
      if (remaining <= 0) return prev;
      const toAdd: UploadedFile[] = [];
      for (const file of arr.slice(0, remaining)) {
        if (!ACCEPTED_TYPES[file.type]) continue;
        if (file.size > MAX_FILE_SIZE) continue;
        // Avoid duplicates by name+size
        if (prev.some((f) => f.file.name === file.name && f.file.size === file.size)) continue;
        const id = `${file.name}-${file.size}-${Date.now()}`;
        const entry: UploadedFile = { file, id };
        // Generate preview for images
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setUploadedFiles((p) =>
              p.map((u) => (u.id === id ? { ...u, preview: e.target?.result as string } : u)),
            );
          };
          reader.readAsDataURL(file);
        }
        toAdd.push(entry);
      }
      return [...prev, ...toAdd];
    });
  }, []);

  const removeFile = (id: string) =>
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  // ── Step 1 → 2: Research ─────────────────────────────────────────────────
  const handleResearch = async () => {
    if (!keyword.trim()) return;
    setResearching(true);
    setError(null);
    setBrief(null);

    try {
      const fd = new FormData();
      fd.append('keyword', keyword.trim());
      fd.append('urls', JSON.stringify(validUrls));
      fd.append('mode', 'research');
      uploadedFiles.forEach((u) => fd.append('files', u.file));

      const res = await fetch('/api/blog/generate', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        setBrief(data.data);
        setAnswers({});
        setStep('research');
      } else {
        setError(data.error || 'Research failed. Please try again.');
      }
    } catch (err: any) {
      setError('Network error: ' + err.message);
    } finally {
      setResearching(false);
    }
  };

  // ── Step 2 → 3: Generate ─────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!brief) return;
    setGenerating(true);
    setError(null);
    setBlog(null);

    try {
      const res = await fetch('/api/blog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, urls: validUrls, mode: 'generate', brief, answers }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setBlog(data.data);
        setStep('generate');
      } else {
        setError(data.error || 'Generation failed. Please try again.');
      }
    } catch (err: any) {
      setError('Network error: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  // ── Save / Publish ────────────────────────────────────────────────────────
  const handleSave = async (status: 'draft' | 'published') => {
    if (!blog) return;
    status === 'draft' ? setSaving(true) : setPublishing(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...blog, status }),
      });
      const data = await res.json();
      if (data.success) {
        if (status === 'draft') router.push(`/admin/blogs/${data.data._id}/edit`);
        else router.push('/admin/blogs');
      } else {
        setError(data.error || 'Failed to save');
      }
    } catch {
      setError('Error saving blog');
    } finally {
      setSaving(false);
      setPublishing(false);
    }
  };

  const reset = () => {
    setStep('input');
    setBrief(null);
    setBlog(null);
    setError(null);
    setAnswers({});
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-3xl font-bold text-white mb-1">🤖 AI Blog Generator</h1>
      <p className="text-gray-400 mb-8">
        Enter a keyword, add source links or upload documents/images, let AI research and read them, answer a few questions, then generate a full blog post.
      </p>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-8 text-sm">
        {(['input', 'research', 'generate'] as Step[]).map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-medium transition-colors ${
              step === s ? 'bg-purple-600 text-white' :
              ['input', 'research', 'generate'].indexOf(step) > i ? 'bg-green-600/20 text-green-400' :
              'bg-gray-800 text-gray-500'
            }`}>
              <span>{i + 1}</span>
              <span className="capitalize">{s === 'generate' ? 'Generate' : s === 'research' ? 'Research' : 'Topic & Sources'}</span>
            </div>
            {i < 2 && <div className="w-6 h-px bg-gray-700" />}
          </React.Fragment>
        ))}
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-900/30 border border-red-700 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* ── STEP 1: Input ──────────────────────────────────────────────────── */}
      {step === 'input' && (
        <div className="space-y-6">
          {/* Keyword */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Keyword / Topic <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. NEET cutoff 2026 for OBC category"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              onKeyDown={(e) => e.key === 'Enter' && handleResearch()}
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1">
              Upload Documents / Images{' '}
              <span className="text-gray-500 font-normal">(optional — AI will read these)</span>
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Supports PDF, JPG, PNG, WebP, GIF, TXT, CSV. Max 15 MB per file, up to {MAX_FILES} files.
              AI will extract and use the content during research.
            </p>

            {/* Dropzone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                dragOver
                  ? 'border-purple-500 bg-purple-900/20'
                  : 'border-gray-700 hover:border-gray-500 bg-gray-800/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPT_STRING}
                className="hidden"
                onChange={(e) => e.target.files && addFiles(e.target.files)}
              />
              <div className="flex flex-col items-center gap-2 pointer-events-none">
                <span className="text-3xl">📎</span>
                <p className="text-gray-300 text-sm font-medium">
                  {dragOver ? 'Drop files here' : 'Click or drag & drop files here'}
                </p>
                <p className="text-xs text-gray-500">PDF, Images, TXT, CSV</p>
              </div>
            </div>

            {/* File list */}
            {uploadedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {uploadedFiles.map((uf) => {
                  const meta = ACCEPTED_TYPES[uf.file.type] || { label: 'File', icon: '📁' };
                  return (
                    <div
                      key={uf.id}
                      className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5"
                    >
                      {uf.preview ? (
                        <img src={uf.preview} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <span className="text-2xl flex-shrink-0">{meta.icon}</span>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{uf.file.name}</p>
                        <p className="text-xs text-gray-500">
                          {meta.label} · {formatBytes(uf.file.size)}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-0.5 bg-purple-900/40 text-purple-300 border border-purple-800/50 rounded-full flex-shrink-0">
                        Will be read by AI
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(uf.id); }}
                        className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg transition-colors flex-shrink-0"
                        aria-label="Remove file"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
                {uploadedFiles.length >= MAX_FILES && (
                  <p className="text-xs text-amber-500 text-center">Maximum {MAX_FILES} files reached.</p>
                )}
              </div>
            )}
          </div>

          {/* Source URLs */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1">
              Source Links <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Paste official pages, news articles, or any reference URLs. AI will read and cite them.
            </p>
            <div className="space-y-2">
              {urls.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => updateUrl(i, e.target.value)}
                    placeholder="https://mcc.nic.in/... or any news/official link"
                    className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {urls.length > 1 && (
                    <button
                      onClick={() => removeUrl(i)}
                      className="px-3 py-2 bg-gray-800 border border-gray-700 text-gray-400 hover:text-red-400 rounded-xl transition-colors text-sm"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addUrl}
              className="mt-2 text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
            >
              + Add another URL
            </button>
          </div>

          <button
            onClick={handleResearch}
            disabled={researching || !keyword.trim()}
            className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
          >
            {researching ? (
              <>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {uploadedFiles.length > 0
                  ? `Reading ${uploadedFiles.length} file(s) & searching the web...`
                  : 'Searching the web & reading sources...'}
              </>
            ) : (
              <>
                🔍 Research & Plan →
                {uploadedFiles.length > 0 && (
                  <span className="ml-1 text-sm font-normal bg-purple-500/40 px-2 py-0.5 rounded-full">
                    +{uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''}
                  </span>
                )}
              </>
            )}
          </button>
          {researching && (
            <p className="text-center text-gray-500 text-sm -mt-2">
              {uploadedFiles.length > 0
                ? `AI is reading your files and searching Google for the latest info. This may take ~20 seconds.`
                : 'AI is searching Google for the latest news and reading your sources. This takes ~15 seconds.'}
            </p>
          )}
        </div>
      )}

      {/* ── STEP 2: Research Brief ─────────────────────────────────────────── */}
      {step === 'research' && brief && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Research Results</h2>
            <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
              ← Start Over
            </button>
          </div>

          {/* Uploaded files note */}
          {brief.uploadedFileCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-purple-900/20 border border-purple-800/50 rounded-xl text-sm text-purple-300">
              <span>📎</span>
              <span>
                AI read <strong>{brief.uploadedFileCount} uploaded file{brief.uploadedFileCount > 1 ? 's' : ''}</strong> and incorporated their content into the research below.
              </span>
            </div>
          )}

          {/* Recent findings */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider mb-3">
              🌐 What AI Found
            </h3>
            <ul className="space-y-2">
              {brief.recentFindings.map((f, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-300">
                  <span className="text-green-400 mt-0.5 shrink-0">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            {brief.sourcesFound.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-800">
                <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Sources used</p>
                <div className="flex flex-wrap gap-2">
                  {brief.sourcesFound.map((s, i) => (
                    <a
                      key={i}
                      href={s.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2.5 py-1 bg-gray-800 text-blue-400 hover:text-blue-300 rounded-full truncate max-w-[200px] transition-colors"
                      title={s.title}
                    >
                      {s.title || s.uri}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Suggested plan */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Suggested Title</p>
              <p className="text-white font-semibold">{brief.suggestedTitle}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Content Angle</p>
              <p className="text-gray-300 text-sm">{brief.suggestedAngle}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Key Topics Planned</p>
              <div className="flex flex-wrap gap-2">
                {brief.keyTopics.map((t, i) => (
                  <span key={i} className="text-xs px-3 py-1 bg-purple-900/40 text-purple-300 border border-purple-800/50 rounded-full">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Clarifying questions */}
          {brief.questions.length > 0 && (
            <div className="bg-gray-900 border border-amber-800/40 rounded-xl p-5">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-4">
                ❓ AI Has Some Questions (optional — skip to generate immediately)
              </h3>
              <div className="space-y-4">
                {brief.questions.map((q) => (
                  <div key={q.id}>
                    <label className="block text-sm text-gray-200 mb-1.5 font-medium">{q.question}</label>
                    <input
                      type="text"
                      value={answers[q.id] || ''}
                      onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                      placeholder={q.placeholder}
                      className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
          >
            {generating ? (
              <>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Writing your blog post...
              </>
            ) : (
              '✨ Generate Full Blog Post →'
            )}
          </button>
          {generating && (
            <p className="text-center text-gray-500 text-sm -mt-2">
              AI is writing a 1500+ word SEO-optimised article. This takes ~20–30 seconds.
            </p>
          )}
        </div>
      )}

      {/* ── STEP 3: Generated Blog ─────────────────────────────────────────── */}
      {step === 'generate' && blog && (
        <div className="space-y-6">
          {/* Action bar */}
          <div className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-green-400 font-medium">✅ Blog generated successfully!</p>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => handleSave('published')}
                disabled={saving || publishing}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {publishing ? 'Publishing...' : '🚀 Publish Now'}
              </button>
              <button
                onClick={() => handleSave('draft')}
                disabled={saving || publishing}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : '💾 Save as Draft & Edit'}
              </button>
              <button
                onClick={() => { setBlog(null); setStep('research'); }}
                className="px-4 py-2 bg-gray-800 text-gray-300 text-sm rounded-lg hover:bg-gray-700"
              >
                Re-generate
              </button>
              <button onClick={reset} className="px-4 py-2 bg-gray-800 text-gray-400 text-sm rounded-lg hover:bg-gray-700">
                Start Over
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Content preview */}
            <div className="xl:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
              <h2 className="text-xl font-bold text-white">{blog.title}</h2>
              <p className="text-gray-500 text-sm">/{blog.slug}</p>
              <div className="bg-gray-800 rounded-lg p-4 max-h-[520px] overflow-y-auto">
                <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono leading-relaxed">{blog.content}</pre>
              </div>

              {blog.sourcesUsed?.length > 0 && (
                <div className="pt-2 border-t border-gray-800">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Web Sources Referenced</p>
                  <div className="flex flex-wrap gap-2">
                    {blog.sourcesUsed.map((s, i) => (
                      <a
                        key={i}
                        href={s.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-2.5 py-1 bg-gray-800 text-blue-400 hover:text-blue-300 rounded-full truncate max-w-[200px] transition-colors"
                        title={s.title}
                      >
                        {s.title || s.uri}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Meta sidebar */}
            <div className="space-y-4">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white">SEO Meta</h3>
                <div>
                  <span className="text-xs text-gray-500">Meta Title</span>
                  <p className="text-gray-300 text-sm mt-0.5">{blog.metaTitle}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Meta Description</span>
                  <p className="text-gray-300 text-sm mt-0.5">{blog.metaDescription}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Category</span>
                  <p className="text-gray-300 text-sm mt-0.5">{blog.category}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Keywords</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {blog.keywords.map((k) => (
                      <span key={k} className="text-xs px-2 py-0.5 bg-gray-800 text-gray-400 rounded-full">{k}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Excerpt</span>
                  <p className="text-gray-400 text-sm mt-0.5 italic">{blog.excerpt}</p>
                </div>
              </div>

              {blog.faqs?.length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-sm font-bold text-white mb-3">FAQs ({blog.faqs.length})</h3>
                  <div className="space-y-2">
                    {blog.faqs.map((faq, i) => (
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
