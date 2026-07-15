export interface StoreProduct {
	id: string;
	url: string;
	imageUrl: string;
	isCrawled?: boolean;
}

export interface Store {
	id: string;
	url: string;
	storeName: string;
	category: string;
	tags: string[];
	description: string;
	memo: string;
	products: StoreProduct[];
	addedAt: string;
}
