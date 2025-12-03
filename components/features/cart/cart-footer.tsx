"use client";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store";
import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

import Link from "next/link";

interface CartFooterProps {
    currencySymbol?: string;
}

export function CartFooter({ currencySymbol = "$" }: CartFooterProps) {
    const { totalItems, totalPrice } = useCartStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const count = totalItems();
    const price = totalPrice();

    if (count === 0) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent z-50 pb-8">
            <div className="container max-w-md mx-auto">
                <Link href="/cart">
                    <Button
                        size="lg"
                        className="w-full flex items-center justify-between shadow-xl animate-in slide-in-from-bottom-10 bg-orange-500 hover:bg-orange-600 text-white h-14 rounded-2xl"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col items-start leading-tight">
                                <span className="text-xs font-bold opacity-90">{count} ITEMS</span>
                                <span className="font-extrabold text-lg">{currencySymbol}{price.toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 font-bold">
                            <span>View Cart</span>
                            <ShoppingBag className="h-5 w-5 fill-current" />
                        </div>
                    </Button>
                </Link>
            </div>
        </div>
    );
}
