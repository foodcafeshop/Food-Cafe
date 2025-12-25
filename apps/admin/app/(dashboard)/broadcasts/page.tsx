
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createBroadcast, toggleBroadcast } from '@/app/actions';
import { Info, AlertTriangle, AlertOctagon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default async function BroadcastsPage() {
    const { data: broadcasts } = await supabaseAdmin
        .from('global_broadcasts')
        .select('*')
        .order('created_at', { ascending: false });

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Global Broadcasts</h2>
                <p className="text-muted-foreground">Send system-wide alerts to all merchants.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Create Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>New Broadcast</CardTitle>
                        <CardDescription>Publish a new message to all active shops.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={async (formData) => {
                            'use server';
                            const data = Object.fromEntries(formData);
                            await createBroadcast(data);
                        }} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Title</label>
                                <Input name="title" required placeholder="Maintenance Alert" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Message</label>
                                <Textarea name="message" required placeholder="We will be down for 30 mins..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Priority</label>
                                    <select
                                        name="priority"
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="info">Info</option>
                                        <option value="warning">Warning</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Expires At</label>
                                    <Input name="expires_at" type="datetime-local" />
                                </div>
                            </div>
                            <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                                Publish Broadcast
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* List */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold tracking-tight">Active Broadcasts</h3>
                    {broadcasts?.map((item) => (
                        <Card key={item.id} className={!item.is_active ? "opacity-60" : ""}>
                            <CardContent className="p-4 flex justify-between items-start gap-3">
                                <div className="flex gap-3">
                                    <div className="mt-1">
                                        {item.priority === 'info' && <Info className="text-blue-500 h-5 w-5" />}
                                        {item.priority === 'warning' && <AlertTriangle className="text-yellow-500 h-5 w-5" />}
                                        {item.priority === 'critical' && <AlertOctagon className="text-destructive h-5 w-5" />}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold leading-none tracking-tight">{item.title}</h4>
                                        <p className="text-sm text-muted-foreground mt-1">{item.message}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Badge variant={item.is_active ? "default" : "secondary"}>
                                                {item.is_active ? 'Active' : 'Archived'}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                Exp: {item.expires_at ? new Date(item.expires_at).toLocaleDateString() : 'Never'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <form action={async () => {
                                    'use server';
                                    await toggleBroadcast(item.id, item.is_active);
                                }}>
                                    <Button variant="outline" size="sm" className="h-8">
                                        {item.is_active ? 'Archive' : 'Activate'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}
