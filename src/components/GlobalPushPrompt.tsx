'use client';

import { useEffect, useState } from 'react';
import { usePushSubscription } from '@/hooks/usePushSubscription';

export default function GlobalPushPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const { subscribeToPush, isSubscribing } = usePushSubscription();

  useEffect(() => {
    // 앱이 처음 로드될 때 브라우저 알림 권한 상태를 확인합니다.
    // 'default'인 경우(아직 묻지 않음) 커스텀 팝업을 띄웁니다.
    if ('Notification' in window && Notification.permission === 'default') {
      // UX를 위해 페이지 로드 후 살짝 딜레이를 주거나 즉시 띄울 수 있습니다.
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAgree = async () => {
    const success = await subscribeToPush();
    if (success) {
      setShowPrompt(false);
      alert('알림 설정이 완료되었습니다!');
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white p-4 rounded-xl shadow-lg border z-50 flex flex-col gap-3">
      <div>
        <h3 className="font-bold text-lg">알림을 받아보시겠어요?</h3>
        <p className="text-sm text-gray-600">찜해둔 쇼핑몰 소식을 알려드릴게요.</p>
      </div>
      <div className="flex gap-2">
        <button 
          onClick={() => setShowPrompt(false)} 
          className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-700"
        >
          나중에
        </button>
        <button 
          onClick={handleAgree}
          disabled={isSubscribing}
          className="flex-1 py-2 rounded-lg bg-black text-white"
        >
          {isSubscribing ? '처리 중...' : '알림 받기'}
        </button>
      </div>
    </div>
  );
}
