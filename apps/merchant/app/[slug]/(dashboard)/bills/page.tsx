"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Receipt, Search, Filter, Calendar } from "lucide-react";
import { getBills, getSettings } from "@/lib/api";
import { toast } from "sonner";
import { cn, getCurrencySymbol } from "@/lib/utils";
import { generateReceiptHtml } from "@/lib/print-utils";
import { supabase } from "@/lib/supabase";

import { useShopId } from "@/lib/hooks/use-shop-id";

export default function BillsPage() {
    const { shopId } = useShopId();
    const [bills, setBills] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currency, setCurrency] = useState('$');
    const [search, setSearch] = useState("");
    const [dateFilter, setDateFilter] = useState<string>('all');
    const [sortOrder, setSortOrder] = useState<string>('newest');
    const [paymentFilter, setPaymentFilter] = useState<string>('all');
    const [selectedBill, setSelectedBill] = useState<any | null>(null);
    const [billOrders, setBillOrders] = useState<any[]>([]);

    // Printer & Shop Settings State
    const [restaurantName, setRestaurantName] = useState('Food Cafe');
    const [shopLogo, setShopLogo] = useState<string | null>(null);
    const [printerWidth, setPrinterWidth] = useState('80mm');
    const [showLogo, setShowLogo] = useState(true);
    const [printerHeader, setPrinterHeader] = useState('');
    const [printerFooter, setPrinterFooter] = useState('');

    // Tax defaults for fallback
    const [defaultTaxRate, setDefaultTaxRate] = useState(0);
    const [defaultTaxIncluded, setDefaultTaxIncluded] = useState(false);
    const [defaultServiceChargeRate, setDefaultServiceChargeRate] = useState(0);

    useEffect(() => {
        if (shopId) {
            fetchData();
        }
    }, [shopId]);

    useEffect(() => {
        const fetchBillOrders = async () => {
            if (selectedBill && selectedBill.order_ids && selectedBill.order_ids.length > 0) {
                const { data } = await supabase
                    .from('orders')
                    .select('order_number, id, service_type, customer_name, customer_phone')
                    .in('id', selectedBill.order_ids);
                setBillOrders(data || []);
            } else {
                setBillOrders([]);
            }
        };
        fetchBillOrders();
    }, [selectedBill]);

    const fetchData = async () => {
        if (!shopId) return;
        setLoading(true);
        const [billsData, settingsData, shopDataResult] = await Promise.all([
            getBills(shopId),
            getSettings(shopId),
            supabase.from('shops').select('logo_url').eq('id', shopId!).single()
        ]);

        if (billsData) setBills(billsData);

        if (settingsData) {
            if (settingsData.currency) setCurrency(getCurrencySymbol(settingsData.currency));
            if (settingsData.restaurant_name) setRestaurantName(settingsData.restaurant_name);

            // Tax/SC Defaults
            if (settingsData.tax_rate !== undefined) setDefaultTaxRate(settingsData.tax_rate);
            if (settingsData.tax_included_in_price !== undefined) setDefaultTaxIncluded(settingsData.tax_included_in_price);
            if (settingsData.service_charge !== undefined) setDefaultServiceChargeRate(settingsData.service_charge);

            // Printer Settings
            if (settingsData.printer_paper_width) setPrinterWidth(settingsData.printer_paper_width);
            if (settingsData.printer_show_logo !== undefined) setShowLogo(settingsData.printer_show_logo);
            if (settingsData.printer_header_text) setPrinterHeader(settingsData.printer_header_text);
            if (settingsData.printer_footer_text) setPrinterFooter(settingsData.printer_footer_text);
        }

        if (shopDataResult.data?.logo_url) {
            setShopLogo(shopDataResult.data.logo_url);
        }

        setLoading(false);
    };

    const filteredBills = bills.filter(bill => {
        const matchesSearch = (bill.bill_number || bill.id).toLowerCase().includes(search.toLowerCase()) ||
            bill.tables?.label.toLowerCase().includes(search.toLowerCase());
        const matchesPayment = paymentFilter === 'all' || bill.payment_method === paymentFilter;

        // Date Filter
        let matchesDate = true;
        if (dateFilter !== 'all') {
            const billDate = new Date(bill.created_at);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (dateFilter === 'today') {
                matchesDate = billDate >= today;
            } else if (dateFilter === 'yesterday') {
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                const tomorrow = new Date(today);
                matchesDate = billDate >= yesterday && billDate < tomorrow;
            } else if (dateFilter === 'week') {
                const lastWeek = new Date(today);
                lastWeek.setDate(lastWeek.getDate() - 7);
                matchesDate = billDate >= lastWeek;
            } else if (dateFilter === 'month') {
                const lastMonth = new Date(today);
                lastMonth.setDate(lastMonth.getDate() - 30);
                matchesDate = billDate >= lastMonth;
            }
        }

        return matchesSearch && matchesPayment && matchesDate;
    }).sort((a, b) => {
        if (sortOrder === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        if (sortOrder === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        if (sortOrder === 'highest') return b.total_amount - a.total_amount;
        if (sortOrder === 'lowest') return a.total_amount - b.total_amount;
        return 0;
    });

    const getPaymentBadgeColor = (method: string) => {
        switch (method) {
            case 'cash': return 'bg-green-100 text-green-800 border-green-200';
            case 'card': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'upi': return 'bg-purple-100 text-purple-800 border-purple-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const handlePrintReceipt = () => {
        if (!selectedBill) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast.error('Please allow popups to print');
            return;
        }

        // Determine breakdown values
        let subtotal = 0;
        let tax = 0;
        let serviceCharge = 0;
        let discountAmount = 0;
        let discountReason = '';
        let discountedSubtotal = 0;
        let finalTaxRate = 0;
        let finalTaxIncluded = false;
        let packagingTotal = 0;
        let deliveryTotal = 0;

        if (selectedBill.breakdown) {
            subtotal = Number(selectedBill.breakdown.subtotal);
            tax = Number(selectedBill.breakdown.tax);
            serviceCharge = Number(selectedBill.breakdown.serviceCharge || 0);
            discountAmount = Number(selectedBill.breakdown.discountAmount || 0);
            discountReason = selectedBill.breakdown.discountReason || '';
            discountedSubtotal = Number(selectedBill.breakdown.discountedSubtotal || 0);
            finalTaxRate = Number(selectedBill.breakdown.taxRate || 0);
            finalTaxIncluded = !!selectedBill.breakdown.taxIncluded;

            // New Fields
            packagingTotal = Number(selectedBill.breakdown.packagingTotal || 0);
            deliveryTotal = Number(selectedBill.breakdown.deliveryTotal || 0);
        } else {
            // Fallback logic for old bills
            const itemsTotal = Array.isArray(selectedBill.items_snapshot)
                ? selectedBill.items_snapshot.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
                : 0;

            // Assume difference is Tax (Exclusive) or SC.
            const diff = selectedBill.total_amount - itemsTotal;
            subtotal = itemsTotal; // Assume Exclusive Base
            tax = diff > 0 ? diff : 0;
            serviceCharge = 0;
            // No discount for old bills
            discountAmount = 0;
            discountedSubtotal = subtotal;

            // For old bills, we force Exclusive display to show the "Tax" amount found
            finalTaxRate = 0;
            finalTaxIncluded = false;
        }

        const firstOrder = billOrders[0];

        const receiptData = {
            restaurantName,
            shopLogo: showLogo ? shopLogo : null,
            printerHeader,
            printerFooter,
            tableLabel: selectedBill.tables?.label || 'Unknown',
            date: new Date(selectedBill.created_at).toLocaleString(),
            billNumber: selectedBill.bill_number,
            billLabel: "Bill #",
            orderNumber: billOrders.map(o => o.order_number || o.id.slice(0, 4)).join(', '),
            currency,
            items: Array.isArray(selectedBill.items_snapshot) ? (() => {
                const groupedItems = selectedBill.items_snapshot.reduce((acc: any[], item: any) => {
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
            })() : [],
            subtotal,
            tax,
            taxRate: finalTaxRate,
            taxIncluded: finalTaxIncluded,
            serviceCharge,
            serviceChargeRate: 0, // We don't store SC rate in breakdown yet, so hiding %
            includeServiceCharge: serviceCharge > 0.01,
            grandTotal: selectedBill.total_amount,
            discountAmount,
            discountReason,
            discountedSubtotal,
            printerWidth,
            packagingCharge: packagingTotal,
            deliveryFee: deliveryTotal,
            serviceType: firstOrder?.service_type || 'dine_in',
            customerName: firstOrder?.customer_name,
            customerPhone: firstOrder?.customer_phone
        };

        const html = generateReceiptHtml(receiptData);
        printWindow.document.write(html);
        printWindow.document.close();
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Receipt className="h-6 w-6" />
                        Bills & History
                    </h1>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/40 p-2 rounded-lg border">
                    <div className="flex flex-col sm:flex-row items-center gap-2 flex-1 w-full">
                        <div className="flex items-center w-full sm:w-auto bg-background rounded-md border px-2">
                            <Search className="h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-9 w-full sm:w-[200px] border-none shadow-none focus-visible:ring-0"
                            />
                        </div>
                        <div className="hidden sm:block h-6 w-px bg-border mx-2" />

                        <div className="grid grid-cols-3 sm:flex gap-2 w-full sm:w-auto">
                            {/* Payment Filter */}
                            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                                <SelectTrigger className="h-9 w-full sm:w-[130px] bg-background border-none shadow-none">
                                    <div className="flex items-center gap-2 truncate">
                                        <Filter className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                        <SelectValue placeholder="Payment" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Methods</SelectItem>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="card">Card</SelectItem>
                                    <SelectItem value="upi">UPI</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Date Filter */}
                            <Select value={dateFilter} onValueChange={setDateFilter}>
                                <SelectTrigger className="h-9 w-full sm:w-[130px] bg-background border-none shadow-none">
                                    <div className="flex items-center gap-2 truncate">
                                        <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                        <SelectValue placeholder="Date" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Time</SelectItem>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="yesterday">Yesterday</SelectItem>
                                    <SelectItem value="week">Last 7 Days</SelectItem>
                                    <SelectItem value="month">Last 30 Days</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Sort Order */}
                            <Select value={sortOrder} onValueChange={setSortOrder}>
                                <SelectTrigger className="h-9 w-full sm:w-[130px] bg-background border-none shadow-none">
                                    <div className="flex items-center gap-2 truncate">
                                        <Filter className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                        <SelectValue placeholder="Sort" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="newest">Newest First</SelectItem>
                                    <SelectItem value="oldest">Oldest First</SelectItem>
                                    <SelectItem value="highest">Highest Amount</SelectItem>
                                    <SelectItem value="lowest">Lowest Amount</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="text-sm text-muted-foreground w-full sm:w-auto text-right pr-2">
                        Total Revenue: <span className="font-bold text-foreground">{currency}{filteredBills.reduce((sum, b) => sum + b.total_amount, 0).toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {loading ? (
                    <div className="p-8 text-center text-muted-foreground">Loading bills...</div>
                ) : filteredBills.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">No bills found.</div>
                ) : (
                    filteredBills.map((bill) => (
                        <Card key={bill.id} className="p-4 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-lg">{currency}{bill.total_amount.toFixed(2)}</span>
                                        <Badge variant="outline" className={cn("uppercase text-[10px]", getPaymentBadgeColor(bill.payment_method))}>
                                            {bill.payment_method}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                        <span className="font-medium text-foreground">{bill.tables?.label || 'Unknown'}</span>
                                        <span>•</span>
                                        <span>{new Date(bill.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="text-xs font-mono text-muted-foreground mt-1">
                                        #{bill.bill_number || bill.id}
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setSelectedBill(bill)}>
                                    Details
                                </Button>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block flex-1 border rounded-lg overflow-hidden bg-background">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground font-medium sticky top-0">
                        <tr>
                            <th className="p-4">Bill ID</th>
                            <th className="p-4">Date & Time</th>
                            <th className="p-4">Table</th>
                            <th className="p-4">Payment</th>
                            <th className="p-4 text-right">Amount</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading bills...</td></tr>
                        ) : filteredBills.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No bills found.</td></tr>
                        ) : (
                            filteredBills.map((bill) => (
                                <tr key={bill.id} className="hover:bg-muted/50">
                                    <td className="p-4 font-mono text-xs">{bill.bill_number || bill.id}</td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span>{new Date(bill.created_at).toLocaleDateString()}</span>
                                            <span className="text-xs text-muted-foreground">{new Date(bill.created_at).toLocaleTimeString()}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 font-medium">{bill.tables?.label || 'Unknown'}</td>
                                    <td className="p-4">
                                        <Badge variant="outline" className={cn("uppercase text-[10px]", getPaymentBadgeColor(bill.payment_method))}>
                                            {bill.payment_method}
                                        </Badge>
                                    </td>
                                    <td className="p-4 text-right font-bold">
                                        {currency}{bill.total_amount.toFixed(2)}
                                    </td>
                                    <td className="p-4 text-right">
                                        <Button variant="ghost" size="sm" onClick={() => setSelectedBill(bill)}>
                                            View Details
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Bill Details Dialog */}
            <Dialog open={!!selectedBill} onOpenChange={(open) => !open && setSelectedBill(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Bill Details</DialogTitle>
                    </DialogHeader>
                    {selectedBill && (
                        <div className="space-y-6 py-4">
                            <div className="flex justify-between items-start border-b pb-4">
                                <div>
                                    <h3 className="font-bold text-lg">Food Cafe</h3>
                                    <p className="text-sm text-muted-foreground">Bill #{selectedBill.bill_number || selectedBill.id}</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Orders: {billOrders.map(o => `#${o.order_number || o.id.slice(0, 4)}`).join(', ')}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">{new Date(selectedBill.created_at).toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <Badge variant="outline" className="mb-1">{selectedBill.tables?.label}</Badge>
                                    <p className="text-sm font-medium uppercase">{selectedBill.payment_method}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {Array.isArray(selectedBill.items_snapshot) && selectedBill.items_snapshot.length > 0 ? (
                                    (() => {
                                        const groupedItems = selectedBill.items_snapshot.reduce((acc: any[], item: any) => {
                                            const key = `${item.menu_item_id || item.name}-${item.price}-${(item.notes || '').trim()}`;
                                            const existing = acc.find((i: any) => i._groupKey === key);

                                            if (existing) {
                                                existing.quantity += item.quantity;
                                            } else {
                                                acc.push({ ...item, _groupKey: key });
                                            }
                                            return acc;
                                        }, []);

                                        return groupedItems.map((item: any, idx: number) => (
                                            <div key={idx} className="flex justify-between text-sm">
                                                <div className="flex gap-2">
                                                    <span className="font-bold">{item.quantity}x</span>
                                                    <div className="flex flex-col">
                                                        <span>{item.name}</span>
                                                        {item.notes && (
                                                            <span className="text-xs text-muted-foreground italic">Note: {item.notes}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <span>{currency}{(item.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                        ));
                                    })()
                                ) : (
                                    <p className="text-sm text-muted-foreground italic text-center py-2">Item details not available for this bill.</p>
                                )}
                            </div>

                            <div className="border-t pt-4 space-y-2">
                                {(() => {
                                    // Use stored breakdown if available, else fallback
                                    let subtotal = 0;
                                    let tax = 0;
                                    let serviceCharge = 0;
                                    let discountAmount = 0;
                                    let discountReason = '';
                                    let discountedSubtotal = 0;
                                    let finalTaxRate = 0;
                                    let finalTaxIncluded = false;

                                    if (selectedBill.breakdown) {
                                        subtotal = Number(selectedBill.breakdown.subtotal);
                                        tax = Number(selectedBill.breakdown.tax);
                                        serviceCharge = Number(selectedBill.breakdown.serviceCharge || 0);
                                        discountAmount = Number(selectedBill.breakdown.discountAmount || 0);
                                        discountReason = selectedBill.breakdown.discountReason || '';
                                        discountedSubtotal = Number(selectedBill.breakdown.discountedSubtotal || 0);
                                        finalTaxRate = Number(selectedBill.breakdown.taxRate || 0);
                                        finalTaxIncluded = !!selectedBill.breakdown.taxIncluded;
                                    } else { // Fallback for old bills
                                        const itemsTotal = Array.isArray(selectedBill.items_snapshot)
                                            ? selectedBill.items_snapshot.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
                                            : 0;

                                        // Assume difference is Tax, not Service Charge for safety on old bills
                                        const diff = selectedBill.total_amount - itemsTotal;
                                        subtotal = itemsTotal;
                                        tax = diff > 0 ? diff : 0;
                                        serviceCharge = 0; // Don't assume SC for old bills without breakdown

                                        // No discount for old bills
                                        discountAmount = 0;
                                        discountedSubtotal = subtotal;

                                        finalTaxRate = 0;
                                        finalTaxIncluded = false;
                                    }

                                    const displaySubtotal = finalTaxIncluded ? (subtotal + tax) : subtotal;

                                    return (
                                        <>
                                            <div className="flex justify-between items-center text-sm text-muted-foreground">
                                                <span>{finalTaxIncluded ? "Subtotal (incl. taxes)" : "Subtotal"}</span>
                                                <span>{currency}{displaySubtotal.toFixed(2)}</span>
                                            </div>

                                            {discountAmount > 0.01 && (
                                                <>
                                                    <div className="flex justify-between items-center text-sm text-green-600 font-medium">
                                                        <span>Discount {discountReason && `(${discountReason})`}</span>
                                                        <span>-{currency}{discountAmount.toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-sm font-medium">
                                                        <span>Total after Discount</span>
                                                        <span>{currency}{(discountedSubtotal || (subtotal - discountAmount)).toFixed(2)}</span>
                                                    </div>
                                                </>
                                            )}

                                            {!finalTaxIncluded && tax > 0 && (
                                                <div className="flex justify-between items-center text-sm text-muted-foreground">
                                                    <span>Tax{finalTaxRate > 0 ? ` (${finalTaxRate}%)` : ''}</span>
                                                    <span>{currency}{tax.toFixed(2)}</span>
                                                </div>
                                            )}

                                            {serviceCharge > 0.01 && (
                                                <div className="flex justify-between items-center text-sm text-muted-foreground">
                                                    <span>Service Charge</span>
                                                    <span>{currency}{serviceCharge.toFixed(2)}</span>
                                                </div>
                                            )}

                                            <div className="flex justify-between items-center text-xl font-bold pt-2 border-t">
                                                <span>Total Paid</span>
                                                <span>{currency}{selectedBill.total_amount.toFixed(2)}</span>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>

                            <DialogFooter>
                                <Button className="w-full" onClick={handlePrintReceipt}>
                                    <Receipt className="mr-2 h-4 w-4" /> Print Receipt
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
