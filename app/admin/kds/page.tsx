"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, ChefHat, ArrowLeft, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getActiveOrders, updateOrderStatus } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type OrderStatus = 'queued' | 'preparing' | 'ready' | 'served' | 'cancelled';

export default function KDSPage() {
    const [orders, setOrders] = useState<any[]>([]);

    useEffect(() => {
        fetchOrders();

        // Realtime subscription
        const channel = supabase
            .channel('public:orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
                fetchOrders(); // Refresh on any change
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchOrders = async () => {
        const data = await getActiveOrders();
        setOrders(data || []);
    };

    const handleStatusUpdate = async (id: string, status: string) => {
        try {
            await updateOrderStatus(id, status);
            toast.success(`Order marked as ${status}`);
            fetchOrders(); // Optimistic update would be better, but this is safe
        } catch (e) {
            toast.error("Failed to update order");
        }
    };

    const columns: { id: OrderStatus; label: string; color: string }[] = [
        { id: 'queued', label: 'Queued', color: 'bg-yellow-500/10 text-yellow-600' },
        { id: 'preparing', label: 'Preparing', color: 'bg-blue-500/10 text-blue-600' },
        { id: 'ready', label: 'Ready to Serve', color: 'bg-green-500/10 text-green-600' },
    ];

    const getNextStatus = (current: OrderStatus): OrderStatus | null => {
        if (current === 'queued') return 'preparing';
        if (current === 'preparing') return 'ready';
        if (current === 'ready') return 'served';
        return null;
    };

    const getPrevStatus = (current: OrderStatus): OrderStatus | null => {
        if (current === 'preparing') return 'queued';
        if (current === 'ready') return 'preparing';
        return null;
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <ChefHat className="h-8 w-8 text-primary" />
                    Kitchen Display System
                </h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Live Updates</span>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
                {columns.map((col) => (
                    <div key={col.id} className="flex flex-col h-full bg-muted/30 rounded-xl border p-4">
                        <div className={cn("flex items-center justify-between mb-4 p-2 rounded-lg font-bold", col.color)}>
                            <span>{col.label}</span>
                            <Badge variant="secondary" className="bg-background/50">
                                {orders.filter(o => o.status === col.id).length}
                            </Badge>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                            {orders
                                .filter((order) => order.status === col.id)
                                .map((order) => (
                                    <OrderCard
                                        key={order.id}
                                        order={order}
                                        onNext={() => {
                                            const next = getNextStatus(order.status);
                                            if (next) handleStatusUpdate(order.id, next);
                                        }}
                                        onPrev={() => {
                                            const prev = getPrevStatus(order.status);
                                            if (prev) handleStatusUpdate(order.id, prev);
                                        }}
                                        onCancel={() => {
                                            if (confirm("Are you sure you want to cancel this order?")) {
                                                handleStatusUpdate(order.id, 'cancelled');
                                            }
                                        }}
                                    />
                                ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function OrderCard({ order, onNext, onPrev, onCancel }: { order: any; onNext: () => void; onPrev: () => void; onCancel: () => void }) {
    // Calculate time elapsed since created_at
    const [timeElapsed, setTimeElapsed] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            const diff = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 1000 / 60);
            setTimeElapsed(diff);
        }, 1000 * 60);

        // Initial calc
        const diff = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 1000 / 60);
        setTimeElapsed(diff);

        return () => clearInterval(interval);
    }, [order.created_at]);

    return (
        <Card className="border-none shadow-sm group relative">
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={onCancel}
                title="Cancel Order"
            >
                <XCircle className="h-4 w-4" />
            </Button>

            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                    <Badge variant="outline">Table {order.tables?.label || order.table_id}</Badge>
                    <span className="text-xs text-muted-foreground">#{order.id.slice(0, 8)}</span>
                </div>
                <span className={cn("text-xs font-medium mr-6", timeElapsed > 15 ? "text-destructive" : "text-muted-foreground")}>
                    {timeElapsed}m ago
                </span>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-2">
                {order.order_items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-start text-sm">
                        <div className="flex gap-2">
                            <span className="font-bold w-4">{item.quantity}x</span>
                            <div className="flex flex-col">
                                <span>{item.name}</span>
                                {item.notes && <span className="text-xs text-muted-foreground italic">{item.notes}</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
            <CardFooter className="p-4 pt-0 gap-2">
                {order.status !== 'queued' && (
                    <Button variant="outline" size="icon" onClick={onPrev} title="Move Back">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                )}
                <Button className="flex-1" onClick={onNext}>
                    {order.status === 'ready' ? (
                        <>
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Served
                        </>
                    ) : (
                        "Next Stage ->"
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}
