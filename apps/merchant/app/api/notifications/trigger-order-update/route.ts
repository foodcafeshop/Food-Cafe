import { NextRequest, NextResponse } from 'next/server';
import webpush, { PushSubscription } from 'web-push';
import { createClient } from '@/lib/supabase-server';

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
    user_id?: string;
    customer_id?: string;
    subscription: PushSubscription;
}

export async function POST(req: NextRequest) {
    const supabase = createClient();

    try {
        const { orderId, status, customerName } = await req.json();

        if (!orderId || !status) {
            return NextResponse.json({ error: 'orderId and status are required' }, { status: 400 });
        }

        // 1. Fetch Order Details to identify the customer
        // We need customer_id AND/OR customer_phone (if we link via phone? No, customer_id is reliable for guests)
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('customer_id, shop_id, shops(slug)')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (!order.customer_id) {
            console.log(`Order ${orderId} has no linked customer_id. Skipping notification.`);
            return NextResponse.json({ message: 'No linked customer' });
        }

        // 2. Fetch Customer Subscriptions
        const { data: subscriptions, error: subError } = await supabase
            .from('push_subscriptions')
            .select('subscription, customer_id, user_id')
            .eq('customer_id', order.customer_id)
            .eq('shop_id', order.shop_id); // Ensure relevant to this shop? Actually a user might be subscribed to the shop.

        if (subError) {
            console.error("Error fetching subscriptions:", subError);
            return NextResponse.json({ error: subError.message }, { status: 500 });
        }

        if (!subscriptions || subscriptions.length === 0) {
            return NextResponse.json({ message: 'No subscriptions found for this customer' });
        }

        // 3. Prepare Payload
        let title = "Order Update";
        let body = `Your order status is now: ${status}`;

        if (status === 'preparing') {
            title = "Order is Preparing 🍳";
            body = "The kitchen has started preparing your food.";
        } else if (status === 'ready') {
            title = "Order Ready! 🍽️";
            body = "Your food is ready to be served/picked up!";
        } else if (status === 'served') {
            title = "Bon Appétit! 😋";
            body = "Your order has been served. Enjoy!";
        }

        // @ts-ignore
        const shopSlug = order.shops?.slug;
        const targetUrl = shopSlug ? `/${shopSlug}/cart` : '/cart';

        const payload = JSON.stringify({
            title,
            body,
            url: targetUrl,
            tag: `order_${orderId}`,
            timestamp: Date.now()
        });

        // 4. Send
        const records = subscriptions as unknown as SubscriptionRecord[];
        const sendPromises = records.map(async (record) => {
            try {
                await webpush.sendNotification(record.subscription, payload);
                return { status: 'fulfilled' };
            } catch (err: any) {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    const endpoint = record.subscription.endpoint;
                    await supabase
                        .from('push_subscriptions')
                        .delete()
                        .match({ customer_id: order.customer_id })
                        .filter('subscription->>endpoint', 'eq', endpoint);
                }
                return { status: 'rejected' };
            }
        });

        await Promise.all(sendPromises);

        return NextResponse.json({ success: true, count: subscriptions.length });

    } catch (error: any) {
        console.error('Trigger Notification Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
