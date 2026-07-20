import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { supabaseAdmin } from '@/lib/supabase-admin';

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, subscription } = body;

    if (!userId || !subscription) {
      return NextResponse.json({ error: 'Missing userId or subscription' }, { status: 400 });
    }

    // Supabase users 테이블 업데이트 (해당 유저가 없으면 upsert 됨)
    // push_agreed: true
    // push_agreed_at: 현재 시간 (이 시간을 기준으로 이틀 뒤를 계산함)
    const { error } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        push_agreed: true,
        push_agreed_at: new Date().toISOString(),
        push_subscription: subscription,
      }, { onConflict: 'id' });

    if (error) {
      console.error('Error updating user push subscription:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // --- 테스트를 위한 즉시 알림 발송 로직 시작 ---
    try {
      const payload = JSON.stringify({
        title: '푸시 알림 테스트',
        body: '푸시 알림 설정이 성공적으로 완료되었습니다! 🚀',
        url: '/'
      });
      await webpush.sendNotification(subscription, payload);
      console.log('Test notification sent successfully to', userId);
    } catch (pushError) {
      console.error('Failed to send test push notification:', pushError);
      // 푸시 발송이 실패하더라도 DB 저장은 완료되었으므로 에러를 반환하지 않고 계속 진행합니다.
    }
    // --- 테스트 발송 로직 끝 ---

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push subscribe error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
