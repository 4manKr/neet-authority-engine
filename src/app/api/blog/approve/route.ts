import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
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

  if (blog.status === 'published') {
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://neetcounselling.info').replace(/\/$/, '');
    return Response.redirect(`${siteUrl}/blog/${blog.slug}`);
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

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://neetcounselling.info').replace(/\/$/, '');
    return Response.redirect(`${siteUrl}/blog/${blog.slug}`);
  } catch (err: any) {
    console.error('Approve error:', err);
    return new Response(errorPage('Image generation failed', err.message || 'Please try again.'), {
      status: 500, headers: { 'Content-Type': 'text/html' },
    });
  }
}

function errorPage(title: string, message: string): string {
  return `<!DOCTYPE html><html><head><title>${title}</title></head>
<body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f3f4f6;">
  <div style="text-align:center;max-width:400px;padding:32px;">
    <p style="font-size:40px;">⚠️</p>
    <h1 style="font-size:22px;color:#111827;">${title}</h1>
    <p style="color:#6b7280;">${message}</p>
  </div>
</body></html>`;
}
