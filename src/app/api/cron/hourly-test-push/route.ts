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

		// 2. 시간 계산 (현재 시간 기준 1시간 전 ~ 현재 사이)
		// 매시간 정각에 Cron이 돌 때, 최근 1시간 이내에 가입한 유저들을 타겟팅하면
		// 가입 후 다가오는 가장 빠른 정각에 알림을 받게 됩니다.
		const now = new Date();
		const nowIso = now.toISOString();
		const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

		// 3. Query users
		const {data: eligibleUsers, error} = await supabaseAdmin
		.from('users')
		.select('id, push_subscription')
		.eq('push_agreed', true)
		.not('push_subscription', 'is', null)
		.gte('push_agreed_at', oneHourAgo)
		.lt('push_agreed_at', nowIso);

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
			window: {start: oneHourAgo, end: nowIso},
		});

	} catch (error) {
		console.error('Hourly cron job error:', error);
		return NextResponse.json({error: 'Internal server error'}, {status: 500});
	}
}
