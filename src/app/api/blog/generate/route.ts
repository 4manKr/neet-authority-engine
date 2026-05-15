import { NextResponse } from 'next/server';

export const maxDuration = 300;

const SUPPORTED_MIME_TYPES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'text/plain', 'text/csv',
]);

// ── Image helpers ─────────────────────────────────────────────────────────────

function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return Math.abs(h) % 99991;
}

// ── DALL-E 3 + Cloudinary ─────────────────────────────────────────────────────

async function uploadToCloudinary(b64: string, folder: string): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET!;

  const form = new FormData();
  form.append('file', `data:image/png;base64,${b64}`);
  form.append('upload_preset', uploadPreset);
  form.append('folder', folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error(`Cloudinary upload failed: ${res.status}`);
  const data = await res.json();
  return data.secure_url as string;
}

async function generateDalleImage(
  prompt: string,
  size: '1792x1024' | '1024x1024',
  folder: string,
  openaiKey: string,
): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt.slice(0, 4000),
      n: 1,
      size,
      quality: 'hd',
      response_format: 'b64_json',
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DALL-E 3 error ${res.status}: ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json as string;
  if (!b64) throw new Error('DALL-E 3 returned no image data');
  return uploadToCloudinary(b64, folder);
}

// ── Pollinations fallback ─────────────────────────────────────────────────────

const QUALITY_SUFFIX =
  ', professional stock photography, ultra sharp focus, perfect studio lighting, ' +
  'clean composition, 4K resolution, no text, no watermarks, no logos';

const NEGATIVE =
  'text, watermark, logo, words, letters, blurry, pixelated, cartoon, illustration, ' +
  '3d render, painting, sketch, ugly, distorted, overexposed, crowds, street scene, ' +
  'bad anatomy, duplicate limbs, disfigured';

function pollinationsUrl(prompt: string, width: number, height: number, seed: number): string {
  const full = (prompt + QUALITY_SUFFIX).slice(0, 500);
  return (
    `https://image.pollinations.ai/prompt/${encodeURIComponent(full)}` +
    `?width=${width}&height=${height}&nologo=true&model=flux-realism&seed=${seed}` +
    `&negative=${encodeURIComponent(NEGATIVE)}`
  );
}

/**
 * Insert up to 2 inline images into markdown content at H2 boundaries.
 * Images are placed after the 2nd H2 section and after the midpoint H2 section.
 */
function insertInlineImages(
  content: string,
  images: Array<{ url: string; alt: string }>,
): string {
  if (!images.length) return content;

  // Split on H2 headings while keeping the heading in each chunk
  const sections = content.split(/(?=\n## )/);
  if (sections.length < 3) return content + images.map(img => `\n\n![${img.alt}](${img.url})\n`).join('');

  const result = [...sections];

  // After section index 1 (second section = first H2 body)
  if (images[0] && result.length >= 2) {
    result[1] = result[1].trimEnd() + `\n\n![${images[0].alt}](${images[0].url})\n`;
  }

  // After the section around the midpoint
  const midIdx = Math.max(2, Math.floor(result.length / 2));
  if (images[1] && result.length >= 4 && midIdx !== 1) {
    result[midIdx] = result[midIdx].trimEnd() + `\n\n![${images[1].alt}](${images[1].url})\n`;
  }

  return result.join('');
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

async function fetchUrlText(url: string): Promise<{ url: string; text: string; title: string }> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NEETBot/1.0)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { url, text: '', title: url };
    const html = await res.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : url;
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 4000);
    return { url, text, title };
  } catch {
    return { url, text: '', title: url };
  }
}

interface FilePart {
  mimeType: string;
  data: string; // base64
  name: string;
}

