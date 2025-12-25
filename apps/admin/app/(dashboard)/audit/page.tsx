
import { supabaseAdmin } from '@/lib/supabase-admin';
import { ShieldAlert } from 'lucide-react';

export default async function AuditPage() {
    const { data: logs } = await supabaseAdmin
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-white">Audit Logs</h2>
                <p className="text-slate-400">Security trail of administrative actions.</p>
            </div>

            <div className="space-y-4">
                {logs?.map((log) => (
                    <div key={log.id} className="flex flex-col gap-1 p-4 border-b border-slate-800 hover:bg-slate-900/40">
                        <div className="flex justify-between items-center">
                            <h4 className="font-bold text-white flex items-center gap-2">
                                <ShieldAlert className="h-4 w-4 text-slate-600" />
                                {log.action}
                            </h4>
                            <span className="text-xs text-slate-500 font-mono">{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-slate-400">
                            By Admin: <span className="text-slate-300">{log.admin_id}</span> • Target: <span className="text-slate-300">{log.target_id || 'N/A'}</span>
                        </p>
                        {log.details && (
                            <pre className="mt-2 bg-slate-950 p-2 rounded text-xs text-slate-500 overflow-x-auto">
                                {JSON.stringify(log.details, null, 2)}
                            </pre>
                        )}
                    </div>
                ))}
                {(!logs || logs.length === 0) && (
                    <div className="text-center text-slate-500 py-8">No audit logs found.</div>
                )}
            </div>
        </div>
    )
}
