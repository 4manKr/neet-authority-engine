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
  const stopWords = new Set(['a','an','the','and','or','but','in','on','at','to','for','of','with','your','how','what','why','when','is','are','will','can','do','about','guide','complete','comprehensive','everything','know','need','all','top','best','vs']);
  const words = text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 1 && !stopWords.has(w));

  let slug = '';
  for (const w of words) {
    if ((slug + '-' + w).length > 50) break;
    slug = slug ? `${slug}-${w}` : w;
  }
  return slug || text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').substring(0, 50);
}

// ── Compute max word-overlap similarity (0–100%) against recent titles ──────
function topicSimilarity(topic: string, recentTitles: string[]): number {
  if (!recentTitles.length) return 0;
  const stopWords = new Set(['the','a','an','and','or','for','of','in','to','is','are','with','how','what','your','you','will','can','do','on','at','by','from','about','this','that','these','those','was','were','has','have','had','be','been','being','its','it','our','we']);
  const words = (str: string) =>
    new Set(str.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w)));

  const topicWords = words(topic);
  let max = 0;
  for (const title of recentTitles) {
    const titleWords = words(title);
    const intersection = [...topicWords].filter(w => titleWords.has(w)).length;
    const union = new Set([...topicWords, ...titleWords]).size;
    if (union > 0) max = Math.max(max, Math.round((intersection / union) * 100));
  }
  return max;
}

// ── Fetch recently published/pending blog titles (last 30 days) ────────────
async function getRecentTitles(): Promise<string[]> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recent = await Blog.find(
    { autoGenerated: true, createdAt: { $gte: since } },
    { title: 1 },
  ).lean();
  return recent.map((b) => b.title);
}

