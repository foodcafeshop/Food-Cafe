'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getShopBySlug, getInventoryItems, bulkAdjustInventory } from '@/lib/api';
import { InventoryItem, AdjustmentReason } from '@/lib/types';
import { Loader2, ArrowLeft, Save, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface ReconcileItem extends InventoryItem {
    physical_stock: number;
    reason: AdjustmentReason;
    notes: string;
}

export default function ReconcilePage({ params }: { params: { slug: string } }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [shopId, setShopId] = useState<string | null>(null);
    const [items, setItems] = useState<ReconcileItem[]>([]);

    useEffect(() => {
        loadData();
    }, [params.slug]);

    async function loadData() {
        try {
            const shop = await getShopBySlug(params.slug);
            if (!shop) {
                toast.error('Shop not found');
                return;
            }
            setShopId(shop.id);

            const inventory = await getInventoryItems(shop.id);
            // Initialize physical stock with current system stock
            setItems(inventory.map(item => ({
                ...item,
                physical_stock: item.stock_quantity,
                reason: 'correction',
                notes: ''
            })));
        } catch (error) {
            console.error(error);
            toast.error('Failed to load inventory');
        } finally {
            setLoading(false);
        }
    }

    const handleStockChange = (id: string, value: string) => {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return;

        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, physical_stock: numValue } : item
        ));
    };

    const handleReasonChange = (id: string, reason: AdjustmentReason) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, reason } : item
        ));
    };

    const handleNotesChange = (id: string, notes: string) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, notes } : item
        ));
    };

    const handleSave = async () => {
        if (!shopId) return;

        // Filter items that have changed
        const adjustments = items
            .filter(item => item.physical_stock !== item.stock_quantity)
            .map(item => ({
                inventoryItemId: item.id,
                adjustment: item.physical_stock - item.stock_quantity,
                reason: item.reason,
                notes: item.notes || 'EOD Reconciliation'
            }));

        if (adjustments.length === 0) {
            toast.info('No changes to save');
            return;
        }

        setSaving(true);
        try {
            const success = await bulkAdjustInventory(shopId, adjustments);
            if (success) {
                toast.success(`Successfully reconciled ${adjustments.length} items`);
                router.push(`/${params.slug}/inventory`);
            } else {
                toast.error('Failed to save adjustments');
            }
        } catch (error) {
            console.error(error);
            toast.error('An error occurred while saving');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const hasChanges = items.some(i => i.physical_stock !== i.stock_quantity);

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] gap-4 p-4 md:p-8 max-w-7xl mx-auto w-full">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-muted rounded-full transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">EOD Reconciliation</h1>
                        <p className="text-muted-foreground">Verify physical stock against system records</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges || saving}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Canfirm & Update Stock
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="border rounded-lg bg-card shadow-sm flex-1 overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
                            <tr className="border-b">
                                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Item Name</th>
                                <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">System Stock</th>
                                <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground w-32">Physical Stock</th>
                                <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground w-24">Diff</th>
                                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground w-40">Reason</th>
                                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => {
                                const diff = item.physical_stock - item.stock_quantity;
                                const isChanged = diff !== 0;

                                return (
                                    <tr key={item.id} className={`border-b transition-colors hover:bg-muted/20 ${isChanged ? 'bg-orange-50/50 dark:bg-orange-950/10' : ''}`}>
                                        <td className="p-4 align-middle font-medium">
                                            {item.name}
                                            <span className="ml-2 text-xs text-muted-foreground font-normal">({item.unit})</span>
                                        </td>
                                        <td className="p-4 align-middle text-right">
                                            {item.stock_quantity}
                                        </td>
                                        <td className="p-4 align-middle">
                                            <input
                                                type="number"
                                                min="0"
                                                step="1"
                                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-right font-mono"
                                                value={item.physical_stock}
                                                onChange={(e) => handleStockChange(item.id, e.target.value)}
                                            />
                                        </td>
                                        <td className={`p-4 align-middle text-right font-mono font-medium ${diff < 0 ? 'text-red-500' : diff > 0 ? 'text-green-500' : 'text-muted-foreground'}`}>
                                            {diff > 0 ? '+' : ''}{parseFloat(diff.toFixed(3))}
                                        </td>
                                        <td className="p-4 align-middle">
                                            {isChanged ? (
                                                <select
                                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                                    value={item.reason}
                                                    onChange={(e) => handleReasonChange(item.id, e.target.value as AdjustmentReason)}
                                                >
                                                    <option value="correction">Correction</option>
                                                    <option value="wastage">Wastage</option>
                                                    <option value="damage">Damage</option>
                                                    <option value="theft">Theft</option>
                                                    <option value="restock">Restock (Found)</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 align-middle">
                                            {isChanged ? (
                                                <input
                                                    type="text"
                                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                                    placeholder="Add note..."
                                                    value={item.notes}
                                                    onChange={(e) => handleNotesChange(item.id, e.target.value)}
                                                />
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
