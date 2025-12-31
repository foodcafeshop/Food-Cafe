"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QrCode, Users, Move, Printer, Plus, Trash2, Edit2, List, Grid, LayoutGrid, CheckSquare, Square, Receipt, FileUp, FileDown } from "lucide-react";
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
import { settleTableBill, clearTable, getSettings, updateOrderStatus } from "@/lib/api";
import { exportToCSV, parseCSV } from "@/lib/csv-utils";
import { BillingDialog } from "@/components/features/staff/BillingDialog";

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
    const { shopId, role } = useShopId();
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
    // Removed redundant billing state (tableOrders, billingLoading, paymentMethod) as they are handled inside BillingDialog

    // Dragging State
    const [draggedTableId, setDraggedTableId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const canvasRef = useRef<HTMLDivElement>(null);

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
        // serviceChargeRate state usage removed from here as it's in BillingDialog, 
        // but maybe we need it for other things? Checking usage... 
        // Seemed only used for billing calculation. 
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
            setTables(tablesWithOtp.sort((a: any, b: any) =>
                a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' })
            ));
        }
        setLoading(false);
    };

    const handleOpenBilling = (table: Table) => {
        setBillingTable(table);
    };

    // Removed handleSettleBill, handleUpdateOrderStatus (if only used in billing dialog) 
    // Wait, handleUpdateOrderStatus is likely only used in the billing list view?
    // Checking usage... Yes, inside the dialog. 
    // So we can remove it from here.


    const handleClearTable = async (table: Table) => {
        if (confirm(`Mark ${table.label} as Empty?`)) {
            try {
                await clearTable(table.id);
                toast.success("Table marked as empty");
                setTables(prev => prev.map(t =>
                    t.id === table.id ? { ...t, status: 'empty' } : t
                ));
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
            const { data, error } = await supabase
                .from('tables')
                .delete()
                .eq('id', currentTable.id)
                .select();

            if (error) {
                toast.error('Failed to delete table');
            } else if (!data || data.length === 0) {
                toast.error('Cannot delete table (Permission denied)');
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

    // Export/Import Handlers
    const handleExport = () => {
        const exportData = tables.map(({ label, seats, x, y }) => ({ label, seats, x, y }));
        exportToCSV(exportData, `tables_${shopSlug}_${new Date().toISOString().split('T')[0]}`, ['label', 'seats', 'x', 'y']);
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !shopId) return;

        try {
            const data = await parseCSV(file);
            if (data.length === 0) {
                toast.error("No data found in CSV");
                return;
            }

            let successCount = 0;
            let failCount = 0;

            for (const row of data) {
                // Basic validation
                if (!row.label || !row.seats) {
                    failCount++;
                    continue;
                }

                const tableData = {
                    shop_id: shopId,
                    label: row.label,
                    seats: Number(row.seats) || 2,
                    x: Number(row.x) || 50,
                    y: Number(row.y) || 50,
                    status: 'empty'
                };

                const { error } = await supabase
                    .from('tables')
                    .upsert(tableData, { onConflict: 'shop_id, label' });

                if (error) failCount++;
                else successCount++;
            }

            toast.success(`Imported ${successCount} tables. Failed: ${failCount}`);
            fetchTables();
            // Reset input
            e.target.value = '';
        } catch (error) {
            console.error("Import error:", error);
            toast.error("Failed to process CSV file");
        }
    };



    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold">Table Management</h1>
                    <div className="flex gap-2 w-full sm:w-auto">
                        {role === 'admin' && (
                            <>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".csv"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={handleImport}
                                        title="Import Tables CSV"
                                    />
                                    <Button variant="outline" className="gap-2 w-full sm:w-auto">
                                        <FileUp className="h-4 w-4" /> Import
                                    </Button>
                                </div>
                                <Button variant="outline" className="gap-2 hidden sm:flex" onClick={handleExport}>
                                    <FileDown className="h-4 w-4" /> Export
                                </Button>
                                <Button className="gap-2 flex-1 sm:flex-none" onClick={handleAddTable}>
                                    <Plus className="h-4 w-4" /> Add Table
                                </Button>
                            </>
                        )}

                        {selectedTables.size > 0 ? (
                            <Button variant="outline" className="gap-2 flex-1 sm:flex-none" onClick={() => handlePrint(tables.filter(t => selectedTables.has(t.id)))}>
                                <Printer className="h-4 w-4" /> Print ({selectedTables.size})
                            </Button>
                        ) : (
                            <Button variant="outline" className="gap-2 flex-1 sm:flex-none" onClick={() => handlePrint(tables)}>
                                <Printer className="h-4 w-4" /> Print QR
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/40 p-2 rounded-lg border">
                    <div className="flex flex-col sm:flex-row items-center gap-2 flex-1 w-full">
                        <div className="flex bg-background rounded-lg border p-1 w-full sm:w-auto justify-center">
                            <Button
                                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('list')}
                                className="gap-2 h-8 flex-1 sm:flex-none"
                            >
                                <List className="h-4 w-4" /> List
                            </Button>
                            <Button
                                variant={viewMode === 'canvas' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('canvas')}
                                className="gap-2 h-8 flex-1 sm:flex-none"
                            >
                                <LayoutGrid className="h-4 w-4" /> Canvas
                            </Button>
                        </div>
                        <div className="hidden sm:block h-6 w-px bg-border mx-2" />
                        <Input
                            placeholder="Search tables..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-9 w-full sm:w-[200px] bg-background"
                        />
                        <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
                            <SelectTrigger className="h-9 w-full sm:w-[150px] bg-background">
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
                    <div className="text-sm text-muted-foreground hidden sm:block">
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
                <>
                    {/* Mobile Card View */}
                    <div className="grid grid-cols-1 gap-4 md:hidden">
                        {filteredTables.map(table => (
                            <Card key={table.id} className="p-4 flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-lg">{table.label}</span>
                                            <Badge variant="outline" className={cn(
                                                table.status === 'empty' ? "text-green-600 border-green-600" :
                                                    table.status === 'occupied' ? "text-blue-600 border-blue-600" :
                                                        "text-red-600 border-red-600"
                                            )}>
                                                {table.status.toUpperCase()}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Users className="h-3 w-3" /> {table.seats} Seats
                                            </div>
                                            <div className="font-mono">OTP: {table.otp}</div>
                                        </div>
                                    </div>
                                    <Checkbox
                                        checked={selectedTables.has(table.id)}
                                        onCheckedChange={() => toggleSelection(table.id)}
                                    />
                                </div>

                                <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                                    {table.status === 'occupied' && (
                                        <Button size="sm" variant="outline" className="flex-1" onClick={() => handleOpenBilling(table)}>
                                            <Receipt className="h-4 w-4 mr-2" /> Settle
                                        </Button>
                                    )}
                                    {table.status === 'billed' && (
                                        <Button size="sm" variant="outline" className="flex-1 text-green-600" onClick={() => handleClearTable(table)}>
                                            <CheckSquare className="h-4 w-4 mr-2" /> Clear
                                        </Button>
                                    )}
                                    <Button size="sm" variant="ghost" onClick={() => setQrTable(table)}>
                                        <QrCode className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => handleEditTable(table)}>
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    {role === 'admin' && (
                                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { setCurrentTable(table); handleDeleteTable(); }}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block border rounded-lg overflow-hidden">
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
                                                {role === 'admin' && (
                                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { setCurrentTable(table); handleDeleteTable(); }}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
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
                </>
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
                        {currentTable.id && role === 'admin' && (
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
            <BillingDialog
                open={!!billingTable}
                onOpenChange={(open) => !open && setBillingTable(null)}
                tableId={billingTable?.id || null}
                tableLabel={billingTable?.label}
                shopId={shopId}
                onSuccess={(tableId, status) => {
                    if (tableId && status) {
                        setTables(prev => prev.map(t =>
                            t.id === tableId ? { ...t, status: status as TableStatus } : t
                        ));
                    }
                    fetchTables();
                    setBillingTable(null);
                }}
            />
        </div>
    );
}
