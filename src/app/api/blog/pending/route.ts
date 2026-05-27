import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Blog } from '@/lib/db/models/Blog';

export async function GET() {
  await dbConnect();
  const blogs = await Blog.find({ status: 'pending_approval' }, { title: 1, approvalToken: 1, createdAt: 1 }).lean();
  return NextResponse.json({ count: blogs.length, blogs });
}
