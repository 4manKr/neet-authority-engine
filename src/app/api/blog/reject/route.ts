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

function page(title: string, message: string, rejected: boolean): string {
  const bg = rejected ? '#fef2f2' : '#f3f4f6';
  const iconBg = rejected ? '#fee2e2' : '#f3f4f6';
  const iconColor = rejected ? '#dc2626' : '#6b7280';
  const icon = rejected ? '✕' : '⚠️';
  const heading = rejected ? '#dc2626' : '#374151';
  return `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:${bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;">
  <div style="text-align:center;max-width:480px;padding:40px 32px;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.08);">
    <div style="width:72px;height:72px;background:${iconBg};border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:32px;font-weight:700;color:${iconColor};line-height:72px;">${icon}</div>
    <h1 style="margin:0 0 10px;font-size:26px;color:${heading};font-weight:700;">${title}</h1>
    <p style="margin:0;font-size:14px;color:#6b7280;">${message}</p>
  </div>
</body>
</html>`;
}
