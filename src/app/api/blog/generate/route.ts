import { NextResponse } from 'next/server';

export const maxDuration = 60;

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
  return Math.abs(h) % 99991; // keep seed < 100k for Pollinations
}

const NEGATIVE =
  'text, watermark, logo, banner, sign, words, letters, low quality, blurry, pixelated, cartoon, illustration, 3d render, painting, sketch, ugly, distorted, overexposed, underexposed, duplicate heads, bad anatomy';

function pollinationsUrl(prompt: string, width: number, height: number, seed: number): string {
  const full = (
    prompt +
    ', professional editorial photography, ultra sharp focus, perfect exposure, ' +
    'award-winning composition, Nikon D850, 85mm f/1.4, cinematic colour grading, ' +
    'high resolution, no text, no watermarks'
  ).slice(0, 500);
  return (
    `https://image.pollinations.ai/prompt/${encodeURIComponent(full)}` +
    `?width=${width}&height=${height}&nologo=true&model=flux-pro&seed=${seed}` +
    `&enhance=true&negative=${encodeURIComponent(NEGATIVE)}`
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
    "thumbnail": "Write a single, highly specific image generation prompt (max 120 words) for a BLOG THUMBNAIL (16:9). It must be a PHOTOREALISTIC scene directly tied to the blog topic. Include: the subject (who/what), setting (where), mood/lighting, camera style. Use concrete visual details — colours, materials, expressions, environment. NO text, NO infographics, NO charts in the image. Example of a GOOD prompt: 'Confident young Indian woman in a white lab coat holding a medical college acceptance letter, standing at the entrance of a modern hospital with glass facade, warm golden hour sunlight, shallow depth of field, Canon EOS R5 editorial photography, vibrant colours'",
    "inline1": "Write a single, highly specific image generation prompt (max 100 words) for an INLINE image relevant to the FIRST main section of this blog. Must be photorealistic, emotionally engaging, with real people or environment. Include subject, setting, lighting. NO text or words in the image. Completely different scene from the thumbnail.",
    "inline2": "Write a single, highly specific image generation prompt (max 100 words) for a SECOND INLINE image relevant to the MAIN THEME of this blog. Must be photorealistic with strong visual storytelling. Include subject, setting, mood. NO text in the image. Completely different scene from thumbnail and inline1."
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

      const thumbnailPrompt =
        imgPrompts.thumbnail ||
        `Confident young Indian medical student in a white lab coat holding MBBS acceptance letter, standing at the entrance of a prestigious modern hospital with glass facade, warm golden hour sunlight, shallow depth of field, editorial photography`;

      const inline1Prompt =
        imgPrompts.inline1 ||
        `Indian university students gathered around a large table reviewing college brochures with a senior counsellor, bright modern office, warm interior lighting, candid moment, sharp focus`;

      const inline2Prompt =
        imgPrompts.inline2 ||
        `Aerial drone view of a sprawling Indian medical college campus with green lawns and modern academic buildings, early morning light, vivid colours, architectural photography`;

      const thumbnailUrl = pollinationsUrl(thumbnailPrompt, 1200, 630, seed);
      const inline1Url   = pollinationsUrl(inline1Prompt,   1200, 800, seed + 1);
      const inline2Url   = pollinationsUrl(inline2Prompt,   1200, 800, seed + 2);

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
