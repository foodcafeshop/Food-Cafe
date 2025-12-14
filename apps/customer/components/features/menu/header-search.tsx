"use client";

import { Search } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface HeaderSearchProps {
    slug: string;
}

export function HeaderSearch({ slug }: HeaderSearchProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [query, setQuery] = useState(searchParams.get('search') || "");

    useEffect(() => {
        setQuery(searchParams.get('search') || "");
    }, [searchParams]);

    const handleSearchChange = (val: string) => {
        setQuery(val);
        const params = new URLSearchParams(searchParams.toString());
        if (val.trim()) {
            params.set("search", val);
        } else {
            params.delete("search");
        }

        const targetPath = `/${slug}/menu`;

        // If we are already on the menu page, replace params without logic reload
        if (pathname === targetPath) {
            router.replace(`${targetPath}?${params.toString()}`, { scroll: false });
        } else {
            // If we are elsewhere, we must navigate
            // For search across site, this is fine.
            // But since we hid search elsewhere, this case effectively only happens on Menu page 
            // OR if we decided to show it elsewhere later.
            router.push(`${targetPath}?${params.toString()}`);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // optionally trigger search if not using live update, but here we do onChange
    };

    return (
        <form onSubmit={handleSubmit} className="hidden md:flex items-center relative group">
            <Search className="h-4 w-4 text-gray-500 absolute left-3 group-hover:text-orange-500 transition-colors" />
            <Input
                type="text"
                placeholder="Search for food..."
                className="pl-9 h-9 w-[200px] bg-gray-50 border-transparent focus:bg-white focus:border-orange-200 focus:ring-2 focus:ring-orange-100 transition-all"
                value={query}
                onChange={(e) => handleSearchChange(e.target.value)}
            />
        </form>
    );
}