// Build Gemini request body. When fileParts are supplied the request is multimodal.
// useSearch=true  → research mode: Google Search grounding, free-form response
// useSearch=false → generate mode: no grounding, forced JSON via responseMimeType
async function callGemini(
  apiKey: string,
  prompt: string,
  useSearch: boolean,
  fileParts: FilePart[] = [],
) {
  const parts: any[] = [{ text: prompt }];

  for (const fp of fileParts) {
    parts.push({ inlineData: { mimeType: fp.mimeType, data: fp.data } });
    // Label each file so AI knows what it's looking at
    parts.unshift({ text: `[Uploaded file: ${fp.name} (${fp.mimeType})]` });
  }

  const body: any = {
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 16384,
      ...(useSearch ? {} : { responseMimeType: 'application/json' }),
    },
  };
  if (useSearch) {
    body.tools = [{ google_search: {} }];
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err.slice(0, 300)}`);
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const groundingChunks: Array<{ uri: string; title: string }> =
    data.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => ({
      uri: c.web?.uri || '',
      title: c.web?.title || c.web?.uri || '',
    })) || [];
  return { text, groundingChunks };
}

function parseJson(text: string): any {
  // Strip markdown fences if present
  let s = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

  // Grab outermost { … }
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object found in response');
  s = s.slice(start, end + 1);

  // Attempt 1: direct parse
  try { return JSON.parse(s); } catch { /* fall through */ }

  // Attempt 2: fix \' (most common Gemini invalid escape)
  try { return JSON.parse(s.replace(/\\'/g, "'")); } catch { /* fall through */ }

  // Attempt 3: remove ALL invalid escape sequences
  // Valid JSON escape chars after \: " \ / b f n r t u
  // \uXXXX needs exactly 4 hex digits — fix bad \u too
  try {
    const fixed = s
      .replace(/\\u(?![0-9a-fA-F]{4})/g, 'u')   // \u not followed by 4 hex → plain u
      .replace(/\\(?!["\\/bfnrtu])/g, '');        // any other invalid \X → remove backslash
    return JSON.parse(fixed);
  } catch { /* fall through */ }

  // Attempt 4: escape unescaped literal newlines/tabs inside string values
  try {
    const fixed = s
      .replace(/\\'/g, "'")
      .replace(/\\(?!["\\/bfnrtu])/g, '')
      // Escape raw control characters that appear inside string values
      .replace(/(?<=":[\s]*"[^"]*)\n/g, '\\n')
      .replace(/(?<=":[\s]*"[^"]*)\r/g, '\\r')
      .replace(/(?<=":[\s]*"[^"]*)\t/g, '\\t');
    return JSON.parse(fixed);
  } catch { /* fall through */ }

  throw new Error('AI returned malformed JSON that could not be repaired. Please regenerate.');
}

// Parse either multipart/form-data (research with files) or application/json (generate)
async function parseRequest(req: Request): Promise<{
  keyword: string;
  urls: string[];
  mode: string;
  brief: any;
  answers: Record<string, string>;
  fileParts: FilePart[];
}> {
  const ct = req.headers.get('content-type') || '';

  if (ct.includes('multipart/form-data')) {
    const fd = await req.formData();
    const keyword = (fd.get('keyword') as string) || '';
    const urls: string[] = JSON.parse((fd.get('urls') as string) || '[]');
    const mode = (fd.get('mode') as string) || 'research';
    const brief = fd.get('brief') ? JSON.parse(fd.get('brief') as string) : null;
    const answers: Record<string, string> = fd.get('answers')
      ? JSON.parse(fd.get('answers') as string)
      : {};

    const uploadedFiles = fd.getAll('files') as File[];
    const fileParts: FilePart[] = [];

    for (const file of uploadedFiles) {
      if (!file.size) continue;
      if (file.size > 15 * 1024 * 1024) continue; // skip files > 15 MB

      const mimeType = file.type || 'application/octet-stream';
      if (!SUPPORTED_MIME_TYPES.has(mimeType)) continue;

      const buf = await file.arrayBuffer();
      const data = Buffer.from(buf).toString('base64');
      fileParts.push({ mimeType, data, name: file.name });
    }

    return { keyword, urls, mode, brief, answers, fileParts };
  }

  // Plain JSON (generate mode or research without files)
  const body = await req.json();
  return {
    keyword: body.keyword || '',
    urls: body.urls || [],
    mode: body.mode || 'research',
    brief: body.brief || null,
    answers: body.answers || {},
    fileParts: [],
  };
}

// POST /api/blog/generate
export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    const { keyword, urls, mode, brief, answers, fileParts } = await parseRequest(req);

    if (!keyword?.trim()) {
      return NextResponse.json({ error: 'keyword is required' }, { status: 400 });
    }

    // Fetch content from admin-provided URLs in parallel
    const urlContents =
      urls.length > 0
        ? await Promise.all((urls as string[]).filter(Boolean).map(fetchUrlText))
        : [];

    const urlContext = urlContents
      .filter((u) => u.text)
      .map((u) => `--- Source: ${u.title} (${u.url}) ---\n${u.text}`)
      .join('\n\n');

    const fileNames = fileParts.map((f) => f.name).join(', ');
    const fileNote = fileParts.length
      ? `\nThe admin has also uploaded ${fileParts.length} file(s) for you to read and extract relevant information from: ${fileNames}. Carefully read each uploaded file and use its content as primary source material.`
      : '';

    // ── RESEARCH MODE ──────────────────────────────────────────────────────────
    if (mode === 'research') {
      const prompt = `You are a senior content strategist for an Indian NEET UG counselling website.

