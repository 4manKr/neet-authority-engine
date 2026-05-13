import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Admin } from '@/lib/db/models/Admin';
import { hashPassword } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { secret, email, password, name } = await req.json();

    // Protect with a seed secret
    const seedSecret = process.env.ADMIN_SEED_SECRET;
    if (!seedSecret || secret !== seedSecret) {
      return NextResponse.json({ error: 'Invalid seed secret' }, { status: 403 });
    }

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, password, and name are required' }, { status: 400 });
    }

    await dbConnect();

    // Check if admin already exists
    const existing = await Admin.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: 'Admin already exists' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const admin = new Admin({
      email: email.toLowerCase(),
      passwordHash,
      name,
      role: 'admin',
    });

    await admin.save();

    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully',
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
