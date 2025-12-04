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

    useEffect(() => {
        if (shopId) {
            fetchData();
        }
    }, [shopId]);

    const fetchData = async () => {
        if (!shopId) return;
        setLoading(true);
        const [billsData, settingsData] = await Promise.all([
            getBills(shopId),
            getSettings(shopId)
        ]);

        if (billsData) setBills(billsData);
        if (settingsData?.currency) setCurrency(getCurrencySymbol(settingsData.currency));
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

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Receipt className="h-6 w-6" />
                        Bills & History
                    </h1>
                </div>

                <div className="flex items-center justify-between gap-4 bg-muted/40 p-2 rounded-lg border">
                    <div className="flex items-center gap-2 flex-1">
                        <Search className="h-4 w-4 text-muted-foreground ml-2" />
                        <Input
                            placeholder="Search by Bill ID or Table..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-9 w-[200px] bg-background border-none shadow-none focus-visible:ring-0"
                        />
                        <div className="h-6 w-px bg-border mx-2" />

                        {/* Payment Filter */}
                        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                            <SelectTrigger className="h-9 w-[130px] bg-background border-none shadow-none">
                                <div className="flex items-center gap-2">
                                    <Filter className="h-3.5 w-3.5 text-muted-foreground" />
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
                            <SelectTrigger className="h-9 w-[130px] bg-background border-none shadow-none">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
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
                            <SelectTrigger className="h-9 w-[130px] bg-background border-none shadow-none">
                                <div className="flex items-center gap-2">
                                    <Filter className="h-3.5 w-3.5 text-muted-foreground" />
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
                    <div className="text-sm text-muted-foreground pr-4">
                        Total Revenue: <span className="font-bold text-foreground">{currency}{filteredBills.reduce((sum, b) => sum + b.total_amount, 0).toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 border rounded-lg overflow-hidden bg-background">
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
                                    <p className="text-sm text-muted-foreground">{new Date(selectedBill.created_at).toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <Badge variant="outline" className="mb-1">{selectedBill.tables?.label}</Badge>
                                    <p className="text-sm font-medium uppercase">{selectedBill.payment_method}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {Array.isArray(selectedBill.items_snapshot) ? (
                                    selectedBill.items_snapshot.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <div className="flex gap-2">
                                                <span className="font-bold">{item.quantity}x</span>
                                                <span>{item.name}</span>
                                            </div>
                                            <span>{currency}{(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">Item details not available for this bill.</p>
                                )}
                            </div>

                            <div className="border-t pt-4 space-y-2">
                                {(() => {
                                    // Use stored breakdown if available
                                    if (selectedBill.breakdown) {
                                        const { subtotal, tax, serviceCharge } = selectedBill.breakdown;
                                        return (
                                            <>
                                                <div className="flex justify-between items-center text-sm text-muted-foreground">
                                                    <span>Subtotal</span>
                                                    <span>{currency}{Number(subtotal).toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm text-muted-foreground">
                                                    <span>Tax (10%)</span>
                                                    <span>{currency}{Number(tax).toFixed(2)}</span>
                                                </div>
                                                {Number(serviceCharge) > 0.01 && (
                                                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                                                        <span>Service Charge</span>
                                                        <span>{currency}{Number(serviceCharge).toFixed(2)}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-center text-xl font-bold pt-2 border-t">
                                                    <span>Total Paid</span>
                                                    <span>{currency}{selectedBill.total_amount.toFixed(2)}</span>
                                                </div>
                                            </>
                                        );
                                    }

                                    // Fallback for old bills
                                    const itemsTotal = Array.isArray(selectedBill.items_snapshot)
                                        ? selectedBill.items_snapshot.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
                                        : 0;
                                    const subtotal = itemsTotal / 1.1;
                                    const tax = itemsTotal - subtotal;
                                    const serviceCharge = selectedBill.total_amount - itemsTotal;

                                    return (
                                        <>
                                            <div className="flex justify-between items-center text-sm text-muted-foreground">
                                                <span>Subtotal</span>
                                                <span>{currency}{subtotal.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm text-muted-foreground">
                                                <span>Tax (10%)</span>
                                                <span>{currency}{tax.toFixed(2)}</span>
                                            </div>
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
                                <Button className="w-full" onClick={() => window.print()}>
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
