"use client";

import { useEffect, useState } from "react";
import { getOrderHistory, getSettings, updateOrderItems } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Eye, Edit2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn, getCurrencySymbol } from "@/lib/utils";
import { toast } from "sonner";

export default function OrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editItems, setEditItems] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [ordersData, settingsData] = await Promise.all([
            getOrderHistory(),
            getSettings()
        ]);
        setOrders(ordersData || []);
        setSettings(settingsData);
        setLoading(false);
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.id.toLowerCase().includes(search.toLowerCase()) ||
            order.table_id?.toString().includes(search);
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'queued': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'ready': return 'bg-green-100 text-green-800 border-green-200';
            case 'served': return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
            case 'billed': return 'bg-purple-100 text-purple-800 border-purple-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const currency = settings?.currency || '$';

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Order History</h1>
                <Button variant="outline" onClick={loadData}>Refresh</Button>
            </div>

            <div className="flex gap-4 items-center bg-muted/40 p-4 rounded-lg border">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search Order ID or Table..."
                        className="pl-9 bg-background"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px] bg-background">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Filter Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="queued">Queued</SelectItem>
                        <SelectItem value="preparing">Preparing</SelectItem>
                        <SelectItem value="ready">Ready</SelectItem>
                        <SelectItem value="served">Served</SelectItem>
                        <SelectItem value="billed">Billed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-4">
                {loading ? (
                    <div className="text-center py-10 text-muted-foreground">Loading orders...</div>
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">No orders found.</div>
                ) : (
                    filteredOrders.map((order) => (
                        <Card key={order.id} className="flex flex-col md:flex-row items-start md:items-center p-4 gap-4 hover:bg-muted/50 transition-colors">
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm text-muted-foreground">#{order.id.slice(0, 8)}</span>
                                    <Badge variant="outline" className="bg-background">Table {order.tables?.label || order.table_id || 'N/A'}</Badge>
                                    <Badge variant="secondary" className={cn("capitalize", getStatusColor(order.status))}>
                                        {order.status}
                                    </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {new Date(order.created_at).toLocaleString()}
                                </div>
                                <div className="text-sm font-medium mt-1">
                                    {order.order_items?.map((i: any) => `${i.quantity}x ${i.name}`).join(', ')}
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <div className="font-bold text-lg">{currency}{order.total_amount}</div>
                                    <div className="text-xs text-muted-foreground capitalize">{order.payment_status}</div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(order)}>
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            <Dialog open={!!selectedOrder} onOpenChange={(open) => { if (!open) { setSelectedOrder(null); setIsEditing(false); } }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Edit Order' : 'Order Details'}</DialogTitle>
                    </DialogHeader>
                    {selectedOrder && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b pb-2">
                                <div>
                                    <div className="font-bold">Order #{selectedOrder.id.slice(0, 8)}</div>
                                    <div className="text-sm text-muted-foreground">{new Date(selectedOrder.created_at).toLocaleString()}</div>
                                </div>
                                <div className="flex gap-2">
                                    {!isEditing && selectedOrder.status !== 'billed' && selectedOrder.status !== 'cancelled' && (
                                        <Button size="sm" variant="outline" onClick={() => { setEditItems(JSON.parse(JSON.stringify(selectedOrder.order_items))); setIsEditing(true); }}>
                                            <Edit2 className="h-4 w-4 mr-2" /> Edit
                                        </Button>
                                    )}
                                    <Badge className={cn("capitalize", getStatusColor(selectedOrder.status))}>
                                        {selectedOrder.status}
                                    </Badge>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {(isEditing ? editItems : selectedOrder.order_items)?.map((item: any, index: number) => (
                                    <div key={index} className="flex justify-between items-start text-sm">
                                        <div className="flex gap-2 items-center">
                                            {isEditing ? (
                                                <div className="flex items-center gap-1 mr-2">
                                                    <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => {
                                                        const newItems = [...editItems];
                                                        if (newItems[index].quantity > 1) {
                                                            newItems[index].quantity--;
                                                            setEditItems(newItems);
                                                        }
                                                    }}>-</Button>
                                                    <span className="w-4 text-center font-bold">{item.quantity}</span>
                                                    <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => {
                                                        const newItems = [...editItems];
                                                        newItems[index].quantity++;
                                                        setEditItems(newItems);
                                                    }}>+</Button>
                                                </div>
                                            ) : (
                                                <span className="font-bold w-6">{item.quantity}x</span>
                                            )}

                                            <div>
                                                <div className={cn(isEditing && "font-medium")}>{item.name}</div>
                                                {item.notes && <div className="text-xs text-muted-foreground italic">{item.notes}</div>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="font-medium">{currency}{item.price * item.quantity}</div>
                                            {isEditing && (
                                                <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => {
                                                    const newItems = editItems.filter((_, i) => i !== index);
                                                    setEditItems(newItems);
                                                }}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {isEditing && editItems.length === 0 && (
                                    <div className="text-center text-muted-foreground py-4">Order is empty.</div>
                                )}
                            </div>

                            <div className="border-t pt-2 flex justify-between items-center font-bold text-lg">
                                <span>Total</span>
                                <span>{currency}{isEditing
                                    ? editItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
                                    : selectedOrder.total_amount}
                                </span>
                            </div>

                            {isEditing && (
                                <div className="flex gap-2 pt-2">
                                    <Button className="flex-1" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                                    <Button className="flex-1" onClick={async () => {
                                        if (confirm("Save changes to this order?")) {
                                            const updatedOrder = await updateOrderItems(selectedOrder.id, editItems);
                                            if (updatedOrder) {
                                                setOrders(orders.map(o => o.id === updatedOrder.id ? { ...o, ...updatedOrder, order_items: editItems } : o));
                                                setSelectedOrder(null);
                                                setIsEditing(false);
                                                toast.success("Order updated successfully");
                                            } else {
                                                toast.error("Failed to update order");
                                            }
                                        }
                                    }}>Save Changes</Button>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
