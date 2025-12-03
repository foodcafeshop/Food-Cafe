"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export function HeaderSearch() {
    const router = useRouter();
    const [query, setQuery] = useState("");

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/menu?search=${encodeURIComponent(query)}`);
        } else {
            router.push('/menu');
        }
    };

    return (
        <form onSubmit={handleSearch} className="hidden md:flex items-center relative group">
            <Search className="h-4 w-4 text-gray-500 absolute left-3 group-hover:text-orange-500 transition-colors" />
            <Input
                type="text"
                placeholder="Search for food..."
                className="pl-9 h-9 w-[200px] bg-gray-50 border-transparent focus:bg-white focus:border-orange-200 focus:ring-2 focus:ring-orange-100 transition-all"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
        </form>
    );
}
