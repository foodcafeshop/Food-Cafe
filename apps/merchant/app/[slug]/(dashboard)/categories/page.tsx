"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Category, DietaryType } from "@/lib/types";
import { Edit2, Plus, Search, Trash2, FileUp, FileDown } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { exportToCSV, parseCSV } from "@/lib/csv-utils";
import { useParams, useRouter } from "next/navigation";

import { useShopId } from "@/lib/hooks/use-shop-id";

// Generate image URL from category name (same as AI menu digitization)
const generateImageUrl = (term: string): string => {
    if (!term) return '';
    const keyword = encodeURIComponent(term.trim());
    return `https://tse2.mm.bing.net/th?q=${keyword}&w=300&h=300&c=7&rs=1&p=0&dpr=3&pid=1.7&mkt=en-IN&adlt=moderate`;
};

export default function CategoryManagementPage() {
    const { shopId } = useShopId();
    const router = useRouter();
    const params = useParams();
    const slug = params?.slug as string;

    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentCategory, setCurrentCategory] = useState<Partial<Category>>({});
    const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

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

        // Auto-generate image if not provided
        currentCategory.image = currentCategory.image || generateImageUrl(currentCategory.name);

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

    const initiateDelete = (id: string) => {
        setCategoryToDelete(id);
    };

    const confirmDelete = async () => {
        if (!categoryToDelete) return;
        const { error } = await supabase.from('categories').delete().eq('id', categoryToDelete);
        if (error) {
            toast.error('Failed to delete category');
        } else {
            setCategories(categories.filter(c => c.id !== categoryToDelete));
            toast.success('Category deleted');
        }
        setCategoryToDelete(null);
    };

    const handleExport = () => {
        const exportData = categories.map(({ name, image, tags, dietary_type }) => ({
            name,
            image,
            tags: tags?.join(', '), // Flatten tags for CSV
            dietary_type
        }));
        exportToCSV(exportData, `categories_${new Date().toISOString().split('T')[0]}`, ['name', 'dietary_type', 'image', 'tags']);
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

            // Check if this is a "Links" file (Category -> Item)
            const firstRow = data[0];
            if ('category_name' in firstRow && 'item_name' in firstRow) {
                // Handle Link Import
                toast.loading("Importing Category links...");

                // Fetch existing categories and menu items to map names to IDs
                const [{ data: dbCategories }, { data: dbItems }] = await Promise.all([
                    supabase.from('categories').select('id, name').eq('shop_id', shopId),
                    supabase.from('menu_items').select('id, name').eq('shop_id', shopId)
                ]);

                if (!dbCategories || !dbItems) {
                    toast.error("Failed to fetch existing data for linking");
                    return;
                }

                let linksCreated = 0;
                let linksFailed = 0;

                for (const row of data) {
                    const catId = dbCategories.find(c => c.name === row.category_name)?.id;
                    const itemId = dbItems.find(i => i.name === row.item_name)?.id;

                    if (catId && itemId) {
                        const { error } = await supabase.from('category_items').upsert({
                            category_id: catId,
                            menu_item_id: itemId,
                            sort_order: row.sort_order || 0
                        });
                        if (error) linksFailed++;
                        else linksCreated++;
                    } else {
                        linksFailed++; // Could not resolve
                    }
                }
                toast.dismiss();
                toast.success(`Links created: ${linksCreated}. Failed: ${linksFailed}`);
            } else {
                // Handle Regular Category Import
                toast.loading("Importing categories...");
                let successCount = 0;
                let failCount = 0;

                for (const row of data) {
                    if (!row.name) {
                        failCount++;
                        continue;
                    }

                    // Handle tags
                    let tags: string[] = [];
                    if (Array.isArray(row.tags)) {
                        tags = row.tags;
                    } else if (typeof row.tags === 'string') {
                        tags = row.tags.split(',').map((t: string) => t.trim());
                    }

                    const categoryData = {
                        shop_id: shopId,
                        name: row.name,
                        image: row.image,
                        dietary_type: row.dietary_type || 'all',
                        tags: tags
                    };

                    const { error } = await supabase
                        .from('categories')
                        .insert(categoryData);

                    if (error) failCount++;
                    else successCount++;
                }

                toast.dismiss();
                toast.success(`Imported ${successCount} categories. Failed: ${failCount}`);
                fetchCategories();
            }
            e.target.value = '';
        } catch (error) {
            console.error(error);
            toast.dismiss();
            toast.error("Failed to process CSV file");
        }
    };

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold">Category Management</h1>
                <div className="grid grid-cols-2 sm:flex gap-2 w-full md:w-auto">
                    <div className="relative col-span-1">
                        <input
                            type="file"
                            accept=".csv"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleImport}
                            title="Import Categories CSV"
                        />
                        <Button variant="outline" className="gap-2 w-full">
                            <FileUp className="h-4 w-4" /> Import
                        </Button>
                    </div>
                    <Button variant="outline" className="gap-2 col-span-1" onClick={handleExport}>
                        <FileDown className="h-4 w-4" /> Export
                    </Button>
                    <Button className="gap-2 col-span-2 sm:col-span-1" onClick={() => { setCurrentCategory({}); setIsDialogOpen(true); }}>
                        <Plus className="h-4 w-4" /> Add New
                    </Button>
                </div>
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
                        onClick={() => router.push(`/${slug}/categories/${category.id}`)}
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
                                        {category.dietary_type === 'veg' ? 'VEG ONLY' :
                                            category.dietary_type === 'non_veg' ? 'NON-VEG ONLY' :
                                                category.dietary_type === 'vegan' ? 'VEGAN ONLY' :
                                                    category.dietary_type === 'jain_veg' ? 'JAIN ONLY' : 'EGG + VEG'}
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setCurrentCategory(category); setIsDialogOpen(true); }}>
                                <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); initiateDelete(category.id); }}>
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
                                        <SelectItem value="contains_egg">Egg + Veg</SelectItem>
                                        <SelectItem value="non_veg">Non-Veg Only</SelectItem>
                                        <SelectItem value="vegan">Vegan Only</SelectItem>
                                        <SelectItem value="jain_veg">Jain Only</SelectItem>
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

            <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Category?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this category? Items in this category will not be deleted but will be unlinked.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>

    );
}
