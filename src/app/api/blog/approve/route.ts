import dbConnect from '@/lib/db/mongoose';
import { Blog } from '@/lib/db/models/Blog';
import { generateBlogImages } from '@/lib/blogImages';

export const maxDuration = 300;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return new Response(errorPage('Invalid link', 'No approval token provided.'), {
      status: 400, headers: { 'Content-Type': 'text/html' },
    });
  }

  await dbConnect();
  const blog = await Blog.findOne({ approvalToken: token });

  if (!blog) {
    return new Response(errorPage('Link expired', 'This blog has already been approved, rejected, or does not exist.'), {
      status: 404, headers: { 'Content-Type': 'text/html' },
    });
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://neetcounselling.info').replace(/\/$/, '');

  if (blog.status === 'published') {
    return new Response(successPage(blog.title, `${siteUrl}/blog/${blog.slug}`), {
      status: 200, headers: { 'Content-Type': 'text/html' },
    });
  }

  try {
    // Generate images now that admin approved
    const { featuredImage, content } = await generateBlogImages(
      blog.imagePrompts || {},
      blog.title,
      blog.content,
      blog.slug,
    );

    await Blog.findByIdAndUpdate(blog._id, {
      status: 'published',
      publishedAt: new Date(),
      featuredImage,
      content,
      $unset: { approvalToken: 1 },
    });

    return new Response(successPage(blog.title, `${siteUrl}/blog/${blog.slug}`), {
      status: 200, headers: { 'Content-Type': 'text/html' },
    });
  } catch (err: any) {
    console.error('Approve error:', err);
    return new Response(errorPage('Image generation failed', err.message || 'Please try again.'), {
      status: 500, headers: { 'Content-Type': 'text/html' },
    });
  }
}

function successPage(title: string, liveUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Published!</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;">
  <div style="text-align:center;max-width:480px;padding:40px 32px;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.08);">
    <div style="width:72px;height:72px;background:#dcfce7;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:36px;line-height:72px;">✅</div>
    <h1 style="margin:0 0 8px;font-size:26px;color:#15803d;font-weight:700;">Published!</h1>
    <p style="margin:0 0 6px;font-size:15px;color:#374151;font-weight:600;">${title}</p>
    <p style="margin:0 0 28px;font-size:14px;color:#6b7280;">Your blog is now live on NEETCounselling.info</p>
    <a href="${liveUrl}"
       style="display:inline-block;padding:12px 28px;background:#16a34a;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
      View Live Blog →
    </a>
  </div>
</body>
</html>`;
}

function errorPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html>
<head><title>${title}</title><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#fef2f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;">
  <div style="text-align:center;max-width:440px;padding:40px 32px;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.08);">
    <p style="font-size:40px;margin:0 0 16px;">⚠️</p>
    <h1 style="margin:0 0 8px;font-size:22px;color:#dc2626;">${title}</h1>
    <p style="margin:0;color:#6b7280;font-size:14px;">${message}</p>
  </div>
</body>
</html>`;
}
