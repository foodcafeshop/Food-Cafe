"use client";

import { useEffect, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingBag, Bike, Clock, CheckCircle2, Receipt, XCircle } from "lucide-react";
import { cn, getCurrencySymbol } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { updateOrderStatus } from "@/lib/api";

interface TakeawayListProps {
    shopId: string;
    onSettle: (order: any) => void;
    showOtpHeader?: boolean;
}

export interface TakeawayListRef {
    refresh: () => Promise<void>;
}

export const TakeawayList = forwardRef<TakeawayListRef, TakeawayListProps>(({ shopId, onSettle, showOtpHeader = false }, ref) => {
    const [takeaways, setTakeaways] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currency, setCurrency] = useState('₹');
    const [takeawayOtp, setTakeawayOtp] = useState<string | null>(null);
    const [otpEnabled, setOtpEnabled] = useState(false);

    const fetchTakeaways = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('shop_id', shopId)
            .in('status', ['queued', 'preparing', 'ready'])
            .in('service_type', ['takeaway', 'delivery'])
            .order('created_at', { ascending: true });

        if (error) {
            console.error("Error fetching takeaways:", error);
            toast.error("Failed to fetch takeaways.");
        } else {
            setTakeaways(data || []);
        }
        setLoading(false);
    }, [shopId]);

    useImperativeHandle(ref, () => ({
        refresh: fetchTakeaways
    }));

    useEffect(() => {
        if (shopId) {
            fetchTakeaways();
            fetchSettings();

            // Realtime subscription for orders
            const channel = supabase
                .channel(`takeaway-list-${shopId}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'orders',
                        filter: `shop_id=eq.${shopId}`
                    },
                    (payload) => {
                        // Refresh on any change for simplicity, or handle granular updates
                        fetchTakeaways();
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'settings',
                        filter: `shop_id=eq.${shopId}`
                    },
                    (payload) => {
                        // Update OTP when settings change
                        if (payload.new.takeaway_otp) setTakeawayOtp(payload.new.takeaway_otp);
                        if (typeof payload.new.enable_otp === 'boolean') setOtpEnabled(payload.new.enable_otp);
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [shopId, fetchTakeaways]);

    const fetchSettings = async () => {
        const { data } = await supabase.from('settings').select('currency, takeaway_otp, enable_otp').eq('shop_id', shopId).single();
        if (data) {
            if (data.currency) setCurrency(data.currency);
            setTakeawayOtp(data.takeaway_otp || null);
            setOtpEnabled(data.enable_otp || false);
        }
    };

    const handleMarkServed = async (orderId: string) => {
        try {
            await updateOrderStatus(orderId, 'served');
            toast.success("Order marked as Served");
            fetchTakeaways();
        } catch (e) {
            toast.error("Failed to update status");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'queued': return 'text-yellow-600 border-yellow-200 bg-yellow-50';
            case 'preparing': return 'text-blue-600 border-blue-200 bg-blue-50';
            case 'ready': return 'text-green-600 border-green-200 bg-green-50';
            case 'served': return 'text-gray-600 border-gray-200 bg-gray-50';
            default: return 'text-gray-600 border-gray-200 bg-gray-50';
        }
    };

    const TimeElapsed = ({ date }: { date: string }) => {
        const [elapsed, setElapsed] = useState(0);

        useEffect(() => {
            const interval = setInterval(() => {
                const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000 / 60);
                setElapsed(diff);
            }, 60000);
            const initialDiff = Math.floor((Date.now() - new Date(date).getTime()) / 1000 / 60);
            setElapsed(initialDiff);
            return () => clearInterval(interval);
        }, [date]);

        return (
            <span className={cn("text-xs flex items-center gap-1", elapsed > 15 ? "text-red-500 font-medium" : "text-muted-foreground")}>
                <Clock className="h-3 w-3" />
                {elapsed}m
            </span>
        );
    };

    if (loading && takeaways.length === 0) {
        return <div className="p-4 text-center text-muted-foreground text-sm">Loading takeaways...</div>;
    }

    if (takeaways.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground p-4 text-center border-2 border-dashed rounded-lg m-4">
                <ShoppingBag className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm font-medium">No active takeaways</p>
                <p className="text-xs">New takeaway/delivery orders will appear here.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* OTP Header - shown when parent header is hidden (mobile) */}
            {showOtpHeader && takeawayOtp && (
                <div className="p-3 mx-3 mb-1 bg-muted/30 rounded-lg border flex items-center justify-center gap-2 shrink-0">
                    <span className="text-sm text-muted-foreground">Takeaway OTP:</span>
                    <span className={cn(
                        "font-mono font-bold text-xl px-3 py-1 rounded border",
                        otpEnabled
                            ? "text-orange-600 bg-orange-50 border-orange-200"
                            : "text-muted-foreground bg-muted border-border"
                    )}>
                        {takeawayOtp}
                    </span>
                </div>
            )}

            <ScrollArea className="flex-1 h-full">
                <div className="flex flex-col gap-4 p-4">
                    {takeaways.map((order: any) => (
                        <Card key={order.id} className="p-4 flex flex-col gap-2.5">
                            {/* Header Row: Status + Order Number + Time */}
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={cn("h-5 text-[10px] px-1.5 uppercase font-semibold", getStatusColor(order.status))}>
                                        {order.status}
                                    </Badge>
                                    <span className="text-sm font-bold text-foreground">#{order.order_number || order.id.slice(0, 4)}</span>
                                </div>
                                <TimeElapsed date={order.created_at} />
                            </div>

                            {/* Customer Info */}
                            <div>
                                <div className="font-medium text-sm truncate">{order.customer_name || 'Guest'}</div>
                                {order.customer_phone && <div className="text-xs text-muted-foreground">{order.customer_phone}</div>}
                            </div>

                            {/* Service Type + Amount */}
                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    {order.service_type === 'delivery' ? <Bike className="h-3.5 w-3.5" /> : <ShoppingBag className="h-3.5 w-3.5" />}
                                    <span className="capitalize">{order.service_type}</span>
                                </div>
                                <span className="font-semibold text-sm text-foreground">{currency}{order.total_amount?.toFixed(2)}</span>
                            </div>

                            {/* Pickup OTP Display */}
                            {order.pickup_otp && (
                                <div className="flex items-center gap-2 py-1.5 px-2.5 bg-orange-50/50 rounded border border-orange-100">
                                    <span className="text-[10px] text-muted-foreground uppercase font-medium">Pickup OTP:</span>
                                    <span className="font-mono font-bold text-sm text-orange-600">
                                        {order.pickup_otp}
                                    </span>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 pt-2 mt-1 border-t border-border/40">
                                {order.status === 'ready' && (
                                    <Button size="sm" className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700" onClick={() => handleMarkServed(order.id)}>
                                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Served
                                    </Button>
                                )}
                                <Button size="sm" variant="outline" className={cn("h-8 text-xs border-green-200 text-green-700 hover:bg-green-50", order.status !== 'ready' && "flex-1")} onClick={() => onSettle(order)}>
                                    <Receipt className="h-3.5 w-3.5 mr-1.5" /> Settle
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
});

TakeawayList.displayName = "TakeawayList";
