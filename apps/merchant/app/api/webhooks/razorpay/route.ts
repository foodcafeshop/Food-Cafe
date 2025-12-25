import { NextRequest, NextResponse } from 'next/server';
import { getPaymentProvider } from '@/lib/payment/factory';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const signature = req.headers.get('x-razorpay-signature');
        const eventId = req.headers.get('x-razorpay-event-id');

        if (!signature || !eventId) {
            return NextResponse.json({ error: 'Missing signature or event ID' }, { status: 400 });
        }

        const provider = getPaymentProvider('razorpay');

        // 1. Verify Signature
        if (!provider.verifyWebhookSignature(body, signature, process.env.RAZORPAY_WEBHOOK_SECRET!)) {
            console.error('Invalid Webhook Signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const event = JSON.parse(body);
        const eventType = event.event;

        // 2. Idempotency Check
        const { data: existingEvent } = await supabaseAdmin
            .from('webhook_events')
            .select('id, status')
            .eq('provider', 'razorpay')
            .eq('event_id', eventId)
            .single();

        if (existingEvent) {
            return NextResponse.json({ message: 'Event already processed' }, { status: 200 });
        }

        // 3. Log Event as Pending
        await supabaseAdmin.from('webhook_events').insert({
            provider: 'razorpay',
            event_id: eventId,
            event_type: eventType,
            payload: event,
            status: 'pending'
        });

        // 4. Process Event
        try {
            await processRazorpayEvent(event);

            // Mark as Processed
            await supabaseAdmin
                .from('webhook_events')
                .update({ status: 'processed', processed_at: new Date().toISOString() })
                .eq('provider', 'razorpay')
                .eq('event_id', eventId);

            return NextResponse.json({ status: 'ok' });
        } catch (err: any) {
            console.error('Error processing event:', err);

            // Mark as Failed
            await supabaseAdmin
                .from('webhook_events')
                .update({ status: 'failed' })
                .eq('provider', 'razorpay')
                .eq('event_id', eventId);

            return NextResponse.json({ error: 'Internal processing error' }, { status: 500 });
        }
    } catch (err: any) {
        console.error('Webhook Error:', err);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
    }
}

async function processRazorpayEvent(event: any) {
    const { payload } = event;

    switch (event.event) {
        case 'subscription.charged':
            await handleSubscriptionCharged(payload);
            break;
        case 'subscription.cancelled':
            await handleSubscriptionCancelled(payload);
            break;
        // Add other cases as needed
        default:
            console.log(`Unhandled event type: ${event.event}`);
    }
}

async function handleSubscriptionCharged(payload: any) {
    const payment = payload.payment.entity;
    const subscription = payload.subscription.entity;

    const subId = subscription.id;
    const payId = payment.id;
    const amount = payment.amount / 100; // Razorpay is in paise

    // 1. Find our local subscription
    const { data: localSub, error: subError } = await supabaseAdmin
        .from('subscriptions')
        .select('id, shop_id')
        .eq('provider_subscription_id', subId)
        .single();

    if (subError || !localSub) {
        console.error('Subscription not found for ID:', subId);
        return;
    }

    // 2. Record Payment
    const { data: localPayment, error: payError } = await supabaseAdmin
        .from('payments')
        .insert({
            shop_id: localSub.shop_id,
            subscription_id: localSub.id,
            amount: amount,
            currency: payment.currency,
            status: 'captured',
            method: payment.method,
            provider: 'razorpay',
            provider_payment_id: payId,
            provider_order_id: payment.order_id
        })
        .select()
        .single();

    if (payError) throw payError;

    // 3. Update Subscription Status
    await supabaseAdmin
        .from('subscriptions')
        .update({
            status: 'active',
            current_period_start: new Date(subscription.current_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_end * 1000).toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('id', localSub.id);

    // 4. Generate Invoice (Paid)
    await supabaseAdmin
        .from('invoices')
        .insert({
            shop_id: localSub.shop_id,
            subscription_id: localSub.id,
            payment_id: localPayment.id,
            amount: amount,
            status: 'paid',
            billing_reason: 'subscription_cycle',
            // invoice_pdf_url: ... generate or store later
        });
}

async function handleSubscriptionCancelled(payload: any) {
    const subscription = payload.subscription.entity;
    const subId = subscription.id;

    await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('provider_subscription_id', subId);
}
