import { NextResponse } from 'next/server';
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

export async function POST(req: Request) {
  return NextResponse.json({ success: true, message: "Hello from route" });
}
