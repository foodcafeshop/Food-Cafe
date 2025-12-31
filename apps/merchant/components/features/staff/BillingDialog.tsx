"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Receipt, Printer, CheckSquare } from "lucide-react";
import { getTableOrders, settleTableBill, getSettings, updateOrderStatus, clearTable } from "@/lib/api";
import { cn, getCurrencySymbol, roundToThree } from "@/lib/utils";
import { toast } from "sonner";
import { generateReceiptHtml } from "@/lib/print-utils";
import { supabase } from "@/lib/supabase";

interface BillingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tableId: string | null;
    tableLabel?: string;
    shopId: string | null;
    onSuccess: (tableId?: string, status?: string) => void;
}

export function BillingDialog({ open, onOpenChange, tableId, tableLabel, shopId, onSuccess }: BillingDialogProps) {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [currency, setCurrency] = useState('₹'); // Default fallback
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [serviceChargeRate, setServiceChargeRate] = useState(0);
    const [includeServiceCharge, setIncludeServiceCharge] = useState(true);
    const [restaurantName, setRestaurantName] = useState('Food Cafe');
    const [taxRate, setTaxRate] = useState(0);
    const [taxIncluded, setTaxIncluded] = useState(false);
    const [billNumber, setBillNumber] = useState<string | null>(null);

    // Printer Settings State
    const [printerWidth, setPrinterWidth] = useState('80mm');
    const [showLogo, setShowLogo] = useState(true);
    const [printerHeader, setPrinterHeader] = useState('');
    const [printerFooter, setPrinterFooter] = useState('');
    const [shopLogo, setShopLogo] = useState<string | null>(null);

    useEffect(() => {
        if (open && tableId && shopId) {
            loadData();
        }
    }, [open, tableId, shopId]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch Settings, Shop Logo and Bill Info in parallel
            const [ordersData, settings, shopDataResult, billResult] = await Promise.all([
                getTableOrders(tableId!),
                getSettings(shopId!),
                supabase.from('shops').select('logo_url').eq('id', shopId!).single(),
                supabase.from('bills').select('bill_number').eq('table_id', tableId!).order('created_at', { ascending: false }).limit(1).maybeSingle()
            ]);

            setOrders(ordersData || []);

            if (billResult.data) {
                setBillNumber(billResult.data.bill_number);
            } else {
                setBillNumber(null);
            }

            if (settings) {
                if (settings.currency) setCurrency(settings.currency);
                if (settings.service_charge !== undefined) setServiceChargeRate(settings.service_charge);
                if (settings.restaurant_name) setRestaurantName(settings.restaurant_name);
                if (settings.tax_rate !== undefined) setTaxRate(settings.tax_rate);
                if (settings.tax_included_in_price !== undefined) setTaxIncluded(settings.tax_included_in_price);

                // Printer Settings
                if (settings.printer_paper_width) setPrinterWidth(settings.printer_paper_width);
                if (settings.printer_show_logo !== undefined) setShowLogo(settings.printer_show_logo);
                if (settings.printer_header_text) setPrinterHeader(settings.printer_header_text);
                if (settings.printer_footer_text) setPrinterFooter(settings.printer_footer_text);
            }

            if (shopDataResult.data?.logo_url) {
                setShopLogo(shopDataResult.data.logo_url);
            }

        } catch (error) {
            console.error("Failed to load billing data", error);
            toast.error("Failed to load billing details");
        } finally {
            setLoading(false);
        }
    };

    const calculateBilling = () => {
        // Ensure we only calculate based on non-cancelled orders
        const activeOrders = orders.filter(o => o.status !== 'cancelled');
        // Calculate raw sum of item prices * quantity
        // Assuming order_items contains price and quantity, sum them up.
        // Wait, orders object has 'total_amount'.
        // If tax is included, 'total_amount' is the inclusive sum.
        // If tax is excluded, 'total_amount' is the exclusive sum (typically).
        // Let's rely on summing items to be safe if 'total_amount' handling is ambiguous in DB.

        let itemTotal = 0;
        activeOrders.forEach(order => {
            // If order_items is joined, use it for accuracy
            if (order.order_items && order.order_items.length > 0) {
                itemTotal += order.order_items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
            } else {
                // Fallback to order total if items missing
                itemTotal += order.total_amount;
            }
        });

        let subtotalVal = 0;
        let taxVal = 0;

        if (taxIncluded) {
            // Prices are inclusive
            subtotalVal = itemTotal / (1 + (taxRate / 100)); // Exclusive amount
            taxVal = itemTotal - subtotalVal;
        } else {
            // Prices are exclusive
            subtotalVal = itemTotal;
            taxVal = subtotalVal * (taxRate / 100);
        }

        // Service charge is usually on the exclusive subtotal
        const serviceCharge = includeServiceCharge ? (subtotalVal * (serviceChargeRate / 100)) : 0;
        const serviceChargeVal = serviceCharge;

        // Grand Total
        // If included: ItemTotal (which is Sub+Tax) + ServiceCharge
        // If excluded: Subtotal + Tax + ServiceCharge
        // Mathematically equivalent: (ExclusiveSubtotal + Tax) + ServiceCharge
        const grandTotal = subtotalVal + taxVal + serviceChargeVal;

        return {
            subtotal: roundToThree(subtotalVal),
            tax: roundToThree(taxVal),
            taxRate,
            taxIncluded,
            serviceCharge: roundToThree(serviceChargeVal),
            grandTotal: roundToThree(grandTotal)
        };
    };

    const billing = calculateBilling();

    const handleSettleBill = async () => {
        if (!tableId) return;
        try {
            const result = await settleTableBill(tableId, paymentMethod, billing);
            if (result && result.bill_number) {
                setBillNumber(result.bill_number);
            }
            toast.success("Bill settled successfully");
            onSuccess(tableId, 'billed');
            // Don't close immediately so they can print?
            // Usually we might want to close or refresh.
            // onOpenChange(false); 
            // Refresh orders to see status change
            loadData();
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

        const orderNumbers = orders
            .filter(o => o.status !== 'cancelled')
            .map(o => o.order_number || o.id.slice(0, 4))
            .join(', ');

        // Use Bill Number if available, otherwise Order Numbers
        const displayBillNumber = billNumber ? billNumber : orderNumbers;
        const billLabel = billNumber ? "Bill #" : "Orders #";

        const receiptData = {
            restaurantName,
            shopLogo: showLogo ? shopLogo : null,
            printerHeader,
            printerFooter,
            tableLabel: tableLabel || 'Unknown Table',
            date,
            billNumber: displayBillNumber,
            billLabel,
            currency,
            items: orders
                .filter(o => o.status !== 'cancelled')
                .flatMap(o => o.order_items || [])
                .map((item: any) => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    notes: item.notes
                })),
            subtotal: billing.subtotal,
            tax: billing.tax,
            taxRate,
            taxIncluded,
            serviceCharge: billing.serviceCharge,
            serviceChargeRate,
            includeServiceCharge,
            grandTotal: billing.grandTotal,
            printerWidth
        };

        const html = generateReceiptHtml(receiptData);

        printWindow.document.write(html);
        printWindow.document.close();
    };

    const handleClearTable = async () => {
        if (!tableId) return;
        try {
            await clearTable(tableId);
            toast.success("Table marked as Empty");
            onSuccess(tableId, 'empty');
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to clear table:", error);
            toast.error("Failed to clear table");
        }
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
                    <div className="py-8 text-center space-y-4">
                        <div className="text-muted-foreground">No active orders for this table.</div>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleClearTable}
                        >
                            Mark as Empty
                        </Button>
                    </div>
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
                            {taxIncluded ? (
                                <div className="flex justify-between items-center text-sm text-muted-foreground">
                                    <span>Subtotal (incl. taxes)</span>
                                    {/* Subtotal is exclusive, tax is tax. Sum is inclusive total or separate */}
                                    {/* billing.subtotal is exclusive. billing.tax is tax. So sum is inclusive */}
                                    <span>{currency}{(billing.subtotal + billing.tax).toFixed(2)}</span>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                                        <span>Subtotal</span>
                                        <span>{currency}{billing.subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                                        <span>Tax ({taxRate}%)</span>
                                        <span>{currency}{billing.tax.toFixed(2)}</span>
                                    </div>
                                </>
                            )}

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
