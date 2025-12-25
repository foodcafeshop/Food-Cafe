
import { supabaseAdmin } from '@/lib/supabase-admin';
import { MessageSquare, Clock } from 'lucide-react';

export default async function SupportPage() {
    const { data: tickets } = await supabaseAdmin
        .from('support_tickets')
        .select('*, shops(name)')
        .order('created_at', { ascending: false });

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-white">Support Switchboard</h2>
                <p className="text-slate-400">Incoming help requests from merchants.</p>
            </div>

            <div className="rounded-md border border-slate-800">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-900 text-slate-400">
                        <tr>
                            <th className="p-4 font-medium">Subject</th>
                            <th className="p-4 font-medium">Shop</th>
                            <th className="p-4 font-medium">Status</th>
                            <th className="p-4 font-medium text-right">Priority</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {tickets?.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-slate-500">No active tickets.</td>
                            </tr>
                        )}
                        {tickets?.map((ticket: any) => (
                            <tr key={ticket.id} className="hover:bg-slate-900/50">
                                <td className="p-4 font-medium text-white flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4 text-slate-500" />
                                    {ticket.subject}
                                </td>
                                <td className="p-4 text-slate-400">{ticket.shops?.name || 'Unknown Shop'}</td>
                                <td className="p-4">
                                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${ticket.status === 'open' ? 'bg-blue-400/10 text-blue-400 ring-blue-400/20' :
                                            ticket.status === 'resolved' ? 'bg-green-400/10 text-green-400 ring-green-400/20' : 'bg-slate-800 text-slate-400'
                                        }`}>
                                        {ticket.status}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <span className={`${ticket.priority === 'urgent' ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                                        {ticket.priority}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
