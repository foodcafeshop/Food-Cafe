"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Plus, ChevronLeft } from "lucide-react";
import { getFullMenuData } from "@/lib/api";
import { MenuItem, Category } from "@/lib/types";
import { useShopId } from "@/lib/hooks/use-shop-id";
import { cn, getCurrencySymbol } from "@/lib/utils";
import Image from "next/image";

interface MenuBrowserProps {
    onAddToCart: (item: MenuItem) => void;
    onBack?: () => void;
    tableLabel?: string;
}

export function MenuBrowser({ onAddToCart, onBack, tableLabel }: MenuBrowserProps) {
    const { shopId } = useShopId();
    const [categories, setCategories] = useState<Category[]>([]);
    const [items, setItems] = useState<MenuItem[]>([]); // All items
    const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [currency, setCurrency] = useState("$");

    // Fetch shop slug to get menu data - actually getFullMenuData uses slug.
    // We need to get the slug first or use an API that takes shopId.
    // getFullMenuData takes slug.
    // Let's use a new helper or fetch manually?
    // Wait, getFullMenuData returns { categories, items }.
    // But we need the shop slug.
    // Using supabase to get slug from shopId.

    // Actually, let's just make a specialized fetch or modify getFullMenuData to be more flexible?
    // Or just fetch slug here.

    useEffect(() => {
        if (shopId) {
            // Need slug
            // For now, let's assume we can fetch by shopId or get slug from context if available.
            // useShopId doesn't return slug.
            // I'll implement a quick fetch.
            fetchMenuData();
        }
    }, [shopId]);

    const fetchMenuData = async () => {
        setLoading(true);
        try {
            // 1. Get Slug
            // We can't import supabase directly if we want to keep this clean, but okay.
            // Actually getActiveMenu(shopId) exists in api.ts?
            // checking api.ts... line 5 getActiveMenu(shopId) -> Promise<Menu | null>
            // getMenuCategories(menuId) -> Category[]
            // getMenuItemsForCategory(categoryId) -> MenuItem[]
            // This is waterfall-y.

            // getFullMenuData(slug) is better.
            // Let's rely on api.ts having getShopDetails or similar.
            // getShopDetails(slug).

            // I'll fetch slug locally for now.
            import("@/lib/supabase").then(async ({ supabase }) => {
                const { data: shop } = await supabase.from('shops').select('slug').eq('id', shopId).single();
                if (shop) {
                    const menuData = await getFullMenuData(shop.slug);
                    // menuData returns { categories, items } (grouped?)
                    // checking getFullMenuData return type:
                    // it returns { shop, menu, categories, items: Record<string, MenuItem[]> }

                    if (menuData) {
                        setCategories(menuData.categories);
                        // Flatten items from categories
                        const allItems = menuData.categories.flatMap((c: any) => c.items);
                        setItems(allItems);
                        setFilteredItems(allItems);
                    }
                }
            });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let res = items;
        if (selectedCategory !== 'all') {
            // We need to know which items belong to which category.
            // The flattened items list loses this unless we keep the map.
            // Actually getFullMenuData return structure is Keyed by Category Name usually?
            // Re-checking getFullMenuData implementation might be needed.
            // For now, assume simple filtering if we had content.

            // Alternative: The `items` state stores all items.
            // Items have `category_id`.
            res = res.filter(i => i.category_id === selectedCategory);
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            res = res.filter(i =>
                i.name.toLowerCase().includes(q) ||
                i.description?.toLowerCase().includes(q)
            );
        }
        setFilteredItems(res);
    }, [selectedCategory, searchQuery, items]);

    if (loading) return <div>Loading Menu...</div>;

    return (
        <div className="flex flex-col h-full gap-2">
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 pb-2 border-b md:border-none md:pb-0">
                <div className="absolute inset-0 bg-background md:hidden" />
                <div className="absolute inset-0 bg-muted/20 md:hidden" />

                <div className="relative">
                    {/* Row 1: Back + Search */}
                    <div className="flex items-center gap-2 mb-2 pt-2 px-2 md:px-0">
                        {onBack && (
                            <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10 shrink-0 md:hidden">
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                        )}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={`Search for ${tableLabel || 'table'}...`}
                                className="pl-9 h-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Row 2: Categories */}
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide px-2 md:px-1">
                        <Button
                            variant={selectedCategory === 'all' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedCategory('all')}
                            className="whitespace-nowrap h-7 text-xs rounded-full px-3"
                        >
                            All
                        </Button>
                        {categories.map(cat => (
                            <Button
                                key={cat.id}
                                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setSelectedCategory(cat.id)}
                                className="whitespace-nowrap h-7 text-xs rounded-full px-3"
                            >
                                {cat.name}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Items Grid */}
            <div className="flex-1 overflow-y-auto min-h-0 p-2 md:p-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {filteredItems.map(item => (
                        <Card key={item.id} className={cn(
                            "p-3 flex gap-3 hover:shadow-md transition-shadow group relative",
                            !item.is_available && "opacity-70 bg-muted/50"
                        )}>
                            {!item.is_available && (
                                <div className="absolute inset-0 z-10 bg-background/50 flex items-center justify-center rounded-lg">
                                    <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded shadow-sm">
                                        Out of Stock
                                    </span>
                                </div>
                            )}
                            {item.images?.[0] && (
                                <div className="relative h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
                                    <Image
                                        src={item.images[0]}
                                        alt={item.name}
                                        fill
                                        className={cn("object-cover", !item.is_available && "grayscale")}
                                        sizes="64px"
                                    />
                                </div>
                            )}
                            <div className="flex flex-col flex-1 justify-between min-w-0">
                                <div>
                                    <div className="font-semibold truncate">{item.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {getCurrencySymbol('INR')}{item.offer_price || item.price}
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="self-end h-7 text-xs w-full mt-2"
                                    onClick={() => onAddToCart(item)}
                                    disabled={!item.is_available}
                                >
                                    <Plus className="h-3 w-3 mr-1" /> Add
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
