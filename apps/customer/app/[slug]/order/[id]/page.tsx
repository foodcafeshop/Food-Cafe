"use client";

import { OrderStatus } from "@/lib/order-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ChefHat, Clock, Utensils, ChevronLeft, Star } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useSettingsStore } from "@/lib/settings-store";

import { getOrderById } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { RatingDialog } from "@/components/features/feedback/rating-dialog";

export default function OrderStatusPage() {
    const { id } = useParams();
    const { getCurrencySymbol } = useSettingsStore();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(12); // Mock estimated time
    const [isRatingOpen, setIsRatingOpen] = useState(false);
    const currencySymbol = getCurrencySymbol();

    useEffect(() => {
        fetchOrder();

        // Realtime subscription for status updates
        const channel = supabase
            .channel(`order-${id}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` }, (payload) => {
                setOrder((prev: any) => ({ ...prev, ...payload.new }));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id]);

    const fetchOrder = async () => {
        if (typeof id === 'string') {
            const data = await getOrderById(id);
            setOrder(data);
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading order...</div>;
    }

    if (!order) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold">Order Not Found</h1>
                <Link href="/menu" className="mt-4">
                    <Button>Return to Menu</Button>
                </Link>
            </div>
        );
    }

    const steps: { id: OrderStatus; label: string; icon: any }[] = [
        { id: 'queued', label: 'Order Received', icon: CheckCircle2 },
        { id: 'preparing', label: 'Preparing', icon: ChefHat },
        { id: 'ready', label: 'Ready to Serve', icon: Utensils },
        { id: 'served', label: 'Served', icon: CheckCircle2 },
    ];

    const currentStepIndex = steps.findIndex(s => s.id === order.status);

    return (
        <div className="min-h-screen bg-muted/30 pb-10">
            <header className="bg-background/95 backdrop-blur border-b sticky top-0 z-50">
                <div className="container flex h-16 items-center px-4">
                    <Link href="/menu">
                        <Button variant="ghost" size="icon" className="-ml-2">
                            <ChevronLeft className="h-6 w-6" />
                        </Button>
                    </Link>
                    <h1 className="font-bold text-lg ml-2">Order Status</h1>
                </div>
            </header>

            <main className="container px-4 py-6 space-y-6">
                {/* Status Card */}
                <Card className="border-none shadow-md overflow-hidden">
                    <div className="bg-primary/10 p-6 flex flex-col items-center justify-center text-center space-y-2">
                        <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center animate-pulse">
                            <ChefHat className="h-8 w-8 text-primary-foreground" />
                        </div>
                        <h2 className="text-xl font-bold text-primary">
                            {order.status === 'queued' && 'Order Received'}
                            {order.status === 'preparing' && 'Cooking with Love'}
                            {order.status === 'ready' && 'Coming to You'}
                            {order.status === 'served' && 'Enjoy your Meal!'}
                        </h2>
                        {order.status !== 'served' && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Estimated time: {timeLeft} mins
                            </p>
                        )}
                    </div>

                    <CardContent className="p-6">
                        <div className="relative flex flex-col gap-8 pl-4 border-l-2 border-muted ml-2">
                            {steps.map((step, idx) => {
                                const isCompleted = idx <= currentStepIndex;
                                const isCurrent = idx === currentStepIndex;

                                return (
                                    <div key={step.id} className="relative">
                                        <div className={cn(
                                            "absolute -left-[21px] top-0 h-4 w-4 rounded-full border-2 bg-background transition-colors",
                                            isCompleted ? "border-primary bg-primary" : "border-muted"
                                        )} />
                                        <div className={cn("flex items-center gap-3 -mt-1 transition-opacity", isCompleted ? "opacity-100" : "opacity-50")}>
                                            <step.icon className={cn("h-5 w-5", isCurrent && "text-primary animate-bounce")} />
                                            <span className={cn("font-medium", isCurrent && "text-primary font-bold")}>
                                                {step.label}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Order Summary */}
                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base">Order Summary #{order.id.slice(-4)}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {order.order_items?.map((item: any, i: number) => (
                            <div key={i} className="flex justify-between items-start text-sm">
                                <div className="flex gap-3">
                                    <span className="font-bold text-muted-foreground">{item.quantity}x</span>
                                    <span>{item.name}</span>
                                </div>
                                <span className="font-medium">{currencySymbol}{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                        <div className="border-t pt-4 flex justify-between font-bold">
                            <span>Total Paid</span>
                            <span>{currencySymbol}{order.order_items?.reduce((acc: number, i: any) => acc + i.price * i.quantity, 0).toFixed(2)}</span>
                        </div>
                    </CardContent>
                </Card>

                <Button variant="outline" className="w-full" asChild>
                    <Link href="/menu">Order More Items</Link>
                </Button>

                {(order.status === 'served' || order.status === 'billed') && (
                    <Button
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
                        onClick={() => setIsRatingOpen(true)}
                    >
                        <Star className="w-4 h-4 mr-2" />
                        Rate your Experience
                    </Button>
                )}
            </main>

            <RatingDialog
                isOpen={isRatingOpen}
                onClose={() => setIsRatingOpen(false)}
                orderId={order.id}
                shopId={order.shop_id}
                items={order.order_items || []}
            />
        </div>
    );
}
