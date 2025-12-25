
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createFlag, toggleFlag } from '@/app/actions';
import { Flag, ToggleRight, ToggleLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default async function FeatureFlagsPage() {
    const { data: flags } = await supabaseAdmin
        .from('feature_flags')
        .select('*')
        .order('created_at', { ascending: false });

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Feature Flags</h2>
                <p className="text-muted-foreground">Control feature rollout and beta testing availability.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Create Form */}
                <Card className="md:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle>Create Flag</CardTitle>
                        <CardDescription>Define a new feature toggle.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={async (formData) => {
                            'use server';
                            const data = Object.fromEntries(formData);
                            await createFlag(data);
                        }} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Key</label>
                                <Input name="key" required placeholder="ai_menu_import" className="font-mono" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Description</label>
                                <Textarea name="description" required placeholder="Enables Gemini AI parsing..." className="h-24" />
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" name="is_enabled_globally" id="global" className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-600" />
                                <label htmlFor="global" className="text-sm font-medium leading-none">Enable Globally</label>
                            </div>
                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                Create Flag
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* List */}
                <div className="md:col-span-2 space-y-4">
                    <h3 className="text-lg font-semibold tracking-tight">Existing Flags</h3>
                    {flags?.map((flag) => (
                        <Card key={flag.id}>
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold font-mono flex items-center gap-2">
                                        <Flag className="h-4 w-4 text-purple-500" />
                                        {flag.key}
                                    </h4>
                                    <p className="text-sm text-muted-foreground mt-1">{flag.description}</p>
                                    <div className="mt-2 text-xs text-muted-foreground">
                                        Whitelisted Shops: {flag.allowed_shop_ids?.length || 0}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Badge variant={flag.is_enabled_globally ? "default" : "secondary"} className={flag.is_enabled_globally ? "bg-green-600 hover:bg-green-700" : ""}>
                                        {flag.is_enabled_globally ? 'Global Launch' : 'Beta / Restricted'}
                                    </Badge>
                                    <form action={async () => {
                                        'use server';
                                        await toggleFlag(flag.id, flag.is_enabled_globally);
                                    }}>
                                        <button className="text-muted-foreground hover:text-foreground transition-colors" title="Toggle Global Status">
                                            {flag.is_enabled_globally ? <ToggleRight className="h-8 w-8 text-green-500" /> : <ToggleLeft className="h-8 w-8 text-muted-foreground" />}
                                        </button>
                                    </form>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}
