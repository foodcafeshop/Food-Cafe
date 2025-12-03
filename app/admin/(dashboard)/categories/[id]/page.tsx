"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Category, MenuItem } from "@/lib/types";
import { ArrowLeft, Plus, Trash2, X, Edit2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import Link from "next/link";
import { toast } from "sonner";
import { getSettings, updateMenuItem } from "@/lib/api";
import { getCurrencySymbol } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DietaryType } from "@/lib/types";

import { useShopId } from "@/lib/hooks/use-shop-id";

export default function CategoryBuilderPage() {
    const { shopId } = useShopId();
    const { id } = useParams();
    const router = useRouter();
    const [category, setCategory] = useState<Category | null>(null);
    const [categoryItems, setCategoryItems] = useState<MenuItem[]>([]);
    const [allItems, setAllItems] = useState<MenuItem[]>([]);
    const [isAddItemOpen, setIsAddItemOpen] = useState(false);
    const [isEditDetailsOpen, setIsEditDetailsOpen] = useState(false);
    const [currency, setCurrency] = useState("$");

    useEffect(() => {
        if (id && shopId) {
            fetchData();
        }
    }, [id, shopId]);

    const fetchData = async () => {
        if (!shopId) return;
        // 0. Fetch Settings
        const settings = await getSettings(shopId);
        if (settings?.currency) setCurrency(getCurrencySymbol(settings.currency));

        // 1. Fetch Category
        const { data: catData, error: catError } = await supabase
            .from('categories')
            .select('*')
            .eq('id', id)
            .single();

        if (catError) {
            toast.error("Failed to load category");
            return;
        }
        setCategory(catData);

        // 2. Fetch Items in this Category
        const { data: itemsData, error: itemsError } = await supabase
            .from('category_items')
            .select(`
                menu_item_id,
                menu_items (*)
            `)
            .eq('category_id', id)
            .order('sort_order');

        if (itemsError) {
            console.error("Error fetching items:", itemsError);
        } else {
            setCategoryItems(itemsData.map((i: any) => i.menu_items));
        }

        // 3. Fetch All Items (for adding)
        const { data: allItemsData } = await supabase
            .from('menu_items')
            .select('*')
            .eq('shop_id', shopId);
        setAllItems(allItemsData || []);
    };

    const handleAddItem = async (itemId: string) => {
        const { error } = await supabase.from('category_items').insert({
            category_id: id,
            menu_item_id: itemId,
            sort_order: categoryItems.length
        });

        if (error) {
            toast.error("Failed to add item");
        } else {
            fetchData();
            setIsAddItemOpen(false);
            toast.success("Item added");
        }
    };

    const handleRemoveItem = async (itemId: string) => {
        if (confirm("Remove this item from the category?")) {
            const { error } = await supabase
                .from('category_items')
                .delete()
                .match({ category_id: id, menu_item_id: itemId });

            if (error) {
                toast.error("Failed to remove item");
            } else {
                fetchData();
                toast.success("Item removed");
            }
        }
    };

    const handleToggleStock = async (item: MenuItem) => {
        try {
            const newStatus = !item.is_available;
            await updateMenuItem(item.id, { is_available: newStatus });

            // Optimistic update
            setCategoryItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: newStatus } : i));
            toast.success(`Item marked as ${newStatus ? 'In Stock' : 'Out of Stock'}`);
        } catch (e) {
            console.error(e);
            toast.error("Failed to update stock status");
        }
    };

    const handleUpdateCategory = async () => {
        if (!category) return;

        // Validation: Check if new dietary type conflicts with existing items
        if (category.dietary_type !== 'all') {
            const invalidItems = categoryItems.filter(item => {
                if (category.dietary_type === 'veg' && item.dietary_type !== 'veg' && item.dietary_type !== 'vegan') return true;
                if (category.dietary_type === 'non_veg' && item.dietary_type !== 'non_veg') return true;
                if (category.dietary_type === 'vegan' && item.dietary_type !== 'vegan') return true;
                return false;
            });

            if (invalidItems.length > 0) {
                toast.error(`Cannot set category to ${category.dietary_type} because it contains incompatible items: ${invalidItems.map(i => i.name).join(', ')}`);
                return;
            }
        }

        const { error } = await supabase.from('categories').update({
            name: category.name,
            image: category.image,
            tags: category.tags,
            dietary_type: category.dietary_type
        }).eq('id', category.id);

        if (error) {
            console.error("Error updating category:", error);
            toast.error("Failed to update category");
        } else {
            setIsEditDetailsOpen(false);
            toast.success("Category updated");
        }
    };

    if (!category) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-6 space-y-6 pb-24">
            <div className="flex items-center gap-4">
                <Link href="/admin/categories">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold">{category.name}</h1>
                        <Button variant="ghost" size="icon" onClick={() => setIsEditDetailsOpen(true)}>
                            <Edit2 className="h-4 w-4" />
                        </Button>
                    </div>
                    <p className="text-muted-foreground">Category Builder</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {category.tags?.map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                        {category.dietary_type && category.dietary_type !== 'all' && (
                            <Badge variant="outline" className="text-xs border-primary text-primary">
                                {category.dietary_type === 'veg' ? 'VEG ONLY' : category.dietary_type === 'non_veg' ? 'NON-VEG ONLY' : 'VEGAN ONLY'}
                            </Badge>
                        )}
                    </div>
                </div>
                <Button className="ml-auto gap-2" onClick={() => setIsAddItemOpen(true)}>
                    <Plus className="h-4 w-4" /> Add Item
                </Button>
            </div>

            <Card className="p-4">
                {categoryItems.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                        No items in this category yet. Click "Add Item" to get started.
                    </div>
                ) : (
                    <div className="grid gap-2">
                        {categoryItems.map((item) => (
                            <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 group transition-colors">
                                <div className="h-12 w-12 rounded-md bg-muted overflow-hidden">
                                    {item.images?.[0] && <img src={item.images[0]} className="h-full w-full object-cover" />}
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium">{item.name}</div>
                                    <div className="text-sm text-muted-foreground line-clamp-1">{item.description}</div>
                                </div>
                                <div className="font-bold">{currency}{item.price}</div>
                                <div className="flex items-center gap-2 mr-2">
                                    <Label htmlFor={`stock-${item.id}`} className="text-xs text-muted-foreground">
                                        {item.is_available ? 'In Stock' : 'Out of Stock'}
                                    </Label>
                                    <Switch
                                        id={`stock-${item.id}`}
                                        checked={item.is_available}
                                        onCheckedChange={() => handleToggleStock(item)}
                                    />
                                </div>
                                <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10" onClick={() => handleRemoveItem(item.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add Item to {category.name}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-2 py-4">
                        {allItems.map(item => {
                            const isAdded = categoryItems.find(i => i.id === item.id);
                            if (isAdded) return null;

                            // Filter based on dietary type
                            if (category.dietary_type === 'veg' && item.dietary_type !== 'veg' && item.dietary_type !== 'vegan') return null;
                            if (category.dietary_type === 'non_veg' && item.dietary_type !== 'non_veg') return null;
                            if (category.dietary_type === 'vegan' && item.dietary_type !== 'vegan') return null;

                            return (
                                <div key={item.id} className="flex items-center gap-4 p-2 border rounded-lg hover:bg-muted cursor-pointer transition-colors" onClick={() => handleAddItem(item.id)}>
                                    <div className="h-10 w-10 rounded bg-muted overflow-hidden">
                                        {item.images?.[0] && <img src={item.images[0]} className="h-full w-full object-cover" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium">{item.name}</div>
                                        <div className="text-xs text-muted-foreground">{item.description}</div>
                                    </div>
                                    <div className="font-bold">{currency}{item.price}</div>
                                    <Plus className="h-4 w-4" />
                                </div>
                            );
                        })}
                        {allItems.length === 0 && <div className="text-center text-muted-foreground">No items found in the system.</div>}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Category Details Dialog */}
            <Dialog open={isEditDetailsOpen} onOpenChange={setIsEditDetailsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Category Details</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input id="name" value={category.name} onChange={e => setCategory({ ...category, name: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="image" className="text-right">Image URL</Label>
                            <Input id="image" value={category.image || ''} onChange={e => setCategory({ ...category, image: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="tags" className="text-right">Tags</Label>
                            <Input
                                id="tags"
                                placeholder="Comma separated"
                                value={category.tags?.join(', ') || ''}
                                onChange={e => setCategory({ ...category, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="dietary" className="text-right">Dietary Type</Label>
                            <div className="col-span-3">
                                <Select
                                    value={category.dietary_type || 'all'}
                                    onValueChange={(val: 'all' | DietaryType) => setCategory({ ...category, dietary_type: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Items Allowed</SelectItem>
                                        <SelectItem value="veg">Vegetarian Only</SelectItem>
                                        <SelectItem value="non_veg">Non-Veg Only</SelectItem>
                                        <SelectItem value="vegan">Vegan Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleUpdateCategory}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
