
import { createClient } from '@/lib/supabase-server';
import { PlanCard } from '@/components/subscription/PlanCard';
import { SubscriptionManagement } from '@/components/subscription/SubscriptionManagement';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default async function SubscriptionPage({ params }: { params: { slug: string } }) {
    const supabase = createClient();
    const { slug } = params;

    // 1. Get Shop
    const { data: shop } = await supabase.from('shops').select('id').eq('slug', slug).single();

    if (!shop) return <div>Shop not found</div>;

    // 2. Fetch Plans
    const { data: plans } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price');

    // 3. Fetch Current Subscription
    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('shop_id', shop.id)
        .in('status', ['active', 'trialing'])
        .single();

    // 4. Fetch Invoices
    const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('shop_id', shop.id)
        .order('created_at', { ascending: false });

    return (
        <div className="p-6 space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Subscription Plans</h1>
                <p className="text-muted-foreground">Choose a plan that fits your business needs.</p>
            </div>

            {subscription && (
                <Alert className="bg-green-50 border-green-200">
                    <AlertTitle className="text-green-800">Active Subscription</AlertTitle>
                    <AlertDescription className="text-green-700">
                        You are currently subscribed to a plan.
                        Status: <span className="font-semibold capitalize">{subscription.status}</span>.
                        Renews on: {subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : 'N/A'}
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans?.map((plan) => (
                    <PlanCard
                        key={plan.id}
                        plan={plan}
                        shopSlug={slug}
                        isCurrent={subscription?.plan_id === plan.id}
                    />
                ))}
            </div>

            {subscription && (
                <SubscriptionManagement subscription={subscription} invoices={invoices || []} />
            )}
        </div>
    );
}
