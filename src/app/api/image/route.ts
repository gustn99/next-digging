import {NextRequest, NextResponse} from 'next/server';
import sharp from 'sharp';

export async function GET(request: NextRequest) {
	const url = request.nextUrl.searchParams.get('url');

	if (!url) {
		return new NextResponse('Missing url parameter', {status: 400});
	}

	let originalArrayBuffer: ArrayBuffer | null = null;
	let contentType = 'image/jpeg';

	try {
		const response = await fetch(url, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch image: ${response.statusText}`);
		}

		contentType = response.headers.get('content-type') || contentType;
		originalArrayBuffer = await response.arrayBuffer();
		const originalBuffer = Buffer.from(originalArrayBuffer);

		// sharp는 기본적으로 애니메이션(GIF, WebP)의 첫 프레임만 읽어들입니다.
		// 이를 png로 변환하면 빠르고 확실하게 정적 이미지가 생성됩니다.
		const staticImageBuffer = await sharp(originalBuffer)
		.png()
		.toBuffer();

		return new NextResponse(staticImageBuffer, {
			headers: {
				'Content-Type': 'image/png',
				'Cache-Control': 'public, max-age=31536000, immutable',
			},
		});
	} catch (error) {
		console.error('Error proxying and converting image:', error);

		// sharp 변환에 실패했지만 원본 이미지는 성공적으로 가져온 경우
		if (originalArrayBuffer) {
			return new NextResponse(originalArrayBuffer, {
				headers: {
					'Content-Type': contentType,
					'Cache-Control': 'public, max-age=31536000, immutable',
				},
			});
		}

		// 원본 이미지조차 가져오지 못했다면 리다이렉트
		return NextResponse.redirect(url);
	}
}
