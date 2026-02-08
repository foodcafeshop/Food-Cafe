"use client";

import { ShoppingBag, ChefHat, ChevronDown, Star, Home, Utensils, LogOut, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { HeaderSearch } from "@/components/features/menu/header-search";
import { CartBadge } from "@/components/features/cart/cart-badge";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store";

interface ShopHeaderProps {
    shop: any;
    slug: string;
    showHomeLink?: boolean;
    showMenuLink?: boolean;
    showCartLink?: boolean;
    showSearch?: boolean;
}

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function ShopHeader({ shop, slug, showHomeLink = false, showMenuLink = false, showCartLink = true, showSearch = true }: ShopHeaderProps) {
    const { shopId, setShopId, clearCart, logout } = useCartStore();
    const pathname = usePathname();
    const isMenuPage = pathname?.endsWith('/menu');

    // Check for Shop Mismatch
    useEffect(() => {
        if (shop?.id) {
            // If stored shop exists AND is different from current -> Reset Everything
            if (shopId && shopId !== shop.id) {
                console.log("Shop switched! Clearing session.");
                logout();
                setShopId(shop.id);
            }
            // If no shop stored, set it
            else if (!shopId) {
                setShopId(shop.id);
            }
        }
    }, [shop?.id, shopId, logout, setShopId]);

    return (
        <header className="sticky top-0 z-50 bg-white shadow-sm">
            <div className="container max-w-7xl mx-auto flex h-20 items-center justify-between px-4">
                <div className="flex items-center gap-4">
                    <Link href={`/${slug}`} className="flex items-center gap-2 font-bold text-2xl text-orange-500 hover:opacity-90 transition-opacity">
                        {/* ... (Logo image logic) ... */}
                        {shop?.logo_url ? (
                            <img src={shop.logo_url} alt="Logo" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                            <div className="relative h-8 w-8">
                                <Image
                                    src="/fc_logo_orange.webp"
                                    alt="Logo"
                                    fill
                                    className="object-contain rounded-full"
                                />
                            </div>
                        )}
                        <span className="tracking-tight">{shop?.name || 'Food Cafe'}</span>
                    </Link>
                    {/* Show rating if enabled */}
                    {shop?.average_rating > 0 && shop?.display_ratings !== false && (
                        <div className={cn(
                            "flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-full border border-orange-100 ml-2",
                            isMenuPage ? "hidden md:flex" : "flex"
                        )}>
                            <Star className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
                            <span className="text-xs font-bold text-orange-700">{shop.average_rating}</span>
                            <span className="text-[10px] text-orange-400">({shop.rating_count})</span>
                        </div>
                    )}

                </div>

                <div className="flex items-center gap-6">
                    {showSearch && <HeaderSearch slug={slug} />}

                    {showHomeLink && (
                        <Link href={`/${slug}`} className="hidden md:flex items-center gap-2 text-gray-700 hover:text-orange-500 cursor-pointer font-medium border-b-2 border-transparent hover:border-orange-500 transition-all py-1">
                            <Home className="h-5 w-5" />
                            <span>Home</span>
                        </Link>
                    )}

                    {showMenuLink && (
                        <Link href={`/${slug}/menu`} className="hidden md:flex items-center gap-2 text-gray-700 hover:text-orange-500 cursor-pointer font-medium border-b-2 border-transparent hover:border-orange-500 transition-all py-1">
                            <Utensils className="h-5 w-5" />
                            <span>Menu</span>
                        </Link>
                    )}

                    {showCartLink && (
                        <Link href={`/${slug}/cart`} className="hidden md:flex items-center gap-2 text-gray-700 hover:text-orange-500 cursor-pointer font-medium relative border-b-2 border-transparent hover:border-orange-500 transition-all py-1">
                            <ShoppingBag className="h-5 w-5" />
                            <span>Cart</span>
                            <CartBadge />
                        </Link>
                    )}

                    <UserMenu />
                </div>
            </div>
        </header>
    );
}

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function UserMenu() {
    const { customerName, logout, setWelcomeOpen, tableLabel, serviceType } = useCartStore();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    };

    const LabelBadge = () => {
        if (tableLabel) {
            return (
                <div className="flex items-center gap-1.5 bg-orange-50 text-orange-700 px-2 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold border border-orange-100 whitespace-nowrap">
                    <Utensils className="h-3 w-3" />
                    <span>{tableLabel}</span>
                </div>
            );
        }
        if (serviceType === 'takeaway') {
            return (
                <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold border border-blue-100 whitespace-nowrap">
                    <ShoppingBag className="h-3 w-3" />
                    <span>Takeaway</span>
                </div>
            );
        }
        return null;
    };

    if (customerName) {
        return (
            <div className="flex items-center gap-3 pl-2 md:border-l md:border-gray-200">
                {/* Status Badge - Visible on all screens */}
                <LabelBadge />

                {/* Desktop User Dropdown */}
                <div className="hidden md:block">
                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="flex items-center gap-2 pl-2 pr-1 py-1 hover:bg-gray-50 rounded-full transition-colors outline-none group">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-sm font-bold shadow-sm group-hover:shadow-md transition-all">
                                    {customerName.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex items-center gap-1 text-sm font-medium text-gray-700 group-hover:text-orange-600 transition-colors">
                                    <span className="max-w-[100px] truncate">{customerName}</span>
                                    <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-orange-500 transition-colors" />
                                </div>
                            </button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-60 p-0 rounded-2xl shadow-xl border-orange-100">
                            <div className="p-4 bg-gradient-to-br from-orange-50/80 to-white border-b border-orange-100 rounded-t-2xl">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg">
                                        {customerName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-gray-500 font-medium mb-0.5">{getGreeting()},</div>
                                        <div className="font-bold text-gray-900 truncate text-base leading-tight">{customerName}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-2 space-y-1">
                                {tableLabel ? (
                                    <div className="mb-2 p-2.5 bg-orange-50/50 rounded-xl flex items-center gap-3 border border-orange-100/50">
                                        <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-sm text-orange-600">
                                            <Utensils className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-orange-600/70 uppercase tracking-wider">Current Table</div>
                                            <div className="text-sm font-bold text-gray-900">{tableLabel}</div>
                                        </div>
                                    </div>
                                ) : serviceType === 'takeaway' ? (
                                    <div className="mb-2 p-2.5 bg-blue-50/50 rounded-xl flex items-center gap-3 border border-blue-100/50">
                                        <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-sm text-blue-600">
                                            <ShoppingBag className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-blue-600/70 uppercase tracking-wider">Order Type</div>
                                            <div className="text-sm font-bold text-gray-900">Takeaway</div>
                                        </div>
                                    </div>
                                ) : null}
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl h-10 px-3 font-medium"
                                    onClick={() => logout()}
                                >
                                    <LogOut className="h-4 w-4 mr-3" />
                                    Logout
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <LabelBadge />
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setWelcomeOpen(true, 'welcome')}
                className="hidden md:flex items-center gap-2 text-gray-700 hover:text-orange-500 font-medium"
            >
                <User className="h-5 w-5" />
                <span className="hidden md:inline">Login</span>
            </Button>
        </div>
    );
}
