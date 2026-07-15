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
      } catch (e) {}
    }

    // 휴리스틱 방식으로 상품 리스트(이미지+링크) 추출 (최대 20개)
    const extractedProducts: Array<{ url: string, imageUrl: string }> = [];
    
    $('a').each((i, el) => {
      // 넉넉하게 추출 후 중복/유효성 검사
      if (extractedProducts.length >= 40) return; 

      const href = $(el).attr('href');
      const imgTag = $(el).find('img').first();
      let src = imgTag.attr('src') || imgTag.attr('data-src') || imgTag.attr('data-original');
      
      if (href && src) {
        const lowerHref = href.toLowerCase();
        const lowerSrc = src.toLowerCase();
        
        // URL 디코딩을 통해 인코딩된 문자열 복원 (예: %EB%A1%9C%EA%B3%A0 -> 로고)
        let decodedSrc = lowerSrc;
        try {
          decodedSrc = decodeURIComponent(lowerSrc);
        } catch (e) {
          // 디코딩 실패 시 안전하게 넘어감
        }
        
        // 노이즈 링크 및 이미지 필터링
        const isNoiseLink = ['javascript:', 'cart', 'login', 'board', 'member', 'mypage', 'policy', 'agreement', 'notice', 'review'].some(keyword => lowerHref.includes(keyword));
        
        const noiseImgKeywords = [
          'logo', 'icon', 'btn', 'button', 'banner', '.svg', 'data:image/svg',
          'cart', 'arrow', 'menu', 'nav', 'bg', 'background', 'popup', 'common', 'design', 'skin', 'layout',
          '로고', '장바구니', '카트', '버튼', '아이콘', '배너', '팝업'
        ];
        const isNoiseImg = noiseImgKeywords.some(keyword => decodedSrc.includes(keyword));
        
        const isAnchor = lowerHref === '#' || lowerHref.startsWith('#');

        if (!isNoiseLink && !isNoiseImg && !isAnchor) {
          try {
            const absoluteHref = new URL(href, url).href;
            const absoluteImg = new URL(src, url).href;
            
            // 동일 도메인 내의 링크만 취급 (외부 링크 배제)
            const urlObj = new URL(url);
            const hrefObj = new URL(absoluteHref);
            
            if (hrefObj.hostname.replace('www.', '') === urlObj.hostname.replace('www.', '')) {
              // 자기 자신(루트) 페이지 제외
              if (absoluteHref !== urlObj.origin + '/' && absoluteHref !== urlObj.origin) {
                // 중복 URL 방지
                if (!extractedProducts.some(p => p.url === absoluteHref)) {
                  extractedProducts.push({ url: absoluteHref, imageUrl: absoluteImg });
                }
              }
            }
          } catch (e) {
            // URL 파싱 에러 무시
          }
        }
      }
    });

    return {
      title: title.trim(),
      description: description.trim(),
      image: absoluteImage.trim(),
      siteName: siteName.trim(),
      type: type.trim(),
      keywords: keywords.trim(),
      extractedProducts: extractedProducts.slice(0, 20)
    };
  } catch (error) {
    console.error(`Error fetching metadata for ${url}:`, error);
    return null;
  }
}
