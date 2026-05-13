import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Lead } from '@/lib/db/models/Lead';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    
    // Save the lead to DB
    const lead = new Lead({
      ...body,
      reportViewed: true
    });
    await lead.save();

    return NextResponse.json({ success: true, leadId: lead._id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
