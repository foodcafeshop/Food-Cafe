"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { InventoryItem, AdjustmentReason } from "@/lib/types";
import { Edit2, Plus, Search, Trash2, Package, AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useShopId } from "@/lib/hooks/use-shop-id";
import {
    getInventoryItems,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    adjustStock,
    getStockAdjustments
} from "@/lib/api";

const UNITS = [
    { value: 'kg', label: 'Kilogram (kg)' },
    { value: 'g', label: 'Gram (g)' },
    { value: 'L', label: 'Liter (L)' },
    { value: 'ml', label: 'Milliliter (ml)' },
    { value: 'pcs', label: 'Pieces (pcs)' },
    { value: 'dozen', label: 'Dozen' },
];

const ADJUSTMENT_REASONS: { value: AdjustmentReason; label: string }[] = [
    { value: 'restock', label: '📦 Restock' },
    { value: 'usage', label: '🍳 Usage' },
    { value: 'wastage', label: '🗑️ Wastage' },
    { value: 'damage', label: '💔 Damage' },
    { value: 'theft', label: '🚨 Theft' },
    { value: 'correction', label: '✏️ Correction' },
    { value: 'other', label: '📝 Other' },
];

type FilterType = 'all' | 'low' | 'out';

// Generate image URL from item name (same as AI menu digitization)
const generateImageUrl = (term: string): string => {
    if (!term) return '';
    const keyword = encodeURIComponent(term.trim());
    return `https://tse2.mm.bing.net/th?q=${keyword}&w=300&h=300&c=7&rs=1&p=0&dpr=3&pid=1.7&mkt=en-IN&adlt=moderate`;
};

