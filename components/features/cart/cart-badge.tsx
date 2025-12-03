"use client";

import { useCartStore } from "@/lib/store";
import { useEffect, useState } from "react";

export function CartBadge() {
    const { totalItems } = useCartStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const count = totalItems();

    if (count === 0) return null;

    return (
        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white animate-in zoom-in duration-200">
            {count}
        </span>
    );
}
