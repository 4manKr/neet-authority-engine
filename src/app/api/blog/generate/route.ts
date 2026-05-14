import { NextResponse } from 'next/server';
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

export const maxDuration = 60; // Allow up to 60 seconds for AI generation (Vercel Hobby max)

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured on the server.' }, { status: 500 });
    }

    const body = await req.json();
    const { keyword } = body;

    if (!keyword) {
      return NextResponse.json({ error: 'keyword is required' }, { status: 400 });
    }

    const prompt = `You are an expert Medical Admissions Counselor and SEO Content Writer specializing in NEET UG counselling in India.

Generate a comprehensive, SEO-optimized blog post for the keyword: "${keyword}"

You MUST return your response as valid JSON with this EXACT structure (no markdown code blocks, just raw JSON):
{
  "title": "SEO-optimized title (50-65 characters, include the keyword naturally)",
  "metaTitle": "Meta title for search engines (50-60 characters)",
  "metaDescription": "Compelling meta description (140-155 characters, include keyword, end with CTA)",
  "excerpt": "2-3 sentence summary of the article (under 280 characters)",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "category": "one of: AIQ, State Counselling, Private Colleges, Cutoffs, Guides, News",
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "content": "Full markdown blog content (1200+ words). Use ## for H2 headings, ### for H3. Include introduction, multiple detailed sections with data, tips, comparison tables where relevant, and a strong conclusion. Use bullet points, numbered lists, and bold text for readability. Include internal linking suggestions as [Link Text](/suggested-path). Write for an Indian audience of NEET aspirants and parents.",
  "faqs": [
    {"question": "Frequently asked question 1?", "answer": "Detailed answer 1"},
    {"question": "Frequently asked question 2?", "answer": "Detailed answer 2"},
    {"question": "Frequently asked question 3?", "answer": "Detailed answer 3"},
    {"question": "Frequently asked question 4?", "answer": "Detailed answer 4"},
    {"question": "Frequently asked question 5?", "answer": "Detailed answer 5"}
  ]
}

IMPORTANT RULES:
- The content must be 1200+ words, authoritative, and factually accurate for 2026
- Include real data points where possible (approximate cutoff ranges, fee ranges, etc.)
- Write in a helpful, expert tone — not sales-y
- Every heading should be keyword-relevant
- Include a comparison table in markdown format if applicable
- FAQs should target long-tail search queries related to the keyword
- Return ONLY valid JSON, no explanation or markdown code fences`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', errorText);
      return NextResponse.json({ error: `Gemini API responded with ${response.status}: ${errorText}` }, { status: response.status });
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON from response (handle possible markdown fencing)
    let parsed;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      return NextResponse.json({
        success: true,
        raw: true,
        content: responseText,
        message: 'AI returned non-JSON response. Raw content provided for manual editing.',
      });
    }

    // Generate slug from title
    const slug = generateSlug(parsed.title || keyword);

    return NextResponse.json({
      success: true,
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
      },
    });
  } catch (error: any) {
    console.error('AI Blog Generation Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
