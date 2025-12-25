
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createFlag, toggleFlag } from '@/app/actions';
import { Flag, ToggleRight, ToggleLeft } from 'lucide-react';

export default async function FeatureFlagsPage() {
    const { data: flags } = await supabaseAdmin
        .from('feature_flags')
        .select('*')
        .order('created_at', { ascending: false });

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Feature Flags</h2>
                <p className="text-slate-400">Control feature rollout and beta testing availability.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
                {/* Create Form */}
                <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-lg p-6 h-fit">
                    <h3 className="text-lg font-semibold mb-4 text-white">Create Flag</h3>
                    <form action={async (formData) => {
                        'use server';
                        const data = Object.fromEntries(formData);
                        await createFlag(data);
                    }} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Key (Code Reference)</label>
                            <input name="key" required className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono" placeholder="ai_menu_import" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                            <textarea name="description" required className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white h-24" placeholder="Enables Gemini AI parsing..." />
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" name="is_enabled_globally" id="global" className="rounded border-slate-700 bg-slate-950 text-orange-600 focus:ring-orange-600" />
                            <label htmlFor="global" className="text-sm font-medium text-slate-300">Enable Globally</label>
                        </div>
                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded font-medium">
                            Create Flag
                        </button>
                    </form>
                </div>

                {/* List */}
                <div className="md:col-span-2 space-y-4">
                    <h3 className="text-lg font-semibold text-white">Existing Flags</h3>
                    {flags?.map((flag) => (
                        <div key={flag.id} className="p-4 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                            <div>
                                <h4 className="font-bold text-white font-mono flex items-center gap-2">
                                    <Flag className="h-4 w-4 text-purple-500" />
                                    {flag.key}
                                </h4>
                                <p className="text-sm text-slate-400 mt-1">{flag.description}</p>
                                <div className="mt-2 text-xs text-slate-500">
                                    Whitelisted Shops: {flag.allowed_shop_ids?.length || 0}
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`text-xs px-2 py-1 rounded-full ${flag.is_enabled_globally ? 'bg-green-900/20 text-green-500' : 'bg-yellow-900/20 text-yellow-500'}`}>
                                    {flag.is_enabled_globally ? 'Global Launch' : 'Beta / Restricted'}
                                </span>
                                <form action={async () => {
                                    'use server';
                                    await toggleFlag(flag.id, flag.is_enabled_globally);
                                }}>
                                    <button className="text-slate-400 hover:text-white" title="Toggle Global Status">
                                        {flag.is_enabled_globally ? <ToggleRight className="h-8 w-8 text-green-500" /> : <ToggleLeft className="h-8 w-8 text-slate-600" />}
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
