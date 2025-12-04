"use client";

import { ShoppingBag, ChefHat, ChevronDown, Star, Home, Utensils, LogOut, User } from "lucide-react";
import Link from "next/link";
import { HeaderSearch } from "@/components/features/landing/header-search";
import { CartBadge } from "@/components/features/cart/cart-badge";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store";

interface ShopHeaderProps {
    shop: any;
    slug: string;
    showHomeLink?: boolean;
    showMenuLink?: boolean;
    showCartLink?: boolean;
}

export function ShopHeader({ shop, slug, showHomeLink = false, showMenuLink = false, showCartLink = true }: ShopHeaderProps) {
    return (
        <header className="sticky top-0 z-50 bg-white shadow-sm">
            <div className="container max-w-7xl mx-auto flex h-20 items-center justify-between px-4">
                <div className="flex items-center gap-4">
                    <Link href={`/${slug}`} className="flex items-center gap-2 font-bold text-2xl text-orange-500 hover:opacity-90 transition-opacity">
                        {shop?.logo_url ? (
                            <img src={shop.logo_url} alt="Logo" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                            <ChefHat className="h-8 w-8" />
                        )}
                        <span className="tracking-tight">{shop?.name || 'Food Cafe'}</span>
                    </Link>
                    {shop?.average_rating > 0 && (
                        <div className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-full border border-orange-100 ml-2">
                            <Star className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
                            <span className="text-xs font-bold text-orange-700">{shop.average_rating}</span>
                            <span className="text-[10px] text-orange-400">({shop.rating_count})</span>
                        </div>
                    )}
                    <div className="hidden md:flex items-center gap-2 text-sm text-gray-500 ml-8 hover:text-orange-500 cursor-pointer transition-colors">
                        <span className="font-bold text-gray-700 border-b-2 border-gray-700 pb-0.5">Location</span>
                        <span className="truncate max-w-[200px]">{shop?.address || 'Select Location'}</span>
                        <ChevronDown className="h-4 w-4 text-orange-500" />
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <HeaderSearch />

                    {showHomeLink && (
                        <Link href={`/${slug}`} className="flex items-center gap-2 text-gray-700 hover:text-orange-500 cursor-pointer font-medium">
                            <Home className="h-5 w-5" />
                            <span className="hidden md:inline">Home</span>
                        </Link>
                    )}

                    {showMenuLink && (
                        <Link href={`/${slug}/menu`} className="flex items-center gap-2 text-gray-700 hover:text-orange-500 cursor-pointer font-medium">
                            <Utensils className="h-5 w-5" />
                            <span className="hidden md:inline">Menu</span>
                        </Link>
                    )}

                    {showCartLink && (
                        <Link href={`/${slug}/cart`} className="flex items-center gap-2 text-gray-700 hover:text-orange-500 cursor-pointer font-medium relative">
                            <ShoppingBag className="h-5 w-5" />
                            <span className="hidden md:inline">Cart</span>
                            <CartBadge />
                        </Link>
                    )}

                    <UserMenu />
                </div>
            </div>
        </header>
    );
}

function UserMenu() {
    const { customerName, logout, setWelcomeOpen } = useCartStore();

    if (customerName) {
        return (
            <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
                <div className="hidden md:flex flex-col items-end leading-none">
                    <span className="text-[10px] text-gray-400 font-medium uppercase">Welcome</span>
                    <span className="text-sm font-bold text-gray-700 max-w-[100px] truncate">{customerName}</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => logout()}
                    className="h-9 w-9 text-gray-500 hover:text-red-500 hover:bg-red-50"
                    title="Logout"
                >
                    <LogOut className="h-5 w-5" />
                </Button>
            </div>
        );
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={() => setWelcomeOpen(true, 'welcome')}
            className="flex items-center gap-2 text-gray-700 hover:text-orange-500 font-medium"
        >
            <User className="h-5 w-5" />
            <span className="hidden md:inline">Login</span>
        </Button>
    );
}
