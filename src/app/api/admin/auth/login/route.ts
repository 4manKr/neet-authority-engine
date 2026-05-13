import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Admin } from '@/lib/db/models/Admin';
import { comparePassword, signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    await dbConnect();

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await comparePassword(password, admin.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Update last login
    admin.lastLoginAt = new Date();
    await admin.save();

    // Generate JWT
    const token = await signToken({
      id: admin._id.toString(),
      email: admin.email,
      role: admin.role,
    });

    // Set httpOnly cookie
    const response = NextResponse.json({
      success: true,
      user: { name: admin.name, email: admin.email, role: admin.role },
    });

    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
