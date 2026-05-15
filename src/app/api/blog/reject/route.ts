import dbConnect from '@/lib/db/mongoose';
import { Blog } from '@/lib/db/models/Blog';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return new Response(page('Invalid link', 'No token provided.', false), {
      status: 400, headers: { 'Content-Type': 'text/html' },
    });
  }

  await dbConnect();
  const blog = await Blog.findOne({ approvalToken: token });

  if (!blog) {
    return new Response(page('Already processed', 'This blog has already been approved or rejected.', false), {
      status: 404, headers: { 'Content-Type': 'text/html' },
    });
  }

  await Blog.findByIdAndDelete(blog._id);

  return new Response(page('Blog Rejected', `"${blog.title}" has been deleted.`, true), {
    status: 200, headers: { 'Content-Type': 'text/html' },
  });
}

function page(title: string, message: string, success: boolean): string {
  const color = success ? '#dc2626' : '#6b7280';
  const icon = success ? '🗑️' : '⚠️';
  return `<!DOCTYPE html><html><head><title>${title}</title></head>
<body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f3f4f6;">
  <div style="text-align:center;max-width:400px;padding:32px;">
    <p style="font-size:40px;">${icon}</p>
    <h1 style="font-size:22px;color:${color};">${title}</h1>
    <p style="color:#6b7280;">${message}</p>
  </div>
</body></html>`;
}
