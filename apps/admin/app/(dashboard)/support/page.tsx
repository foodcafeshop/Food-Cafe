
import { supabaseAdmin } from '@/lib/supabase-admin';
import { MessageSquare, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default async function SupportPage() {
    const { data: tickets } = await supabaseAdmin
        .from('support_tickets')
        .select('*, shops(name)')
        .order('created_at', { ascending: false });

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Support Switchboard</h2>
                <p className="text-muted-foreground">Incoming help requests from merchants.</p>
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Subject</TableHead>
                            <TableHead>Shop</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Priority</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tickets?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    No active tickets.
                                </TableCell>
                            </TableRow>
                        )}
                        {tickets?.map((ticket: any) => (
                            <TableRow key={ticket.id}>
                                <TableCell className="font-medium flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                    {ticket.subject}
                                </TableCell>
                                <TableCell className="text-muted-foreground">{ticket.shops?.name || 'Unknown Shop'}</TableCell>
                                <TableCell>
                                    <Badge variant={
                                        ticket.status === 'open' ? 'default' :
                                            ticket.status === 'resolved' ? 'secondary' : 'outline'
                                    } className={
                                        ticket.status === 'open' ? 'bg-blue-600 hover:bg-blue-700' :
                                            ticket.status === 'resolved' ? 'bg-green-600/10 text-green-600 hover:bg-green-600/20' : ''
                                    }>
                                        {ticket.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <span className={`text-sm font-medium ${ticket.priority === 'urgent' ? 'text-destructive' : 'text-muted-foreground'}`}>
                                        {ticket.priority}
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    )
}
