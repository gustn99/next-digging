"use client";

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Link as LinkIcon, 
  Search, 
  ExternalLink,
  Trash2,
  FolderPlus,
  StickyNote
} from 'lucide-react';

// Shadcn UI 스타일의 Button 컴포넌트
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = "default", size = "default", ...props }, ref) => {
  const variants: Record<string, string> = {
    default: "bg-zinc-900 text-white hover:bg-zinc-800",
    outline: "border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-900",
    ghost: "hover:bg-zinc-100 text-zinc-700",
  };
  const sizes: Record<string, string> = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    icon: "h-10 w-10",
  };
  
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className || ''}`}
      {...props}
    />
  );
});
Button.displayName = "Button";

// Shadcn UI 스타일의 Input 컴포넌트
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={`flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

// Shadcn UI 스타일의 Badge 컴포넌트
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline";
}

const Badge = ({ className, variant = "default", ...props }: BadgeProps) => {
  const variants: Record<string, string> = {
    default: "border-transparent bg-zinc-900 text-white hover:bg-zinc-800",
    secondary: "border-transparent bg-zinc-100 text-zinc-900 hover:bg-zinc-100/80",
    outline: "text-zinc-950",
  };
  
  return (
    <div className={`inline-flex items-center rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 ${variants[variant]} ${className || ''}`} {...props} />
  );
};

// 모의 데이터 생성을 위한 헬퍼 함수
const generateMockMetadata = (inputUrl: string, memo: string = '') => {
  // URL 분석 및 루트(Origin) 도출
  let origin = inputUrl;
  let isProduct = false;
  
  try {
    const urlObj = new URL(inputUrl);
    origin = urlObj.origin;
    // 경로가 '/' 보다 길면 상품 상세 페이지로 간주
    isProduct = urlObj.pathname.length > 1 && urlObj.pathname !== '/';
  } catch(e) {
    const domainMatch = inputUrl.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img);
    if (domainMatch) {
      origin = domainMatch[0];
    }
  }

  const domain = origin.replace(/^(https?:\/\/)?(www\.)?/, '');
  const domainName = domain.split('.')[0].toLowerCase();

  // URL 기반으로 그럴듯한 모의 데이터 생성
  let storeName = domainName.toUpperCase();
  let category = '패션/의류';
  let tags: string[] = [];

  // 메타데이터(URL 키워드) 기반 태그 자동 분류 로직
  const keywordMap: Record<string, string[]> = {
    'slowand': ['#감성', '#슬랙스', '#베이직'],
    'musinsa': ['#브랜드', '#스트릿', '#무진장'],
    'zigzag': ['#트렌디', '#다양함', '#여성복'],
    'vintage': ['#빈티지', '#구제', '#유니크'],
    'mood': ['#무드', '#데일리룩', '#데이트룩'],
    'daily': ['#데일리', '#캐주얼', '#편안한'],
  };

  for (const [key, value] of Object.entries(keywordMap)) {
    if (inputUrl.toLowerCase().includes(key)) {
      tags = [...tags, ...value];
    }
  }

  if (tags.length === 0) {
    tags = ['#트렌디', '#신상'];
  }

  const description = `${storeName}의 유니크한 아이템들을 만나보세요.`;

  if (origin.includes('instagram.com')) {
    storeName = origin.split('/').filter(Boolean).pop() + ' 마켓';
    category = '인스타마켓';
    tags = ['#공구', '#인스타감성', ...tags].slice(0, 4);
  } else if (origin.includes('smartstore.naver.com')) {
    storeName = origin.split('/').filter(Boolean).pop() + ' 스토어';
    category = '스마트스토어';
    tags = ['#가성비', '#네이버페이', ...tags].slice(0, 4);
  } else if (storeName === 'MUSINSA' || storeName === 'ZIGZAG') {
    storeName = storeName + ' (입점몰)';
    category = '대형플랫폼';
  }

  tags = [...new Set(tags)];

  // 상세 페이지일 경우 상품 배열 초기화
  const products: {id: string, url: string, imageUrl: string}[] = [];
  if (isProduct) {
    products.push({
      id: Math.random().toString(36).substring(2, 15),
      url: inputUrl, // 상품 상세 URL
      imageUrl: `https://picsum.photos/seed/${Math.random()}/200/200` // 썸네일 랜덤 생성
    });
  }

  return {
    id: Math.random().toString(36).substring(2, 15),
    url: origin, // 스토어 메인 링크는 무조건 루트(origin)로 설정
    storeName,
    category,
    tags,
    description,
    memo,
    products, // 상품 리스트 배열 추가
    addedAt: new Date().toISOString(),
  };
};

