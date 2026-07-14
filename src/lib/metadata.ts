import * as cheerio from 'cheerio';

export async function getMetadata(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
    const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
    const image = $('meta[property="og:image"]').attr('content') || '';
    const siteName = $('meta[property="og:site_name"]').attr('content') || '';
    const type = $('meta[property="og:type"]').attr('content') || '';
    const keywords = $('meta[name="keywords"]').attr('content') || '';

    let absoluteImage = image;
    if (image && !image.startsWith('http')) {
      try {
        const urlObj = new URL(url);
        if (image.startsWith('//')) {
          absoluteImage = `${urlObj.protocol}${image}`;
        } else if (image.startsWith('/')) {
          absoluteImage = `${urlObj.origin}${image}`;
        } else {
          absoluteImage = `${urlObj.origin}/${image}`;
        }
      } catch (e) {
      }
    }

    return {
      title: title.trim(),
      description: description.trim(),
      image: absoluteImage.trim(),
      siteName: siteName.trim(),
      type: type.trim(),
      keywords: keywords.trim()
    };
  } catch (error) {
    console.error(`Error fetching metadata for ${url}:`, error);
    return null;
  }
}
