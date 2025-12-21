"use client";

import { Search, X } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";

interface HeaderSearchProps {
    slug: string;
}

export function HeaderSearch({ slug }: HeaderSearchProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [query, setQuery] = useState(searchParams.get('search') || "");
    const [isExpanded, setIsExpanded] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setQuery(searchParams.get('search') || "");
    }, [searchParams]);

    // Focus input when expanded
    useEffect(() => {
        if (isExpanded && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isExpanded]);

    const handleSearchChange = (val: string) => {
        setQuery(val);
        const params = new URLSearchParams(searchParams.toString());
        if (val.trim()) {
            params.set("search", val);
        } else {
            params.delete("search");
        }

        const targetPath = `/${slug}/menu`;

        if (pathname === targetPath) {
            router.replace(`${targetPath}?${params.toString()}`, { scroll: false });
        } else {
            router.push(`${targetPath}?${params.toString()}`);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
    };

    const handleClose = () => {
        setIsExpanded(false);
    };

    return (
        <>
            {/* Mobile Search Button */}
            <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="md:hidden flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 hover:bg-orange-100 text-gray-600 hover:text-orange-600 transition-colors"
                aria-label="Open search"
            >
                <Search className="h-5 w-5" />
            </button>

            {/* Mobile Expanded Search - Overlays entire header */}
            {isExpanded && (
                <div className="md:hidden fixed top-0 left-0 right-0 h-20 bg-white z-[60] flex items-center gap-3 px-4 shadow-sm animate-in fade-in duration-150">
                    <form onSubmit={handleSubmit} className="flex-1 relative">
                        <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                            ref={inputRef}
                            type="text"
                            placeholder="Search for food..."
                            className="pl-10 pr-10 h-12 w-full bg-gray-50 border-gray-200 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-100 text-base rounded-xl"
                            value={query}
                            onChange={(e) => handleSearchChange(e.target.value)}
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => handleSearchChange("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        )}
                    </form>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="text-orange-600 hover:text-orange-700 text-sm font-semibold shrink-0"
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* Desktop Search */}
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
        </>
    );
}

