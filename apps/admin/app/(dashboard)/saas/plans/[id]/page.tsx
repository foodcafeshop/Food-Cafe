
import { upsertPlan } from '@/app/actions';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { notFound } from 'next/navigation';
import EditPlanClient from './client';

export const dynamic = 'force-dynamic';

export default async function EditPlanPage({ params }: { params: { id: string } }) {
    const { data: plan, error } = await supabaseAdmin
        .from('plans')
        .select('*')
        .eq('id', params.id)
        .single();

    if (error || !plan) {
        notFound();
    }

    return <EditPlanClient plan={plan} />;
}
