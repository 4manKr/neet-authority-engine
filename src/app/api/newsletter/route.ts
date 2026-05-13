import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Newsletter } from '@/lib/db/models/Newsletter';

// POST /api/newsletter - Subscribe to newsletter
export async function POST(req: Request) {
  try {
    const { email, name } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    await dbConnect();

    // Check if already subscribed
    const existing = await Newsletter.findOne({ email: email.toLowerCase() });
    if (existing) {
      if (existing.isActive) {
        return NextResponse.json({ success: true, message: 'You are already subscribed!' });
      }
      // Re-activate
      existing.isActive = true;
      await existing.save();
      return NextResponse.json({ success: true, message: 'Welcome back! Subscription re-activated.' });
    }

    const subscriber = new Newsletter({
      email: email.toLowerCase(),
      name: name || undefined,
    });
    await subscriber.save();

    return NextResponse.json({ success: true, message: 'Successfully subscribed!' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
