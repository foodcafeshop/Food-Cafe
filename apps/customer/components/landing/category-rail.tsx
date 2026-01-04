"use client";

import { motion } from 'framer-motion';

const CATEGORIES = [
    { label: "Pizza", icon: "🍕", value: "pizza" },
    { label: "Burger", icon: "🍔", value: "burger" },
    { label: "Coffee", icon: "☕", value: "coffee" },
    { label: "Healthy", icon: "🥗", value: "healthy" },
    { label: "Asian", icon: "🍜", value: "asian" },
    { label: "Dessert", icon: "🍰", value: "dessert" },
    { label: "Indian", icon: "🥘", value: "indian" },
    { label: "Drinks", icon: "🥤", value: "drinks" },
];

export default function CategoryRail({ onSelect, selected }: { onSelect: (val: string) => void, selected?: string }) {
    return (
        <div className="w-full overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
            <div className="flex gap-3 w-max">
                {CATEGORIES.map((cat) => (
                    <motion.button
                        key={cat.value}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onSelect(selected === cat.value ? '' : cat.value)}
                        className={`
                            flex items-center gap-2.5 px-5 py-3 rounded-full border-2 transition-all duration-200
                            ${selected === cat.value
                                ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-200'
                                : 'bg-white border-zinc-200 text-zinc-700 hover:border-orange-300 hover:bg-orange-50'
                            }
                        `}
                    >
                        <span className="text-xl">{cat.icon}</span>
                        <span className="font-semibold text-sm whitespace-nowrap">{cat.label}</span>
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
