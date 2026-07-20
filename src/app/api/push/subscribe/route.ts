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
    const { userId, subscription, agreed = true } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }
    if (agreed && !subscription) {
      return NextResponse.json({ error: 'Missing subscription when agreed is true' }, { status: 400 });
    }

    // Supabase users 테이블 업데이트 (해당 유저가 없으면 upsert 됨)
    // 거절(agreed=false)일 경우 push_subscription은 null 처리
    const { error } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        push_agreed: agreed,
        push_agreed_at: agreed ? new Date().toISOString() : null,
        push_subscription: agreed ? subscription : null,
      }, { onConflict: 'id' });

    if (error) {
      console.error('Error updating user push subscription:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }



    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push subscribe error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
