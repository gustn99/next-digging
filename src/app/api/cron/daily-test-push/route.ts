import {supabaseAdmin} from '@/lib/supabase-admin';
import {NextResponse} from 'next/server';
import webpush from 'web-push';

// Vercel Cron Auth (optional but recommended for security)
const CRON_SECRET = process.env.CRON_SECRET;

webpush.setVapidDetails(
	'mailto:your-email@example.com',
	process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
	process.env.VAPID_PRIVATE_KEY!,
);

export async function GET(request: Request) {
	try {
		// 1. Verify Vercel Cron Secret
		const authHeader = request.headers.get('authorization');
		if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401});
		}

    // 2. 시간 계산 (기준: UTC 06:00 = KST 오후 3시)
    // Vercel Cron은 실행 시간이 3:00 ~ 3:59 사이로 유동적이므로, 
    // 실행 시점(now) 기준 24시간을 빼면 중복이나 누락이 발생할 수 있습니다.
    // 따라서 고정된 '오늘 오후 3시 정각'과 '어제 오후 3시 정각'을 기준으로 조회합니다.
    const today3PM = new Date();
    today3PM.setUTCHours(6, 0, 0, 0); // UTC 06:00 = KST 15:00
    
    // 만약 크론이 정각보다 약간 일찍 돌아서(예: 2:59) today3PM이 미래가 되는 것을 방지
    if (new Date().getTime() < today3PM.getTime()) {
      today3PM.setDate(today3PM.getDate() - 1);
    }
    
    const yesterday3PM = new Date(today3PM.getTime() - 24 * 60 * 60 * 1000);
    const windowStart = yesterday3PM.toISOString();
    const windowEnd = today3PM.toISOString();

    // 3. Query users
    const {data: eligibleUsers, error} = await supabaseAdmin
      .from('users')
      .select('id, push_subscription')
      .eq('push_agreed', true)
      .not('push_subscription', 'is', null)
      .gte('push_agreed_at', windowStart)
      .lt('push_agreed_at', windowEnd);

		if (error) {
			console.error('Error fetching users:', error);
			return NextResponse.json({error: 'Database error'}, {status: 500});
		}

		const notificationPayload = JSON.stringify({
			title: 'Digging',
			body: '아카이빙을 시작해 보세요 👀',
			url: '/',
		});

		// 4. Send Push Notifications
		const pushPromises = eligibleUsers.map(async (user) => {
			try {
				if (!user.push_subscription) return;

				await webpush.sendNotification(
					user.push_subscription as webpush.PushSubscription,
					notificationPayload,
				);
				console.log(`Successfully sent hourly test push to user: ${user.id}`);
			} catch (err: any) {
				console.error(`Failed to send hourly test push to user ${user.id}:`, err);

				if (err.statusCode === 404 || err.statusCode === 410) {
					await supabaseAdmin
					.from('users')
					.update({push_subscription: null, push_agreed: false})
					.eq('id', user.id);
				}
			}
		});

		await Promise.allSettled(pushPromises);

		return NextResponse.json({
			success: true,
			message: `Sent ${pushPromises.length} notifications.`,
			window: {start: windowStart, end: windowEnd},
		});

	} catch (error) {
		console.error('Hourly cron job error:', error);
		return NextResponse.json({error: 'Internal server error'}, {status: 500});
	}
}
