export const getStaticImageUrl = (url: string) => {
	if (!url) return '';
	const lowerUrl = url.toLowerCase();
	if (lowerUrl.includes('.gif') || lowerUrl.includes('.webp')) {
		return `/api/image?url=${encodeURIComponent(url)}`;
	}
	return url;
};
