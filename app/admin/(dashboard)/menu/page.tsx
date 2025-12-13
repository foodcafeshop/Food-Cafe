"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { MenuItem, DietaryType } from "@/lib/types";
import { Edit2, Plus, Search, Trash2, X, FileUp, FileDown } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { getSettings } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { getCurrencySymbol } from "@/lib/utils"; // Added this import
import { exportToCSV, parseCSV } from "@/lib/csv-utils";

import { useShopId } from "@/lib/hooks/use-shop-id";

export default function MenuManagementPage() {
    const { shopId } = useShopId();
    const [items, setItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<Partial<MenuItem>>({});
    const [currencySymbol, setCurrencySymbol] = useState("$");

    useEffect(() => {
        if (shopId) {
            fetchItems();
            fetchSettings();
        }
    }, [shopId]);

    const fetchSettings = async () => {
        if (!shopId) return;
        const settings = await getSettings(shopId);
        if (settings?.currency) {
            setCurrencySymbol(getCurrencySymbol(settings.currency)); // Used getCurrencySymbol here
        }
    };

    const fetchItems = async () => {
        if (!shopId) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('menu_items')
            .select('*')
            .eq('shop_id', shopId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching items:', error);
            toast.error('Failed to fetch items');
        } else {
            setItems(data || []);
        }
        setLoading(false);
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this item?")) {
            const { error } = await supabase.from('menu_items').delete().eq('id', id);
            if (error) {
                toast.error('Failed to delete item');
            } else {
                setItems(items.filter(i => i.id !== id));
                toast.success('Item deleted');
            }
        }
    };

    const handleEdit = (item: MenuItem) => {
        setCurrentItem(item);
        setIsDialogOpen(true);
    };

    const handleAddNew = () => {
        setCurrentItem({
            name: '',
            description: '',
            price: 0,
            offer_price: 0,
            images: ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'],
            dietary_type: 'veg',
            is_available: true,
            is_popular: false,
            tags: [],
        });
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!currentItem.name || !currentItem.price || !shopId) return;

        const itemData = {
            ...currentItem,
            shop_id: shopId,
            // Ensure images is an array
            images: Array.isArray(currentItem.images) ? currentItem.images : [currentItem.images],
        };

        const { data, error } = await supabase
            .from('menu_items')
            .upsert(itemData)
            .select()
            .single();

        if (error) {
            console.error('Error saving item:', error);
            toast.error('Failed to save item');
        } else {
            setItems(prev => {
                const exists = prev.find(i => i.id === data.id);
                if (exists) {
                    return prev.map(i => i.id === data.id ? data : i);
                }
                return [data, ...prev];
            });
            setIsDialogOpen(false);
            toast.success('Item saved successfully');
        }
    };

    const handleExport = () => {
        const exportData = items.map(({ name, description, price, offer_price, dietary_type, is_available, is_popular, images, tags }) => ({
            name,
            description,
            price,
            offer_price,
            dietary_type,
            is_available,
            is_popular,
            image: images?.[0] || '',
            tags: tags?.join(', ')
        }));
        exportToCSV(exportData, `menu_items_${new Date().toISOString().split('T')[0]}`,
            ['name', 'description', 'price', 'offer_price', 'dietary_type', 'is_available', 'is_popular', 'image', 'tags']);
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

            toast.loading("Importing menu items...");
            let successCount = 0;
            let failCount = 0;

            for (const row of data) {
                if (!row.name || !row.price) {
                    failCount++;
                    continue;
                }

                // Handle images: favor 'images' array, fallback to 'image' string
                let images: string[] = [];
                if (Array.isArray(row.images)) {
                    images = row.images;
                } else if (typeof row.images === 'string') {
                    // Try parsing if valid JSON array string
                    try {
                        const parsed = JSON.parse(row.images);
                        if (Array.isArray(parsed)) images = parsed;
                        else images = [row.images];
                    } catch { images = [row.images]; }
                } else if (row.image) {
                    images = [row.image];
                }

                // Handle tags
                let tags: string[] = [];
                if (Array.isArray(row.tags)) {
                    tags = row.tags;
                } else if (typeof row.tags === 'string') {
                    // Try parsing if valid JSON array string (though csv-utils should have done it, this is double safety)
                    try {
                        const parsed = JSON.parse(row.tags);
                        if (Array.isArray(parsed)) tags = parsed;
                        else tags = row.tags.split(',').map((t: string) => t.trim());
                    } catch {
                        tags = row.tags.split(',').map((t: string) => t.trim());
                    }
                }

                const itemData = {
                    shop_id: shopId,
                    name: row.name,
                    description: row.description,
                    price: Number(row.price),
                    offer_price: row.offer_price ? Number(row.offer_price) : null,
                    dietary_type: row.dietary_type || 'veg',
                    is_available: row.is_available === true || row.is_available === 'true',
                    is_popular: row.is_popular === true || row.is_popular === 'true',
                    images: images,
                    tags: tags
                };

                const { error } = await supabase
                    .from('menu_items')
                    .insert(itemData);

                if (error) failCount++;
                else successCount++;
            }

            toast.dismiss();
            toast.success(`Imported ${successCount} items. Failed: ${failCount}`);
            fetchItems();
            e.target.value = '';
        } catch (error) {
            console.error(error);
            toast.error("Failed to process CSV file");
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold">Menu Items</h1>
                <div className="grid grid-cols-2 sm:flex gap-2 w-full md:w-auto">
                    <div className="relative col-span-1">
                        <input
                            type="file"
                            accept=".csv"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleImport}
                            title="Import Items CSV"
                        />
                        <Button variant="outline" className="gap-2 w-full">
                            <FileUp className="h-4 w-4" /> Import
                        </Button>
                    </div>
                    <Button variant="outline" className="gap-2 col-span-1" onClick={handleExport}>
                        <FileDown className="h-4 w-4" /> Export
                    </Button>
                    <Button className="gap-2 col-span-2 sm:col-span-1" onClick={handleAddNew}>
                        <Plus className="h-4 w-4" /> Add New Item
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search items..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-4">
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading items...</div>
                ) : filteredItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No items found. Add one to get started.</div>
                ) : (
                    filteredItems.map((item) => (
                        <Card key={item.id} className="flex flex-col md:flex-row items-center p-4 gap-4 overflow-hidden">
                            <div className="w-full md:w-auto flex items-center gap-4 flex-1 min-w-0">
                                <div className="h-16 w-16 rounded-md overflow-hidden shrink-0 bg-muted relative">
                                    <img src={item.images[0]} alt={item.name} className="h-full w-full object-cover" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold truncate">{item.name}</h3>
                                        {item.is_popular && <Badge variant="secondary" className="text-[10px]">Popular</Badge>}
                                        <Badge variant="outline" className={item.dietary_type === 'veg' ? "text-green-600 border-green-600" : item.dietary_type === 'non_veg' ? "text-red-600 border-red-600" : "text-green-600 border-green-600"}>
                                            {item.dietary_type === 'vegan' ? 'VEGAN' : item.dietary_type === 'veg' ? 'VEG' : 'NON-VEG'}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-sm font-medium">{currencySymbol}{(item.offer_price ?? item.price).toFixed(2)}</span>
                                        {item.offer_price && item.offer_price < item.price && (
                                            <span className="text-xs text-muted-foreground line-through">{currencySymbol}{item.price.toFixed(2)}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between w-full md:w-auto md:justify-end gap-6 border-t md:border-none pt-4 md:pt-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-muted-foreground">In Stock</span>
                                    <Switch
                                        checked={item.is_available}
                                        onCheckedChange={async (checked) => {
                                            // Optimistic update
                                            setItems(items.map(i => i.id === item.id ? { ...i, is_available: checked } : i));
                                            await supabase.from('menu_items').update({ is_available: checked }).eq('id', item.id);
                                        }}
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{currentItem.id ? 'Edit Item' : 'Add New Item'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input id="name" value={currentItem.name} onChange={e => setCurrentItem({ ...currentItem, name: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="desc" className="text-right">Description</Label>
                            <Input id="desc" value={currentItem.description || ''} onChange={e => setCurrentItem({ ...currentItem, description: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" className="text-right">Price</Label>
                            <div className="col-span-3 flex gap-4">
                                <div className="flex-1">
                                    <Input
                                        type="number"
                                        placeholder="Selling Price"
                                        value={currentItem.price}
                                        onChange={e => setCurrentItem({ ...currentItem, price: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div className="flex-1">
                                    <Input
                                        type="number"
                                        placeholder="Offer Price (Optional)"
                                        value={currentItem.offer_price || ''}
                                        onChange={e => setCurrentItem({ ...currentItem, offer_price: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="dietary" className="text-right">Type</Label>
                            <div className="col-span-3">
                                <Select
                                    value={currentItem.dietary_type}
                                    onValueChange={(val: DietaryType) => setCurrentItem({ ...currentItem, dietary_type: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="veg">Vegetarian</SelectItem>
                                        <SelectItem value="non_veg">Non-Vegetarian</SelectItem>
                                        <SelectItem value="vegan">Vegan</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="image" className="text-right">Image URL</Label>
                            <Input
                                id="image"
                                value={currentItem.images?.[0] || ''}
                                onChange={e => setCurrentItem({ ...currentItem, images: [e.target.value] })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Options</Label>
                            <div className="col-span-3 flex gap-6">
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={currentItem.is_popular}
                                        onCheckedChange={checked => setCurrentItem({ ...currentItem, is_popular: checked })}
                                    />
                                    <Label>Popular Item</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={currentItem.is_available}
                                        onCheckedChange={checked => setCurrentItem({ ...currentItem, is_available: checked })}
                                    />
                                    <Label>Available</Label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSave}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
