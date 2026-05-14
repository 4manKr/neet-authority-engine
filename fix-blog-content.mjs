import mongoose from 'mongoose';
import { readFileSync } from 'fs';

const envFile = readFileSync('.env.local', 'utf8');
envFile.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const idx = trimmed.indexOf('=');
  if (idx === -1) return;
  const key = trimmed.slice(0, idx).trim();
  let val = trimmed.slice(idx + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
  process.env[key] = val;
});

const BlogSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const Blog = mongoose.model('Blog', BlogSchema);

function fixContent(rawContent) {
  let text = rawContent.trim();

  // Strip markdown fencing like ```json ... ``` or ``` ... ```
  const fenceMatch = text.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/);
  if (fenceMatch) text = fenceMatch[1].trim();

  // Try clean JSON parse first
  try {
    const parsed = JSON.parse(text);
    return { success: true, data: parsed };
  } catch {}

  // Extract "content" field value with multiline regex
  // The pattern: find "content": " ... " where we stop at the next top-level key
  // Strategy: find the index of "content": " and then track from there
  const contentKey = '"content":';
  const ci = text.indexOf(contentKey);
  if (ci === -1) return { success: false, reason: 'no content key' };
  
  // Find the opening quote after "content":
  let i = ci + contentKey.length;
  while (i < text.length && text[i] !== '"') i++;
  if (i >= text.length) return { success: false, reason: 'no opening quote' };
  i++; // skip opening quote
  
  // Read until we find an unescaped closing quote
  let content = '';
  while (i < text.length) {
    if (text[i] === '\\') {
      // Escaped character
      const next = text[i + 1];
      if (next === 'n') content += '\n';
      else if (next === 't') content += '\t';
      else if (next === '"') content += '"';
      else if (next === '\\') content += '\\';
      else content += next;
      i += 2;
    } else if (text[i] === '"') {
      break; // end of content string
    } else {
      content += text[i];
      i++;
    }
  }

  // Also extract other simple string fields
  const getField = (key) => {
    const m = text.match(new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`));
    return m ? m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : null;
  };
  const getArray = (key) => {
    const m = text.match(new RegExp(`"${key}"\\s*:\\s*\\[([^\\]]+)\\]`));
    return m ? (m[1].match(/"([^"]+)"/g) || []).map(s => s.slice(1, -1)) : [];
  };

  return {
    success: true,
    data: {
      content,
      title: getField('title'),
      metaTitle: getField('metaTitle'),
      metaDescription: getField('metaDescription'),
      excerpt: getField('excerpt'),
      category: getField('category'),
      keywords: getArray('keywords'),
      tags: getArray('tags'),
    }
  };
}

await mongoose.connect(process.env.MONGODB_URI);
const blogs = await Blog.find({}).lean();
let fixed = 0;

for (const blog of blogs) {
  const content = blog.content || '';
  const trimmed = content.trim();
  
  const looksLikeJSON = trimmed.startsWith('```') || trimmed.startsWith('{');
  if (!looksLikeJSON) {
    console.log(`✓  OK: "${blog.title || blog.slug}"`);
    continue;
  }

  const result = fixContent(trimmed);
  if (!result.success) {
    console.log(`⚠️  Could not extract from "${blog.slug}": ${result.reason}`);
    continue;
  }

  const d = result.data;
  const updates = {};
  if (d.content) updates.content = d.content;
  if (d.title) updates.title = d.title;
  if (d.metaTitle) updates.metaTitle = d.metaTitle;
  if (d.metaDescription) updates.metaDescription = d.metaDescription;
  if (d.excerpt) updates.excerpt = d.excerpt;
  if (d.category) updates.category = d.category;
  if (d.keywords?.length) updates.keywords = d.keywords;
  if (d.tags?.length) updates.tags = d.tags;

  if (Object.keys(updates).length > 0) {
    await Blog.updateOne({ _id: blog._id }, { $set: updates });
    console.log(`✅ Fixed: "${blog.slug}" → ${Object.keys(updates).join(', ')}`);
    fixed++;
  }
}

console.log(`\nDone! Fixed ${fixed} of ${blogs.length} blogs.`);
await mongoose.disconnect();
