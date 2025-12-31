import { NextRequest, NextResponse } from 'next/server';
import webpush, { PushSubscription } from 'web-push';
import { createClient } from '@/lib/supabase-server';

if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.error("VAPID Keys are missing");
}

webpush.setVapidDetails(
    process.env.NEXT_PUBLIC_VAPID_SUBJECT || 'mailto:admin@foodcafeshop.in',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

interface SubscriptionRecord {
    user_id: string;
    subscription: PushSubscription;
}

export async function POST(req: NextRequest) {
    const supabase = createClient();
    try {
        const { userIds, title, body, url, tag } = await req.json();

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return NextResponse.json({ error: 'userIds array is required' }, { status: 400 });
        }

        // 1. Fetch subscriptions for these users
        const { data: subscriptions, error } = await supabase
            .from('push_subscriptions')
            .select('subscription, user_id')
            .in('user_id', userIds);

        if (error) {
            console.error('Error fetching subscriptions:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!subscriptions || subscriptions.length === 0) {
            return NextResponse.json({ message: 'No subscriptions found for these users' });
        }

        // 2. Prepare payload
        const payload = JSON.stringify({
            title,
            body,
            url: url || '/',
            tag: tag || 'default', // For grouping (e.g. 'new_order')
            timestamp: Date.now()
        });

        // 3. Send notifications
        // Cast to unknown then SubscriptionRecord[] to ensure types
        const records = subscriptions as unknown as SubscriptionRecord[];

        const sentPromises = records.map(async (record) => {
            try {
                await webpush.sendNotification(record.subscription, payload);
                return { status: 'fulfilled', userId: record.user_id };
            } catch (err: any) {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    // Subscription is gone, delete it
                    const endpoint = record.subscription.endpoint;
                    await supabase
                        .from('push_subscriptions')
                        .delete()
                        .match({ user_id: record.user_id })
                        .filter('subscription->>endpoint', 'eq', endpoint);
                    return { status: 'deleted', userId: record.user_id };
                }
                return { status: 'rejected', userId: record.user_id, error: err };
            }
        });

        const results = await Promise.all(sentPromises);
        const successCount = results.filter((r) => r.status === 'fulfilled').length;
        const deletedCount = results.filter((r) => r.status === 'deleted').length;

        return NextResponse.json({
            success: true,
            sent: successCount,
            cleaned: deletedCount
        });

    } catch (error: any) {
        console.error('Notification API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

