import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Blog } from '@/lib/db/models/Blog';
import { Lead } from '@/lib/db/models/Lead';
import { Newsletter } from '@/lib/db/models/Newsletter';

// GET /api/admin/stats - Dashboard statistics
export async function GET() {
  try {
    await dbConnect();

    const [
      totalBlogs,
      publishedBlogs,
      draftBlogs,
      totalViews,
      totalLeads,
      totalSubscribers,
      recentBlogs,
      recentLeads,
    ] = await Promise.all([
      Blog.countDocuments(),
      Blog.countDocuments({ status: 'published' }),
      Blog.countDocuments({ status: 'draft' }),
      Blog.aggregate([{ $group: { _id: null, total: { $sum: '$viewCount' } } }]),
      Lead.countDocuments(),
      Newsletter.countDocuments({ isActive: true }),
      Blog.find()
        .select('title slug status publishedAt createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Lead.find()
        .select('name email source createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalBlogs,
        publishedBlogs,
        draftBlogs,
        totalViews: totalViews[0]?.total || 0,
        totalLeads,
        totalSubscribers,
        recentBlogs,
        recentLeads,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
