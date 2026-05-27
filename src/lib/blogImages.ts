// Shared blog image generation — used by generate route (images mode) and approve route

import dbConnect from '@/lib/db/mongoose';

function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return Math.abs(h) % 99991;
}

const QUALITY_SUFFIX =
  ', professional stock photography, ultra sharp focus, perfect studio lighting, ' +
  'clean composition, 4K resolution, no text, no watermarks, no logos';

const NEGATIVE =
  'text, watermark, logo, words, letters, blurry, pixelated, cartoon, illustration, ' +
  '3d render, painting, sketch, ugly, distorted, overexposed, crowds, street scene, ' +
  'bad anatomy, duplicate limbs, disfigured';

export function pollinationsUrl(prompt: string, width: number, height: number, seed: number): string {
  const full = (prompt + QUALITY_SUFFIX).slice(0, 500);
  return (
    `https://image.pollinations.ai/prompt/${encodeURIComponent(full)}` +
    `?width=${width}&height=${height}&nologo=true&model=flux-realism&seed=${seed}` +
    `&negative=${encodeURIComponent(NEGATIVE)}`
  );
}


async function generateDalleImage(
  prompt: string,
  size: '1792x1024' | '1024x1024',
  folder: string,
  openaiKey: string,
): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt: (prompt + ' IMPORTANT: any text visible in the image must be perfectly spelled, accurate, and legible. No random characters, gibberish, or misspelled words anywhere.').slice(0, 4000),
      n: 1,
      size: size === '1792x1024' ? '1536x1024' : '1024x1024',
      quality: 'medium', // 'medium' ≈ $0.06 vs 'high' ≈ $0.50 — good enough for blog thumbnails
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Image generation error ${res.status}: ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  // gpt-image-1 returns b64_json
  const b64 = data.data?.[0]?.b64_json as string;
  if (!b64) throw new Error('Image generation returned no data');
  const buffer = Buffer.from(b64, 'base64');
  await dbConnect();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://neetcounselling.info').replace(/\/$/, '');
  const { Image } = await import('@/lib/db/models/Image');
  const doc = await Image.create({ data: buffer, contentType: 'image/png', folder });
  return `${siteUrl}/api/images/${doc._id}`;
}

export function insertInlineImages(
  content: string,
  images: Array<{ url: string; alt: string }>,
): string {
  if (!images.length) return content;
  const sections = content.split(/(?=\n## )/);
  if (sections.length < 3) return content + images.map(img => `\n\n![${img.alt}](${img.url})\n`).join('');
  const result = [...sections];
  if (images[0] && result.length >= 2) {
    result[1] = result[1].trimEnd() + `\n\n![${images[0].alt}](${images[0].url})\n`;
  }
  const midIdx = Math.max(2, Math.floor(result.length / 2));
  if (images[1] && result.length >= 4 && midIdx !== 1) {
    result[midIdx] = result[midIdx].trimEnd() + `\n\n![${images[1].alt}](${images[1].url})\n`;
  }
  return result.join('');
}

export interface ImagePrompts {
  thumbnail?: string;
  inline1?: string;
  inline2?: string;
}

// Dynamic fallbacks — built from blog title + category so every blog gets
// contextually relevant images even when AI-generated prompts are absent.
function buildFallbackPrompts(title: string, category: string) {
  const topic = title.replace(/[^a-zA-Z0-9\s]/g, '').slice(0, 60);
  const cat = category || 'NEET counselling';

  return {
    thumbnail:
      `Professional indoor photograph for a blog about "${topic}". ` +
      `A focused Indian medical student or counsellor at a clean modern desk, ` +
      `${cat} documents or laptop visible, warm studio lighting, shallow depth of field, ` +
      `no text overlays, no outdoor scenes, no crowds, photorealistic`,

    inline1:
      `Top-down flat-lay on a white desk: items directly related to ${cat} — ` +
      `NEET forms, a pen, organised notes about "${topic}", ` +
      `a laptop showing a college ranking table, small plant, bright natural window light, ` +
      `minimal clean aesthetic, no text on papers, product photography`,

    inline2:
      `Indian medical college counselling session: a senior counsellor pointing at a laptop screen ` +
      `showing information about ${cat}, one attentive student across the desk, ` +
      `modern bright office with large window, natural daylight, ` +
      `professional candid photography, no text visible, photorealistic`,
  };
}

// Reject a stored prompt if it looks like an instruction rather than a real visual description.
function isValidPrompt(p: string | undefined): p is string {
  if (!p || p.trim().length < 20) return false;
  const lower = p.toLowerCase();
  // Discard meta-instructions Gemini sometimes outputs instead of real prompts
  if (lower.startsWith('write') || lower.startsWith('generate') || lower.startsWith('create an image')) return false;
  return true;
}

export async function generateBlogImages(
  imagePrompts: ImagePrompts,
  title: string,
  content: string,
  slug: string,
  category = 'NEET counselling',
): Promise<{ featuredImage: string; content: string }> {
  const seed = simpleHash(title);
  const fallback = buildFallbackPrompts(title, category);

  const thumbnailPrompt = isValidPrompt(imagePrompts.thumbnail) ? imagePrompts.thumbnail : fallback.thumbnail;
  const inline1Prompt   = isValidPrompt(imagePrompts.inline1)   ? imagePrompts.inline1   : fallback.inline1;
  const inline2Prompt   = isValidPrompt(imagePrompts.inline2)   ? imagePrompts.inline2   : fallback.inline2;

  const openaiKey = process.env.OPENAI_API_KEY;

  let thumbnailUrl: string;
  let inline1Url: string;
  let inline2Url: string;

  if (openaiKey) {
    // All 3 calls run in parallel — total wall-clock time ≈ 20 s (1 image worth of latency).
    // gpt-image-1 medium quality: ~$0.065/image → ~$0.20/blog for 3 images.
    [thumbnailUrl, inline1Url, inline2Url] = await Promise.all([
      generateDalleImage(thumbnailPrompt, '1792x1024', `neet-blog/${slug}`, openaiKey),
      generateDalleImage(inline1Prompt,   '1792x1024', `neet-blog/${slug}`, openaiKey),
      generateDalleImage(inline2Prompt,   '1792x1024', `neet-blog/${slug}`, openaiKey),
    ]);
  } else {
    thumbnailUrl = pollinationsUrl(thumbnailPrompt, 1200, 630, seed);
    inline1Url   = pollinationsUrl(inline1Prompt,   1200, 800, seed + 1);
    inline2Url   = pollinationsUrl(inline2Prompt,   1200, 800, seed + 2);
  }

  const contentWithImages = insertInlineImages(content, [
    { url: inline1Url, alt: `${title} — visual guide` },
    { url: inline2Url, alt: 'NEET counselling — expert guidance' },
  ]);

  return { featuredImage: thumbnailUrl, content: contentWithImages };
}
