'use client';

import { upsertCoupon } from '@/app/actions';
import { useState } from 'react';
import { toast } from 'sonner';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

export default function EditCouponClient({ coupon }: { coupon: any }) {
    const [loading, setLoading] = useState(false);
    // Initialize date from valid_until if exists
    const [date, setDate] = useState<Date | undefined>(
        coupon.valid_until ? new Date(coupon.valid_until) : undefined
    );

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const rawData = Object.fromEntries(formData.entries());

        const data = {
            id: coupon.id,
            ...rawData
        };

        try {
            await upsertCoupon(data);
            toast.success('Coupon updated');
        } catch (error: any) {
            toast.error(error.message);
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-white">Edit Platform Coupon</h2>
                <p className="text-slate-400">Update detailed discount rules.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 bg-slate-900 p-8 rounded-lg border border-slate-800">
                <input type="hidden" name="id" value={coupon.id} />

                <div className="grid gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Coupon Code</label>
                        <input name="code" defaultValue={coupon.code} required className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white uppercase" placeholder="WELCOME50" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Discount Type</label>
                            <select name="discount_type" defaultValue={coupon.discount_type} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white">
                                <option value="percentage">Percentage (%)</option>
                                <option value="flat">Flat Amount (₹)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Amount</label>
                            <input name="discount_amount" type="number" min="0" step="1" defaultValue={coupon.discount_amount} required className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" placeholder="50" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Max Uses</label>
                            <input name="max_uses" type="number" min="0" step="1" defaultValue={coupon.max_uses || ''} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" placeholder="Total global uses" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Valid Until</label>
                            <div className="flex gap-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal bg-slate-950 border-slate-700 text-white hover:bg-slate-900 hover:text-white",
                                                !date && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <input
                                    type="time"
                                    className="bg-slate-950 border border-slate-700 rounded p-2 text-white w-32"
                                    defaultValue={date ? format(date, "HH:mm") : "23:59"}
                                    onChange={(e) => {
                                        if (date) {
                                            const [hours, minutes] = e.target.value.split(':');
                                            const newDate = new Date(date);
                                            newDate.setHours(parseInt(hours), parseInt(minutes));
                                            setDate(newDate);
                                        }
                                    }}
                                />
                            </div>
                            <input type="hidden" name="valid_until" value={date ? date.toISOString() : ''} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Gateway Coupon ID</label>
                        <input name="gateway_coupon_id" defaultValue={coupon.gateway_coupon_id || ''} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" placeholder="offer_..." />
                        <p className="text-xs text-slate-500 mt-1">ID from Razorpay dashboard (optional if handled locally)</p>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50">
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    )
}
