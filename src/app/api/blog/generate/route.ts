import { NextResponse } from 'next/server';

export const maxDuration = 60;

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

// useSearch=true  → research mode: enables Google Search grounding, free-form text response
// useSearch=false → generate mode: no grounding (brief has findings), forces JSON via responseMimeType
async function callGemini(apiKey: string, prompt: string, useSearch: boolean) {
  const body: any = {
    contents: [{ parts: [{ text: prompt }] }],
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
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
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

function parseJson(text: string) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON in response');
  return JSON.parse(match[0]);
}

// POST /api/blog/generate
// mode = "research" → search web + read URLs → return brief + clarifying questions
// mode = "generate" → use brief + answers → return full blog post
export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    const body = await req.json();
    const { keyword, urls = [], mode = 'research', brief, answers = {} } = body;

    if (!keyword?.trim()) {
      return NextResponse.json({ error: 'keyword is required' }, { status: 400 });
    }

    // Fetch content from admin-provided URLs in parallel
    const urlContents = urls.length > 0
      ? await Promise.all((urls as string[]).filter(Boolean).map(fetchUrlText))
      : [];

    const urlContext = urlContents
      .filter((u) => u.text)
      .map((u) => `--- Source: ${u.title} (${u.url}) ---\n${u.text}`)
      .join('\n\n');

    // ── RESEARCH MODE ──────────────────────────────────────────────────────────
    if (mode === 'research') {
      const prompt = `You are a senior content strategist for an Indian NEET UG counselling website.

Your task is to RESEARCH the topic: "${keyword}"

Use Google Search to find:
- The most recent news, announcements, and updates (2025–2026)
- Official sources (NTA, MCC, state counselling authorities)
- Current trends, statistics, and data

${urlContext ? `The admin has also provided these reference sources to use:\n\n${urlContext}\n` : ''}

Based on your research, return a JSON object (no markdown, just raw JSON) with this EXACT structure:
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

      const { text, groundingChunks } = await callGemini(apiKey, prompt, true);

      let parsed;
      try {
        parsed = parseJson(text);
      } catch {
        return NextResponse.json({ error: 'AI returned unexpected research format. Please try again.' }, { status: 500 });
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

${answersText ? `ADMIN'S ANSWERS TO CLARIFYING QUESTIONS:\n${answersText}\n` : ''}
${urlContext ? `REFERENCE SOURCES PROVIDED BY ADMIN:\n\n${urlContext}\n` : ''}

Use Google Search to verify facts and find any additional recent data before writing.

Generate a comprehensive, SEO-optimized blog post. Return ONLY valid JSON (no markdown fences):
{
  "title": "SEO-optimized title (50-65 characters, include the keyword naturally)",
  "metaTitle": "Meta title (50-60 characters)",
  "metaDescription": "Compelling meta description (140-155 characters, include keyword, end with CTA)",
  "excerpt": "2-3 sentence article summary (under 280 characters)",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "category": "one of: AIQ, State Counselling, Private Colleges, Cutoffs, Guides, News",
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "content": "Full markdown content (1500+ words). Use ## for H2, ### for H3. Include intro, detailed sections with data, comparison tables where relevant, bullet points, bold text, and a strong conclusion. Include internal link suggestions as [Link Text](/suggested-path). Incorporate the recent findings from research. Write for Indian NEET aspirants and parents.",
  "faqs": [
    {"question": "Long-tail FAQ 1?", "answer": "Detailed answer 1"},
    {"question": "Long-tail FAQ 2?", "answer": "Detailed answer 2"},
    {"question": "Long-tail FAQ 3?", "answer": "Detailed answer 3"},
    {"question": "Long-tail FAQ 4?", "answer": "Detailed answer 4"},
    {"question": "Long-tail FAQ 5?", "answer": "Detailed answer 5"}
  ]
}`;

      // useSearch=false: research brief already has findings; forcing JSON via responseMimeType
      // is far more reliable for a 1500+ word generation than search grounding.
      const { text } = await callGemini(apiKey, prompt, false);

      let parsed;
      try {
        parsed = parseJson(text);
      } catch (parseErr: any) {
        console.error('JSON parse failed. Raw response snippet:', text.slice(0, 500));
        return NextResponse.json(
          { error: `AI returned malformed JSON: ${parseErr.message}. Please try again.` },
          { status: 500 }
        );
      }

      const slug = generateSlug(parsed.title || keyword);

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
          content: parsed.content || '',
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
