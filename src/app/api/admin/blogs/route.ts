import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Blog } from '@/lib/db/models/Blog';
import { generateSlug } from '@/lib/markdown';

// GET /api/admin/blogs - List all blogs (including drafts)
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const filter: any = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .select('title slug status category tags viewCount publishedAt createdAt isFeatured isTrending')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Blog.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: blogs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/blogs - Create new blog
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    // Auto-generate slug if not provided
    if (!body.slug) {
      body.slug = generateSlug(body.title);
    }

    // Set publishedAt if status is published
    if (body.status === 'published' && !body.publishedAt) {
      body.publishedAt = new Date();
    }

    // Generate excerpt from content if not provided
    if (!body.excerpt && body.content) {
      body.excerpt = body.content
        .replace(/[#*\[\]()_`>-]/g, '')
        .substring(0, 280)
        .trim() + '...';
    }

    // Default meta fields
    if (!body.metaTitle) body.metaTitle = body.title.substring(0, 70);
    if (!body.metaDescription) body.metaDescription = (body.excerpt || '').substring(0, 160);

    const blog = new Blog(body);
    await blog.save();

    return NextResponse.json({ success: true, data: blog }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'A blog with this slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
