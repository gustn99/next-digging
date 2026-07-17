'use client';

import {Badge, Button, Input} from '@/components/ui';
import {useStores} from '@/lib/storeHooks';
import {Store} from '@/lib/types';
import {getStaticImageUrl} from '@/lib/utils';
import {ChevronRight, ExternalLink, FolderPlus, Link as LinkIcon, Loader2, Plus, Search, Star, StickyNote, Trash2} from 'lucide-react';
import {useRouter} from 'next/navigation';
import React, {useEffect, useState} from 'react';

export default function Home() {
	const router = useRouter();
	const {stores, saveStores, isMounted} = useStores();
	const [urlInput, setUrlInput] = useState('');
	const [memoInput, setMemoInput] = useState('');
	const [isAdding, setIsAdding] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [errorMsg, setErrorMsg] = useState('');

	const processedShare = React.useRef(false);

	const processAddLink = async (targetUrl: string, targetMemo: string, currentStores: Store[]) => {
		if (isAdding) return;
		if (!targetUrl.trim()) return;

		let normalizedInput = targetUrl.trim();
		if (!normalizedInput.startsWith('http')) {
			normalizedInput = `https://${normalizedInput}`;
		}

		let urlObj;
		try {
			urlObj = new URL(normalizedInput);
		} catch (e) {
			setErrorMsg('유효한 URL을 입력해주세요.');
			return;
		}

		const origin = urlObj.origin;
		const isProductPath = urlObj.pathname.length > 1 && urlObj.pathname !== '/';
		const isLikelyNotProduct = /\/(mypage|cart|login|member|board|notice|customer)/i.test(urlObj.pathname);
		let isProduct = isProductPath && !isLikelyNotProduct;

		const existingStore = currentStores.find(store => store.url === origin);

		if (existingStore) {
			if (isProduct) {
				const isDuplicateProduct = existingStore.products?.some(p => p.url === normalizedInput);
				if (isDuplicateProduct) {
					setErrorMsg('이미 아카이빙된 상품입니다.');
					return;
				}
			} else {
				setErrorMsg('이미 아카이빙된 스토어입니다.');
				return;
			}
		}

		setErrorMsg('');
		setIsAdding(true);

		try {
			const res = await fetch(`/api/metadata?url=${encodeURIComponent(normalizedInput)}`);
			if (!res.ok) throw new Error('Failed to fetch');
			const meta = await res.json();

			let rootMeta = meta;
			if (normalizedInput !== origin && normalizedInput !== origin + '/') {
				try {
					const rootRes = await fetch(`/api/metadata?url=${encodeURIComponent(origin)}`);
					if (rootRes.ok) {
						rootMeta = await rootRes.json();
					}
				} catch (e) {
					console.warn('Failed to fetch root metadata', e);
				}
			}

			const domain = origin.replace(/^(https?:\/\/)?(www\.)?/, '');
			const domainName = domain.split('.')[0].toLowerCase();

			const storeName = rootMeta.siteName || rootMeta.title?.split(' - ')[0] || rootMeta.title?.split('|')[0] || domainName.toUpperCase();
			const description = rootMeta.description || `${storeName}의 유니크한 아이템들을 만나보세요.`;

			const tags = rootMeta.keywords
				? rootMeta.keywords
				.split(',')
				.map((k: string) => k.trim())
				.filter((k: string) => {
					if (!k) return false;
					if (k.length < 3 || k.length > 5) return false;
					if (k.toLowerCase() === storeName.toLowerCase()) return false;
					return true;
				})
				.map((k: string) => '#' + k)
				.slice(0, 4)
				: [];

			if (meta.type?.includes('product')) {
				isProduct = true;
			}

			let nextStores = [...currentStores];
			const existingIdx = nextStores.findIndex(s => s.url === origin);

			if (existingIdx !== -1) {
				const existing = nextStores[existingIdx];
				if (isProduct) {
					const newProduct = {
						id: Math.random().toString(36).substring(2, 15),
						url: normalizedInput,
						imageUrl: meta.image || `https://picsum.photos/seed/${Math.random()}/200/200`,
					};
					const updatedStore = {
						...existing,
						products: [newProduct, ...(existing.products || [])],
						memo: targetMemo || existing.memo,
					};
					nextStores.splice(existingIdx, 1);
					nextStores = [updatedStore, ...nextStores];
				} else {
					const updatedStore = {
						...existing,
						memo: targetMemo || existing.memo,
					};
					nextStores.splice(existingIdx, 1);
					nextStores = [updatedStore, ...nextStores];
				}
			} else {
				const products: { id: string, url: string, imageUrl: string, isCrawled?: boolean }[] = [];
				if (isProduct) {
					products.push({
						id: Math.random().toString(36).substring(2, 15),
						url: normalizedInput,
						imageUrl: meta.image || `https://picsum.photos/seed/${Math.random()}/200/200`,
					});
				}

				if (rootMeta.extractedProducts && rootMeta.extractedProducts.length > 0) {
					rootMeta.extractedProducts.forEach((ep: { url: string, imageUrl: string }) => {
						if (!products.some(p => p.url === ep.url) && products.length < 20) {
							products.push({
								id: Math.random().toString(36).substring(2, 15),
								url: ep.url,
								imageUrl: ep.imageUrl,
								isCrawled: true,
							});
						}
					});
				}

				const newStore: Store = {
					id: Math.random().toString(36).substring(2, 15),
					url: origin,
					storeName,
					category: '패션/의류',
					tags,
					description,
					memo: targetMemo,
					products,
					addedAt: new Date().toISOString(),
				};
				nextStores = [newStore, ...nextStores];
			}

			saveStores(nextStores);
			setUrlInput('');
			setMemoInput('');
		} catch (error) {
			console.error(error);
			setErrorMsg('메타데이터를 가져오는데 실패했습니다.');
		} finally {
			setIsAdding(false);
		}
	};

	useEffect(() => {
		if (typeof window !== 'undefined' && isMounted && !processedShare.current) {
			const params = new URLSearchParams(window.location.search);
			const shareUrl = params.get('url') || params.get('text');

			if (shareUrl && shareUrl.startsWith('http')) {
				processedShare.current = true;
				const newUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
				window.history.replaceState({path: newUrl}, '', newUrl);

				// eslint-disable-next-line react-hooks/set-state-in-effect
				setUrlInput(shareUrl);
				processAddLink(shareUrl, '', stores);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isMounted, stores]);

	const handleAddLink = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		await processAddLink(urlInput, memoInput, stores);
	};

	const handleDelete = (id: string) => {
		saveStores(stores.filter(store => store.id !== id));
	};

	const filteredStores = stores.filter(store => {
		const query = searchQuery.toLowerCase();
		return (
			store.storeName.toLowerCase().includes(query) ||
			store.tags.some(tag => tag.toLowerCase().includes(query)) ||
			store.category.toLowerCase().includes(query)
		);
	});

	if (!isMounted) return null;

	return (
		<div className="min-h-screen bg-zinc-50 font-sans text-zinc-900">
			<header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
				<div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<div className="w-8 h-8 bg-zinc-900 text-white rounded-lg flex items-center justify-center font-bold text-xl">
							D
						</div>
						<h1 className="text-xl font-bold tracking-tight flex items-center">Digging
							{/*<span>D</span>*/}
							{/*<span className="relative inline-block">*/}
							{/*	<span className="invisible">i</span>*/}
							{/*	<span className="absolute inset-0 text-primary-teal" style={{ clipPath: 'inset(0 0 65% 0)' }}>i</span>*/}
							{/*	<span className="absolute inset-0 text-zinc-900" style={{ clipPath: 'inset(35% 0 0 0)' }}>i</span>*/}
							{/*</span>*/}
							{/*<span>gging</span>*/}
						</h1>
					</div>
					{/* <nav className="hidden sm:flex gap-6 text-sm font-medium text-zinc-500">
						<a href="#" className="text-zinc-900">내 아카이브</a>
						<a href="#" className="hover:text-zinc-900">컬렉션</a>
						<a href="#" className="hover:text-zinc-900">탐색</a>
					</nav> */}
					<div className="w-8"/>
				</div>
			</header>

			<main className="max-w-4xl mx-auto px-4 py-8">
				<section className="mb-10">
					<div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
						<h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
							<LinkIcon className="h-5 w-5"/>
							새로운 스토어 발굴하기
						</h2>
						<p className="text-sm text-zinc-500 mb-4">
							쇼핑몰 상세 상품 링크나 스토어 홈 링크를 붙여넣어 아카이빙하세요.
						</p>
						<form onSubmit={handleAddLink} className="flex flex-col gap-3">
							<div className="flex gap-2">
								<Input
									type="url"
									placeholder="https://..."
									className="flex-1"
									value={urlInput}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
										setUrlInput(e.target.value);
										if (errorMsg) setErrorMsg('');
									}}
									required
								/>
								<Button type="submit" disabled={isAdding} className="shrink-0">
									{isAdding ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin"/>
											저장 중...
										</>
									) : (
										<>
											저장하기
											<Plus className="ml-2 h-4 w-4"/>
										</>
									)}
								</Button>
							</div>
							{errorMsg && <p className="text-red-500 text-sm mt-0 mb-1">{errorMsg}</p>}
							{/* <Input
								type="text"
								placeholder="이 스토어/상품에 대한 메모를 남겨보세요"
								value={memoInput}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMemoInput(e.target.value)}
								className="bg-zinc-50/50"
							/> */}
						</form>
					</div>
				</section>

				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
					<div className="text-sm font-medium text-zinc-700">
						총 <span className="font-bold text-zinc-900">{filteredStores.length}</span>개의 스토어
					</div>
					<div className="relative w-full sm:w-64">
						<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400"/>
						<Input
							type="text"
							placeholder="스토어명, 태그 검색..."
							className="pl-9 bg-white"
							value={searchQuery}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
						/>
					</div>
				</div>

				{filteredStores.length === 0 ? (
					<div className="text-center py-20 bg-white border border-dashed border-zinc-300 rounded-xl">
						<FolderPlus className="h-10 w-10 text-zinc-400 mx-auto mb-3"/>
						<p className="text-zinc-500 text-sm">저장된 스토어가 없습니다.</p>
						<p className="text-zinc-400 text-xs mt-1">링크를 추가하여 첫 번째 스토어를 아카이빙 해보세요.</p>
					</div>
				) : (
					<div className="flex flex-col gap-4">
						{filteredStores.map((store) => (
							<div
								key={store.id}
								className="group bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 p-5"
							>
								<div className="flex justify-between items-start mb-2">
									<div className="truncate pr-4 flex-1">
										<div className="flex items-center gap-2 mb-1">
											<h4 className="font-semibold text-lg text-zinc-900 truncate">
												{store.storeName}
											</h4>
											<Badge className="bg-zinc-900 text-white border-none text-[10px] px-2 py-0.5 font-medium shadow-none">
												{store.category}
											</Badge>
										</div>
										<a
											href={store.url}
											target="_blank"
											rel="noreferrer"
											className="text-xs text-zinc-400 hover:text-zinc-600 hover:underline truncate inline-flex items-center gap-1"
										>
											{store.url}
											<ExternalLink className="h-3 w-3"/>
										</a>
									</div>
									<button
										onClick={() => handleDelete(store.id)}
										className="text-zinc-400 hover:text-red-500 transition-colors shrink-0 p-1.5 rounded-md hover:bg-red-50"
										title="삭제"
									>
										<Trash2 className="h-4 w-4"/>
									</button>
								</div>

								<p className="text-sm text-zinc-500 line-clamp-2 mb-3 mt-1.5">
									{store.description}
								</p>

								{store.memo && (
									<div className="bg-zinc-50 border border-zinc-100 rounded-lg p-2.5 mb-3 flex items-start gap-2">
										<StickyNote className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5"/>
										<p className="text-sm text-zinc-700 leading-snug">{store.memo}</p>
									</div>
								)}

								{(() => {
									const userProducts = (store.products || []).filter(p => !p.isCrawled);
									const crawledProducts = (store.products || []).filter(p => p.isCrawled);
									const displayProducts = [...userProducts, ...crawledProducts].slice(0, 4);
									return (
										<div className="flex gap-1 overflow-x-auto pb-2 mt-1 scrollbar-hide">
											{displayProducts.map(product => (
												<a
													key={product.id}
													href={product.url}
													target="_blank"
													rel="noreferrer"
													className="shrink-0 group/item relative"
													title="상품 상세 보기"
												>
													<div className="w-22 h-22 sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-50 relative group-hover/item:border-zinc-300 transition-colors">
														<img src={getStaticImageUrl(product.imageUrl)} alt="상품 이미지" className="w-full h-full object-cover"/>
														{!product.isCrawled && (
															<div className="absolute top-1.5 right-1.5 z-10 drop-shadow-sm">
																<Star className="h-4 w-4 text-teal-300 fill-teal-300"/>
															</div>
														)}
														<div className="absolute inset-0 bg-black/0 group-hover/item:bg-black/10 transition-colors flex items-center justify-center">
															<ExternalLink className="text-white opacity-0 group-hover/item:opacity-100 h-5 w-5 drop-shadow-md"/>
														</div>
													</div>
												</a>
											))}

											<button
												onClick={() => {
													router.push(`/shop?id=${store.id}`);
												}}
												className="shrink-0 w-22 h-22 sm:w-24 sm:h-24 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 flex flex-col items-center justify-center text-zinc-500 hover:text-zinc-900 hover:border-zinc-400 hover:bg-zinc-100 transition-colors"
											>
												<ChevronRight className="h-5 w-5 mb-1 text-zinc-400"/>
												<span className="text-xs font-medium">더보기</span>
											</button>
										</div>
									);
								})()}

								<div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-100">
									<div className="flex flex-wrap gap-1.5 overflow-hidden">
										{store.tags.map(tag => (
											<span key={tag} className="inline-flex items-center text-xs px-2 py-0.5 bg-zinc-100/80 text-zinc-600 rounded-md whitespace-nowrap">
												{tag}
											</span>
										))}
										{/* <button className="inline-flex items-center text-xs px-2 py-0.5 border border-dashed border-zinc-300 text-zinc-400 rounded-md hover:bg-zinc-50 hover:text-zinc-600 transition-colors whitespace-nowrap">
											<Plus className="h-3 w-3 mr-1"/>
											태그
										</button> */}
									</div>
									<span className="text-xs text-zinc-400 whitespace-nowrap ml-4">
										{new Date(store.addedAt).toLocaleDateString()}
									</span>
								</div>
							</div>
						))}
					</div>
				)}
			</main>
		</div>
	);
}
