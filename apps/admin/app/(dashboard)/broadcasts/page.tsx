
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createBroadcast, toggleBroadcast } from '@/app/actions';
import { Radio, AlertTriangle, Info, AlertOctagon } from 'lucide-react';

export default async function BroadcastsPage() {
    const { data: broadcasts } = await supabaseAdmin
        .from('global_broadcasts')
        .select('*')
        .order('created_at', { ascending: false });

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Global Broadcasts</h2>
                <p className="text-slate-400">Send system-wide alerts to all merchants.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                {/* Create Form */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-white">New Broadcast</h3>
                    <form action={async (formData) => {
                        'use server';
                        const data = Object.fromEntries(formData);
                        await createBroadcast(data);
                    }} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                            <input name="title" required className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" placeholder="Maintenance Alert" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Message</label>
                            <textarea name="message" required className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white h-24" placeholder="We will be down for 30 mins..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Priority</label>
                                <select name="priority" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white">
                                    <option value="info">Info</option>
                                    <option value="warning">Warning</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Expires At</label>
                                <input name="expires_at" type="datetime-local" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
                            </div>
                        </div>
                        <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white p-2 rounded font-medium">
                            Publish Broadcast
                        </button>
                    </form>
                </div>

                {/* List */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Active Broadcasts</h3>
                    {broadcasts?.map((item) => (
                        <div key={item.id} className={`p-4 rounded-lg border ${item.is_active ? 'border-l-4 border-l-orange-500 bg-slate-900 border-slate-800' : 'bg-slate-900/50 border-slate-800 opacity-50'}`}>
                            <div className="flex justify-between items-start">
                                <div className="flex gap-3">
                                    {item.priority === 'info' && <Info className="text-blue-500 h-5 w-5" />}
                                    {item.priority === 'warning' && <AlertTriangle className="text-yellow-500 h-5 w-5" />}
                                    {item.priority === 'critical' && <AlertOctagon className="text-red-500 h-5 w-5" />}
                                    <div>
                                        <h4 className="font-bold text-white">{item.title}</h4>
                                        <p className="text-sm text-slate-300 mt-1">{item.message}</p>
                                        <p className="text-xs text-slate-500 mt-2">
                                            {item.is_active ? 'Active' : 'Archived'} • Exp: {item.expires_at ? new Date(item.expires_at).toLocaleDateString() : 'Never'}
                                        </p>
                                    </div>
                                </div>
                                <form action={async () => {
                                    'use server';
                                    await toggleBroadcast(item.id, item.is_active);
                                }}>
                                    <button className="text-xs border border-slate-700 px-2 py-1 rounded text-slate-400 hover:text-white hover:bg-slate-800">
                                        {item.is_active ? 'Archive' : 'Activate'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
