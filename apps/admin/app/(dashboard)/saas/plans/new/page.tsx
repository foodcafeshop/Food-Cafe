
'use client';

import { upsertPlan } from '@/app/actions';
import { useState } from 'react';
import { toast } from 'sonner';

export default function NewPlanPage() {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const rawData = Object.fromEntries(formData.entries());
        const data = {
            ...rawData,
            is_active: formData.get('is_active') === 'on'
        };

        try {
            await upsertPlan(data);
            toast.success('Plan created');
        } catch (error: any) {
            toast.error(error.message);
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-white">New Plan</h2>
                <p className="text-slate-400">Define a subscription tier.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 bg-slate-900 p-8 rounded-lg border border-slate-800">
                <div className="grid gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Plan Name</label>
                        <input name="name" required className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" placeholder="e.g. Pro Plan" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                        <textarea name="description" required className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white h-20" placeholder="Best for growing businesses..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Price (INR)</label>
                            <input name="price" type="number" min="0" step="1" required className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" placeholder="Original Price (e.g. 1500)" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Offer Price (Optional)</label>
                            <input name="offer_price" type="number" min="0" step="1" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" placeholder="Discounted Price (e.g. 999)" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Interval</label>
                        <select name="interval" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white">
                            <option value="month">Monthly</option>
                            <option value="quarterly">Quarterly (3 Months)</option>
                            <option value="half_yearly">Half Yearly (6 Months)</option>
                            <option value="year">Yearly</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Features (Comma separated)</label>
                        <textarea name="features" required className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white h-24" placeholder="Unlimited Tables, Advanced Analytics, AI Menu Import" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Gateway Metadata (JSON)</label>
                        <textarea name="gateway_metadata" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono text-sm h-24" placeholder={'{"razorpay": {"plan_id": "plan_..."}}'} />
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" name="is_active" id="is_active" defaultChecked className="rounded border-slate-700 bg-slate-950 text-orange-600 focus:ring-orange-600" />
                        <label htmlFor="is_active" className="text-sm font-medium text-slate-300">Active (Visible to merchants)</label>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button type="submit" disabled={loading} className="bg-orange-600 text-white px-4 py-2 rounded font-medium hover:bg-orange-700 disabled:opacity-50">
                        {loading ? 'Creating...' : 'Create Plan'}
                    </button>
                </div>
            </form>
        </div>
    )
}
