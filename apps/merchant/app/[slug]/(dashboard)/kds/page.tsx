"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, Clock, CheckCircle2, ChefHat, ArrowLeft, XCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getActiveOrders, updateOrderStatus } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type OrderStatus = 'queued' | 'preparing' | 'ready' | 'served' | 'cancelled';

import { useShopId } from "@/lib/hooks/use-shop-id";

export default function KDSPage() {
    const { shopId } = useShopId();
    const [orders, setOrders] = useState<any[]>([]);
    const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('all');
    const [search, setSearch] = useState("");
    const prevOrdersCount = useRef(0);
    const [orderToCancel, setOrderToCancel] = useState<string | null>(null);

    useEffect(() => {
        if (shopId) {
            fetchOrders();

            // Realtime subscription
            const channel = supabase
                .channel(`public:orders:${shopId}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `shop_id=eq.${shopId}` }, () => {
                    fetchOrders(); // Refresh on any change
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [shopId]);

    const fetchOrders = async () => {
        if (!shopId) return;
        const data = await getActiveOrders(shopId);

        // Check if we have new orders to play sound
        if (data && data.length > prevOrdersCount.current) {
            // New order received
            const audio = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-positive-notification-951.mp3");
            audio.play().catch(e => console.log("Audio play failed", e));
        }

        if (data) {
            prevOrdersCount.current = data.length;
            setOrders(data);
        } else {
            setOrders([]);
        }
    };

    const handleStatusUpdate = async (id: string, status: string) => {
        // Capture previous state for rollback
        const previousOrders = [...orders];

        // Optimistic update
        setOrders(currentOrders => {
            if (status === 'served' || status === 'cancelled') {
                return currentOrders.filter(o => o.id !== id);
            }
            return currentOrders.map(o =>
                o.id === id ? { ...o, status } : o
            );
        });

        try {
            await updateOrderStatus(id, status);
            toast.success(`Order marked as ${status}`);
            fetchOrders();
        } catch (e) {
            toast.error("Failed to update order");
            // 1. Explicitly Revert State immediately
            setOrders(previousOrders);
            // 2. Try to re-fetch true state (background reconciliation)
            fetchOrders();
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

    const filteredOrders = orders.filter(o => {
        const matchesService = serviceTypeFilter === 'all' || (o.service_type || 'dine_in') === serviceTypeFilter;
        const matchesSearch = !search ||
            o.id.toLowerCase().includes(search.toLowerCase()) ||
            o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
            o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
            o.tables?.label?.toLowerCase().includes(search.toLowerCase());

        return matchesService && matchesSearch;
    });

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <ChefHat className="h-8 w-8 text-primary" />
                    Kitchen Display System
                </h1>

                <div className="flex items-center gap-4">
                    <div className="relative w-[200px]">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search..."
                            className="pl-8 h-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
                        <SelectTrigger className="w-[180px]">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                <SelectValue placeholder="All Service Types" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Service Types</SelectItem>
                            <SelectItem value="dine_in">Dine In</SelectItem>
                            <SelectItem value="takeaway">Takeaway</SelectItem>
                            <SelectItem value="delivery">Delivery</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-full">
                        <Clock className="h-4 w-4" />
                        <span className="animate-pulse text-green-600 font-bold">•</span>
                        <span>Live</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
                {columns.map((col) => (
                    <div key={col.id} className="flex flex-col h-full bg-muted/30 rounded-xl border p-4">
                        <div className={cn("flex items-center justify-between mb-4 p-2 rounded-lg font-bold", col.color)}>
                            <span>{col.label}</span>
                            <Badge variant="secondary" className="bg-background/50">
                                {filteredOrders.filter(o => o.status === col.id).length}
                            </Badge>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                            {filteredOrders
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
                                        onCancel={() => setOrderToCancel(order.id)}
                                    />
                                ))}
                        </div>
                    </div>
                ))}
            </div>

            <AlertDialog open={!!orderToCancel} onOpenChange={() => setOrderToCancel(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Order?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel this order? This action requires kitchen staff authorization.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep Order</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                if (orderToCancel) {
                                    handleStatusUpdate(orderToCancel, 'cancelled');
                                    setOrderToCancel(null);
                                }
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Confirm Cancel
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
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

    const getServiceTypeBadge = (type: string | null) => {
        const t = type || 'dine_in';
        switch (t) {
            case 'dine_in': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Dine In</Badge>;
            case 'takeaway': return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Takeaway</Badge>;
            case 'delivery': return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Delivery</Badge>;
            default: return null;
        }
    };

    return (
        <Card className="border-none shadow-sm group relative">
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity z-10"
                onClick={onCancel}
                title="Cancel Order"
            >
                <XCircle className="h-4 w-4" />
            </Button>

            <CardHeader className="p-4 pb-2 flex flex-col items-start gap-2">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        {getServiceTypeBadge(order.service_type)}
                        <span className="text-xs text-muted-foreground">#{order.order_number || order.id.slice(0, 4)}</span>
                    </div>
                    <span className={cn("text-xs font-medium mr-6", timeElapsed > 15 ? "text-destructive" : "text-muted-foreground")}>
                        {timeElapsed > 60 ? `${Math.floor(timeElapsed / 60)}h ${timeElapsed % 60}m` : `${timeElapsed}m`} ago
                    </span>
                </div>

                {/* Table Info only for Dine In */}
                {(order.service_type === 'dine_in' || !order.service_type) && (
                    <Badge variant="secondary" className="text-xs">
                        Table {order.tables?.label || order.table_id || 'N/A'}
                    </Badge>
                )}

                {/* Customer Info for Takeaway/Delivery */}
                {(order.service_type === 'takeaway' || order.service_type === 'delivery') && (
                    <div className="text-xs bg-muted/40 p-1.5 rounded w-full">
                        <span className="font-bold">{order.customer_name || 'Guest'}</span>
                        <span className="block text-muted-foreground">{order.customer_phone}</span>
                    </div>
                )}

                {order.is_staff_order && <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200 text-[10px] px-1 h-5">{order.staff_name || 'Staff'}</Badge>}
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
