import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Blog } from '@/lib/db/models/Blog';

// GET /api/blog/search?q=keyword
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const q = req.nextUrl.searchParams.get('q');
    if (!q || q.length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Use text search index for full-text search
    const blogs = await Blog.find(
      {
        status: 'published',
        $text: { $search: q },
      },
      {
        score: { $meta: 'textScore' },
      }
    )
      .select('title slug excerpt category publishedAt')
      .sort({ score: { $meta: 'textScore' } })
      .limit(10)
      .lean();

    // Fallback to regex if text search returns nothing
    if (blogs.length === 0) {
      const regexBlogs = await Blog.find({
        status: 'published',
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { tags: { $regex: q, $options: 'i' } },
        ],
      })
        .select('title slug excerpt category publishedAt')
        .sort({ publishedAt: -1 })
        .limit(10)
        .lean();

      return NextResponse.json({ success: true, data: regexBlogs });
    }

    return NextResponse.json({ success: true, data: blogs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
