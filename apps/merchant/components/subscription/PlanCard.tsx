'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { createSubscriptionAction } from '@/app/actions/payment';
import { toast } from 'sonner';
import Script from 'next/script';

interface Plan {
    id: string;
    name: string;
    price: number;
    description: string;
    features: string[];
    interval: string;
}

interface PlanCardProps {
    plan: Plan;
    shopSlug: string;
    isCurrent?: boolean;
}

export function PlanCard({ plan, shopSlug, isCurrent }: PlanCardProps) {
    const [loading, setLoading] = useState(false);
    const [coupon, setCoupon] = useState('');

    const handleSubscribe = async () => {
        setLoading(true);
        try {
            // 1. Create Subscription
            const { subscriptionId, keyId } = await createSubscriptionAction(shopSlug, plan.id, coupon);

            // 2. Open Razorpay
            const options = {
                key: keyId,
                subscription_id: subscriptionId,
                name: "Food Cafe",
                description: `Subscribe to ${plan.name}`,
                handler: function (response: any) {
                    toast.success('Subscription Successful!');
                    // Ideally verify signature on server or refresh page to update state
                    window.location.reload();
                },
                theme: {
                    color: "#ea580c"
                }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();

        } catch (error: any) {
            toast.error(error.message || 'Subscription failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />
            <Card className={`flex flex-col ${isCurrent ? 'border-primary border-2' : ''}`}>
                <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                    <div className="text-3xl font-bold">
                        ₹{plan.price}
                        <span className="text-sm font-normal text-muted-foreground">/{plan.interval}</span>
                    </div>
                    <ul className="space-y-2">
                        {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-center text-sm">
                                <span className="mr-2 text-primary">✓</span>
                                {feature}
                            </li>
                        ))}
                    </ul>

                    {!isCurrent && (
                        <div className="pt-4 border-t">
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Have a coupon?</label>
                            <input
                                type="text"
                                placeholder="Enter code"
                                value={coupon}
                                onChange={(e) => setCoupon(e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    {isCurrent ? (
                        <Button disabled className="w-full">Current Plan</Button>
                    ) : (
                        <Button
                            className="w-full"
                            onClick={handleSubscribe}
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Subscribe'}
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </>
    );
}
