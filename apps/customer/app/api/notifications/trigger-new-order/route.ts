import { NextRequest, NextResponse } from 'next/server';
import webpush, { PushSubscription } from 'web-push';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Initialize Web Push
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
    const supabase = supabaseAdmin;

    try {
        const { shopId, orderNumber, tableLabel, customerName } = await req.json();

        if (!shopId) {
            return NextResponse.json({ error: 'shopId is required' }, { status: 400 });
        }

        // 1. Fetch Staff Subscriptions for this Shop
        // 1. Fetch Staff Subscriptions for this Shop
        // We want staff/admin of this shop who have 'new_order' preference enabled (default true)
        const { data: subscriptions, error } = await supabase
            .from('push_subscriptions')
            .select('subscription, user_id, role, shop_id')
            .eq('shop_id', shopId)
            .in('role', ['staff', 'merchant', 'admin']);

        if (error) {
            console.error('Error fetching staff subscriptions:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!subscriptions || subscriptions.length === 0) {
            return NextResponse.json({ message: 'No staff subscriptions found' });
        }

        // 2. Prepare Payload
        const payload = JSON.stringify({
            title: `New Order #${orderNumber}`,
            body: `Table ${tableLabel || ''} - ${customerName || 'Guest'}`,
            url: `/orders`,
            tag: `order-${orderNumber}`,
            timestamp: Date.now()
        });

        // 3. Send
        const records = subscriptions as unknown as SubscriptionRecord[];

        // Parallel send
        const sendPromises = records.map(async (record) => {
            try {
                await webpush.sendNotification(record.subscription, payload);
                return { status: 'fulfilled' };
            } catch (err: any) {
                // Return rejected but log error silently or cleanup
                if (err.statusCode === 410 || err.statusCode === 404) {
                    const endpoint = record.subscription.endpoint;
                    await supabase
                        .from('push_subscriptions')
                        .delete()
                        .match({ user_id: record.user_id })
                        .filter('endpoint', 'eq', endpoint);
                }
                return { status: 'rejected', error: err };
            }
        });

        await Promise.all(sendPromises);

        return NextResponse.json({ success: true, count: subscriptions.length });

    } catch (error: any) {
        console.error('Trigger Notification Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
