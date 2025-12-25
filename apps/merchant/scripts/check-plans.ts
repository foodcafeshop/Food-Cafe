
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function checkPlans() {
    const { data, error } = await supabaseAdmin.from('plans').select('*');
    console.log('Plans:', data);
    console.log('Error:', error);
}

checkPlans();
