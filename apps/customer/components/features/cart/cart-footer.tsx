"use client";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store";
import { useCartAvailability } from "@/lib/hooks/use-cart-availability";
import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

import Link from "next/link";

interface CartFooterProps {
    currencySymbol?: string;
    slug: string;
}

export function CartFooter({ currencySymbol = "$", slug }: CartFooterProps) {
    const { items, totalItems } = useCartStore(); // Use items instead of totalPrice directly to re-calc
    const [mounted, setMounted] = useState(false);

    // We need shopId for the hook, but we only have slug. 
    // BUT CartContent gets shopId. CartFooter might not have it.
    // However, the items in store act as source of truth.
    // Ideally we pass shopId or fetch it? 
    // Wait, the hook needs shopId to subscribe. 
    // For now, let's assume all items in cart are from same shop (enforced elsewhere).
    // The items likely don't store shop_id? Let's check store logic. 
    // Items are MenuItems. MenuItems have shop_id.
    const shopId = items.length > 0 ? items[0].shop_id : "";

    const { unavailableItemIds } = useCartAvailability(items, shopId);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    // Filter available items
    const availableItems = items.filter(i => !unavailableItemIds.has(i.id));
    const unavailableItems = items.filter(i => unavailableItemIds.has(i.id));

    // Calculate counts based on QUANTITY
    const unavailableCount = unavailableItems.reduce((acc, item) => acc + item.quantity, 0);

    const validCount = availableItems.reduce((acc, item) => acc + item.quantity, 0);
    const validPrice = availableItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    const count = totalItems(); // Total count including invalid (for check) used below? No we use validCount.

    if (count === 0) return null;

    return (
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent z-40 pb-4 md:pb-8">
            <div className="container max-w-md mx-auto">
                <Link href={`/${slug}/cart`}>
                    <Button
                        size="lg"
                        className="w-full flex items-center justify-between shadow-xl animate-in slide-in-from-bottom-10 bg-orange-500 hover:bg-orange-600 text-white h-14 rounded-2xl"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col items-start leading-tight">
                                <span className="text-xs font-bold opacity-90">
                                    {validCount} ITEMS {unavailableCount > 0 && <span className="text-orange-100 opacity-80 font-normal">({unavailableCount} unavailable)</span>}
                                </span>
                                <span className="font-extrabold text-lg">{currencySymbol}{validPrice.toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 font-bold">
                            <span>View Cart</span>
                            <ShoppingBag className="h-5 w-5" />
                        </div>
                    </Button>
                </Link>
            </div>
        </div>
    );
}
