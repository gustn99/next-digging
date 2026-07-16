import {NextRequest, NextResponse} from 'next/server';

export async function GET(request: NextRequest) {
	const url = request.nextUrl.searchParams.get('url');

	if (!url) {
		return new NextResponse('Missing url parameter', {status: 400});
	}

	try {
		const response = await fetch(url, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch image: ${response.statusText}`);
		}

		const contentType = response.headers.get('content-type') || 'image/jpeg';
		const originalArrayBuffer = await response.arrayBuffer();

		return new NextResponse(originalArrayBuffer, {
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=31536000, immutable',
			},
		});
	} catch (error) {
		console.error('Error proxying image:', error);
		return NextResponse.redirect(url);
	}
}
