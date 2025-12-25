
'use client';

import { upsertCoupon } from '@/app/actions';
import { useState } from 'react';
import { toast } from 'sonner';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function NewCouponPage() {
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState<Date>();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        try {
            await upsertCoupon(data);
            toast.success('Coupon created');
        } catch (error: any) {
            toast.error(error.message);
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">New Platform Coupon</h2>
                <p className="text-muted-foreground">Create a discount for subscription plans.</p>
            </div>

            <Card>
                <form onSubmit={handleSubmit}>
                    <CardHeader>
                        <CardTitle>Coupon Details</CardTitle>
                        <CardDescription>Enter the details for the new discount coupon.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="code">Coupon Code</Label>
                            <Input id="code" name="code" required placeholder="WELCOME50" className="uppercase font-mono" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="discount_type">Discount Type</Label>
                                <select
                                    id="discount_type"
                                    name="discount_type"
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="percentage">Percentage (%)</option>
                                    <option value="flat">Flat Amount (₹)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="discount_amount">Amount</Label>
                                <Input id="discount_amount" name="discount_amount" type="number" min="0" step="1" required placeholder="50" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="max_uses">Max Uses</Label>
                                <Input id="max_uses" name="max_uses" type="number" min="0" step="1" placeholder="Total global uses" />
                            </div>
                            <div className="space-y-2">
                                <Label>Valid Until</Label>
                                <div className="flex gap-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
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
                                    <Input
                                        type="time"
                                        className="w-32"
                                        defaultValue="23:59"
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
                        <div className="space-y-2">
                            <Label htmlFor="gateway_coupon_id">Gateway Coupon ID</Label>
                            <Input id="gateway_coupon_id" name="gateway_coupon_id" placeholder="offer_..." />
                            <p className="text-[0.8rem] text-muted-foreground">ID from Razorpay dashboard (optional if handled locally)</p>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {loading ? 'Creating...' : 'Create Coupon'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
