"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Receipt, Printer, CheckSquare } from "lucide-react";
import { getTableOrders, settleTableBill, getSettings, updateOrderStatus, clearTable, getOrderById, settleOrderBill } from "@/lib/api";
import { cn, getCurrencySymbol, roundToThree } from "@/lib/utils";
import { toast } from "sonner";
import { generateReceiptHtml } from "@/lib/print-utils";
import { supabase } from "@/lib/supabase";

interface BillingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tableId: string | null;
    tableLabel?: string;
    orderId?: string | null; // Added
    shopId: string | null;
    onSuccess: (id?: string, status?: string) => void;
}

export function BillingDialog({ open, onOpenChange, tableId, tableLabel, orderId, shopId, onSuccess }: BillingDialogProps) {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [settling, setSettling] = useState(false); // New state for settlement process
    const [currency, setCurrency] = useState('₹'); // Default fallback
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [serviceChargeRate, setServiceChargeRate] = useState(0);
    const [includeServiceCharge, setIncludeServiceCharge] = useState(true);
    const [restaurantName, setRestaurantName] = useState('Food Cafe');
    const [taxRate, setTaxRate] = useState(0);
    const [taxIncluded, setTaxIncluded] = useState(false);
    const [billNumber, setBillNumber] = useState<string | null>(null);

    // Discount State
    const [discountAmount, setDiscountAmount] = useState<number>(0);
    const [discountReason, setDiscountReason] = useState<string>('');

    // Printer Settings State
    const [printerWidth, setPrinterWidth] = useState('80mm');
    const [showLogo, setShowLogo] = useState(true);
    const [printerHeader, setPrinterHeader] = useState('');
    const [printerFooter, setPrinterFooter] = useState('');
    const [shopLogo, setShopLogo] = useState<string | null>(null);
    const [confirmClearOpen, setConfirmClearOpen] = useState(false);

    // Explicitly fetched table label to handle mismatch cases
    const [fetchedTableLabel, setFetchedTableLabel] = useState<string | null>(null);
    const [deliveryChargeType, setDeliveryChargeType] = useState<'flat' | 'percent'>('flat');
    const [deliveryChargeAmount, setDeliveryChargeAmount] = useState(0);
    const [waiveServiceChargeForTakeaway, setWaiveServiceChargeForTakeaway] = useState(false);

    useEffect(() => {
        if (open && (tableId || orderId) && shopId) {
            loadData();
        }
    }, [open, tableId, orderId, shopId]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Determine fetch promise
            let ordersPromise;
            let billPromise;
            // Initialize as promise that resolves to match Supabase response shape roughly or null
            let tablePromise: Promise<any> = Promise.resolve({ data: null });

            if (orderId) {
                ordersPromise = getOrderById(orderId).then(data => data ? [data] : []);
                billPromise = Promise.resolve({ data: null });
            } else if (tableId) {
                ordersPromise = getTableOrders(tableId);
                billPromise = supabase.from('bills').select('bill_number').eq('table_id', tableId).order('created_at', { ascending: false }).limit(1).maybeSingle();

                // Explicitly fetch table label to be 100% sure
                tablePromise = Promise.resolve(supabase.from('tables').select('label').eq('id', tableId).single());
            }

            // Fetch Settings, Shop Logo, Bill Info and Table details in parallel
            const [ordersData, settings, shopDataResult, billResult, tableResult] = await Promise.all([
                ordersPromise,
                getSettings(shopId!),
                supabase.from('shops').select('logo_url').eq('id', shopId!).single(),
                billPromise,
                tablePromise
            ]);

            setOrders(ordersData || []);

            // Use the explicitly fetched table label if available
            if (tableResult?.data?.label) {
                setFetchedTableLabel(tableResult.data.label);
            } else {
                setFetchedTableLabel(null);
            }


            if (billResult?.data) {
                setBillNumber(billResult.data.bill_number);
            } else {
                setBillNumber(null);
                // If orderId is passed, maybe check if order is already paid/billed
                if (ordersData && ordersData.length > 0 && ordersData[0].payment_status === 'paid') {
                    // Maybe fetch bill? Not implemented yet for order lookup by order_id in bills logic efficiently without scanning.
                }
            }

            if (settings) {
                if (settings.currency) setCurrency(settings.currency);
                if (settings.service_charge !== undefined) setServiceChargeRate(settings.service_charge);
                if (settings.delivery_charge_amount !== undefined) setDeliveryChargeAmount(settings.delivery_charge_amount);
                if (settings.delivery_charge_type) setDeliveryChargeType(settings.delivery_charge_type as 'flat' | 'percent');

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

        let itemTotal = 0;
        let packagingTotal = 0;
        let deliveryTotal = 0;

        activeOrders.forEach(order => {
            // Item Total
            if (activeOrders.length > 0) {
                if (order.order_items && order.order_items.length > 0) {
                    itemTotal += order.order_items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
                } else {
                    itemTotal += order.total_amount;
                }
            }

            // Fees
            packagingTotal += Number(order.packaging_charge) || 0;
            deliveryTotal += Number(order.delivery_fee) || 0;

            // Should also check metadata for fees if stored there? Assuming column for now.
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

        // Apply Discount on Subtotal (Exclusive)
        const discountedSubtotal = Math.max(0, subtotalVal - discountAmount);

        // Recalculate Tax on Discounted Subtotal
        const finalTaxVal = discountedSubtotal * (taxRate / 100);

        // Recalculate Service Charge on Discounted Subtotal
        // Service Charge is only applicable for Dine-in orders
        const isDineIn = activeOrders.some(o => o.service_type === 'dine_in');
        const effectiveServiceChargeRate = isDineIn ? serviceChargeRate : 0;

        const finalServiceChargeVal = includeServiceCharge ? (discountedSubtotal * (effectiveServiceChargeRate / 100)) : 0;

        // Grand Total: discountedSubtotal + tax + SC + packaging + delivery
        const finalGrandTotal = discountedSubtotal + finalTaxVal + finalServiceChargeVal + packagingTotal + deliveryTotal;

        return {
            subtotal: roundToThree(subtotalVal),
            tax: roundToThree(finalTaxVal),
            taxRate,
            taxIncluded,
            serviceCharge: roundToThree(finalServiceChargeVal),
            grandTotal: roundToThree(finalGrandTotal),
            discountAmount,
            discountReason,
            discountedSubtotal: roundToThree(discountedSubtotal),
            packagingTotal: roundToThree(packagingTotal),
            deliveryTotal: roundToThree(deliveryTotal)
        };
    };

    const billing = calculateBilling();

    const handleSettleBill = async () => {
        if (!tableId && !orderId) return;
        if (discountAmount > 0 && !discountReason.trim()) {
            toast.error("Please provide a reason for the discount");
            return;
        }

        setSettling(true); // Disable button during settlement
        try {
            let result;
            if (orderId) {
                result = await settleOrderBill(orderId, paymentMethod, billing);
                // Determine status based on service type
                const isTakeawayOrDelivery = orders.length > 0 && ['takeaway', 'delivery'].includes(orders[0].service_type);
                const newStatus = isTakeawayOrDelivery ? 'complete' : 'billed';
                onSuccess(orderId, newStatus);
            } else if (tableId) {
                result = await settleTableBill(tableId, paymentMethod, billing);
                onSuccess(tableId, 'billed');
            }

            if (result && result.bill_number) {
                setBillNumber(result.bill_number);
            }
            toast.success("Bill settled successfully");
            onOpenChange(false); // Close dialog after successful settlement
        } catch (error) {
            console.error(error);
            toast.error("Failed to settle bill");
        } finally {
            setSettling(false); // Re-enable button
        }
    };

    const handleUpdateOrderStatus = async (orderId: string, status: string) => {
        try {
            await updateOrderStatus(orderId, status);
            toast.success(`Order marked as ${status}`);
            // Reload specific order or table orders
            if (tableId) {
                const updatedOrders = await getTableOrders(tableId);
                setOrders(updatedOrders || []);
            } else {
                const updatedOrder = await getOrderById(orderId);
                setOrders(updatedOrder ? [updatedOrder] : []);
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to update status");
        }
    };

    const handlePrintBill = () => {
        if ((!tableId && !orderId) || !restaurantName) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast.error('Please allow popups to print');
            return;
        }

        const billingData = calculateBilling();
        const date = new Date().toLocaleString();

        const activeApprovedOrders = orders.filter(o => o.status !== 'cancelled');
        const orderNumbers = activeApprovedOrders
            .map(o => o.order_number || o.id.slice(0, 4))
            .join(', ');

        const displayBillNumber = billNumber ? billNumber : orderNumbers;
        const billLabel = billNumber ? "Bill #" : "Orders #";

        // Extract Customer/Service Info from first order (assuming homogeneous)
        const firstOrder = activeApprovedOrders[0];
        const serviceType = firstOrder?.service_type || 'dine_in';
        const customerName = firstOrder?.customer_name;
        const customerPhone = firstOrder?.customer_phone;

        // Determine Table Label
        // Proirity 1: Label from order data (joined with tables) - this is the source of truth
        // Priority 2: Label from props - fallback if order data doesn't have it
        // Priority 3: "Order #..." for takeaway/delivery

        let displayTableLabel = null;

        if (fetchedTableLabel) {
            displayTableLabel = fetchedTableLabel;
        }

        // Check if we have a valid table label from the order data join
        if (!displayTableLabel && firstOrder?.tables?.label && firstOrder.tables.label !== 'Table') {
            displayTableLabel = firstOrder.tables.label;
        }

        // If not found in order data, try the prop (but skip if it's just "Table" and we want to avoid generic names?)
        // Actually, user said DB says "T1", so firstOrder.tables.label SHOULD be "T1".
        // The prop was "Table" for some reason.
        if (!displayTableLabel && tableLabel) {
            displayTableLabel = tableLabel;
        }

        // If still no label, try to get it from order data even if it was "Table" (maybe that IS the name?)
        if (!displayTableLabel && firstOrder?.tables?.label) {
            displayTableLabel = firstOrder.tables.label;
        }

        // Fallback logic for takeaways or missing table info
        if (!displayTableLabel) {
            if (activeApprovedOrders.some(o => ['takeaway', 'delivery'].includes(o.service_type))) {
                displayTableLabel = `Order #${orderNumbers}`;
            } else if (orderId && !firstOrder?.table_id) {
                displayTableLabel = `Order #${orderNumbers}`;
            } else {
                displayTableLabel = orderId ? `Order #${orderNumbers}` : 'Unknown Table';
            }
        }

        const receiptData = {
            restaurantName,
            shopLogo: showLogo ? shopLogo : null,
            printerHeader,
            printerFooter,
            tableLabel: displayTableLabel,
            date,
            billNumber: displayBillNumber,
            billLabel,
            currency,
            items: (() => {
                const allItems = activeApprovedOrders.flatMap(o => o.order_items || []);

                const groupedItems = allItems.reduce((acc: any[], item: any) => {
                    const key = `${item.menu_item_id || item.name}-${item.price}-${(item.notes || '').trim()}`;
                    const existing = acc.find((i: any) => i._groupKey === key);

                    if (existing) {
                        existing.quantity += item.quantity;
                    } else {
                        acc.push({ ...item, _groupKey: key });
                    }
                    return acc;
                }, []);

                return groupedItems.map((item: any) => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    notes: item.notes
                }));
            })(),
            subtotal: billingData.subtotal,
            tax: billingData.tax,
            taxRate,
            taxIncluded,
            serviceCharge: billingData.serviceCharge,
            serviceChargeRate,
            includeServiceCharge,
            grandTotal: billingData.grandTotal,
            discountAmount: billingData.discountAmount,
            discountReason: billingData.discountReason,
            discountedSubtotal: billingData.discountedSubtotal,
            printerWidth,
            // New Fields
            packagingCharge: billingData.packagingTotal,
            deliveryFee: billingData.deliveryTotal,
            serviceType,
            customerName,
            customerPhone
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
                    <DialogTitle>
                        {orderId
                            ? `Bill for Order #${orders[0]?.order_number || orders[0]?.id?.slice(0, 4) || '...'}`
                            : `Bill for ${tableLabel}`
                        }
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="py-8 text-center text-muted-foreground">Loading orders...</div>
                ) : orders.length === 0 ? (
                    <div className="py-8 text-center space-y-4">
                        <div className="text-muted-foreground">No active orders for this table.</div>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setConfirmClearOpen(true)}
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
                                    <span>{currency}{(billing.subtotal + billing.tax).toFixed(2)}</span>
                                </div>
                            ) : (
                                <div className="flex justify-between items-center text-sm text-muted-foreground">
                                    <span>Subtotal</span>
                                    <span>{currency}{billing.subtotal.toFixed(2)}</span>
                                </div>
                            )}

                            {/* Discount Input Section */}
                            <div className="pt-2 border-t mt-2 space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <Label htmlFor="discount-amount" className="font-medium text-muted-foreground">Discount</Label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">- {currency}</span>
                                        <Input
                                            id="discount-amount"
                                            type="number"
                                            value={discountAmount || ''}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                // Enforce positive and max limit
                                                if (val >= 0 && val <= billing.subtotal) {
                                                    setDiscountAmount(val);
                                                }
                                            }}
                                            className="h-8 w-20 text-right"
                                            placeholder="0"
                                            min="0"
                                            max={billing.subtotal}
                                        />
                                    </div>
                                </div>
                                {discountAmount > 0 && (
                                    <Input
                                        placeholder="Reason (e.g. Staff Meal, Complaint)"
                                        value={discountReason}
                                        onChange={(e) => setDiscountReason(e.target.value)}
                                        className="h-8 text-sm"
                                    />
                                )}
                            </div>

                            {discountAmount > 0 && (
                                <div className="flex justify-between items-center text-sm font-medium">
                                    <span>Total after Discount</span>
                                    <span>{currency}{billing.discountedSubtotal?.toFixed(2)}</span>
                                </div>
                            )}

                            {billing.packagingTotal > 0 && (
                                <div className="flex justify-between items-center text-sm text-muted-foreground">
                                    <span>Packaging Charges</span>
                                    <span>{currency}{billing.packagingTotal.toFixed(2)}</span>
                                </div>
                            )}

                            {billing.deliveryTotal > 0 && (
                                <div className="flex justify-between items-center text-sm text-muted-foreground">
                                    <span>Delivery Fees</span>
                                    <span>{currency}{billing.deliveryTotal.toFixed(2)}</span>
                                </div>
                            )}

                            {!taxIncluded && (
                                <div className="flex justify-between items-center text-sm text-muted-foreground">
                                    <span>Tax ({taxRate}%)</span>
                                    <span>{currency}{billing.tax.toFixed(2)}</span>
                                </div>
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
                            <Button variant="outline" onClick={handlePrintBill} className="gap-2" disabled={settling}>
                                <Printer className="h-4 w-4" /> Print Bill
                            </Button>
                            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={settling}>Cancel</Button>
                            <Button
                                onClick={handleSettleBill}
                                className="bg-green-600 hover:bg-green-700"
                                disabled={settling || orders.some(o => ['queued', 'preparing', 'ready'].includes(o.status))}
                            >
                                <Receipt className="mr-2 h-4 w-4" /> {settling ? 'Settling...' : 'Settle Bill'}
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>

            <AlertDialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
                <AlertDialogContent className="z-[200]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Mark Table as Empty?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will clear the table status. Ensure there are no active customers seated.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleClearTable();
                                setConfirmClearOpen(false);
                            }}
                        >
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Dialog >
    );
}
