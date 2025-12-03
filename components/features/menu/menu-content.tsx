"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MenuItemCard } from "@/components/features/menu/menu-item-card";
import { CategoryNav } from "@/components/features/menu/category-nav";
import { CartFooter } from "@/components/features/cart/cart-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Search, Star, Clock, MapPin, X, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { getCurrencySymbol } from "@/lib/utils";
import { useCartStore } from "@/lib/store";
import { getTableById } from "@/lib/api";

interface MenuContentProps {
    categories: any[];
    settings: any;
}

export function MenuContent({ categories: initialCategories, settings }: MenuContentProps) {
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

    // Filter categories based on search query
    const filteredCategories = initialCategories.map(cat => ({
        ...cat,
        items: cat.items.filter((item: any) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(cat => cat.items.length > 0);

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
        router.replace(`/menu?${params.toString()}`, { scroll: false });
    };

    const clearSearch = () => {
        setSearchQuery("");
        setIsSearchOpen(false);
        router.replace("/menu", { scroll: false });
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <header className="sticky top-0 z-50 bg-white shadow-sm transition-all duration-200">
                {/* Restaurant Info Header */}
                <div className="container max-w-7xl mx-auto flex h-20 items-center justify-between px-4">
                    <div className="flex items-center gap-4 flex-1">
                        <Link href="/">
                            <Button variant="ghost" size="icon" className="-ml-2">
                                <ChevronLeft className="h-6 w-6" />
                            </Button>
                        </Link>

                        {isSearchOpen ? (
                            <div className="flex-1 max-w-md relative animate-in fade-in slide-in-from-right-4 duration-200">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    autoFocus
                                    placeholder="Search for dishes..."
                                    className="pl-9 pr-8 h-10 bg-gray-50 border-gray-200 focus-visible:ring-orange-500"
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div>
                                <h1 className="font-bold text-lg text-gray-800">Food Cafe Premium</h1>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span className="flex items-center gap-0.5"><Star className="w-3 h-3 fill-green-600 text-green-600" /> 4.2</span>
                                    <span className="hidden sm:inline">•</span>
                                    <span className="hidden sm:flex items-center gap-0.5"><Clock className="w-3 h-3" /> 35 mins</span>
                                    <span className="hidden sm:inline">•</span>
                                    <span className="hidden sm:inline">{currencySymbol}400 for two</span>
                                </div>
                                {tableId && (
                                    <div className="mt-1">
                                        <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                            Table {tableLabel || tableId}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 ml-2">
                        {!isSearchOpen ? (
                            <>
                                <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)}>
                                    <Search className="h-5 w-5 text-gray-600" />
                                </Button>
                                <Link href="/cart">
                                    <Button variant="ghost" size="icon" className="relative">
                                        <ShoppingBag className="h-5 w-5 text-gray-600" />
                                        <CartBadge />
                                    </Button>
                                </Link>
                            </>
                        ) : (
                            <Button variant="ghost" size="sm" onClick={clearSearch} className="text-gray-500">
                                Cancel
                            </Button>
                        )}
                    </div>
                </div>

                {/* Mobile Category Nav - Hide when searching to give more space */}
                {!isSearchOpen && (
                    <div className="md:hidden border-t border-gray-100">
                        <CategoryNav categories={initialCategories} />
                    </div>
                )}
            </header>

            <main className="container max-w-7xl mx-auto px-4 py-6">
                {/* Restaurant Info Card (Desktop) - Hide when searching */}
                {!isSearchOpen && !searchQuery && (
                    <div className="hidden md:block mb-8">
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Food Cafe Premium</h1>
                                <p className="text-gray-500 mb-4">North Indian, Chinese, Fast Food • Koramangala</p>
                                <div className="flex items-center gap-6 text-gray-700 font-bold">
                                    <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-lg border border-green-100">
                                        <Star className="w-5 h-5 fill-green-700 text-green-700" />
                                        <span className="text-green-700">4.2</span>
                                    </div>
                                    <div className="w-[1px] h-6 bg-gray-300"></div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-5 h-5" />
                                        <span>35 mins</span>
                                    </div>
                                    <div className="w-[1px] h-6 bg-gray-300"></div>
                                    <div>{currencySymbol}400 for two</div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-orange-500 border border-orange-100 bg-orange-50 px-4 py-2 rounded-xl">
                                    <MapPin className="w-4 h-4" />
                                    <span className="text-sm font-bold">Live Tracking</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex gap-8 items-start">
                    {/* Desktop Sidebar Navigation */}
                    <aside className="w-64 shrink-0 hidden md:block sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="flex flex-col gap-1">
                            {initialCategories.map((category) => (
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
                                            <MenuItemCard key={item.id} item={item} currencySymbol={currencySymbol} />
                                        ))}
                                    </div>
                                </section>
                            ))
                        )}
                    </div>
                </div>
            </main>
            <CartFooter currencySymbol={currencySymbol} />
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
