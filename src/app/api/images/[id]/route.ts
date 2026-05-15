import dbConnect from '@/lib/db/mongoose';
import { Image } from '@/lib/db/models/Image';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!id || !/^[a-f\d]{24}$/i.test(id)) {
    return new Response('Not found', { status: 404 });
  }

  await dbConnect();
  const image = await Image.findById(id).lean();

  if (!image) return new Response('Not found', { status: 404 });

  return new Response(image.data.buffer as ArrayBuffer, {
    headers: {
      'Content-Type': image.contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
