
import { supabaseAdmin } from '@/lib/supabase-admin';
import { Store, Users, DollarSign, Activity } from 'lucide-react';

// Minimal Card Component since I don't have shadcn installed in admin
function StatCard({ title, value, icon: Icon, subtext, color }: any) {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900 text-slate-100 shadow p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium text-slate-400">{title}</h3>
                <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-slate-500 mt-1">{subtext}</p>
        </div>
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
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-slate-400">Platform overview and health status.</p>
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

            <div className="rounded-xl border border-slate-800 bg-slate-900">
                <div className="p-6 border-b border-slate-800">
                    <h3 className="text-lg font-medium leading-none tracking-tight">Recent Admin Activity</h3>
                </div>
                <div className="p-6">
                    {stats.logs.length === 0 ? (
                        <p className="text-sm text-slate-500">No activity recorded yet.</p>
                    ) : (
                        <div className="space-y-4">
                            {/* Render logs list */}
                            {stats.logs.map((log: any) => (
                                <div key={log.id} className="flex items-center justify-between border-b border-slate-800 pb-4 last:border-0 last:pb-0">
                                    <div>
                                        <p className="text-sm font-medium text-white">{log.action}</p>
                                        <p className="text-xs text-slate-500">{new Date(log.created_at).toLocaleString()}</p>
                                    </div>
                                    <div className="text-xs text-slate-400 font-mono">
                                        {log.target_id || '-'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
