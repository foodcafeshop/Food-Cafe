'use server';

import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getPaymentProvider } from '@/lib/payment/factory';
import { revalidatePath } from 'next/cache';

export async function createSubscriptionAction(shopSlug: string, planId: string, couponCode?: string) {
    const supabase = createClient();

    // 1. Get Authenticated User
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        throw new Error('Unauthorized');
    }

    // 2. Get Shop & Role Validation
    const { data: shop, error: shopError } = await supabaseAdmin
        .from('shops')
        .select('id, owner_id')
        .eq('slug', shopSlug)
        .single();

    if (shopError || !shop) throw new Error('Shop not found');

    // Verify User is Admin of this shop
    const { data: role } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('id', user.id)
        .eq('shop_id', shop.id)
        .single();

    if (role?.role !== 'admin') {
        throw new Error('Permission denied');
    }

    // 3. Get Plan Details
    const { data: plan, error: planError } = await supabaseAdmin
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single();

    if (planError || !plan) throw new Error('Invalid Plan');

    // Extract Razorpay Plan ID
    // @ts-ignore
    const razorpayPlanId = plan.gateway_metadata?.razorpay?.plan_id;
    if (!razorpayPlanId) throw new Error('Plan not configured for payments');

    // 4. Handle Coupon
    let razorpayOfferId = undefined;
    let couponId = undefined;

    if (couponCode) {
        const { data: coupon } = await supabaseAdmin
            .from('coupons')
            .select('*')
            .eq('code', couponCode)
            .eq('is_active', true)
            // Check scope: Platform only? Or allow shop if null shop_id
            .is('shop_id', null)
            .gte('valid_until', new Date().toISOString())
            .single();

        // Also check max uses if needed

        if (coupon) {
            // 1. Check Global Usage Limit
            if (coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses) {
                throw new Error('Coupon global usage limit reached');
            }

            // 2. Check Whitelist (Targeted Users)
            if (coupon.allowed_user_ids && coupon.allowed_user_ids.length > 0) {
                if (!coupon.allowed_user_ids.includes(shop.id)) {
                    throw new Error('This coupon is not applicable to your account');
                }
            }

            // 3. Rules: 'new_only'
            if (coupon.user_type_rule === 'new_only') {
                // Check if shop has ANY previous subscriptions/payments (simplified: any previous subscription)
                const { count } = await supabaseAdmin
                    .from('subscriptions')
                    .select('*', { count: 'exact', head: true })
                    .eq('shop_id', shop.id)
                    .neq('status', 'created'); // Ignore abandoned attempts

                if (count && count > 0) {
                    throw new Error('This coupon is for new subscribers only');
                }
            }

            // 4. Check Per-User Usage Limit
            // Count redemptions for this shop
            const { count: userRedemptions } = await supabaseAdmin
                .from('coupon_redemptions')
                .select('*', { count: 'exact', head: true })
                .eq('coupon_id', coupon.id)
                .eq('user_id', shop.id);

            const limitPerUser = coupon.max_uses_per_user ?? 1; // Default to 1 if not set
            if ((userRedemptions || 0) >= limitPerUser) {
                throw new Error(`You have already used this coupon maximum ${limitPerUser} times`);
            }

            razorpayOfferId = coupon.gateway_coupon_id;
            couponId = coupon.id;
        } else {
            throw new Error('Invalid or expired coupon');
        }
    }

    // 5. Create Subscription on Gateway
    const provider = getPaymentProvider('razorpay');
    const subId = await provider.createSubscription({
        planId: razorpayPlanId,
        offerId: razorpayOfferId,
        notes: {
            shop_id: shop.id,
            plan_internal_id: planId,
        }
    });

    // 6. Insert Pending Subscription Record
    const { error: insertError } = await supabaseAdmin
        .from('subscriptions')
        .insert({
            shop_id: shop.id,
            plan_id: planId,
            coupon_id: couponId,
            provider: 'razorpay',
            provider_subscription_id: subId,
            status: 'created',
        });

    if (insertError) {
        console.error('Failed to create local subscription:', insertError);
        // Should we cancel gateway sub? Ideally yes.
        throw new Error('Failed to initialize subscription');
    }

    // 7. Increment Coupon Usage
    if (couponId) {
        const { data: currentCoupon } = await supabaseAdmin
            .from('coupons')
            .select('current_uses')
            .eq('id', couponId)
            .single();

        if (currentCoupon) {
            await supabaseAdmin
                .from('coupons')
                .update({ current_uses: (currentCoupon.current_uses || 0) + 1 })
                .eq('id', couponId);

            // Record specific redemption
            await supabaseAdmin.from('coupon_redemptions').insert({
                coupon_id: couponId,
                user_id: shop.id,
                redeemed_at: new Date().toISOString()
            });
        }
    }

    return { subscriptionId: subId, keyId: process.env.RAZORPAY_KEY_ID };
}
