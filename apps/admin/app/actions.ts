
'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { redirect } from 'next/navigation';

export async function banShop(shopId: string, currentState: boolean) {
    const { error } = await supabaseAdmin
        .from('shops')
        .update({ is_banned: !currentState }) // Toggle
        .eq('id', shopId);

    if (error) throw new Error(error.message);
}

export async function impersonateShopOwner(ownerId: string, shopSlug: string) {
    // 1. Generate Magic Link for the owner
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: ownerId, // This usually requires email, not ID? 
        // Wait, generateLink requires email. We need to fetch email from auth.users first if we only have ID.
        // OR, the shop owner ID IS the auth user ID. I need their email.
    });

    // Correction: I need to fetch the email first.
    // However, I can't easily fetch email from auth.users with standard supabase client unless I have permission.
    // Use `supabaseAdmin.auth.admin.getUserById(id)` to get email.
}

// Fixed Impersonation Function
export async function generateImpersonationLink(userId: string) {
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (userError || !user.user) {
        throw new Error('User not found');
    }

    const email = user.user.email;
    if (!email) throw new Error('User has no email');

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
    });

    if (error) {
        throw new Error(error.message);
    }

    // The link will log them in. 
    // Ideally, we redirect the Admin to the *Merchant App* with this link token?
    // Magic Link is usually "Verify Email" link. We want a direct login session.
    // generateLink returns properties: { user, action_link, ... }
    // The action_link is `http://.../verify?token=...`
    // We can redirect the Admin's browser to that link. The Merchant App will handle the token verification and set the session *for the Admin's browser* effectively logging them in as the user.


    return data.properties.action_link;
}

// === SaaS Actions ===

// Plans
export async function upsertPlan(data: any) {
    const { error } = await supabaseAdmin
        .from('plans')
        .upsert({
            name: data.name,
            description: data.description || null,
            price: data.price,
            offer_price: data.offer_price || null,
            interval: data.interval,
            features: data.features.split(',').map((f: string) => f.trim()),
            is_active: data.is_active,
            gateway_metadata: data.gateway_metadata ? JSON.parse(data.gateway_metadata) : {},
            ...(data.id ? { id: data.id } : {})
        });

    if (error) throw new Error(error.message);
    redirect('/saas');
}

export async function deletePlan(id: string) {
    const { error } = await supabaseAdmin.from('plans').delete().eq('id', id);
    if (error) throw new Error(error.message);
    redirect('/saas');
}

// Coupons
export async function upsertCoupon(data: any) {
    const { error } = await supabaseAdmin
        .from('coupons')
        .upsert({
            code: data.code.toUpperCase(),
            discount_type: data.discount_type,
            discount_amount: data.discount_amount,
            scope: 'platform', // Platform only
            max_uses: data.max_uses || null,
            valid_until: data.valid_until || null,
            gateway_coupon_id: data.gateway_coupon_id,
            ...(data.id ? { id: data.id } : {})
        });

    if (error) throw new Error(error.message);
    redirect('/saas');
}

export async function deleteCoupon(id: string) {
    const { error } = await supabaseAdmin.from('coupons').delete().eq('id', id);
    if (error) throw new Error(error.message);
    redirect('/saas');
}

// === Pro Features Actions ===

// Broadcasts
export async function createBroadcast(data: any) {
    const { error } = await supabaseAdmin.from('global_broadcasts').insert({
        title: data.title,
        message: data.message,
        priority: data.priority,
        expires_at: data.expires_at || null,
        created_by: (await supabaseAdmin.auth.getUser()).data.user?.id
    });
    if (error) throw new Error(error.message);
    redirect('/broadcasts');
}

export async function toggleBroadcast(id: string, currentState: boolean) {
    const { error } = await supabaseAdmin.from('global_broadcasts').update({ is_active: !currentState }).eq('id', id);
    if (error) throw new Error(error.message);
    redirect('/broadcasts');
}

// Feature Flags
export async function createFlag(data: any) {
    const { error } = await supabaseAdmin.from('feature_flags').insert({
        key: data.key,
        description: data.description,
        is_enabled_globally: data.is_enabled_globally === 'on'
    });
    if (error) throw new Error(error.message);
    redirect('/flags');
}

export async function toggleFlag(id: string, currentState: boolean) {
    const { error } = await supabaseAdmin.from('feature_flags').update({ is_enabled_globally: !currentState }).eq('id', id);
    if (error) throw new Error(error.message);
    redirect('/flags');
}


