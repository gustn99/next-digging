import { NextResponse } from 'next/server';
import { getMetadata } from '@/lib/metadata';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    const meta = await getMetadata(url);
    if (!meta) {
      throw new Error('Failed to fetch metadata');
    }
    return NextResponse.json(meta);
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return NextResponse.json({ error: 'Failed to extract metadata' }, { status: 500 });
  }
}
