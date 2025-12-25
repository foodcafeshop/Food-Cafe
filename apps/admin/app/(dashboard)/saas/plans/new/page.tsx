
'use client';

import { upsertPlan } from '@/app/actions';
import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function NewPlanPage() {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const rawData = Object.fromEntries(formData.entries());

        // Handle checkbox manually if using shadcn Checkbox? 
        // Shadcn Checkbox doesn't always play nice with native forms unless using a hidden input.
        // For simplicity and robustness with standard FormData, I'll use native checkbox styled or ensure value is passed.
        // Actually, let's use the native checkbox with a class to make it look decent, OR rely on `name` existing.
        // But wait, the previous code handled `is_active` manually from formData.

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
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">New Plan</h2>
                <p className="text-muted-foreground">Define a subscription tier.</p>
            </div>

            <Card>
                <form onSubmit={handleSubmit}>
                    <CardHeader>
                        <CardTitle>Plan Details</CardTitle>
                        <CardDescription>Enter the details for the new subscription plan.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Plan Name</Label>
                            <Input id="name" name="name" required placeholder="e.g. Pro Plan" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" required placeholder="Best for growing businesses..." className="h-20" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">Price (INR)</Label>
                                <Input id="price" name="price" type="number" min="0" step="1" required placeholder="Original Price (e.g. 1500)" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="offer_price">Offer Price (Optional)</Label>
                                <Input id="offer_price" name="offer_price" type="number" min="0" step="1" placeholder="Discounted Price (e.g. 999)" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="interval">Interval</Label>
                            <select
                                id="interval"
                                name="interval"
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="month">Monthly</option>
                                <option value="quarterly">Quarterly (3 Months)</option>
                                <option value="half_yearly">Half Yearly (6 Months)</option>
                                <option value="year">Yearly</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="features">Features (Comma separated)</Label>
                            <Textarea id="features" name="features" required placeholder="Unlimited Tables, Advanced Analytics, AI Menu Import" className="h-24" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gateway_metadata">Gateway Metadata (JSON)</Label>
                            <Textarea id="gateway_metadata" name="gateway_metadata" className="font-mono text-xs h-24" placeholder={'{"razorpay": {"plan_id": "plan_..."}}'} />
                        </div>
                        <div className="flex items-center space-x-2 pt-2">
                            <input
                                type="checkbox"
                                id="is_active"
                                name="is_active"
                                defaultChecked
                                className="h-4 w-4 rounded border-primary text-primary focus:ring-primary"
                            />
                            <Label htmlFor="is_active">Active (Visible to merchants)</Label>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                        <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700 text-white">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {loading ? 'Creating...' : 'Create Plan'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