Your task is to RESEARCH the topic: "${keyword}"

Use Google Search to find:
- The most recent news, announcements, and updates (2025–2026)
- Official sources (NTA, MCC, state counselling authorities)
- Current trends, statistics, and data
${fileNote}
${urlContext ? `\nThe admin has also provided these reference URLs to use:\n\n${urlContext}\n` : ''}
Based on your research (and the uploaded files if any), return a JSON object (no markdown, just raw JSON) with this EXACT structure:
{
  "recentFindings": [
    "Specific, factual finding with date/source if available",
    "Another recent finding",
    "Another recent finding"
  ],
  "suggestedTitle": "A strong SEO title for a blog post on this topic (50-65 chars)",
  "suggestedAngle": "A 1-2 sentence description of the best content angle to take",
  "keyTopics": [
    "Main topic/section 1",
    "Main topic/section 2",
    "Main topic/section 3",
    "Main topic/section 4"
  ],
  "questions": [
    {
      "id": "q1",
      "question": "A clarifying question to make the blog more targeted",
      "placeholder": "Example answer hint"
    },
    {
      "id": "q2",
      "question": "Another clarifying question",
      "placeholder": "Example answer hint"
    },
    {
      "id": "q3",
      "question": "Another clarifying question",
      "placeholder": "Example answer hint"
    }
  ]
}

Questions should help refine: target audience, specific state or quota focus, tone, specific data points to include.`;

      const { text, groundingChunks } = await callGemini(apiKey, prompt, true, fileParts);

      let parsed;
      try {
        parsed = parseJson(text);
      } catch {
        return NextResponse.json(
          { error: 'AI returned unexpected research format. Please try again.' },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        mode: 'research',
        data: {
          recentFindings: parsed.recentFindings || [],
          suggestedTitle: parsed.suggestedTitle || keyword,
          suggestedAngle: parsed.suggestedAngle || '',
          keyTopics: parsed.keyTopics || [],
          questions: parsed.questions || [],
          sourcesFound: groundingChunks.slice(0, 6),
          uploadedFileCount: fileParts.length,
        },
      });
    }

    // ── GENERATE MODE ──────────────────────────────────────────────────────────
    if (mode === 'generate') {
      if (!brief) {
        return NextResponse.json({ error: 'brief is required for generate mode' }, { status: 400 });
      }

      const answersText = Object.entries(answers as Record<string, string>)
        .filter(([, v]) => v?.trim())
        .map(([id, ans]) => {
          const q = brief.questions?.find((q: any) => q.id === id);
          return q ? `Q: ${q.question}\nA: ${ans}` : '';
        })
        .filter(Boolean)
        .join('\n\n');

      const prompt = `You are an expert Medical Admissions Counselor and SEO Content Writer for an Indian NEET UG counselling website.