export default function InventoryPage() {
    const { shopId } = useShopId();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<FilterType>('all');

    // Item Dialog
    const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<Partial<InventoryItem>>({});

    // Adjustment Dialog
    const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
    const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
    const [adjustmentAmount, setAdjustmentAmount] = useState<number>(0);
    const [isNegativeDirection, setIsNegativeDirection] = useState(false);
    const [adjustmentReason, setAdjustmentReason] = useState<AdjustmentReason>('restock');
    const [adjustmentNotes, setAdjustmentNotes] = useState<string>('');

    useEffect(() => {
        if (shopId) fetchItems();
    }, [shopId]);

    const fetchItems = async () => {
        if (!shopId) return;
        setLoading(true);
        const data = await getInventoryItems(shopId);
        setItems(data);
        setLoading(false);
    };

    const getStockStatus = (item: InventoryItem) => {
        if (item.stock_quantity <= 0) return 'out';
        if (item.stock_quantity <= item.low_stock_threshold) return 'low';
        return 'ok';
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
        if (!matchesSearch) return false;

        if (filter === 'all') return true;
        const status = getStockStatus(item);
        if (filter === 'low') return status === 'low' || status === 'out';
        if (filter === 'out') return status === 'out';
        return true;
    });

    const handleAddNew = () => {
        setCurrentItem({
            name: '',
            unit: 'kg',
            stock_quantity: 0,
            low_stock_threshold: 10,
            image_url: '',
        });
        setIsItemDialogOpen(true);
    };

    const handleEdit = (item: InventoryItem) => {
        setCurrentItem(item);
        setIsItemDialogOpen(true);
    };

    const handleSave = async () => {
        if (!currentItem.name || !currentItem.unit || !shopId) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            if (currentItem.id) {
                // Update existing
                const updated = await updateInventoryItem(currentItem.id, currentItem);
                setItems(items.map(i => i.id === updated.id ? updated : i));
                toast.success('Item updated');
            } else {
                // Create new - auto-generate image if not provided
                const imageUrl = currentItem.image_url || generateImageUrl(currentItem.name);
                const created = await createInventoryItem({
                    shop_id: shopId,
                    name: currentItem.name,
                    unit: currentItem.unit,
                    stock_quantity: currentItem.stock_quantity || 0,
                    low_stock_threshold: currentItem.low_stock_threshold || 10,
                    image_url: imageUrl,
                    cost_per_unit: currentItem.cost_per_unit,
                });
                setItems([created, ...items]);
                toast.success('Item created');
            }
            setIsItemDialogOpen(false);
        } catch (error: any) {
            toast.error(error.message || 'Failed to save item');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this inventory item?")) return;

        try {
            await deleteInventoryItem(id);
            setItems(items.filter(i => i.id !== id));
            toast.success('Item deleted');
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete item');
        }
    };

    const openAdjustDialog = (item: InventoryItem) => {
        setAdjustingItem(item);
        setAdjustmentAmount(0);
        setIsNegativeDirection(false);
        setAdjustmentReason('restock');
        setAdjustmentNotes('');
        setIsAdjustDialogOpen(true);
    };

    const handleAdjustStock = async () => {
        if (!adjustingItem || !shopId || adjustmentAmount === 0) {
            toast.error('Please enter a valid adjustment amount');
            return;
        }

        // Validate: don't allow negative resulting stock
        const newStock = adjustingItem.stock_quantity + adjustmentAmount;
        if (newStock < 0) {
            toast.error(`Cannot reduce more than current stock (${adjustingItem.stock_quantity} ${adjustingItem.unit})`);
            return;
        }

        try {
            await adjustStock(
                shopId,
                adjustingItem.id,
                adjustmentAmount,
                adjustmentReason,
                adjustmentNotes || undefined
            );

            // Refresh items
            await fetchItems();
            setIsAdjustDialogOpen(false);
            toast.success(`Stock adjusted by ${adjustmentAmount > 0 ? '+' : ''}${adjustmentAmount} ${adjustingItem.unit}`);
        } catch (error: any) {
            toast.error(error.message || 'Failed to adjust stock');
        }
    };

    const lowStockCount = items.filter(i => getStockStatus(i) === 'low').length;
    const outOfStockCount = items.filter(i => getStockStatus(i) === 'out').length;

    return (
        <div className="min-h-full bg-background">
            <div className="p-6 pb-6 space-y-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Package className="h-6 w-6" />
                            Inventory
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Manage raw materials and stock levels
                        </p>
                    </div>
                    <Button className="gap-2" onClick={handleAddNew}>
                        <Plus className="h-4 w-4" /> Add Inventory Item
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <Card className={`col-span-2 sm:col-span-1 cursor-pointer transition-colors ${filter === 'all' ? 'ring-2 ring-primary' : ''}`} onClick={() => setFilter('all')}>
                        <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Items</p>
                                    <p className="text-2xl font-bold">{items.length}</p>
                                </div>
                                <Package className="h-8 w-8 text-muted-foreground" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className={`cursor-pointer transition-colors ${filter === 'low' ? 'ring-2 ring-yellow-500' : ''}`} onClick={() => setFilter('low')}>
                        <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Low Stock</p>
                                    <p className="text-2xl font-bold text-yellow-600">{lowStockCount}</p>
                                </div>
                                <AlertTriangle className="h-8 w-8 text-yellow-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className={`cursor-pointer transition-colors ${filter === 'out' ? 'ring-2 ring-red-500' : ''}`} onClick={() => setFilter('out')}>
                        <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Out of Stock</p>
                                    <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
                                </div>
                                <AlertTriangle className="h-8 w-8 text-red-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Search - Sticky */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 px-6 border-y shadow-sm">
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search inventory..."
                        className="pl-9 bg-background"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Scrollable Items Section */}
            <div className="p-6 pt-6">
                <div className="grid gap-4">
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading inventory...</div>
                    ) : filteredItems.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            {search || filter !== 'all' ? 'No items match your criteria.' : 'No inventory items yet. Add one to get started.'}
                        </div>
                    ) : (
                        filteredItems.map((item) => {
                            const status = getStockStatus(item);
                            const rowColorClass = status === 'out'
                                ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900'
                                : status === 'low'
                                    ? 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900'
                                    : '';
                            return (
                                <Card key={item.id} className={`p-4 ${rowColorClass}`}>
                                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                                        {/* Image */}
                                        <div className="h-16 w-16 rounded-md overflow-hidden shrink-0 bg-muted flex items-center justify-center">
                                            {item.image_url ? (
                                                <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <Package className="h-8 w-8 text-muted-foreground" />
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-semibold">{item.name}</h3>
                                                <Badge variant="outline">{item.unit}</Badge>
                                                {status === 'out' && (
                                                    <Badge variant="destructive">Out of Stock</Badge>
                                                )}
                                                {status === 'low' && (
                                                    <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Low Stock</Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                                <span>Stock: <strong className={status === 'out' ? 'text-red-600' : status === 'low' ? 'text-yellow-600' : 'text-green-600'}>{item.stock_quantity} {item.unit}</strong></span>
                                                <span>Alert at: {item.low_stock_threshold} {item.unit}</span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 w-full md:w-auto">
                                            <Button variant="outline" size="sm" className="gap-1 flex-1 md:flex-none" onClick={() => openAdjustDialog(item)}>
                                                <TrendingUp className="h-4 w-4" /> Adjust
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })
                    )}
                </div>

                {/* Add/Edit Item Dialog */}
                <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{currentItem.id ? 'Edit Inventory Item' : 'Add Inventory Item'}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Name *</Label>
                                <Input
                                    id="name"
                                    value={currentItem.name || ''}
                                    onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
                                    className="col-span-3"
                                    placeholder="e.g., Chicken Breast"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="unit" className="text-right">Unit *</Label>
                                <Select
                                    value={currentItem.unit}
                                    onValueChange={(val) => setCurrentItem({ ...currentItem, unit: val })}
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select unit" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {UNITS.map(u => (
                                            <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="stock" className="text-right">Stock Qty</Label>
                                <Input
                                    id="stock"
                                    type="number"
                                    step="1"
                                    min="0"
                                    value={currentItem.stock_quantity || 0}
                                    onChange={(e) => setCurrentItem({ ...currentItem, stock_quantity: parseFloat(e.target.value) || 0 })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="threshold" className="text-right">Low Stock Alert</Label>
                                <Input
                                    id="threshold"
                                    type="number"
                                    step="1"
                                    min="0"
                                    value={currentItem.low_stock_threshold || 10}
                                    onChange={(e) => setCurrentItem({ ...currentItem, low_stock_threshold: parseFloat(e.target.value) || 10 })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="image" className="text-right">Image URL</Label>
                                <Input
                                    id="image"
                                    value={currentItem.image_url || ''}
                                    onChange={(e) => setCurrentItem({ ...currentItem, image_url: e.target.value })}
                                    className="col-span-3"
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="cost" className="text-right">Cost/Unit</Label>
                                <Input
                                    id="cost"
                                    type="number"
                                    step="0.01"
                                    value={currentItem.cost_per_unit || ''}
                                    onChange={(e) => setCurrentItem({ ...currentItem, cost_per_unit: parseFloat(e.target.value) || undefined })}
                                    className="col-span-3"
                                    placeholder="Optional - for future COGS"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsItemDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleSave}>Save</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Stock Adjustment Dialog */}
                <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
                    <DialogContent className="sm:max-w-[450px]">
                        <DialogHeader>
                            <DialogTitle>Adjust Stock: {adjustingItem?.name}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="text-center p-4 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground">Current Stock</p>
                                <p className="text-3xl font-bold">{adjustingItem?.stock_quantity} {adjustingItem?.unit}</p>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="adjustment" className="text-right">Adjustment</Label>
                                <div className="col-span-3 flex gap-2">
                                    <Button
                                        variant={isNegativeDirection ? "default" : "outline"}
                                        size="icon"
                                        onClick={() => {
                                            setIsNegativeDirection(true);
                                            setAdjustmentAmount(prev => -Math.abs(prev) || 0);
                                        }}
                                        disabled={adjustmentReason === 'restock'}
                                    >
                                        <TrendingDown className="h-4 w-4" />
                                    </Button>
                                    <Input
                                        id="adjustment"
                                        type="number"
                                        step="1"
                                        min="0"
                                        max={isNegativeDirection ? adjustingItem?.stock_quantity : undefined}
                                        value={Math.abs(adjustmentAmount)}
                                        onChange={(e) => {
                                            let val = parseFloat(e.target.value) || 0;
                                            // Limit to current stock for negative adjustments
                                            if (isNegativeDirection && val > (adjustingItem?.stock_quantity || 0)) {
                                                val = adjustingItem?.stock_quantity || 0;
                                            }
                                            setAdjustmentAmount(isNegativeDirection ? -val : val);
                                        }}
                                        className="flex-1"
                                    />
                                    <Button
                                        variant={!isNegativeDirection ? "default" : "outline"}
                                        size="icon"
                                        onClick={() => {
                                            setIsNegativeDirection(false);
                                            setAdjustmentAmount(prev => Math.abs(prev) || 0);
                                        }}
                                        disabled={['usage', 'wastage', 'damage', 'theft'].includes(adjustmentReason)}
                                    >
                                        <TrendingUp className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="reason" className="text-right">Reason</Label>
                                <Select
                                    value={adjustmentReason}
                                    onValueChange={(val: AdjustmentReason) => {
                                        setAdjustmentReason(val);
                                        // Auto-select direction based on reason
                                        const negativeReasons: AdjustmentReason[] = ['usage', 'wastage', 'damage', 'theft', 'order'];
                                        const isNegative = negativeReasons.includes(val);
                                        setIsNegativeDirection(isNegative);
                                        setAdjustmentAmount(prev => {
                                            const absVal = Math.abs(prev) || 0;
                                            return isNegative ? -absVal : absVal;
                                        });
                                    }}
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ADJUSTMENT_REASONS.map(r => (
                                            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="notes" className="text-right">Notes</Label>
                                <Input
                                    id="notes"
                                    value={adjustmentNotes}
                                    onChange={(e) => setAdjustmentNotes(e.target.value)}
                                    className="col-span-3"
                                    placeholder="Optional notes..."
                                />
                            </div>
                            <div className="text-center p-4 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground">New Stock</p>
                                <p className={`text-3xl font-bold ${(adjustingItem?.stock_quantity || 0) + adjustmentAmount < 0 ? 'text-red-600' : ''}`}>
                                    {((adjustingItem?.stock_quantity || 0) + adjustmentAmount).toFixed(3)} {adjustingItem?.unit}
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAdjustDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleAdjustStock} disabled={adjustmentAmount === 0}>
                                Confirm Adjustment
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
