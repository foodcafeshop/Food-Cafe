"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Receipt, Printer, CheckSquare } from "lucide-react";
import { getTableOrders, settleTableBill, getSettings, updateOrderStatus } from "@/lib/api";
import { cn, getCurrencySymbol, roundToThree } from "@/lib/utils";
import { toast } from "sonner";

interface BillingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tableId: string | null;
    tableLabel?: string;
    shopId: string | null;
    onSuccess: () => void;
}

export function BillingDialog({ open, onOpenChange, tableId, tableLabel, shopId, onSuccess }: BillingDialogProps) {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [currency, setCurrency] = useState('₹'); // Default fallback
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [serviceChargeRate, setServiceChargeRate] = useState(0);
    const [includeServiceCharge, setIncludeServiceCharge] = useState(true);
    const [restaurantName, setRestaurantName] = useState('Food Cafe');

    useEffect(() => {
        if (open && tableId && shopId) {
            loadData();
        }
    }, [open, tableId, shopId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [ordersData, settings] = await Promise.all([
                getTableOrders(tableId!),
                getSettings(shopId!)
            ]);
            setOrders(ordersData || []);
            if (settings?.currency) setCurrency(settings.currency);
            if (settings?.service_charge) setServiceChargeRate(settings.service_charge);
            if (settings?.restaurant_name) setRestaurantName(settings.restaurant_name);
        } catch (error) {
            console.error("Failed to load billing data", error);
            toast.error("Failed to load billing details");
        } finally {
            setLoading(false);
        }
    };

    const calculateBilling = () => {
        const activeOrders = orders.filter(o => o.status !== 'cancelled');
        const subtotal = activeOrders.reduce((sum, order) => sum + (order.total_amount / 1.1), 0); // Assuming tax included in total_amount for calculation backwards? or matching tables page logic
        // Original logic: 
        // rawSubtotal = validOrders.reduce((sum, order) => sum + (order.total_amount / 1.1), 0);
        // rawTax = validOrders.reduce((sum, order) => sum + order.total_amount, 0) - rawSubtotal;
        // This implies orders total_amount is inclusive of 10% tax? 
        // Let's rely on standard logic. If API returns total_amount, usually that's the final price.
        // Tables page logic:
        // const rawSubtotal = validOrders.reduce((sum, order) => sum + (order.total_amount / 1.1), 0);
        // const rawTax = validOrders.reduce((sum, order) => sum + order.total_amount, 0) - rawSubtotal;

        // I will copy exact logic for consistency.
        const rawSubtotal = activeOrders.reduce((sum, order) => sum + (order.total_amount / 1.1), 0);
        const rawTax = activeOrders.reduce((sum, order) => sum + order.total_amount, 0) - rawSubtotal;

        const serviceCharge = includeServiceCharge ? (rawSubtotal * (serviceChargeRate / 100)) : 0;

        // Calculations
        const subtotalVal = roundToThree(rawSubtotal);
        const taxVal = roundToThree(rawTax);
        const serviceChargeVal = roundToThree(serviceCharge);
        const grandTotal = subtotalVal + taxVal + serviceChargeVal;

        return { subtotal: subtotalVal, tax: taxVal, serviceCharge: serviceChargeVal, grandTotal: roundToThree(grandTotal) };
    };

    const billing = calculateBilling();

    const handleSettleBill = async () => {
        if (!tableId) return;
        try {
            await settleTableBill(tableId, paymentMethod, billing);
            toast.success("Bill settled successfully");
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to settle bill");
        }
    };

    const handleUpdateOrderStatus = async (orderId: string, status: string) => {
        try {
            await updateOrderStatus(orderId, status);
            toast.success(`Order marked as ${status}`);
            const updatedOrders = await getTableOrders(tableId!);
            setOrders(updatedOrders || []);
        } catch (e) {
            console.error(e);
            toast.error("Failed to update status");
        }
    };

    const handlePrintBill = () => {
        if (!tableId || !restaurantName) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast.error('Please allow popups to print');
            return;
        }

        const { subtotal, tax, serviceCharge, grandTotal } = calculateBilling();
        const date = new Date().toLocaleString();

        const html = `
            <html>
                <head>
                    <title>Bill - ${tableLabel}</title>
                    <style>
                        body { font-family: 'Courier New', monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
                        .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
                        .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
                        .header p { margin: 5px 0 0; font-size: 12px; }
                        .info { margin-bottom: 15px; font-size: 12px; }
                        .items { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 12px; }
                        .items th { text-align: left; border-bottom: 1px solid #000; padding-bottom: 5px; }
                        .items td { padding: 5px 0; }
                        .items .price { text-align: right; }
                        .totals { margin-top: 15px; border-top: 1px dashed #000; padding-top: 10px; font-size: 12px; }
                        .totals .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
                        .totals .grand-total { font-weight: bold; font-size: 16px; margin-top: 10px; border-top: 1px solid #000; padding-top: 10px; }
                        .footer { text-align: center; margin-top: 30px; font-size: 12px; border-top: 1px dashed #000; padding-top: 10px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>${restaurantName}</h1>
                        <p>Thank you for dining with us!</p>
                    </div>
                    
                    <div class="info">
                        <div>Table: ${tableLabel}</div>
                        <div>Date: ${date}</div>
                    </div>

                    <table class="items">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th class="price">Qty</th>
                                <th class="price">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orders
                .filter(o => o.status !== 'cancelled')
                .flatMap(o => o.order_items).map((item: any) => `
                                <tr>
                                    <td>${item.name}</td>
                                    <td class="price">${item.quantity}</td>
                                    <td class="price">${currency}${(item.price * item.quantity).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div class="totals">
                        <div class="row">
                            <span>Subtotal</span>
                            <span>${currency}${subtotal.toFixed(2)}</span>
                        </div>
                        <div class="row">
                            <span>Tax (10%)</span>
                            <span>${currency}${tax.toFixed(2)}</span>
                        </div>
                        ${includeServiceCharge ? `
                        <div class="row">
                            <span>Service Charge (${serviceChargeRate}%)</span>
                            <span>${currency}${serviceCharge.toFixed(2)}</span>
                        </div>
                        ` : ''}
                        <div class="row grand-total">
                            <span>Grand Total</span>
                            <span>${currency}${grandTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    <div class="footer">
                        <p>Please visit again!</p>
                    </div>

                    <script>
                        window.onload = () => { window.print(); }
                    </script>
                </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg z-[100]">
                <DialogHeader>
                    <DialogTitle>Bill for {tableLabel}</DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="py-8 text-center text-muted-foreground">Loading orders...</div>
                ) : orders.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">No active orders for this table.</div>
                ) : (
                    <div className="space-y-6">
                        <div className="max-h-[300px] overflow-y-auto space-y-4 pr-2">
                            {orders.map((order) => (
                                <div key={order.id} className="border rounded-lg p-3 bg-muted/20">
                                    <div className="flex justify-between items-center mb-2 text-sm border-b pb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-muted-foreground">#{order.order_number || order.id.slice(0, 8)}</span>
                                            <Badge variant="outline" className={cn(
                                                "text-[10px] h-5 px-1.5",
                                                order.status === 'served' ? "text-green-600 border-green-600" :
                                                    order.status === 'cancelled' ? "text-red-600 border-red-600" :
                                                        "text-orange-600 border-orange-600"
                                            )}>
                                                {order.status.toUpperCase()}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {['queued', 'preparing', 'ready'].includes(order.status) && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 px-2 text-[10px] text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    onClick={() => handleUpdateOrderStatus(order.id, 'served')}
                                                >
                                                    Mark Served
                                                </Button>
                                            )}
                                            {['queued', 'preparing'].includes(order.status) && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 px-2 text-[10px] text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                                                >
                                                    Cancel
                                                </Button>
                                            )}
                                            <span className="text-muted-foreground text-xs">{new Date(order.created_at).toLocaleTimeString()}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        {order.order_items?.map((item: any, idx: number) => (
                                            <div key={idx} className={cn("flex justify-between text-sm", order.status === 'cancelled' && "line-through opacity-50")}>
                                                <span>{item.quantity}x {item.name}</span>
                                                <span>{currency}{(item.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2 border-t pt-4">
                            <div className="flex justify-between items-center text-sm text-muted-foreground">
                                <span>Subtotal</span>
                                <span>{currency}{billing.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-muted-foreground">
                                <span>Tax (10%)</span>
                                <span>{currency}{billing.tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="service-charge"
                                        checked={includeServiceCharge}
                                        onCheckedChange={(checked) => setIncludeServiceCharge(checked as boolean)}
                                    />
                                    <Label htmlFor="service-charge">Service Charge ({serviceChargeRate}%)</Label>
                                </div>
                                <span>{currency}{billing.serviceCharge.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xl font-bold pt-2 border-t">
                                <span>Grand Total</span>
                                <span>{currency}{billing.grandTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="payment-method" className="text-right">Payment Method</Label>
                            <div className="col-span-3">
                                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select method" />
                                    </SelectTrigger>
                                    <SelectContent className="z-[200]">
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="card">Card</SelectItem>
                                        <SelectItem value="upi">UPI</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {orders.some(o => ['queued', 'preparing', 'ready'].includes(o.status)) && (
                            <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-2 rounded-md text-sm flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                                Cannot settle bill: Some orders are still active.
                            </div>
                        )}

                        <DialogFooter>
                            <Button variant="outline" onClick={handlePrintBill} className="gap-2">
                                <Printer className="h-4 w-4" /> Print Bill
                            </Button>
                            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button
                                onClick={handleSettleBill}
                                className="bg-green-600 hover:bg-green-700"
                                disabled={orders.some(o => ['queued', 'preparing', 'ready'].includes(o.status))}
                            >
                                <Receipt className="mr-2 h-4 w-4" /> Settle Bill
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
