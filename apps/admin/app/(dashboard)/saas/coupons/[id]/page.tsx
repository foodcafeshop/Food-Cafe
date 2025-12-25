
import { supabaseAdmin } from '@/lib/supabase-admin';
import { notFound } from 'next/navigation';
import EditCouponClient from './client';

export const dynamic = 'force-dynamic';

export default async function EditCouponPage({ params }: { params: { id: string } }) {
    const { data: coupon, error } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .eq('id', params.id)
        .single();

    if (error || !coupon) {
        notFound();
    }

    return <EditCouponClient coupon={coupon} />;
}
