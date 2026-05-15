import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/db/mongoose';
import { Blog } from '@/lib/db/models/Blog';
import { sendEmail, buildApprovalEmail } from '@/lib/email';

export const maxDuration = 300;

// ── Keyword pool used when RSS yields no headlines ─────────────────────────
const FALLBACK_TOPICS = [
  'NEET UG 2026 counselling schedule and latest updates',
  'MBBS admission process India 2026',
  'NEET cutoff 2026 category wise expected',
  'BDS counselling 2026 state quota seats',
  'Top government medical colleges India NEET 2026',
  'NEET PG MD MS admission 2026 updates',
  'MCC AIQ counselling round 1 2026',
  'State medical counselling NEET 2026',
];

// ── Google News RSS fetch ──────────────────────────────────────────────────
const RSS_QUERIES = [
  'NEET 2026 India counselling',
  'MBBS BDS admission India 2026',
  'medical education news India',
];

async function fetchTrendingHeadlines(): Promise<string[]> {
  const headlines: string[] = [];
  for (const q of RSS_QUERIES) {
    try {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-IN&gl=IN&ceid=IN:en`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      const xml = await res.text();
      // Extract <title> inside each <item>
      const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
      for (const block of itemBlocks.slice(0, 6)) {
        const m = block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) ||
                  block.match(/<title>([\s\S]*?)<\/title>/);
        if (!m) continue;
        const title = m[1]
          .replace(/\s*-\s*[^-]+$/, '')  // strip " - Source Name"
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .trim();
        if (title.length > 20) headlines.push(title);
      }
    } catch {
      // ignore individual RSS failures
    }
  }
  return [...new Set(headlines)];
}

// ── Gemini helpers ─────────────────────────────────────────────────────────
async function callGeminiJson(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 16384, responseMimeType: 'application/json' },
      }),
    },
  );
  if (!res.ok) throw new Error(`Gemini error ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

function parseJson(text: string): any {
  let s = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  const start = s.indexOf('{'); const end = s.lastIndexOf('}');
  if (start !== -1 && end !== -1) s = s.slice(start, end + 1);
  try { return JSON.parse(s); } catch { /* fall through */ }
  try { return JSON.parse(s.replace(/\\'/g, "'")); } catch { /* fall through */ }
  try {
    return JSON.parse(
      s.replace(/\\u(?![0-9a-fA-F]{4})/g, 'u').replace(/\\(?!["\\/bfnrtu])/g, ''),
    );
  } catch { /* fall through */ }
  throw new Error('Could not parse JSON');
}

function parseJsonArray(text: string): string[] {
  let s = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  const start = s.indexOf('['); const end = s.lastIndexOf(']');
  if (start !== -1 && end !== -1) s = s.slice(start, end + 1);
  try { const r = JSON.parse(s); return Array.isArray(r) ? r : []; } catch { return []; }
}

function generateSlug(text: string): string {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
    .replace(/^-|-$/g, '').substring(0, 80);
}

// ── Pick 3 blog topics from headlines (or fallback) ────────────────────────
async function pickTopics(headlines: string[], apiKey: string): Promise<string[]> {
  if (headlines.length === 0) {
    // Rotate fallback topics by day of year so each day is different
    const dayIdx = Math.floor(Date.now() / 86400000) % FALLBACK_TOPICS.length;
    return [
      FALLBACK_TOPICS[dayIdx % FALLBACK_TOPICS.length],
      FALLBACK_TOPICS[(dayIdx + 1) % FALLBACK_TOPICS.length],
      FALLBACK_TOPICS[(dayIdx + 2) % FALLBACK_TOPICS.length],
    ];
  }

  const prompt = `You are a content strategist for an Indian NEET UG medical counselling website (neetcounselling.info).

Today's trending medical education headlines from Google News:
${headlines.slice(0, 15).map((h, i) => `${i + 1}. ${h}`).join('\n')}

Pick exactly 3 topics from these headlines that would make the best SEO blog posts for NEET aspirants and parents in India.
Focus on: counselling updates, cutoffs, admission procedures, college information, exam news.
Return a JSON array of exactly 3 strings. Each string should be a specific, searchable blog keyword/topic.
Example format: ["NEET UG 2026 AIQ Round 1 counselling dates", "MBBS cutoff 2026 OBC category", "Top medical colleges Delhi NEET 2026"]
Return only the JSON array, nothing else.`;

  const text = await callGeminiJson(apiKey, prompt);
  const topics = parseJsonArray(text);
  if (topics.length >= 2) return topics.slice(0, 3);

  // Fallback if Gemini fails to pick
  const dayIdx = Math.floor(Date.now() / 86400000) % FALLBACK_TOPICS.length;
  return [FALLBACK_TOPICS[dayIdx], FALLBACK_TOPICS[(dayIdx + 1) % FALLBACK_TOPICS.length], FALLBACK_TOPICS[(dayIdx + 2) % FALLBACK_TOPICS.length]];
}

// ── Generate a full blog for one topic ────────────────────────────────────
interface GeneratedBlogData {
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
  imagePrompts: { thumbnail?: string; inline1?: string; inline2?: string };
}

async function generateBlogForTopic(
  topic: string,
  headlines: string[],
  apiKey: string,
): Promise<GeneratedBlogData | null> {
  const newsContext = headlines.length
    ? `Today's relevant news headlines:\n${headlines.slice(0, 10).map((h) => `• ${h}`).join('\n')}`
    : '';

  const prompt = `You are an expert Medical Admissions Counselor and SEO Content Writer for an Indian NEET UG counselling website.

KEYWORD TO TARGET: "${topic}"

${newsContext}

Generate a comprehensive, SEO-optimized blog post. Return ONLY valid JSON (no markdown fences, no trailing commas, no single-quoted strings, no invalid escape sequences — use \\n for newlines inside strings):
{
  "title": "SEO-optimized title (50-65 characters, include the keyword naturally)",
  "metaTitle": "Meta title (50-60 characters)",
  "metaDescription": "Compelling meta description (140-155 characters, include keyword, end with CTA)",
  "excerpt": "2-3 sentence article summary (under 280 characters)",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "category": "one of: AIQ, State Counselling, Private Colleges, Cutoffs, Guides, News",
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "content": "Full markdown content (1500+ words). Use ## for H2, ### for H3. Include intro, detailed sections with data, comparison tables where relevant, bullet points, bold text, and a strong conclusion. Write for Indian NEET aspirants and parents. Naturally include: (1) A sentence like 'For personalised guidance, call our experts at **9311483555**.' near a helpful section. (2) A hyperlink to [TAB India](https://www.tabindia.org/) as a trusted resource.",
  "faqs": [
    {"question": "Long-tail FAQ 1?", "answer": "Detailed answer 1"},
    {"question": "Long-tail FAQ 2?", "answer": "Detailed answer 2"},
    {"question": "Long-tail FAQ 3?", "answer": "Detailed answer 3"},
    {"question": "Long-tail FAQ 4?", "answer": "Detailed answer 4"},
    {"question": "Long-tail FAQ 5?", "answer": "Detailed answer 5"}
  ],
  "imagePrompts": {
    "thumbnail": "Write ONE image generation prompt (max 80 words) for a PROFESSIONAL BLOG THUMBNAIL. STRICT RULES: (1) Indoor or studio setting ONLY — never streets, crowds, or outdoor public spaces. (2) Subject must be a single person or a clean object/scene — not a group of people. (3) Must be relevant to this blog topic. (4) Describe: subject, exact indoor setting, lighting style, camera details.",
    "inline1": "Write ONE image generation prompt (max 70 words) for an INLINE illustration. STRICT RULES: (1) Indoor or controlled setting ONLY — no streets, no crowds. (2) Either a flat-lay product shot of relevant objects OR a single person in a professional indoor setting. (4) Bright, clean lighting. No text in image.",
    "inline2": "Write ONE image generation prompt (max 70 words) for a SECOND INLINE image. STRICT RULES: (1) Indoor setting ONLY. (2) Must be completely different from thumbnail and inline1. (3) Could be: a counselling session interior, a medical college lecture hall, a study desk flat-lay, or a hospital corridor. No text."
  }
}`;

  try {
    const text = await callGeminiJson(apiKey, prompt);
    const parsed = parseJson(text);
    if (!parsed.title || !parsed.content) return null;
    return {
      title: parsed.title,
      slug: generateSlug(parsed.title),
      metaTitle: parsed.metaTitle || parsed.title,
      metaDescription: parsed.metaDescription || '',
      excerpt: parsed.excerpt || '',
      keywords: parsed.keywords || [],
      category: parsed.category || 'Guides',
      tags: parsed.tags || [],
      content: parsed.content,
      faqs: parsed.faqs || [],
      imagePrompts: parsed.imagePrompts || {},
    };
  } catch {
    return null;
  }
}

// ── Main cron handler ──────────────────────────────────────────────────────
export async function GET(req: Request) {
  // Vercel sends Authorization: Bearer <CRON_SECRET> automatically
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 });

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return NextResponse.json({ error: 'ADMIN_EMAIL not set' }, { status: 500 });

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://neetcounselling.info').replace(/\/$/, '');

  try {
    // 1. Fetch today's trending headlines
    const headlines = await fetchTrendingHeadlines();

    // 2. Pick 3 topics
    const topics = await pickTopics(headlines, apiKey);

    // 3. Generate blogs sequentially (avoid Gemini rate limits)
    await dbConnect();
    const savedBlogs: Array<{ title: string; excerpt: string; category: string; token: string }> = [];

    for (const topic of topics) {
      const blogData = await generateBlogForTopic(topic, headlines, apiKey);
      if (!blogData) continue;

      // Ensure slug uniqueness
      let slug = blogData.slug;
      const existing = await Blog.findOne({ slug }).lean();
      if (existing) slug = `${slug}-${Date.now()}`;

      const token = crypto.randomBytes(32).toString('hex');

      await Blog.create({
        ...blogData,
        slug,
        status: 'pending_approval',
        autoGenerated: true,
        approvalToken: token,
        author: 'AI Content Engine',
      });

      savedBlogs.push({
        title: blogData.title,
        excerpt: blogData.excerpt,
        category: blogData.category,
        token,
      });
    }

    if (savedBlogs.length === 0) {
      return NextResponse.json({ success: true, message: 'No blogs generated today' });
    }

    // 4. Send approval email
    const date = new Date().toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
    const html = buildApprovalEmail(siteUrl, savedBlogs, date);
    await sendEmail(adminEmail, `${savedBlogs.length} blogs ready for review — ${date}`, html);

    return NextResponse.json({
      success: true,
      blogsGenerated: savedBlogs.length,
      topics: savedBlogs.map((b) => b.title),
    });
  } catch (err: any) {
    console.error('Cron error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