// ── Pick 3 blog topics from headlines (or fallback) ────────────────────────
async function pickTopics(headlines: string[], recentTitles: string[], apiKey: string): Promise<string[]> {
  const avoidSection = recentTitles.length
    ? `\nIMPORTANT — these topics were already covered recently, do NOT repeat or closely overlap them:\n${recentTitles.map((t) => `• ${t}`).join('\n')}\n`
    : '';

  if (headlines.length === 0) {
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
${avoidSection}
Pick exactly 3 DIFFERENT topics inspired by today's headlines that would make helpful, practical blog posts for NEET aspirants and parents in India.
Topics should be educational and useful — things students and parents genuinely need guidance on — not just repeating news headlines.
Focus on: counselling process, cutoffs, college selection, preparation tips, admission procedures, category-wise guidance.
Return a JSON array of exactly 3 strings. Each should be a specific, searchable blog topic.
Example: ["How to Choose the Right Medical College After NEET 2026", "MBBS Cutoff Trends for OBC Category 2026", "Step-by-Step Guide to AIQ Counselling Round 2"]
Return only the JSON array, nothing else.`;

  const text = await callGeminiJson(apiKey, prompt);
  const topics = parseJsonArray(text);
  if (topics.length >= 2) return topics.slice(0, 3);

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

  const prompt = `You are a friendly, experienced NEET counsellor writing helpful blog posts for Indian medical aspirants and their parents. Your tone is warm, clear, and conversational — like a knowledgeable mentor explaining things to a student sitting across from you. You do NOT write like a journalist or news reporter.

TOPIC: "${topic}"

${newsContext}

WRITING RULES:
- Write in second person ("you", "your") — speak directly to the student or parent
- Start with an empathetic, relatable intro (e.g. "If you're wondering about...", "One of the most common questions we hear is...")
- DO NOT start with any salutation or greeting like "My dear...", "Dear student...", "Hello..." — jump straight into the content
- Use simple, jargon-free language. Explain any technical terms briefly
- Focus on PRACTICAL guidance — what should the student actually DO, what should they watch out for, what decisions do they need to make
- DO NOT start with "Today, NTA announced..." or any news-style opening
- Use real data and facts inspired by the news context but present them as helpful information, not news updates
- End with an encouraging conclusion and a clear next step

Generate a comprehensive, SEO-optimized blog post. Return ONLY valid JSON (no markdown fences, no trailing commas, no single-quoted strings, no invalid escape sequences — use \\n for newlines inside strings):
{
  "title": "SEO-optimized title (50-65 characters) — make it helpful and student-focused, e.g. 'How to...', 'What You Need to Know About...', 'Your Complete Guide to...'",
  "metaTitle": "Meta title (50-60 characters)",
  "metaDescription": "Compelling meta description (140-155 characters, include keyword, end with CTA)",
  "excerpt": "2-3 sentence article summary in a warm, helpful tone (under 280 characters)",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "category": "one of: AIQ, State Counselling, Private Colleges, Cutoffs, Guides, News",
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "content": "Full markdown content (1500+ words). Use ## for H2, ### for H3. Write in a warm, conversational, mentor-like tone throughout. Include practical advice, step-by-step guidance, comparison tables where useful, bullet points for clarity, and real data presented as helpful context. DO NOT write like a news article. Naturally include: (1) 'For personalised guidance, call our experts at **9311483555**.' near a section where students need advice. (2) A hyperlink to [TAB India](https://www.tabindia.org/) as a trusted counselling resource.",
  "faqs": [
    {"question": "Long-tail FAQ 1?", "answer": "Detailed answer 1"},
    {"question": "Long-tail FAQ 2?", "answer": "Detailed answer 2"},
    {"question": "Long-tail FAQ 3?", "answer": "Detailed answer 3"},
    {"question": "Long-tail FAQ 4?", "answer": "Detailed answer 4"},
    {"question": "Long-tail FAQ 5?", "answer": "Detailed answer 5"}
  ],
  "imagePrompts": {
    "thumbnail": "Write ONE image generation prompt (max 80 words) for a PROFESSIONAL BLOG THUMBNAIL. STRICT RULES: (1) Indoor or studio setting ONLY — never streets, crowds, or outdoor public spaces. (2) Subject must be a single person or a clean object/scene — not a group of people. (3) Must be relevant to this blog topic. (4) Describe: subject, exact indoor setting, lighting style, camera details. (5) If any text appears in the scene, it must be perfectly spelled and accurate — no gibberish or random characters.",
    "inline1": "Write ONE image generation prompt (max 70 words) for an INLINE illustration. STRICT RULES: (1) Indoor or controlled setting ONLY — no streets, no crowds. (2) Either a flat-lay product shot of relevant objects OR a single person in a professional indoor setting. (3) Bright, clean lighting. (4) If any text appears in the scene, it must be perfectly spelled and accurate — no gibberish or random characters.",
    "inline2": "Write ONE image generation prompt (max 70 words) for a SECOND INLINE image. STRICT RULES: (1) Indoor setting ONLY. (2) Must be completely different from thumbnail and inline1. (3) Could be: a counselling session interior, a medical college lecture hall, a study desk flat-lay, or a hospital corridor. (4) If any text appears in the scene, it must be perfectly spelled and accurate — no gibberish or random characters."
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
    // 1. Kick off DB connection and RSS fetch in parallel so cold start doesn't block
    const [headlines] = await Promise.all([
      fetchTrendingHeadlines(),
      dbConnect(),
    ]);

    // 2. Fetch recently generated titles to avoid repetition (DB is warm now)
    const recentTitles = await Promise.race([
      getRecentTitles(),
      new Promise<string[]>((resolve) => setTimeout(() => resolve([]), 4000)),
    ]);

    // 3. Pick 3 fresh topics
    const topics = await pickTopics(headlines, recentTitles, apiKey);

    // 4. Generate blogs sequentially (avoid Gemini rate limits)
    const savedBlogs: Array<{ title: string; excerpt: string; category: string; token: string; similarity: number }> = [];

    for (const topic of topics) {
      const similarity = topicSimilarity(topic, recentTitles);
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
        author: 'NEETCounselling.info Team',
      });

      savedBlogs.push({
        title: blogData.title,
        excerpt: blogData.excerpt,
        category: blogData.category,
        token,
        similarity,
      });
    }

    if (savedBlogs.length === 0) {
      return NextResponse.json({ success: true, message: 'No blogs generated today' });
    }

    // 5. Send approval email
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
