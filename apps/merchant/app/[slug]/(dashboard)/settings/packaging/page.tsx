"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PackagingItem } from "@/lib/types";
import { Plus, Trash2, Edit2, Package, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { getSettings, getPackagingItems, createPackagingItem, updatePackagingItem, deletePackagingItem } from "@/lib/api";
import { toast } from "sonner";
import { getCurrencySymbol } from "@/lib/utils";
import { useShopId } from "@/lib/hooks/use-shop-id";
import { Switch } from "@/components/ui/switch";

export default function PackagingSettingsPage() {
    const { shopId } = useShopId();
    const [items, setItems] = useState<PackagingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [currency, setCurrency] = useState("$");

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<Partial<PackagingItem>>({});

    useEffect(() => {
        if (shopId) {
            fetchData();
        }
    }, [shopId]);

    const fetchData = async () => {
        if (!shopId) return;
        setLoading(true);
        const [settingsData, itemsData] = await Promise.all([
            getSettings(shopId),
            getPackagingItems(shopId)
        ]);

        if (settingsData?.currency) {
            setCurrency(getCurrencySymbol(settingsData.currency));
        }
        setItems(itemsData || []);
        setLoading(false);
    };

    const handleAddNew = () => {
        setCurrentItem({
            name: '',
            price: 0,
            cost_price: 0,
            is_active: true
        });
        setIsDialogOpen(true);
    };

    const handleEdit = (item: PackagingItem) => {
        setCurrentItem(item);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this packaging type? Items using this packaging will need to be updated.")) return;

        try {
            await deletePackagingItem(id);
            setItems(prev => prev.filter(i => i.id !== id));
            toast.success("Packaging item deleted");
        } catch (e) {
            console.error(e);
            toast.error("Failed to delete item");
        }
    };

    const handleSave = async () => {
        if (!currentItem.name || !shopId) return;

        try {
            const payload = {
                ...currentItem,
                shop_id: shopId
            };

            let savedItem: PackagingItem;
            if (currentItem.id) {
                savedItem = await updatePackagingItem(currentItem.id, payload);
                setItems(prev => prev.map(i => i.id === savedItem.id ? savedItem : i));
                toast.success("Packaging updated");
            } else {
                savedItem = await createPackagingItem(payload);
                setItems(prev => [...prev, savedItem]);
                toast.success("Packaging created");
            }
            setIsDialogOpen(false);
        } catch (e) {
            console.error(e);
            toast.error("Failed to save packaging item");
        }
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Packaging Inventory</h1>
                    <p className="text-muted-foreground">Manage your boxes, bags, and containers.</p>
                </div>
                <Button onClick={handleAddNew} className="gap-2">
                    <Plus className="h-4 w-4" /> Add Material
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search materials..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 text-center text-muted-foreground">Loading inventory...</div>
                    ) : filteredItems.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
                            <Package className="h-10 w-10 opacity-20" />
                            <p>No packaging materials defined yet.</p>
                            <Button variant="link" onClick={handleAddNew}>Create your first item</Button>
                        </div>
                    ) : (
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm text-left">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Name</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Price (Customer)</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {filteredItems.map(item => (
                                        <tr key={item.id} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-4 align-middle font-medium">{item.name}</td>
                                            <td className="p-4 align-middle">{currency}{item.price.toFixed(2)}</td>
                                            <td className="p-4 align-middle">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${item.is_active
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-gray-100 text-gray-800"
                                                    }`}>
                                                    {item.is_active ? 'Active' : 'Archived'}
                                                </span>
                                            </td>
                                            <td className="p-4 align-middle text-right">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(item.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{currentItem.id ? 'Edit Material' : 'Add Material'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input
                                id="name"
                                value={currentItem.name}
                                onChange={e => setCurrentItem({ ...currentItem, name: e.target.value })}
                                className="col-span-3"
                                placeholder="e.g. 500ml Container"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" className="text-right">Price</Label>
                            <div className="col-span-3">
                                <Input
                                    id="price"
                                    type="number"
                                    value={currentItem.price}
                                    onChange={e => setCurrentItem({ ...currentItem, price: parseFloat(e.target.value) })}
                                    placeholder="0.00"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Amount charged to customer per unit</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="active" className="text-right">Active</Label>
                            <div className="col-span-3 flex items-center gap-2">
                                <Switch
                                    id="active"
                                    checked={currentItem.is_active}
                                    onCheckedChange={c => setCurrentItem({ ...currentItem, is_active: c })}
                                />
                                <Label htmlFor="active" className="font-normal text-muted-foreground">Available for selection</Label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save Material</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
