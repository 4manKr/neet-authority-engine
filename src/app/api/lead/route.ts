import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Lead } from '@/lib/db/models/Lead';

const VALID_SOURCES = ['rank-predictor', 'free-counselling', 'book-consultation', 'blog-pdf', 'newsletter'] as const;

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();

    const { name, email, phone, neetRank, neetScore, category, source, state, budget } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Valid name is required' }, { status: 400 });
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }
    if (!phone || typeof phone !== 'string' || !/^\+?[\d\s\-]{7,15}$/.test(phone)) {
      return NextResponse.json({ error: 'Valid phone number is required' }, { status: 400 });
    }

    const lead = new Lead({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      neetRank: neetRank ? Number(neetRank) : undefined,
      neetScore: neetScore ? Number(neetScore) : undefined,
      category: typeof category === 'string' ? category : undefined,
      source: VALID_SOURCES.includes(source) ? source : 'rank-predictor',
      state: typeof state === 'string' ? state : undefined,
      budget: typeof budget === 'string' ? budget : undefined,
      reportViewed: true,
    });
    await lead.save();

    return NextResponse.json({ success: true, leadId: lead._id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
