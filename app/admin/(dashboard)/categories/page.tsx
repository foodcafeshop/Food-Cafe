"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Category, DietaryType } from "@/lib/types";
import { Edit2, Plus, Search, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

import { useShopId } from "@/lib/hooks/use-shop-id";

export default function CategoryManagementPage() {
    const { shopId } = useShopId();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentCategory, setCurrentCategory] = useState<Partial<Category>>({});

    useEffect(() => {
        if (shopId) {
            fetchCategories();
        }
    }, [shopId]);

    const fetchCategories = async () => {
        if (!shopId) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('shop_id', shopId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to fetch categories');
        } else {
            setCategories(data || []);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!currentCategory.name || !shopId) return;

        const { data, error } = await supabase
            .from('categories')
            .upsert({ ...currentCategory, shop_id: shopId })
            .select()
            .single();

        if (error) {
            console.error('Error saving category:', error);
            toast.error('Failed to save category');
        } else {
            setCategories(prev => {
                const exists = prev.find(c => c.id === data.id);
                if (exists) {
                    return prev.map(c => c.id === data.id ? data : c);
                }
                return [data, ...prev];
            });
            setIsDialogOpen(false);
            toast.success('Category saved successfully');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this category?")) {
            const { error } = await supabase.from('categories').delete().eq('id', id);
            if (error) {
                toast.error('Failed to delete category');
            } else {
                setCategories(categories.filter(c => c.id !== id));
                toast.success('Category deleted');
            }
        }
    };

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Category Management</h1>
                <Button className="gap-2" onClick={() => { setCurrentCategory({}); setIsDialogOpen(true); }}>
                    <Plus className="h-4 w-4" /> Add New Category
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search categories..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredCategories.map((category) => (
                    <Card
                        key={category.id}
                        className="flex items-center p-4 gap-4 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => window.location.href = `/admin/categories/${category.id}`}
                    >
                        <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                            {category.image ? (
                                <img src={category.image} alt={category.name} className="h-full w-full object-cover" />
                            ) : (
                                <span className="text-xs text-muted-foreground">No Img</span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-medium">{category.name}</div>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {category.tags?.map((tag, i) => (
                                    <Badge key={i} variant="secondary" className="text-[10px] px-1 py-0 h-5">{tag}</Badge>
                                ))}
                                {category.dietary_type && category.dietary_type !== 'all' && (
                                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-5 border-primary text-primary">
                                        {category.dietary_type === 'veg' ? 'VEG ONLY' : category.dietary_type === 'non_veg' ? 'NON-VEG ONLY' : 'VEGAN ONLY'}
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setCurrentCategory(category); setIsDialogOpen(true); }}>
                                <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(category.id); }}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{currentCategory.id ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input id="name" value={currentCategory.name || ''} onChange={e => setCurrentCategory({ ...currentCategory, name: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="image" className="text-right">Image URL</Label>
                            <Input id="image" value={currentCategory.image || ''} onChange={e => setCurrentCategory({ ...currentCategory, image: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="tags" className="text-right">Tags</Label>
                            <Input
                                id="tags"
                                placeholder="Comma separated (e.g. breakfast, drinks)"
                                value={currentCategory.tags?.join(', ') || ''}
                                onChange={e => setCurrentCategory({ ...currentCategory, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="dietary" className="text-right">Dietary Type</Label>
                            <div className="col-span-3">
                                <Select
                                    value={currentCategory.dietary_type || 'all'}
                                    onValueChange={(val: 'all' | DietaryType) => setCurrentCategory({ ...currentCategory, dietary_type: val })}
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
                        <Button onClick={handleSave}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
