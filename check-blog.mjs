import mongoose from 'mongoose';
import { readFileSync, writeFileSync } from 'fs';

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

await mongoose.connect(process.env.MONGODB_URI);
const blog = await Blog.findOne({ slug: 'neet-re-exam' }).lean();
if (blog) {
  writeFileSync('debug-content.txt', blog.content || '(empty)');
  console.log('Written to debug-content.txt, length:', (blog.content||'').length);
}
await mongoose.disconnect();
