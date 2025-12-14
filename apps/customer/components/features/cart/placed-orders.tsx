"use client";

import { useEffect, useState } from "react";
import { getTableOrders } from "@/lib/api";
import { useCartStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, ChefHat, Utensils, XCircle } from "lucide-react";
import { getCurrencySymbol } from "@/lib/utils";

interface PlacedOrdersProps {
    currencySymbol?: string;
    onOrderClick?: (orderId: string) => void;
}

export function PlacedOrders({ currencySymbol = "$", onOrderClick }: PlacedOrdersProps) {
    const { tableId } = useCartStore();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (tableId) {
            fetchOrders();
            // Optional: Poll for updates every 10 seconds
            const interval = setInterval(fetchOrders, 10000);
            return () => clearInterval(interval);
        } else {
            setLoading(false);
        }
    }, [tableId]);

    const fetchOrders = async () => {
        if (!tableId) return;
        const data = await getTableOrders(tableId);
        setOrders(data || []);
        setLoading(false);
    };

    if (loading) return <div className="p-4 text-center text-gray-500">Loading orders...</div>;
    if (orders.length === 0) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'queued': return 'bg-gray-100 text-gray-600';
            case 'preparing': return 'bg-orange-100 text-orange-600';
            case 'ready': return 'bg-green-100 text-green-600';
            case 'served': return 'bg-blue-100 text-blue-600';
            case 'cancelled': return 'bg-red-100 text-red-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'queued': return <Clock className="w-3 h-3" />;
            case 'preparing': return <ChefHat className="w-3 h-3" />;
            case 'ready': return <CheckCircle2 className="w-3 h-3" />;
            case 'served': return <Utensils className="w-3 h-3" />;
            case 'cancelled': return <XCircle className="w-3 h-3" />;
            default: return <Clock className="w-3 h-3" />;
        }
    };

    const activeOrders = orders.filter(order => order.status !== 'cancelled');

    const grandSubtotal = activeOrders.reduce((sum, order) => {
        const orderSubtotal = order.order_items.reduce((itemSum: number, item: any) => itemSum + (item.price * item.quantity), 0);
        return sum + orderSubtotal;
    }, 0);

    const grandTotal = activeOrders.reduce((sum, order) => sum + order.total_amount, 0);
    const grandTax = grandTotal - grandSubtotal;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800">Placed Orders</h2>
                <Badge variant="outline" className="text-gray-600 border-gray-300">
                    Total Bill:
                    {grandTax > 0.01 ? (
                        <span className="ml-1">
                            {currencySymbol}{grandTotal.toFixed(2)} (incl. taxes)
                        </span>
                    ) : (
                        <span className="ml-1">{currencySymbol}{grandTotal.toFixed(2)}</span>
                    )}
                </Badge>
            </div>

            <div className="space-y-4">
                {orders.map((order) => {
                    const orderSubtotal = order.order_items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
                    const orderTax = order.total_amount - orderSubtotal;

                    return (
                        <div
                            key={order.id}
                            className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm cursor-pointer hover:border-orange-300 transition-colors text-left w-full"
                            onClick={() => onOrderClick?.(order.id)}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <Badge className={`flex items-center gap-1 border-0 ${getStatusColor(order.status)}`}>
                                        {getStatusIcon(order.status)}
                                        <span className="capitalize">{order.status}</span>
                                    </Badge>
                                    <span className="text-xs text-gray-400">
                                        #{order.order_number || order.id.slice(0, 8)} • {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <span className={`font-bold text-gray-800 ${order.status === 'cancelled' ? 'line-through opacity-50' : ''}`}>
                                    {orderTax > 0.01 && order.status !== 'cancelled' ? (
                                        <span className="text-sm">
                                            {currencySymbol}{order.total_amount.toFixed(2)} (incl. taxes)
                                        </span>
                                    ) : (
                                        <>{currencySymbol}{order.total_amount.toFixed(2)}</>
                                    )}
                                </span>
                            </div>

                            <div className={`space-y-2 ${order.status === 'cancelled' ? 'opacity-50' : ''}`}>
                                {order.order_items.map((item: any) => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                        <div className="flex gap-2">
                                            <span className="font-bold text-gray-600">{item.quantity}x</span>
                                            <div className="flex flex-col">
                                                <span className="text-gray-700">{item.name}</span>
                                                {item.notes && (
                                                    <span className="text-xs text-gray-400 italic">Note: {item.notes}</span>
                                                )}
                                            </div>
                                        </div>
                                        <span className={`text-gray-500 ${order.status === 'cancelled' ? 'line-through' : ''}`}>
                                            {currencySymbol}{(item.price * item.quantity).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

