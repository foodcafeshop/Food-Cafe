
import { supabaseAdmin } from '@/lib/supabase-admin';
import { Store, Users, DollarSign, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function StatCard({ title, value, icon: Icon, subtext, color }: any) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                    {subtext}
                </p>
            </CardContent>
        </Card>
    )
}

async function getStats() {
    // Parallel fetch
    const [
        { count: shopCount },
        { data: userCount },
        { data: payments },
        { count: activeSubs }
    ] = await Promise.all([
        supabaseAdmin.from('shops').select('*', { count: 'exact', head: true }),
        supabaseAdmin.rpc('get_total_users'),
        supabaseAdmin.from('payments').select('amount').eq('status', 'captured'),
        supabaseAdmin.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active')
    ]);

    // Calculate revenue
    const totalRevenue = payments?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;

    // Get recent logs
    const { data: logs } = await supabaseAdmin
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    return {
        shopCount: shopCount || 0,
        userCount: userCount || 0, // This might return null if not accessible. We'll see.
        totalRevenue,
        activeSubs: activeSubs || 0,
        logs: logs || []
    }
}

export default async function DashboardPage() {
    const stats = await getStats();

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground">Platform overview and health status.</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Active Shops"
                    value={stats.shopCount}
                    icon={Store}
                    subtext="All onboarded merchants"
                    color="text-blue-500"
                />
                <StatCard
                    title="Total Revenue"
                    value={`₹${stats.totalRevenue.toLocaleString()}`}
                    icon={DollarSign}
                    subtext="Gross platform revenue"
                    color="text-green-500"
                />
                <StatCard
                    title="Active Subscriptions"
                    value={stats.activeSubs}
                    icon={Activity}
                    subtext="Paying merchants"
                    color="text-orange-500"
                />
                <StatCard
                    title="Total Users"
                    value={stats.userCount || 'N/A'}
                    icon={Users}
                    subtext="Registered across platform"
                    color="text-purple-500"
                />
            </div>

            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Recent Admin Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    {stats.logs.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
                    ) : (
                        <div className="space-y-8">
                            {/* Render logs list */}
                            {stats.logs.map((log: any) => (
                                <div key={log.id} className="flex items-center">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">{log.action}</p>
                                        <p className="text-sm text-muted-foreground">{new Date(log.created_at).toLocaleString()}</p>
                                    </div>
                                    <div className="ml-auto font-mono text-xs text-muted-foreground">
                                        {log.target_id || '-'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
