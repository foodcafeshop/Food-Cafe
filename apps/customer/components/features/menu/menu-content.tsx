"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { MenuItemCard } from "@/components/features/menu/menu-item-card";
import { CategoryNav } from "@/components/features/menu/category-nav";
import { CartFooter } from "@/components/features/cart/cart-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Search, Star, Clock, MapPin, X, ShoppingBag, Leaf, Diamond, Egg, Flame } from "lucide-react";
import Link from "next/link";
import { getCurrencySymbol } from "@/lib/utils";
import { useCartStore } from "@/lib/store";
import { getTableById } from "@/lib/api";
import { ShopHeader } from "@/components/features/landing/shop-header";
import { QuickActionsBar } from "@/components/features/landing/quick-actions-bar";

import { supabase } from "@/lib/supabase";

interface MenuContentProps {
    categories: any[];
    settings: any;
    shop?: any;
}

export function MenuContent({ categories: initialCategories, settings, shop }: MenuContentProps) {
    const [categories, setCategories] = useState(initialCategories);
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialQuery = searchParams.get("search") || "";
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [isSearchOpen, setIsSearchOpen] = useState(!!initialQuery);
    const currencySymbol = getCurrencySymbol(settings?.currency);
    const { setTableId, tableId } = useCartStore();
    const [tableLabel, setTableLabel] = useState<string>("");

    useEffect(() => {
        const tableIdParam = searchParams.get("tableId");
        if (tableIdParam) {
            setTableId(tableIdParam);
        }
    }, [searchParams, setTableId]);

    // Sync search query from URL
    useEffect(() => {
        const query = searchParams.get("search") || "";
        setSearchQuery(query);
        setIsSearchOpen(!!query);
    }, [searchParams]);

    useEffect(() => {
        const fetchTableLabel = async () => {
            if (tableId) {
                const table = await getTableById(tableId);
                if (table) {
                    setTableLabel(table.label);
                }
            }
        };
        fetchTableLabel();
    }, [tableId]);

    // Real-time Menu Text Updates
    useEffect(() => {
        if (!shop?.id) return;

        console.log("Subscribing to menu updates for shop:", shop.id);
        const channel = supabase
            .channel(`menu-updates-${shop.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'menu_items',
                    filter: `shop_id=eq.${shop.id}`
                },
                (payload) => {
                    console.log("Menu Item Updated:", payload.new);
                    const updatedItem = payload.new;

                    setCategories(prevCategories => {
                        return prevCategories.map(cat => ({
                            ...cat,
                            items: cat.items.map((item: any) =>
                                item.id === updatedItem.id ? { ...item, ...updatedItem } : item
                            )
                        }));
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [shop?.id]);

    const [dietaryFilter, setDietaryFilter] = useState<string>("all");
    const [sortBy, setSortBy] = useState<string>("recommended");

    // Calculate available dietary types
    const availableDietaryTypes = new Set<string>();
    categories.forEach(cat => {
        cat.items.forEach((item: any) => {
            if (item.dietary_type) availableDietaryTypes.add(item.dietary_type);
        });
    });

    // Veg filter should be available if there are any veg, vegan, or jain items
    const hasVegOptions = availableDietaryTypes.has('veg') || availableDietaryTypes.has('vegan') || availableDietaryTypes.has('jain_veg');

    // Filter categories based on search query and filters
    const filteredCategories = categories.map(cat => ({
        ...cat,
        items: cat.items.filter((item: any) => {
            // Search Filter
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = item.name.toLowerCase().includes(searchLower) ||
                item.description?.toLowerCase().includes(searchLower) ||
                item.tags?.some((tag: string) => tag.toLowerCase().includes(searchLower));

            // Dietary Filter
            const matchesDietary = dietaryFilter === "all" ||
                item.dietary_type === dietaryFilter ||
                (dietaryFilter === 'veg' && ['vegan', 'jain_veg'].includes(item.dietary_type));

            return matchesSearch && matchesDietary;
        }).sort((a: any, b: any) => {
            // Sorting
            if (sortBy === "price_asc") return a.price - b.price;
            if (sortBy === "price_desc") return b.price - a.price;
            if (sortBy === "rating") return (b.average_rating || 0) - (a.average_rating || 0);
            if (sortBy === "popular") return (b.is_popular === a.is_popular) ? 0 : b.is_popular ? 1 : -1;
            return 0; // recommended (default order)
        })
    })).filter(cat => cat.items.length > 0);

    const pathname = usePathname();

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);

        // Update URL without reloading
        const params = new URLSearchParams(searchParams.toString());
        if (query) {
            params.set("search", query);
        } else {
            params.delete("search");
        }
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const clearSearch = () => {
        setSearchQuery("");
        setIsSearchOpen(false);
        router.replace(pathname, { scroll: false });
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <ShopHeader shop={shop} slug={shop.slug} showHomeLink={true} />

            {/* Unified Sticky Header: Category Nav (Mobile) + Filters + Closed Banner */}
            {(!isSearchOpen || !shop?.is_open) && (
                <div className="bg-white sticky top-20 z-40 shadow-sm border-b border-gray-100 transition-all duration-200">
                    {!isSearchOpen && (
                        <>
                            <div className="md:hidden border-t border-gray-100">
                                <CategoryNav categories={categories} />
                            </div>

                            {/* Filters Bar */}
                            <div className="container max-w-7xl mx-auto px-4 py-3 flex gap-3 overflow-x-auto no-scrollbar items-center">
                                {/* Dietary Filters */}
                                <div className="flex gap-2 shrink-0">
                                    <button
                                        onClick={() => setDietaryFilter("all")}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${dietaryFilter === "all" ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}
                                    >
                                        All
                                    </button>

                                    {hasVegOptions && (
                                        <button
                                            onClick={() => setDietaryFilter("veg")}
                                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors flex items-center gap-1.5 ${dietaryFilter === "veg" ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-600 border-gray-200 hover:border-green-400"}`}
                                        >
                                            <div className="w-2 h-2 rounded-full bg-green-500 border border-white"></div> Veg
                                        </button>
                                    )}

                                    {availableDietaryTypes.has('contains_egg') && (
                                        <button
                                            onClick={() => setDietaryFilter("contains_egg")}
                                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors flex items-center gap-1.5 ${dietaryFilter === "contains_egg" ? "bg-amber-500 text-white border-amber-500" : "bg-white text-gray-600 border-gray-200 hover:border-amber-400"}`}
                                        >
                                            <Egg className="w-3 h-3" /> Egg
                                        </button>
                                    )}

                                    {availableDietaryTypes.has('non_veg') && (
                                        <button
                                            onClick={() => setDietaryFilter("non_veg")}
                                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors flex items-center gap-1.5 ${dietaryFilter === "non_veg" ? "bg-red-600 text-white border-red-600" : "bg-white text-gray-600 border-gray-200 hover:border-red-400"}`}
                                        >
                                            <div className="w-2 h-2 rounded-full bg-red-500 border border-white"></div> Non-Veg
                                        </button>
                                    )}

                                    {availableDietaryTypes.has('vegan') && (
                                        <button
                                            onClick={() => setDietaryFilter("vegan")}
                                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors flex items-center gap-1.5 ${dietaryFilter === "vegan" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-600 border-gray-200 hover:border-emerald-400"}`}
                                        >
                                            <Leaf className="w-3 h-3" /> Vegan
                                        </button>
                                    )}

                                    {availableDietaryTypes.has('jain_veg') && (
                                        <button
                                            onClick={() => setDietaryFilter("jain_veg")}
                                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors flex items-center gap-1.5 ${dietaryFilter === "jain_veg" ? "bg-teal-600 text-white border-teal-600" : "bg-white text-gray-600 border-gray-200 hover:border-teal-400"}`}
                                        >
                                            <Diamond className="w-3 h-3" /> Jain
                                        </button>
                                    )}
                                </div>

                                <div className="w-[1px] h-6 bg-gray-200 shrink-0"></div>

                                {/* Sort Options */}
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="bg-transparent text-xs font-bold text-gray-600 focus:outline-none cursor-pointer"
                                >
                                    <option value="recommended">Sort: Recommended</option>
                                    <option value="price_asc">Price: Low to High</option>
                                    <option value="price_desc">Price: High to Low</option>
                                    <option value="rating">Top Rated</option>
                                    <option value="popular">Bestsellers</option>
                                </select>
                            </div>
                        </>
                    )}

                    {/* Shop Closed Banner */}
                    {!shop?.is_open && (
                        <div className="bg-red-600 text-white px-4 py-3 text-center font-bold">
                            <div className="flex items-center justify-center gap-2">
                                <Clock className="h-5 w-5" />
                                <span>This shop is currently not accepting orders. You can still browse the menu.</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <main className="container max-w-7xl mx-auto px-4 py-6">


                <div className="flex gap-8 items-start">
                    {/* Desktop Sidebar Navigation */}
                    <aside className="w-64 shrink-0 hidden md:block sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="flex flex-col gap-1">
                            {categories.map((category) => (
                                <a
                                    key={category.id}
                                    href={`#category-${category.id}`}
                                    className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors font-medium text-sm group ${filteredCategories.find(c => c.id === category.id)
                                        ? 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                                        : 'text-gray-300 cursor-not-allowed'
                                        }`}
                                    onClick={(e) => {
                                        if (!filteredCategories.find(c => c.id === category.id)) {
                                            e.preventDefault();
                                        }
                                    }}
                                >
                                    <span>{category.name}</span>
                                    <span className={`text-xs ${filteredCategories.find(c => c.id === category.id) ? 'text-gray-400 group-hover:text-orange-400' : 'text-gray-300'}`}>
                                        {category.items.length}
                                    </span>
                                </a>
                            ))}
                        </div>
                    </aside>

                    {/* Menu Items Content */}
                    <div className="flex-1 min-w-0">
                        {filteredCategories.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800">No items found</h3>
                                <p className="text-gray-500">Try searching for something else</p>
                                <Button variant="link" onClick={clearSearch} className="mt-2 text-orange-500">
                                    View Full Menu
                                </Button>
                            </div>
                        ) : (
                            filteredCategories.map((category) => (
                                <section key={category.id} id={`category-${category.id}`} className="scroll-mt-32 mb-8">
                                    {/* Category Header */}
                                    <h2 className="text-xl font-extrabold text-gray-800 mb-6 pb-2 border-b-2 border-gray-100 inline-block pr-8">
                                        {category.name} ({category.items.length})
                                    </h2>

                                    <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 px-4">
                                        {category.items.map((item: any) => (
                                            <MenuItemCard key={item.id} item={item} currencySymbol={currencySymbol} isOpen={shop?.is_open} maxQuantity={settings?.max_item_quantity || 10} />
                                        ))}
                                    </div>
                                </section>
                            ))
                        )}
                    </div>
                </div>
            </main>
            <CartFooter currencySymbol={currencySymbol} slug={shop.slug} isOpen={shop?.is_open} />
            <QuickActionsBar slug={shop.slug} activePage="menu" />
        </div>
    );
}

function CartBadge() {
    const { totalItems } = useCartStore();
    const count = totalItems();

    if (count === 0) return null;

    return (
        <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
            {count}
        </span>
    );
}
