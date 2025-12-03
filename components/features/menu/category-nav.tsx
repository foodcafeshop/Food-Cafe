"use client";

import { Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface CategoryNavProps {
    categories: Category[];
}

export function CategoryNav({ categories }: CategoryNavProps) {
    const [activeCategory, setActiveCategory] = useState(categories[0]?.id);

    const scrollToCategory = (id: string) => {
        setActiveCategory(id);
        const element = document.getElementById(`category-${id}`);
        if (element) {
            const offset = 80; // Height of header + nav
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth",
            });
        }
    };

    return (
        <div className="sticky top-16 z-40 bg-background/95 backdrop-blur border-b overflow-x-auto no-scrollbar py-2">
            <div className="flex px-4 gap-2 min-w-max">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => scrollToCategory(cat.id)}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                            activeCategory === cat.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        )}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>
        </div>
    );
}
