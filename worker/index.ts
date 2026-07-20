/// <reference lib="webworker" />

declare let self: ServiceWorkerGlobalScope;

// PWA Push 이벤트 리스너
self.addEventListener('push', (event: any) => {
  if (event.data) {
    const data = event.data.json();
    
    // 알림 옵션 설정
    const options = {
      body: data.body,
      icon: '/icon-192x192.png', // 푸시 알림 내용 옆에 뜨는 큰 아이콘 (컬러 가능)
      badge: '/badge-icon.png', // 안드로이드 상태바에 뜨는 작은 아이콘 (반드시 배경이 투명한 흰색 단색 이미지여야 함, 72x72 또는 96x96 권장)
      vibrate: [100, 50, 100],
      data: {
        url: '/' // 항상 루트 페이지로 이동
      }
    };

    // 알림 표시
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// 사용자가 알림을 클릭했을 때의 이벤트 리스너
self.addEventListener('notificationclick', (event: any) => {
  event.notification.close();

  // 알림에 포함된 url로 이동 (앱 열기)
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((windowClients) => {
      // 이미 열린 창이 있다면 포커스
      for (const client of windowClients) {
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      // 열린 창이 없다면 새 창(혹은 PWA 앱) 열기
      if (self.clients.openWindow) {
        return self.clients.openWindow(event.notification.data.url);
      }
    })
  );
});

export {};
