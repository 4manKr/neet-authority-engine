// Shared blog image generation — used by generate route (images mode) and approve route

import dbConnect from '@/lib/db/mongoose';
import { Image } from '@/lib/db/models/Image';

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

// Save DALL-E base64 image to MongoDB and return a permanent serving URL
async function uploadToMongoDB(b64: string, folder: string): Promise<string> {
  await dbConnect();
  const buffer = Buffer.from(b64, 'base64');
  const doc = await Image.create({ data: buffer, contentType: 'image/png', folder });
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://neetcounselling.info').replace(/\/$/, '');
  return `${siteUrl}/api/images/${doc._id}`;
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
  return uploadToMongoDB(b64, folder);
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

const DEFAULT_THUMBNAIL =
  'Confident young Indian woman doctor in a pristine white lab coat and stethoscope, smiling at camera, ' +
  'modern hospital corridor background softly blurred, bright studio-quality lighting, professional headshot';

const DEFAULT_INLINE1 =
  'Flat-lay top-down view of a clean white desk with NEET study materials — open medical textbook showing ' +
  'anatomy diagrams, stethoscope, a notepad with neat handwriting, pen and green plant, bright natural window light, ' +
  'minimal aesthetic, product photography style';

const DEFAULT_INLINE2 =
  'Modern bright medical college counselling office interior, a senior Indian counsellor gesturing at a laptop ' +
  'screen showing college rankings, two students listening attentively across the desk, large window with natural ' +
  'daylight, tidy professional environment, candid documentary photography';

export async function generateBlogImages(
  imagePrompts: ImagePrompts,
  title: string,
  content: string,
  slug: string,
): Promise<{ featuredImage: string; content: string }> {
  const seed = simpleHash(title);
  const thumbnailPrompt = imagePrompts.thumbnail || DEFAULT_THUMBNAIL;
  const inline1Prompt   = imagePrompts.inline1   || DEFAULT_INLINE1;
  const inline2Prompt   = imagePrompts.inline2   || DEFAULT_INLINE2;

  const openaiKey = process.env.OPENAI_API_KEY;
  const useDalle = !!openaiKey; // MongoDB is always available, so just need the OpenAI key

  let thumbnailUrl: string;
  let inline1Url: string;
  let inline2Url: string;

  if (useDalle) {
    [thumbnailUrl, inline1Url, inline2Url] = await Promise.all([
      generateDalleImage(thumbnailPrompt, '1792x1024', `neet-blog/${slug}`, openaiKey!),
      generateDalleImage(inline1Prompt,   '1792x1024', `neet-blog/${slug}`, openaiKey!),
      generateDalleImage(inline2Prompt,   '1792x1024', `neet-blog/${slug}`, openaiKey!),
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