KEYWORD TO TARGET: "${keyword}"

RESEARCH BRIEF:
- Suggested angle: ${brief.suggestedAngle}
- Key topics to cover: ${(brief.keyTopics || []).join(', ')}
- Recent findings to incorporate:
${(brief.recentFindings || []).map((f: string) => `  • ${f}`).join('\n')}
${brief.uploadedFileCount ? `\n(Note: ${brief.uploadedFileCount} file(s) were analyzed during research and their content is reflected in the findings above.)` : ''}
${answersText ? `\nADMIN'S ANSWERS TO CLARIFYING QUESTIONS:\n${answersText}\n` : ''}
${urlContext ? `\nREFERENCE SOURCES PROVIDED BY ADMIN:\n\n${urlContext}\n` : ''}

Generate a comprehensive, SEO-optimized blog post. Return ONLY valid JSON (no markdown fences, no trailing commas, no single-quoted strings, no invalid escape sequences — use \\n for newlines inside strings):
{
  "title": "SEO-optimized title (50-65 characters, include the keyword naturally)",
  "metaTitle": "Meta title (50-60 characters)",
  "metaDescription": "Compelling meta description (140-155 characters, include keyword, end with CTA)",
  "excerpt": "2-3 sentence article summary (under 280 characters)",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "category": "one of: AIQ, State Counselling, Private Colleges, Cutoffs, Guides, News",
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "content": "Full markdown content (1500+ words). Use ## for H2, ### for H3. Include intro, detailed sections with data, comparison tables where relevant, bullet points, bold text, and a strong conclusion. Incorporate the recent findings from research. Write for Indian NEET aspirants and parents. IMPORTANT — naturally weave in the following two elements at appropriate points in the content (do NOT drop them in awkwardly; integrate them as organic sentences): (1) A call-to-action sentence suggesting readers call **9311483555** for personalised guidance or clarification, e.g. 'For personalised guidance, you can reach our counselling experts directly at **9311483555**.' Place this near a section where students would benefit from expert advice. (2) A hyperlink to [TAB India](https://www.tabindia.org/) as a trusted counselling resource, e.g. 'You can also explore detailed college and counselling resources at [TAB India](https://www.tabindia.org/).' Place this where referencing an external resource feels natural.",
  "faqs": [
    {"question": "Long-tail FAQ 1?", "answer": "Detailed answer 1"},
    {"question": "Long-tail FAQ 2?", "answer": "Detailed answer 2"},
    {"question": "Long-tail FAQ 3?", "answer": "Detailed answer 3"},
    {"question": "Long-tail FAQ 4?", "answer": "Detailed answer 4"},
    {"question": "Long-tail FAQ 5?", "answer": "Detailed answer 5"}
  ],
  "imagePrompts": {
    "thumbnail": "Write ONE image generation prompt (max 80 words) for a PROFESSIONAL BLOG THUMBNAIL. STRICT RULES: (1) Indoor or studio setting ONLY — never streets, crowds, or outdoor public spaces. (2) Subject must be a single person or a clean object/scene — not a group of people. (3) Must be relevant to this blog topic. (4) Describe: subject, exact indoor setting, lighting style, camera details. Example: 'Confident Indian male doctor in white lab coat, modern private clinic office background with bookshelves, soft key light from left, professional portrait, shallow depth of field, Canon 85mm'",
    "inline1": "Write ONE image generation prompt (max 70 words) for an INLINE illustration of the first main section. STRICT RULES: (1) Indoor or controlled setting ONLY — no streets, no crowds, no outdoor scenes. (2) Clean, uncluttered composition. (3) Either a flat-lay product shot of relevant objects (books, stethoscope, documents, laptop) OR a single person in a professional indoor setting. (4) Bright, clean lighting. No text in image.",
    "inline2": "Write ONE image generation prompt (max 70 words) for a SECOND INLINE image on the blog main theme. STRICT RULES: (1) Indoor setting ONLY — no streets, no outdoor scenes. (2) Must be completely different subject and scene from thumbnail and inline1. (3) Choose one: a counselling session interior, a medical college lecture hall interior, a study desk flat-lay, or a hospital corridor. (4) Professional photography style, clean composition. No text."
  }
}`;

      const { text } = await callGemini(apiKey, prompt, false);

      let parsed;
      try {
        parsed = parseJson(text);
      } catch (parseErr: any) {
        console.error('JSON parse failed. Raw response snippet:', text.slice(0, 500));
        return NextResponse.json(
          { error: `AI returned malformed JSON: ${parseErr.message}. Please try again.` },
          { status: 500 },
        );
      }

      const slug = generateSlug(parsed.title || keyword);
      const seed = simpleHash(parsed.title || keyword);

      // Build image URLs from AI-generated prompts using Pollinations (Flux model)
      const imgPrompts: { thumbnail?: string; inline1?: string; inline2?: string } =
        parsed.imagePrompts || {};

      // Topic-aware professional prompt builder
      const topic = (parsed.category || 'medical education').toLowerCase();
      const titleSnippet = (parsed.title || keyword).slice(0, 60);

      const thumbnailPrompt =
        imgPrompts.thumbnail ||
        `Confident young Indian woman doctor in a pristine white lab coat and stethoscope, smiling at camera, modern hospital corridor background softly blurred, bright studio-quality lighting, professional headshot, clean background, sharp focus, stock photography`;

      const inline1Prompt =
        imgPrompts.inline1 ||
        `Flat-lay top-down view of a clean white desk with NEET study materials — open medical textbook showing anatomy diagrams, stethoscope, a notepad with neat handwriting, pen and green plant, bright natural window light, minimal aesthetic, product photography style`;

      const inline2Prompt =
        imgPrompts.inline2 ||
        `Modern bright medical college counselling office interior, a senior Indian counsellor gesturing at a laptop screen showing college rankings, two students listening attentively across the desk, large window with natural daylight, tidy professional environment, candid documentary photography`;

      const openaiKey = process.env.OPENAI_API_KEY;
      const hasCloudinary = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_UPLOAD_PRESET;
      const useDalle = !!(openaiKey && hasCloudinary);

      const blogFolder = `neet-blog/${slug}`;

      let thumbnailUrl: string;
      let inline1Url: string;
      let inline2Url: string;

      if (useDalle) {
        [thumbnailUrl, inline1Url, inline2Url] = await Promise.all([
          generateDalleImage(thumbnailPrompt, '1792x1024', blogFolder, openaiKey!),
          generateDalleImage(inline1Prompt,   '1792x1024', blogFolder, openaiKey!),
          generateDalleImage(inline2Prompt,   '1792x1024', blogFolder, openaiKey!),
        ]);
      } else {
        thumbnailUrl = pollinationsUrl(thumbnailPrompt, 1200, 630, seed);
        inline1Url   = pollinationsUrl(inline1Prompt,   1200, 800, seed + 1);
        inline2Url   = pollinationsUrl(inline2Prompt,   1200, 800, seed + 2);
      }

      // Embed inline images into the markdown content
      const contentWithImages = insertInlineImages(
        parsed.content || '',
        [
          { url: inline1Url, alt: `${parsed.title} — visual guide` },
          { url: inline2Url, alt: `NEET counselling — expert guidance` },
        ],
      );

      return NextResponse.json({
        success: true,
        mode: 'generate',
        data: {
          title: parsed.title || '',
          slug,
          metaTitle: parsed.metaTitle || parsed.title || '',
          metaDescription: parsed.metaDescription || '',
          excerpt: parsed.excerpt || '',
          keywords: parsed.keywords || [],
          category: parsed.category || 'Guides',
          tags: parsed.tags || [],
          content: contentWithImages,
          featuredImage: thumbnailUrl,
          faqs: parsed.faqs || [],
          sourcesUsed: brief.sourcesFound || [],
        },
      });
    }

    return NextResponse.json({ error: 'Invalid mode. Use "research" or "generate".' }, { status: 400 });
  } catch (error: any) {
    console.error('AI Blog Generation Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
