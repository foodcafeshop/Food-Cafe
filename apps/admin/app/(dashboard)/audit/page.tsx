
import { supabaseAdmin } from '@/lib/supabase-admin';
import { ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default async function AuditPage() {
    const { data: logs } = await supabaseAdmin
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Audit Logs</h2>
                <p className="text-muted-foreground">Security trail of administrative actions.</p>
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">Action</TableHead>
                            <TableHead>Admin</TableHead>
                            <TableHead>Target</TableHead>
                            <TableHead>Timestamp</TableHead>
                            <TableHead className="w-[300px]">Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(!logs || logs.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No audit logs found.
                                </TableCell>
                            </TableRow>
                        )}
                        {logs?.map((log) => (
                            <TableRow key={log.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                                        {log.action}
                                    </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground">{log.admin_id}</TableCell>
                                <TableCell className="text-muted-foreground font-mono text-xs">{log.target_id || 'N/A'}</TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {new Date(log.created_at).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                    {log.details && (
                                        <pre className="bg-muted p-2 rounded text-[10px] text-muted-foreground overflow-x-auto max-w-[300px]">
                                            {JSON.stringify(log.details, null, 2)}
                                        </pre>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    )
}
