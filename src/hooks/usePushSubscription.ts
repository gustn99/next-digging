import { useState } from 'react';
import { getOrCreateUserId } from '@/lib/user-id';

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const usePushSubscription = () => {
  const [isSubscribing, setIsSubscribing] = useState(false);

  const subscribeToPush = async () => {
    setIsSubscribing(true);
    try {
      // 1. 브라우저 알림 권한 요청
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('푸시 알림 권한이 거부되었습니다. 설정에서 권한을 허용해주세요.');
        return false;
      }

      // 2. 서비스 워커 등록 확인
      console.log('[Push] Check service worker registration...');
      let registration = await navigator.serviceWorker.getRegistration();
      
      if (!registration) {
        console.log('[Push] No registration found, attempting to register /sw.js manually...');
        registration = await navigator.serviceWorker.register('/sw.js');
      }
      
      // ready가 영원히 멈추는 것을 방지하기 위해 등록된 registration을 바로 사용하거나 ready를 기다립니다.
      registration = await navigator.serviceWorker.ready;

      if (!registration) {
        throw new Error('Service Worker is not registered');
      }

      console.log('[Push] Service worker is ready. Subscribing to push manager...');
      // 3. Push Manager 구독
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error('VAPID Public Key is missing in environment variables');
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });
      console.log('[Push] Subscription successful:', subscription);

      // 4. 로컬 스토리지에서 UUID 가져오기
      const userId = getOrCreateUserId();

      // 5. 서버로 구독 정보와 userId 전송하여 DB에 저장 (push_agreed_at 갱신)
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          subscription
        })
      });

      if (!response.ok) {
        throw new Error('서버에 구독 정보를 저장하는데 실패했습니다.');
      }

      return true;
    } catch (error) {
      console.error('푸시 알림 구독 중 에러 발생:', error);
      return false;
    } finally {
      setIsSubscribing(false);
    }
  };

  return { subscribeToPush, isSubscribing };
};
