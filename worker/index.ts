/// <reference lib="webworker" />

declare let self: ServiceWorkerGlobalScope;

// PWA Push 이벤트 리스너
self.addEventListener('push', (event: any) => {
  if (event.data) {
    const data = event.data.json();
    
    // 알림 옵션 설정
    const options = {
      body: data.body,
      icon: '/icon-192x192.png', // public 폴더에 있는 PWA 아이콘 경로 (프로젝트에 맞게 변경하세요)
      badge: '/icon-192x192.png',
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
