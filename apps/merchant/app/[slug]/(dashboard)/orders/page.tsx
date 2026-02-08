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
import { ReceiptPrintView } from "@/components/features/orders/receipt-print-view";
import { BillingDialog } from "@/components/features/staff/BillingDialog";
import { supabase } from "@/lib/supabase";
import { Printer, Receipt } from "lucide-react";

import { useShopId } from "@/lib/hooks/use-shop-id";

export default function OrdersPage() {
    const { shopId } = useShopId();
    const [orders, setOrders] = useState<any[]>([]);
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [serviceTypeFilter, setServiceTypeFilter] = useState("all"); // Added
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editItems, setEditItems] = useState<any[]>([]);
    const [billingOrder, setBillingOrder] = useState<any>(null);

    // Print State
    const [shopDetails, setShopDetails] = useState<any>(null);
    const [printMode, setPrintMode] = useState<"bill" | "kot" | null>(null);
    const [printOrder, setPrintOrder] = useState<any>(null);

    useEffect(() => {
        if (shopId) {
            const fetchShop = async () => {
                const { data } = await supabase.from('shops').select('*').eq('id', shopId).single();
                setShopDetails(data);
            }
            fetchShop();
        }
    }, [shopId]);

    const handlePrint = (order: any, mode: "bill" | "kot") => {
        setPrintOrder(order);
        setPrintMode(mode);
        // Wait for render then print
        setTimeout(() => {
            window.print();
            // Optional: clear after print to remove styles, but keep for now to avoid flicker if user cancels
            // setPrintMode(null); 
        }, 100);
    };

    // Close print mode when dialog closes or user acknowledges
    useEffect(() => {
        const handleAfterPrint = () => {
            setPrintMode(null);
            setPrintOrder(null);
        };
        window.addEventListener("afterprint", handleAfterPrint);
        return () => window.removeEventListener("afterprint", handleAfterPrint);
    }, []);

    useEffect(() => {
        if (shopId) {
            loadData();
        }
    }, [shopId]);

    const loadData = async () => {
        if (!shopId) return;
        setLoading(true);
        const [ordersData, settingsData] = await Promise.all([
            getOrderHistory(shopId),
            getSettings(shopId)
        ]);
        setOrders(ordersData || []);
        setSettings(settingsData);
        setLoading(false);
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.id.toLowerCase().includes(search.toLowerCase()) ||
            order.order_number?.toLowerCase().includes(search.toLowerCase()) ||
            order.table_id?.toString().includes(search);
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        // Service Type Filter
        const matchesService = serviceTypeFilter === 'all' || (order.service_type || 'dine_in') === serviceTypeFilter;

        return matchesSearch && matchesStatus && matchesService;
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

    const getServiceBadge = (type: string | null) => {
        const t = type || 'dine_in';
        if (t === 'takeaway') return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 h-5 px-1.5 text-[10px]">Takeaway</Badge>
        if (t === 'delivery') return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 h-5 px-1.5 text-[10px]">Delivery</Badge>
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 h-5 px-1.5 text-[10px]">Dine In</Badge>
    };

    const currency = settings?.currency || '$';

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Order History</h1>
                <Button variant="outline" onClick={loadData}>Refresh</Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-muted/40 p-4 rounded-lg border">
                <div className="relative flex-1 max-w-sm w-full">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search Order ID or Table..."
                        className="pl-9 bg-background"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
                        <SelectTrigger className="w-[150px] bg-background">
                            <SelectValue placeholder="Service Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="dine_in">Dine In</SelectItem>
                            <SelectItem value="takeaway">Takeaway</SelectItem>
                            <SelectItem value="delivery">Delivery</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[150px] bg-background">
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
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono text-sm text-muted-foreground">#{order.order_number || order.id.slice(0, 8)}</span>
                                    {getServiceBadge(order.service_type)}
                                    {(order.service_type === 'dine_in' || !order.service_type) && (
                                        <Badge variant="outline" className="bg-background">Table {order.tables?.label || order.table_id || 'N/A'}</Badge>
                                    )}
                                    <Badge variant="secondary" className={cn("capitalize", getStatusColor(order.status))}>
                                        {order.status}
                                    </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {new Date(order.created_at).toLocaleString()} • {order.staff_name || order.customer_name || 'Guest'}
                                    {(order.service_type === 'takeaway' || order.service_type === 'delivery') && order.customer_phone && (
                                        <span className="ml-1 text-xs">({order.customer_phone})</span>
                                    )}
                                </div>
                                <div className="text-sm font-medium mt-1">
                                    {order.order_items?.map((i: any) => `${i.quantity}x ${i.name}`).join(', ')}
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <div className="font-bold text-lg">{currency}{order.total_amount.toFixed(2)}</div>
                                    <div className="text-xs text-muted-foreground capitalize">{order.payment_status}</div>
                                </div>
                                {order.status !== 'billed' && order.status !== 'complete' && order.status !== 'cancelled' && order.service_type !== 'dine_in' && (
                                    <Button
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700 h-8"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setBillingOrder(order);
                                        }}
                                    >
                                        Settle
                                    </Button>
                                )}
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
                            <div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-bold text-lg flex items-center gap-2">
                                            Order #{selectedOrder.order_number || selectedOrder.id.slice(0, 8)}
                                            {getServiceBadge(selectedOrder.service_type)}
                                        </div>
                                        <div className="text-sm text-muted-foreground">{new Date(selectedOrder.created_at).toLocaleString()}</div>
                                        <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                                            <span>Ordered by <span className="font-medium text-foreground">{selectedOrder.staff_name || selectedOrder.customer_name || 'Guest'}</span></span>
                                            {selectedOrder.is_staff_order && <Badge variant="secondary" className="bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 text-[10px] h-5 px-1.5">Staff</Badge>}
                                        </div>
                                        {(selectedOrder.service_type === 'takeaway' || selectedOrder.service_type === 'delivery') && (
                                            <div className="text-sm text-muted-foreground mt-0.5">
                                                Phone: <span className="font-mono">{selectedOrder.customer_phone}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        {!isEditing && (
                                            <>
                                                <Button size="sm" variant="outline" onClick={() => handlePrint(selectedOrder, 'kot')} title="Print KOT">
                                                    <Printer className="h-4 w-4 mr-1" /> KOT
                                                </Button>
                                            </>
                                        )}
                                        {!isEditing && selectedOrder.status !== 'billed' && selectedOrder.status !== 'cancelled' && (
                                            <Button size="sm" variant="outline" onClick={() => { setEditItems(JSON.parse(JSON.stringify(selectedOrder.order_items))); setIsEditing(true); }}>
                                                <Edit2 className="h-4 w-4 mr-2" /> Edit
                                            </Button>
                                        )}
                                        {!isEditing && selectedOrder.status !== 'billed' && selectedOrder.status !== 'cancelled' && (
                                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setBillingOrder(selectedOrder)}>
                                                <Receipt className="h-4 w-4 mr-2" /> Settle
                                            </Button>
                                        )}
                                        <Badge className={cn("capitalize", getStatusColor(selectedOrder.status))}>
                                            {selectedOrder.status}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 py-2">
                                {(isEditing ? editItems : selectedOrder.order_items)?.map((item: any, index: number) => (
                                    <div key={index} className="flex justify-between items-start text-sm group">
                                        <div className="flex gap-3 items-center">
                                            {isEditing ? (
                                                <div className="flex items-center gap-1 mr-2">
                                                    <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => {
                                                        const newItems = [...editItems];
                                                        if (newItems[index].quantity > 1) {
                                                            newItems[index].quantity--;
                                                            setEditItems(newItems);
                                                        }
                                                    }}>-</Button>
                                                    <span className="w-6 text-center font-bold tabular-nums">{item.quantity}</span>
                                                    <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => {
                                                        const newItems = [...editItems];
                                                        newItems[index].quantity++;
                                                        setEditItems(newItems);
                                                    }}>+</Button>
                                                </div>
                                            ) : (
                                                <span className="font-bold w-4">{item.quantity}x</span>
                                            )}

                                            <div>
                                                <div className={cn("font-medium", isEditing && "text-base")}>{item.name}</div>
                                                {item.notes && <div className="text-xs text-muted-foreground italic mt-0.5">{item.notes}</div>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="font-medium">{currency}{(item.price * item.quantity).toFixed(2)}</div>
                                            {isEditing && (
                                                <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
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
                                    <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">Order is empty</div>
                                )}
                            </div>

                            {(() => {
                                const currentItems = isEditing ? editItems : selectedOrder.order_items;
                                const subtotal = currentItems?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || 0;
                                const total = isEditing ? subtotal : selectedOrder.total_amount;
                                const tax = Math.max(0, total - subtotal);

                                return (
                                    <div className="border-t pt-4 space-y-2">
                                        <div className="flex justify-between text-sm text-muted-foreground">
                                            <span>Subtotal</span>
                                            <span>{currency}{subtotal.toFixed(2)}</span>
                                        </div>
                                        {tax > 0.01 && (
                                            <div className="flex justify-between text-sm text-muted-foreground">
                                                <span>Tax</span>
                                                <span>{currency}{tax.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center pt-2">
                                            <span className="font-bold text-lg">Total</span>
                                            <span className="font-bold text-lg">{currency}{total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                );
                            })()}

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
            {/* Hidden Print Component - Only renders when printMode is active */}
            {
                printOrder && printMode && (
                    <ReceiptPrintView
                        order={printOrder}
                        settings={settings}
                        mode={printMode}
                        shopDetails={shopDetails}
                    />
                )
            }

            <BillingDialog
                open={!!billingOrder}
                onOpenChange={(open) => !open && setBillingOrder(null)}
                tableId={billingOrder?.table_id || null}
                orderId={billingOrder?.table_id ? null : billingOrder?.id}
                shopId={shopId}
                tableLabel={billingOrder?.tables?.label || (billingOrder?.service_type === 'takeaway' ? 'Takeaway' : billingOrder?.service_type === 'delivery' ? 'Delivery' : 'Order')}
                onSuccess={(id, status) => {
                    setBillingOrder(null);
                    setSelectedOrder(null);
                    loadData();
                }}
            />
        </div >
    );
}