export default function DiggingApp() {
  const [stores, setStores] = useState(() => [
    // 테스트용 데이터: 상세 상품 링크가 들어간 상태
    generateMockMetadata('https://www.slowand.com/product/detail.html?product_no=1234', '바지 핏이 예쁜 쇼핑몰. 다음 달 월급 들어오면 기본 슬랙스 구매할 것.'),
    generateMockMetadata('https://smartstore.naver.com/dailymood', '여름 셔츠 가성비 좋음'),
    generateMockMetadata('https://instagram.com/vintage_archive_'),
  ]);
  const [urlInput, setUrlInput] = useState('');
  const [memoInput, setMemoInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleAddLink = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isAdding) return;
    if (!urlInput.trim()) return;

    let normalizedInput = urlInput.trim();
    if (!normalizedInput.startsWith('http')) {
      normalizedInput = `https://${normalizedInput}`;
    }

    let urlObj;
    try {
      urlObj = new URL(normalizedInput);
    } catch(e) {
      setErrorMsg('유효한 URL을 입력해주세요.');
      return;
    }

    const origin = urlObj.origin;
    const isProduct = urlObj.pathname.length > 1 && urlObj.pathname !== '/';

    // 중복 및 상품 통합(Merge) 검증 (동기 처리)
    const existingStore = stores.find(store => store.url === origin);
    
    if (existingStore) {
      if (isProduct) {
        // 이미 저장된 스토어에 새로운 상품을 추가하는 경우
        const isDuplicateProduct = existingStore.products?.some(p => p.url === normalizedInput);
        if (isDuplicateProduct) {
          setErrorMsg('이미 아카이빙된 상품입니다.');
          return;
        }
      } else {
        // 이미 저장된 스토어의 루트 링크를 다시 추가하는 경우
        setErrorMsg('이미 아카이빙된 스토어입니다.');
        return;
      }
    }

    setErrorMsg('');
    setIsAdding(true);
    
    // 메타데이터 추출을 시뮬레이션하기 위한 지연 시간
    setTimeout(() => {
      setStores(prev => {
        const existingIdx = prev.findIndex(s => s.url === origin);
        
        if (existingIdx !== -1) {
          // 1. 기존 스토어에 새 상품 추가 및 최상단으로 끌어올리기 로직
          const existing = prev[existingIdx];
          const newProduct = {
            id: Math.random().toString(36).substring(2, 15),
            url: normalizedInput,
            imageUrl: `https://picsum.photos/seed/${Math.random()}/200/200`
          };
          
          const updatedStore = {
            ...existing,
            products: [newProduct, ...(existing.products || [])], // 가로 리스트의 가장 앞에 추가
            memo: memoInput || existing.memo // 새로운 메모가 있다면 덮어쓰기
          };
          
          const nextStores = [...prev];
          nextStores.splice(existingIdx, 1);
          return [updatedStore, ...nextStores];
        } else {
          // 2. 새로운 스토어(또는 상품) 등록 로직
          const newStore = generateMockMetadata(normalizedInput, memoInput);
          return [newStore, ...prev];
        }
      });

      setUrlInput('');
      setMemoInput('');
      setIsAdding(false);
    }, 800);
  };

  const handleDelete = (id: string) => {
    setStores(stores.filter(store => store.id !== id));
  };

  const filteredStores = stores.filter(store => {
    const query = searchQuery.toLowerCase();
    return (
      store.storeName.toLowerCase().includes(query) ||
      store.tags.some(tag => tag.toLowerCase().includes(query)) ||
      store.category.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-900 text-white rounded-lg flex items-center justify-center font-bold text-xl">
              D
            </div>
            <h1 className="text-xl font-bold tracking-tight">Digging</h1>
          </div>
          <nav className="hidden sm:flex gap-6 text-sm font-medium text-zinc-500">
            <a href="#" className="text-zinc-900">내 아카이브</a>
            <a href="#" className="hover:text-zinc-900">컬렉션</a>
            <a href="#" className="hover:text-zinc-900">탐색</a>
          </nav>
          <div className="w-8" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Link Input Section */}
        <section className="mb-10">
          <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
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
                  {isAdding ? '저장 중...' : '저장하기'}
                  {!isAdding && <Plus className="ml-2 h-4 w-4" />}
                </Button>
              </div>
              
              {errorMsg && <p className="text-red-500 text-sm mt-0 mb-1">{errorMsg}</p>}
              
              <Input 
                type="text" 
                placeholder="이 스토어/상품에 대한 메모를 남겨보세요" 
                value={memoInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMemoInput(e.target.value)}
                className="bg-zinc-50/50"
              />
            </form>
          </div>
        </section>

        {/* Filters & Count */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="text-sm font-medium text-zinc-700">
            총 <span className="font-bold text-zinc-900">{filteredStores.length}</span>개의 스토어
          </div>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
            <Input 
              type="text" 
              placeholder="스토어명, 태그 검색..." 
              className="pl-9 bg-white"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Stores List View */}
        {filteredStores.length === 0 ? (
          <div className="text-center py-20 bg-white border border-dashed border-zinc-300 rounded-xl">
            <FolderPlus className="h-10 w-10 text-zinc-400 mx-auto mb-3" />
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
                {/* Content Section */}
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
                    {/* 최상단 메인 링크는 언제나 스토어 홈(Root) 링크 */}
                    <a 
                      href={store.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-xs text-zinc-400 hover:text-zinc-600 hover:underline truncate inline-flex items-center gap-1"
                    >
                      {store.url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  
                  <button 
                    onClick={() => handleDelete(store.id)}
                    className="text-zinc-400 hover:text-red-500 transition-colors shrink-0 p-1.5 rounded-md hover:bg-red-50 opacity-0 group-hover:opacity-100"
                    title="삭제"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                
                <p className="text-sm text-zinc-500 line-clamp-2 mb-3 mt-1.5">
                  {store.description}
                </p>
                
                {/* 메모 표시 영역 */}
                {store.memo && (
                  <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-2.5 mb-3 flex items-start gap-2">
                    <StickyNote className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-zinc-700 leading-snug">{store.memo}</p>
                  </div>
                )}

                {/* 상품 리스트 가로 스크롤 영역 */}
                {store.products && store.products.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto pb-2 mb-3 mt-1 scrollbar-hide">
                    {store.products.map(product => (
                      <a 
                        key={product.id} 
                        href={product.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="shrink-0 group/item relative"
                        title="상품 상세 보기"
                      >
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-50 relative group-hover/item:border-zinc-300 transition-colors">
                          <img src={product.imageUrl} alt="상품 이미지" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover/item:bg-black/10 transition-colors flex items-center justify-center">
                            <ExternalLink className="text-white opacity-0 group-hover/item:opacity-100 h-5 w-5 drop-shadow-md" />
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}

                {/* Tags & Actions */}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-100">
                  <div className="flex flex-wrap gap-1.5 overflow-hidden">
                    {store.tags.map(tag => (
                       <span key={tag} className="inline-flex items-center text-xs px-2 py-0.5 bg-zinc-100/80 text-zinc-600 rounded-md whitespace-nowrap">
                        {tag}
                      </span>
                    ))}
                    <button className="inline-flex items-center text-xs px-2 py-0.5 border border-dashed border-zinc-300 text-zinc-400 rounded-md hover:bg-zinc-50 hover:text-zinc-600 transition-colors whitespace-nowrap">
                      <Plus className="h-3 w-3 mr-1" />
                      태그
                    </button>
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