"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QrCode, Users, Move, Printer, Plus, Trash2, Edit2, List, Grid, LayoutGrid, CheckSquare, Square, Receipt } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn, getCurrencySymbol, roundToThree } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { QRCodeSVG } from 'qrcode.react';
import { Checkbox } from "@/components/ui/checkbox";
import { getTableOrders, settleTableBill, clearTable, getSettings, updateOrderStatus } from "@/lib/api";

type TableStatus = 'empty' | 'occupied' | 'billed';

interface Table {
    id: string;
    label: string;
    status: TableStatus;
    seats: number;
    x: number;
    y: number;
    otp?: string;
}

import { useShopId } from "@/lib/hooks/use-shop-id";

// ...

export default function TableManagementPage() {
    const { shopId } = useShopId();
    const [tables, setTables] = useState<Table[]>([]);
    // ... (keep existing state)
    const [viewMode, setViewMode] = useState<'list' | 'canvas'>('list');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentTable, setCurrentTable] = useState<Partial<Table>>({});
    const [loading, setLoading] = useState(true);
    const [currency, setCurrency] = useState('$');

    // Filter State
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<TableStatus | 'all'>('all');

    // QR & Selection
    const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());
    const [qrTable, setQrTable] = useState<Table | null>(null); // Table to view QR for

    // Billing State
    const [billingTable, setBillingTable] = useState<Table | null>(null);
    const [tableOrders, setTableOrders] = useState<any[]>([]);
    const [billingLoading, setBillingLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('cash');

    // Dragging State
    const [draggedTableId, setDraggedTableId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const canvasRef = useRef<HTMLDivElement>(null);

    const [serviceChargeRate, setServiceChargeRate] = useState(0);
    const [includeServiceCharge, setIncludeServiceCharge] = useState(true);
    const [restaurantName, setRestaurantName] = useState('Food Cafe');
    const [shopSlug, setShopSlug] = useState<string>("");

    useEffect(() => {
        if (shopId) {
            fetchTables();
            fetchSettings();
            fetchShopSlug();

            // Realtime subscription
            const channel = supabase
                .channel('tables-realtime')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'tables', filter: `shop_id=eq.${shopId}` },
                    () => {
                        fetchTables();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [shopId]);

    const fetchSettings = async () => {
        if (!shopId) return;
        const settings = await getSettings(shopId);
        if (settings?.currency) setCurrency(settings.currency);
        if (settings?.service_charge) setServiceChargeRate(settings.service_charge);
        if (settings?.restaurant_name) setRestaurantName(settings.restaurant_name);
    };

    const fetchShopSlug = async () => {
        if (!shopId) return;
        const { data } = await supabase.from('shops').select('slug').eq('id', shopId).single();
        if (data) setShopSlug(data.slug);
    };

    const fetchTables = async () => {
        if (!shopId) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('tables')
            .select(`
                *,
                table_secrets (otp)
            `)
            .eq('shop_id', shopId)
            .order('label');

        if (error) {
            toast.error('Failed to fetch tables');
        } else {
            // Flatten the OTP
            const tablesWithOtp = data?.map((t: any) => ({
                ...t,
                otp: t.table_secrets?.otp || t.table_secrets?.[0]?.otp || '----'
            })) || [];
            setTables(tablesWithOtp);
        }
        setLoading(false);
    };

    const handleOpenBilling = async (table: Table) => {
        setBillingTable(table);
        setBillingLoading(true);
        setPaymentMethod('cash'); // Reset default
        const orders = await getTableOrders(table.id);
        setTableOrders(orders || []);
        setBillingLoading(false);
    };

    const handleSettleBill = async () => {
        if (!billingTable) return;

        try {
            const orderIds = tableOrders.map(o => o.id);

            // Calculate Service Charge
            const rawSubtotal = tableOrders.reduce((sum, order) => sum + (order.total_amount / 1.1), 0);
            const rawTax = tableOrders.reduce((sum, order) => sum + order.total_amount, 0) - rawSubtotal;
            const rawServiceCharge = includeServiceCharge ? (rawSubtotal * (serviceChargeRate / 100)) : 0;

            const subtotal = roundToThree(rawSubtotal);
            const tax = roundToThree(rawTax);
            const serviceChargeAmount = roundToThree(rawServiceCharge);

            const breakdown = {
                subtotal: subtotal,
                tax: tax,
                serviceCharge: serviceChargeAmount,
                total: roundToThree(subtotal + tax + serviceChargeAmount)
            };

            await settleTableBill(billingTable.id, paymentMethod, breakdown);

            toast.success("Bill settled");
            setBillingTable(null);
            setTableOrders([]);
            fetchTables(); // Refresh table status
        } catch (e) {
            console.error(e);
            toast.error("Failed to settle bill");
        }
    };

    const handleUpdateOrderStatus = async (orderId: string, status: string) => {
        try {
            await updateOrderStatus(orderId, status);
            toast.success(`Order marked as ${status}`);
            // Refresh orders
            if (billingTable) {
                const orders = await getTableOrders(billingTable.id);
                setTableOrders(orders || []);
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to update order status");
        }
    };

    const handleClearTable = async (table: Table) => {
        if (confirm(`Mark ${table.label} as Empty?`)) {
            try {
                await clearTable(table.id);
                toast.success("Table marked as empty");
                fetchTables();
            } catch (e) {
                console.error(e);
                toast.error("Failed to clear table");
            }
        }
    };

    const getStatusColor = (status: TableStatus) => {
        switch (status) {
            case 'empty': return 'bg-green-500/20 border-green-500 text-green-700';
            case 'occupied': return 'bg-blue-500/20 border-blue-500 text-blue-700';
            case 'billed': return 'bg-red-500/20 border-red-500 text-red-700';
            default: return 'bg-gray-200';
        }
    };

    const handleAddTable = () => {
        setCurrentTable({
            label: `T${tables.length + 1}`,
            status: 'empty',
            seats: 2,
            x: 50,
            y: 50
        });
        setIsDialogOpen(true);
    };

    const handleEditTable = (table: Table) => {
        setCurrentTable(table);
        setIsDialogOpen(true);
    };

    const handleDeleteTable = async () => {
        if (currentTable.id && confirm("Delete this table?")) {
            const { error } = await supabase.from('tables').delete().eq('id', currentTable.id);
            if (error) {
                toast.error('Failed to delete table');
            } else {
                setTables(tables.filter(t => t.id !== currentTable.id));
                setIsDialogOpen(false);
                toast.success('Table deleted');
            }
        }
    };

    const handleSave = async () => {
        if (!currentTable.label || !shopId) return;

        // Sanitize data: remove OTP and table_secrets which are UI-only or joined fields
        const { otp, table_secrets, ...cleanTableData } = currentTable as any;

        const tableData = {
            ...cleanTableData,
            shop_id: shopId,
            updated_at: new Date().toISOString() // Ensure updated_at is set
        };

        const { data, error } = await supabase
            .from('tables')
            .upsert(tableData)
            .select()
            .single();

        if (error) {
            toast.error('Failed to save table');
        } else {
            setTables(prev => {
                const exists = prev.find(t => t.id === data.id);
                if (exists) {
                    return prev.map(t => t.id === data.id ? data : t);
                }
                return [...prev, data];
            });
            setIsDialogOpen(false);
            toast.success('Table saved');
        }
    };

    // Selection Handlers
    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedTables);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedTables(newSet);
    };

    const toggleAll = () => {
        if (selectedTables.size === filteredTables.length) {
            setSelectedTables(new Set());
        } else {
            setSelectedTables(new Set(filteredTables.map(t => t.id)));
        }
    };

    // Print Handler
    const handlePrint = (tablesToPrint: Table[]) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast.error('Please allow popups to print');
            return;
        }

        const html = `
            <html>
                <head>
                    <title>Print QR Codes</title>
                    <style>
                        body { font-family: sans-serif; display: flex; flex-wrap: wrap; gap: 20px; padding: 20px; }
                        .qr-card { border: 1px solid #ccc; padding: 20px; text-align: center; width: 200px; page-break-inside: avoid; border-radius: 8px; }
                        h1 { font-size: 24px; margin: 0 0 10px 0; }
                        p { margin: 10px 0 0 0; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    ${tablesToPrint.map(t => {
            const url = `https://foodcafeshop.in/${shopSlug}/menu?table=${t.label}`;
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`;

            return `
                            <div class="qr-card">
                                <h1>${t.label}</h1>
                                <img src="${qrUrl}" width="150" height="150" />
                                <p>Scan to Order</p>
                            </div>
                        `;
        }).join('')}
                    <script>
                        window.onload = () => { window.print(); }
                    </script>
                </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    };

    const handlePrintBill = () => {
        if (!billingTable) return;

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
                    <title>Bill - ${billingTable.label}</title>
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
                        <div>Table: ${billingTable.label}</div>
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
                            ${tableOrders.flatMap(o => o.order_items).map((item: any) => `
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

    // Drag Handlers
    const handleMouseDown = (e: React.MouseEvent, table: Table) => {
        if (viewMode !== 'canvas') return;
        // Don't drag if clicking buttons
        if ((e.target as HTMLElement).closest('button')) return;

        e.preventDefault();
        e.stopPropagation();

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        setDraggedTableId(table.id);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!draggedTableId || !canvasRef.current) return;

        const canvasRect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - canvasRect.left - dragOffset.x;
        const y = e.clientY - canvasRect.top - dragOffset.y;

        // Snap to grid (10px)
        const snappedX = Math.round(x / 10) * 10;
        const snappedY = Math.round(y / 10) * 10;

        // Constrain to canvas
        const constrainedX = Math.max(0, Math.min(canvasRect.width - 112, snappedX)); // 112 is approx width (w-28)
        const constrainedY = Math.max(0, Math.min(canvasRect.height - 112, snappedY));

        setTables(prev => prev.map(t =>
            t.id === draggedTableId ? { ...t, x: constrainedX, y: constrainedY } : t
        ));
    };

    const handleMouseUp = async () => {
        if (draggedTableId) {
            const table = tables.find(t => t.id === draggedTableId);
            if (table) {
                // Save new position
                await supabase.from('tables').update({ x: table.x, y: table.y }).eq('id', table.id);
            }
            setDraggedTableId(null);
        }
    };

    const filteredTables = tables.filter(table => {
        const matchesSearch = table.label.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || table.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Helper for billing calculation
    const calculateBilling = () => {
        const subtotal = tableOrders.reduce((sum, order) => sum + (order.total_amount / 1.1), 0);
        const tax = tableOrders.reduce((sum, order) => sum + order.total_amount, 0) - subtotal;
        const serviceCharge = includeServiceCharge ? (subtotal * (serviceChargeRate / 100)) : 0;
        const grandTotal = subtotal + tax + serviceCharge;
        return { subtotal, tax, serviceCharge, grandTotal };
    };

    const billing = calculateBilling();

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Table Management</h1>
                    <div className="flex gap-2">
                        <Button className="gap-2" onClick={handleAddTable}>
                            <Plus className="h-4 w-4" /> Add Table
                        </Button>

                        {selectedTables.size > 0 ? (
                            <Button variant="outline" className="gap-2" onClick={() => handlePrint(tables.filter(t => selectedTables.has(t.id)))}>
                                <Printer className="h-4 w-4" /> Print Selected ({selectedTables.size})
                            </Button>
                        ) : (
                            <Button variant="outline" className="gap-2" onClick={() => handlePrint(tables)}>
                                <Printer className="h-4 w-4" /> Print All QR
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between gap-4 bg-muted/40 p-2 rounded-lg border">
                    <div className="flex items-center gap-2 flex-1">
                        <div className="flex bg-background rounded-lg border p-1">
                            <Button
                                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('list')}
                                className="gap-2 h-8"
                            >
                                <List className="h-4 w-4" /> List
                            </Button>
                            <Button
                                variant={viewMode === 'canvas' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('canvas')}
                                className="gap-2 h-8"
                            >
                                <LayoutGrid className="h-4 w-4" /> Canvas
                            </Button>
                        </div>
                        <div className="h-6 w-px bg-border mx-2" />
                        <Input
                            placeholder="Search tables..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-9 w-[200px] bg-background"
                        />
                        <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
                            <SelectTrigger className="h-9 w-[150px] bg-background">
                                <SelectValue placeholder="Filter Status" />
                            </SelectTrigger>
                            <SelectContent className="z-[200]">
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="empty">Empty</SelectItem>
                                <SelectItem value="occupied">Occupied</SelectItem>
                                <SelectItem value="billed">Billed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Showing {filteredTables.length} tables
                    </div>
                </div>
            </div>

            {viewMode === 'canvas' ? (
                <div
                    ref={canvasRef}
                    className="flex-1 bg-muted/30 rounded-xl border relative overflow-hidden min-h-[500px]"
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    {/* Grid Background */}
                    <div className="absolute inset-0 pointer-events-none" style={{
                        backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                    }}></div>

                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">Loading tables...</div>
                    ) : (
                        filteredTables.map((table) => (
                            <div
                                key={table.id}
                                className={cn(
                                    "absolute w-28 h-28 rounded-xl border-2 flex flex-col items-center justify-center cursor-move transition-shadow shadow-sm bg-background group select-none",
                                    getStatusColor(table.status),
                                    draggedTableId === table.id ? "shadow-xl z-50 scale-105" : "hover:shadow-md"
                                )}
                                style={{ left: table.x, top: table.y }}
                                onMouseDown={(e) => handleMouseDown(e, table)}
                            >
                                <span className="font-bold text-lg">{table.label}</span>
                                <div className="flex items-center gap-1 text-xs mt-1 font-medium">
                                    <Users className="h-3 w-3" />
                                    <span>{table.seats}</span>
                                </div>
                                {table.otp && (
                                    <div className="mt-1 px-1.5 py-0.5 bg-black/10 rounded text-[10px] font-mono font-bold">
                                        OTP: {table.otp}
                                    </div>
                                )}

                                {/* Hover Actions */}
                                <div className="absolute -top-3 -right-3 hidden group-hover:flex gap-1">
                                    <Button
                                        size="icon"
                                        variant="secondary"
                                        className="h-7 w-7 rounded-full shadow-md"
                                        onClick={(e) => { e.stopPropagation(); setQrTable(table); }}
                                    >
                                        <QrCode className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="secondary"
                                        className="h-7 w-7 rounded-full shadow-md"
                                        onClick={(e) => { e.stopPropagation(); handleEditTable(table); }}
                                    >
                                        <Edit2 className="h-3.5 w-3.5" />
                                    </Button>
                                    {table.status === 'occupied' && (
                                        <Button
                                            size="icon"
                                            variant="secondary"
                                            className="h-7 w-7 rounded-full shadow-md bg-primary text-primary-foreground hover:bg-primary/90"
                                            onClick={(e) => { e.stopPropagation(); handleOpenBilling(table); }}
                                            title="Settle Bill"
                                        >
                                            <Receipt className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                    {table.status === 'billed' && (
                                        <Button
                                            size="icon"
                                            variant="secondary"
                                            className="h-7 w-7 rounded-full shadow-md bg-green-600 text-white hover:bg-green-700"
                                            onClick={(e) => { e.stopPropagation(); handleClearTable(table); }}
                                            title="Mark as Empty"
                                        >
                                            <CheckSquare className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted text-muted-foreground font-medium">
                            <tr>
                                <th className="p-4 w-10">
                                    <Checkbox
                                        checked={selectedTables.size === filteredTables.length && filteredTables.length > 0}
                                        onCheckedChange={toggleAll}
                                    />
                                </th>
                                <th className="p-4">Label</th>
                                <th className="p-4">Seats</th>
                                <th className="p-4">OTP</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredTables.map((table) => (
                                <tr key={table.id} className="hover:bg-muted/50">
                                    <td className="p-4">
                                        <Checkbox
                                            checked={selectedTables.has(table.id)}
                                            onCheckedChange={() => toggleSelection(table.id)}
                                        />
                                    </td>
                                    <td className="p-4 font-medium">{table.label}</td>
                                    <td className="p-4">{table.seats}</td>
                                    <td className="p-4 font-mono font-bold text-muted-foreground">{table.otp}</td>
                                    <td className="p-4">
                                        <Badge variant="outline" className={cn(
                                            table.status === 'empty' ? "text-green-600 border-green-600" :
                                                table.status === 'occupied' ? "text-blue-600 border-blue-600" :
                                                    "text-red-600 border-red-600"
                                        )}>
                                            {table.status.toUpperCase()}
                                        </Badge>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {table.status === 'occupied' && (
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenBilling(table)} title="Settle Bill">
                                                    <Receipt className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {table.status === 'billed' && (
                                                <Button variant="ghost" size="icon" onClick={() => handleClearTable(table)} title="Mark as Empty" className="text-green-600">
                                                    <CheckSquare className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" onClick={() => setQrTable(table)}>
                                                <QrCode className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleEditTable(table)}>
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { setCurrentTable(table); handleDeleteTable(); }}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredTables.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                        No tables found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Edit/Add Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="z-[100]">
                    <DialogHeader>
                        <DialogTitle>{currentTable.id ? 'Edit Table' : 'Add New Table'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="label" className="text-right">Label</Label>
                            <Input id="label" value={currentTable.label || ''} onChange={e => setCurrentTable({ ...currentTable, label: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="seats" className="text-right">Seats</Label>
                            <Input id="seats" type="number" value={currentTable.seats || 2} onChange={e => setCurrentTable({ ...currentTable, seats: parseInt(e.target.value) })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="status" className="text-right">Status</Label>
                            <div className="col-span-3">
                                <Select
                                    value={currentTable.status || 'empty'}
                                    onValueChange={(val: TableStatus) => setCurrentTable({ ...currentTable, status: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent className="z-[200]">
                                        <SelectItem value="empty">Empty</SelectItem>
                                        <SelectItem value="occupied">Occupied</SelectItem>
                                        <SelectItem value="billed">Billed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Position</Label>
                            <div className="col-span-3 flex gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">X:</span>
                                    <Input type="number" value={currentTable.x || 0} onChange={e => setCurrentTable({ ...currentTable, x: parseInt(e.target.value) })} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Y:</span>
                                    <Input type="number" value={currentTable.y || 0} onChange={e => setCurrentTable({ ...currentTable, y: parseInt(e.target.value) })} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="flex justify-between sm:justify-between">
                        {currentTable.id && (
                            <Button variant="destructive" onClick={handleDeleteTable}>Delete</Button>
                        )}
                        <Button onClick={handleSave}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* QR Code Dialog */}
            <Dialog open={!!qrTable} onOpenChange={(open) => !open && setQrTable(null)}>
                <DialogContent className="sm:max-w-md z-[100]">
                    <DialogHeader>
                        <DialogTitle>QR Code - {qrTable?.label}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center py-6 gap-4">
                        <div className="bg-white p-4 rounded-xl border shadow-sm">
                            {qrTable && (
                                <QRCodeSVG
                                    value={`https://foodcafeshop.in/${shopSlug}/menu?table=${qrTable.label}`}
                                    size={200}
                                    level="H"
                                    includeMargin={true}
                                />
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">Scan to view menu for {qrTable?.label}</p>
                    </div>
                    <DialogFooter className="sm:justify-center">
                        <Button className="gap-2" onClick={() => qrTable && handlePrint([qrTable])}>
                            <Printer className="h-4 w-4" /> Print QR Code
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Billing Dialog */}
            <Dialog open={!!billingTable} onOpenChange={(open) => !open && setBillingTable(null)}>
                <DialogContent className="max-w-lg z-[100]">
                    <DialogHeader>
                        <DialogTitle>Bill for {billingTable?.label}</DialogTitle>
                    </DialogHeader>

                    {billingLoading ? (
                        <div className="py-8 text-center text-muted-foreground">Loading orders...</div>
                    ) : tableOrders.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">No active orders for this table.</div>
                    ) : (
                        <div className="space-y-6">
                            <div className="max-h-[300px] overflow-y-auto space-y-4 pr-2">
                                {tableOrders.map((order) => (
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
                                                <div key={idx} className="flex justify-between text-sm">
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

                            {tableOrders.some(o => ['queued', 'preparing', 'ready'].includes(o.status)) && (
                                <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-2 rounded-md text-sm flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                                    Cannot settle bill: Some orders are still active.
                                </div>
                            )}

                            <DialogFooter>
                                <Button variant="outline" onClick={handlePrintBill} className="gap-2">
                                    <Printer className="h-4 w-4" /> Print Bill
                                </Button>
                                <Button variant="outline" onClick={() => setBillingTable(null)}>Cancel</Button>
                                <Button
                                    onClick={handleSettleBill}
                                    className="bg-green-600 hover:bg-green-700"
                                    disabled={tableOrders.some(o => ['queued', 'preparing', 'ready'].includes(o.status))}
                                >
                                    <Receipt className="mr-2 h-4 w-4" /> Settle Bill
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
