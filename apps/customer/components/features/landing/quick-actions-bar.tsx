"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Utensils, ShoppingBag, Home, User } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { AccountSheet } from "@/components/features/account/account-sheet";

interface QuickActionsBarProps {
    slug: string;
    activePage?: 'home' | 'menu' | 'cart';
}

export function QuickActionsBar({ slug, activePage }: QuickActionsBarProps) {
    const [mounted, setMounted] = useState(false);
    const [accountSheetOpen, setAccountSheetOpen] = useState(false);
    const { totalItems, customerName, setWelcomeOpen } = useCartStore();

    useEffect(() => {
        setMounted(true);
    }, []);

    const cartCount = mounted ? totalItems() : 0;
    const isLoggedIn = mounted && !!customerName;

    const handleAccountClick = () => {
        if (isLoggedIn) {
            setAccountSheetOpen(true);
        } else {
            setWelcomeOpen(true, 'welcome');
        }
    };

    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t shadow-lg safe-area-pb">
                <div className="flex items-stretch justify-around px-2">
                    <Link
                        href={`/${slug}`}
                        className={`relative flex flex-col items-center gap-1 py-2 px-3 transition-all ${activePage === 'home' ? 'scale-105' : ''}`}
                    >
                        {activePage === 'home' && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-orange-500 rounded-b-full" />
                        )}
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${activePage === 'home' ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-gray-100 text-gray-400'}`}>
                            <Home className="h-5 w-5" />
                        </div>
                        <span className={`text-xs font-bold ${activePage === 'home' ? 'text-orange-600' : 'text-gray-400'}`}>Home</span>
                    </Link>
                    <Link
                        href={`/${slug}/menu`}
                        className={`relative flex flex-col items-center gap-1 py-2 px-3 transition-all ${activePage === 'menu' ? 'scale-105' : ''}`}
                    >
                        {activePage === 'menu' && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-orange-500 rounded-b-full" />
                        )}
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${activePage === 'menu' ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-gray-100 text-gray-400'}`}>
                            <Utensils className="h-5 w-5" />
                        </div>
                        <span className={`text-xs font-bold ${activePage === 'menu' ? 'text-orange-600' : 'text-gray-400'}`}>Menu</span>
                    </Link>
                    <Link
                        href={`/${slug}/cart`}
                        className={`relative flex flex-col items-center gap-1 py-2 px-3 transition-all ${activePage === 'cart' ? 'scale-105' : ''}`}
                    >
                        {activePage === 'cart' && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-purple-500 rounded-b-full" />
                        )}
                        <div className={`relative h-10 w-10 rounded-full flex items-center justify-center transition-all ${activePage === 'cart' ? 'bg-purple-500 text-white shadow-lg shadow-purple-200' : 'bg-gray-100 text-gray-400'}`}>
                            <ShoppingBag className="h-5 w-5" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full">
                                    {cartCount > 9 ? '9+' : cartCount}
                                </span>
                            )}
                        </div>
                        <span className={`text-xs font-bold ${activePage === 'cart' ? 'text-purple-600' : 'text-gray-400'}`}>Cart</span>
                    </Link>
                    {/* Account Button */}
                    <button
                        onClick={handleAccountClick}
                        className="relative flex flex-col items-center gap-1 py-2 px-3 transition-all"
                    >
                        <div className={`relative h-10 w-10 rounded-full flex items-center justify-center transition-all ${isLoggedIn ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-gray-100 text-gray-400'}`}>
                            <User className="h-5 w-5" />
                            {isLoggedIn && (
                                <span className="absolute -top-0.5 -right-0.5 bg-green-400 h-3 w-3 rounded-full border-2 border-white" />
                            )}
                        </div>
                        <span className={`text-xs font-bold ${isLoggedIn ? 'text-green-600' : 'text-gray-400'}`}>
                            {isLoggedIn ? 'Account' : 'Login'}
                        </span>
                    </button>
                </div>
            </div>

            {/* Account Sheet for logged-in users */}
            <AccountSheet open={accountSheetOpen} onOpenChange={setAccountSheetOpen} />
        </>
    );
}

