'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, StickyNote } from 'lucide-react';
import { Badge } from '@/components/ui';
import { useStores } from '@/lib/storeHooks';

function ShopDetailContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const id = searchParams.get('id');
	const { stores, isMounted } = useStores();

	if (!isMounted) return null;

	const store = stores.find(s => s.id === id);
	if (!store) {
		return (
			<div className="min-h-screen bg-zinc-50 font-sans flex items-center justify-center">
				<div className="text-center">
					<p className="text-zinc-500 mb-4">스토어를 찾을 수 없습니다.</p>
					<button 
						onClick={() => router.push('/')}
						className="text-sm font-medium text-zinc-900 hover:underline"
					>
						메인으로 돌아가기
					</button>
				</div>
			</div>
		);
	}

	const userProducts = (store.products || []).filter(p => !p.isCrawled);
	const crawledProducts = (store.products || []).filter(p => p.isCrawled);

	return (
		<div className="min-h-screen bg-zinc-50 font-sans text-zinc-900">
			<header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
				<div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
					<div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
						<div className="w-8 h-8 bg-zinc-900 text-white rounded-lg flex items-center justify-center font-bold text-xl">
							D
						</div>
						<h1 className="text-xl font-bold tracking-tight">Digging</h1>
					</div>
				</div>
			</header>

			<main className="max-w-4xl mx-auto px-4 py-8">
				<div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
					<button 
						onClick={() => router.push('/')}
						className="mb-6 flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
					>
						<ArrowLeft className="h-4 w-4 mr-1" />
						목록으로 돌아가기
					</button>

					<div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm p-6 sm:p-8 mb-8">
						<div className="flex justify-between items-start mb-4">
							<div>
								<div className="flex items-center gap-2 mb-2">
									<h2 className="text-2xl font-bold text-zinc-900">{store.storeName}</h2>
									<Badge className="bg-zinc-900 text-white border-none shadow-none">{store.category}</Badge>
								</div>
								<a href={store.url} target="_blank" rel="noreferrer" className="text-sm text-zinc-500 hover:text-zinc-800 hover:underline flex items-center gap-1">
									{store.url} <ExternalLink className="h-3 w-3" />
								</a>
							</div>
						</div>
						
						<p className="text-zinc-700 leading-relaxed">{store.description}</p>
						
						{store.memo && (
							<div className="bg-zinc-50 border border-zinc-100 rounded-lg p-4 mb-6 mt-4 flex items-start gap-3">
								<StickyNote className="h-5 w-5 text-zinc-400 shrink-0 mt-0.5" />
								<p className="text-zinc-800 whitespace-pre-wrap">{store.memo}</p>
							</div>
						)}

						<div className="flex flex-wrap gap-2 mt-auto">
							{store.tags.map(tag => (
								<span key={tag} className="px-2.5 py-1 bg-zinc-100 text-zinc-600 rounded-md text-xs font-medium">{tag}</span>
							))}
						</div>
					</div>

					{userProducts.length > 0 && (
						<div className="mb-12">
							<h3 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
								내가 저장한 상품 <span className="bg-zinc-100 text-zinc-600 text-xs py-0.5 px-2 rounded-full">{userProducts.length}</span>
							</h3>
							<div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
								{userProducts.map(product => (
									<a key={product.id} href={product.url} target="_blank" rel="noreferrer" className="shrink-0 w-[calc(50%-4px)] group block">
										<div className="aspect-square rounded-xl overflow-hidden border border-zinc-200 bg-white relative group-hover:border-zinc-300 transition-colors">
											<img src={product.imageUrl} alt="저장한 상품" className="w-full h-full object-cover" />
											<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
												<ExternalLink className="text-white opacity-0 group-hover:opacity-100 h-6 w-6 drop-shadow-md" />
											</div>
										</div>
									</a>
								))}
							</div>
						</div>
					)}

					<div>
						<h3 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
							이 스토어의 다른 상품들 <span className="bg-zinc-100 text-zinc-600 text-xs py-0.5 px-2 rounded-full">{crawledProducts.length}</span>
						</h3>
						{crawledProducts.length > 0 ? (
							<div className="grid grid-cols-2 gap-2">
								{crawledProducts.map(product => (
									<a key={product.id} href={product.url} target="_blank" rel="noreferrer" className="group block">
										<div className="aspect-square rounded-xl overflow-hidden border border-zinc-200 bg-white relative group-hover:border-zinc-300 transition-colors">
											<img src={product.imageUrl} alt="크롤링된 상품" className="w-full h-full object-cover" />
											<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
												<ExternalLink className="text-white opacity-0 group-hover:opacity-100 h-6 w-6 drop-shadow-md" />
											</div>
										</div>
									</a>
								))}
							</div>
						) : (
							<div className="py-12 text-center bg-white rounded-xl border border-dashed border-zinc-300">
								<p className="text-zinc-500">자동으로 찾은 추가 상품이 없습니다.</p>
							</div>
						)}
					</div>
				</div>
			</main>
		</div>
	);
}

export default function ShopPage() {
	return (
		<Suspense fallback={<div className="min-h-screen bg-zinc-50" />}>
			<ShopDetailContent />
		</Suspense>
	);
}
