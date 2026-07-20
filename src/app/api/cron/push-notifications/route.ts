import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Vercel Cron Auth (optional but recommended for security)
// https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs
const CRON_SECRET = process.env.CRON_SECRET;

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function GET(request: Request) {
  try {
    // 1. (Optional) Verify Vercel Cron Secret to ensure only Vercel can trigger this
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Calculate the target date (2 days ago)
    // '푸시 알림에 동의한 지 이틀 뒤' 조건을 위해 이틀 전 날짜를 구합니다.
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const startOfDay = new Date(twoDaysAgo.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(twoDaysAgo.setHours(23, 59, 59, 999)).toISOString();

    // 3. Query users
    // 조건:
    // - push_agreed_at (푸시 동의 일시)가 이틀 전(startOfDay ~ endOfDay)인 사용자
    // - 푸시 알림에 동의 상태 유지 중 (push_agreed: true)
    const { data: eligibleUsers, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        push_subscription
      `)
      .eq('push_agreed', true)
      .not('push_subscription', 'is', null)
      .gte('push_agreed_at', startOfDay)
      .lte('push_agreed_at', endOfDay);

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    const notificationPayload = JSON.stringify({
      title: '쇼핑몰 알림',
      body: '찜해둔 쇼핑몰이 조용히 기다리고 있어요 👀',
      url: '/', // 알림 클릭 시 메인 페이지로 이동
    });

    // 4. Send Push Notifications
    const pushPromises = eligibleUsers.map(async (user) => {
      try {
        if (!user.push_subscription) return;
        
        await webpush.sendNotification(
          user.push_subscription as webpush.PushSubscription,
          notificationPayload
        );
        console.log(`Successfully sent push to user: ${user.id}`);
      } catch (err: any) {
        console.error(`Failed to send push to user ${user.id}:`, err);
        
        // 구독이 만료되었거나 유효하지 않은 경우 DB에서 삭제 (옵션)
        if (err.statusCode === 404 || err.statusCode === 410) {
          await supabaseAdmin
            .from('users')
            .update({ push_subscription: null, push_agreed: false })
            .eq('id', user.id);
        }
      }
    });

    await Promise.allSettled(pushPromises);

    return NextResponse.json({ 
      success: true, 
      message: `Sent ${pushPromises.length} notifications.` 
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
