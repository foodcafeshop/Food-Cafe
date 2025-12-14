"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OrderStatus } from "@/lib/order-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ChefHat, Clock, Utensils, Star, XCircle } from "lucide-react";
import { cn, getCurrencySymbol } from "@/lib/utils";
import { useEffect, useState } from "react";
import { getOrderById, cancelOrder } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { RatingDialog } from "@/components/features/feedback/rating-dialog";
import { useSettingsStore } from "@/lib/settings-store";
import { toast } from "sonner";

interface OrderDetailsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string | null;
    initialOrder?: any;
    shopId?: string; // Optional, can be derived from order
    currencySymbol?: string;
}

export function OrderDetailsDialog({ isOpen, onClose, orderId, initialOrder, shopId, currencySymbol }: OrderDetailsDialogProps) {
    const [order, setOrder] = useState<any>(initialOrder || null);
    const [loading, setLoading] = useState(!initialOrder);
    const [timeLeft, setTimeLeft] = useState(12);
    const [isRatingOpen, setIsRatingOpen] = useState(false);
    const { getCurrencySymbol } = useSettingsStore();

    // Reset state when dialog opens with a new orderId
    useEffect(() => {
        if (isOpen && orderId) {
            if (initialOrder && initialOrder.id === orderId) {
                setOrder(initialOrder);
                setLoading(false);
            } else {
                setLoading(true);
                fetchOrder(orderId);
            }
        }
    }, [isOpen, orderId, initialOrder]);

    // Realtime updates
    useEffect(() => {
        if (!isOpen || !orderId) return;

        const channel = supabase
            .channel(`order-dialog-${orderId}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` }, (payload) => {
                setOrder((prev: any) => ({ ...prev, ...payload.new }));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isOpen, orderId]);

    const fetchOrder = async (id: string) => {
        const data = await getOrderById(id);
        setOrder(data);
        setLoading(false);
    };

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    const handleCancelOrder = async () => {
        if (!order) return;
        try {
            setLoading(true);
            await cancelOrder(order.id);
            toast.success("Order cancelled successfully");
            onClose();
        } catch (error) {
            console.error("Failed to cancel order:", error);
            toast.error("Failed to cancel order: " + (error as Error).message);
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const steps: { id: OrderStatus; label: string; icon: any }[] = [
        { id: 'queued', label: 'Order Received', icon: CheckCircle2 },
        { id: 'preparing', label: 'Preparing', icon: ChefHat },
        { id: 'ready', label: 'Ready to Serve', icon: Utensils },
        { id: 'served', label: 'Served', icon: CheckCircle2 },
    ];

    const currentStepIndex = order ? steps.findIndex(s => s.id === order.status) : 0;
    const displayCurrency = currencySymbol || getCurrencySymbol();

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Order Status #{order?.order_number || orderId?.slice(0, 8)}</DialogTitle>
                </DialogHeader>

                {loading || !order ? (
                    <div className="py-8 text-center text-gray-500">Loading order details...</div>
                ) : (
                    <div className="space-y-6">
                        {/* Status Card */}
                        <div className={cn(
                            "rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-2 border",
                            order.status === 'cancelled'
                                ? "bg-red-50 border-red-100"
                                : "bg-primary/5 border-primary/10"
                        )}>
                            <div className={cn(
                                "h-14 w-14 rounded-full flex items-center justify-center",
                                order.status === 'cancelled' ? "bg-red-100" : "bg-primary animate-pulse"
                            )}>
                                {order.status === 'cancelled' ? (
                                    <XCircle className="h-7 w-7 text-red-600" />
                                ) : (
                                    <ChefHat className="h-7 w-7 text-primary-foreground" />
                                )}
                            </div>
                            <h2 className={cn(
                                "text-lg font-bold",
                                order.status === 'cancelled' ? "text-red-700" : "text-primary"
                            )}>
                                {order.status === 'queued' && 'Order Received'}
                                {order.status === 'preparing' && 'Cooking with Love'}
                                {order.status === 'ready' && 'Coming to You'}
                                {order.status === 'served' && 'Enjoy your Meal!'}
                                {order.status === 'cancelled' && 'Order Cancelled'}
                            </h2>
                            {order.status !== 'served' && order.status !== 'cancelled' && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> Estimated time: {timeLeft} mins
                                </p>
                            )}
                        </div>

                        {/* Timeline */}
                        {order.status !== 'cancelled' && (
                            <div className="relative flex flex-col gap-6 pl-4 border-l-2 border-muted ml-2">
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
                                                <step.icon className={cn("h-4 w-4", isCurrent && "text-primary animate-bounce")} />
                                                <span className={cn("font-medium text-sm", isCurrent && "text-primary font-bold")}>
                                                    {step.label}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Order Summary */}
                        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                            <h3 className="font-bold text-sm text-gray-700">Order Summary</h3>
                            <div className="space-y-2">
                                {order.order_items?.map((item: any, i: number) => (
                                    <div key={i} className="flex justify-between items-start text-sm">
                                        <div className="flex gap-2">
                                            <span className="font-bold text-gray-600">{item.quantity}x</span>
                                            <span className="text-gray-800">{item.name}</span>
                                        </div>
                                        <span className="font-medium text-gray-600">{displayCurrency}{(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            {(() => {
                                const subtotal = order.order_items?.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0) || 0;
                                const tax = order.total_amount - subtotal;

                                return (
                                    <div className="border-t border-gray-200 pt-3 space-y-2">
                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span>Subtotal</span>
                                            <span>{displayCurrency}{subtotal.toFixed(2)}</span>
                                        </div>
                                        {tax > 0.01 && (
                                            <div className="flex justify-between text-sm text-gray-600">
                                                <span>Tax</span>
                                                <span>{displayCurrency}{tax.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between font-bold text-gray-800 pt-1">
                                            <span>Total</span>
                                            <span>{displayCurrency}{order.total_amount.toFixed(2)}</span>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {(order.status === 'served' || order.status === 'billed') && (
                            <Button
                                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
                                onClick={() => setIsRatingOpen(true)}
                            >
                                <Star className="w-4 h-4 mr-2" />
                                Rate your Experience
                            </Button>
                        )}

                        {order.status === 'queued' && (
                            <Button
                                variant="destructive"
                                className="w-full"
                                onClick={handleCancelOrder}
                                disabled={loading}
                            >
                                Cancel Order
                            </Button>
                        )}
                    </div>
                )}
            </DialogContent>

            {order && (
                <RatingDialog
                    isOpen={isRatingOpen}
                    onClose={() => setIsRatingOpen(false)}
                    orderId={order.id}
                    shopId={order.shop_id}
                    items={order.order_items || []}
                />
            )}
        </Dialog>
    );
}
