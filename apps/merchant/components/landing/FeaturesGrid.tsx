"use client";

import { motion } from "framer-motion";
import {
    Sparkles,
    Smartphone,
    UtensilsCrossed,
    ChefHat,
    Zap,
    Users,
    ShieldCheck,
    BarChart3
} from "lucide-react";

// --- Visual Components ---

function AnalyticsVisual() {
    return (
        <div className="flex items-end gap-1 h-20 w-full justify-center pb-2">
            {[40, 70, 50, 90, 60, 80].map((h, i) => (
                <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${h}%` }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="w-4 bg-orange-500/50 rounded-t-sm"
                />
            ))}
        </div>
    );
}

function KDSVisual() {
    return (
        <div className="relative h-20 w-32 bg-slate-800 rounded-lg p-2 border border-slate-700 shadow-xl overflow-hidden">
            <motion.div
                initial={{ x: -100 }}
                whileInView={{ x: 0 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="flex flex-col gap-2"
            >
                <div className="h-2 w-16 bg-gray-600 rounded" />
                <div className="h-2 w-24 bg-gray-700 rounded" />
                <div className="h-2 w-20 bg-gray-700 rounded" />
            </motion.div>
            <div className="absolute top-2 right-2 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
        </div>
    );
}

function SocialVisual() {
    return (
        <div className="flex -space-x-3 justify-center pt-4">
            {[1, 2, 3].map((i) => (
                <motion.div
                    key={i}
                    initial={{ scale: 0, x: 20 }}
                    whileInView={{ scale: 1, x: 0 }}
                    transition={{ type: "spring", delay: i * 0.1 }}
                    className="h-10 w-10 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-xs text-white font-bold"
                >
                    U{i}
                </motion.div>
            ))}
            <div className="h-10 w-10 rounded-full border-2 border-slate-900 bg-orange-600 flex items-center justify-center text-xs text-white font-bold">
                +2
            </div>
        </div>
    );
}

function LiveVisual() {
    return (
        <div className="relative flex items-center justify-center h-20">
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-12 w-12 bg-orange-500/20 rounded-full animate-ping" />
            </div>
            <div className="relative bg-orange-950/50 border border-orange-500/50 px-3 py-1 rounded-full text-orange-400 text-xs font-bold flex items-center gap-2">
                <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse" />
                LIVE UPDATE
            </div>
        </div>
    )
}


const features = [
    {
        title: "AI Menu Builder",
        desc: "Upload a photo of your paper menu. Our AI digitizes it instantly.",
        icon: Sparkles,
        className: "md:col-span-2",
        visual: null // Could add an image scan effect later
    },
    {
        title: "Smart QR Menu",
        desc: "No App Download. Guests simply scan & order.",
        icon: Smartphone,
    },
    {
        title: "Live KDS",
        desc: "Kitchen hears a 'Ping' instantly. No more paper tickets.",
        icon: ChefHat,
        visual: <KDSVisual />
    },
    {
        title: "Social Dining",
        desc: "Multiple guests can add items to a shared cart in real-time.",
        icon: Users,
        visual: <SocialVisual />
    },
    {
        title: "Real-Time Updates",
        desc: "Mark items 'Out of Stock' or change prices in 1 second.",
        icon: Zap,
        visual: <LiveVisual />
    },
    {
        title: "Inventory Tracking",
        desc: "Auto-deduct stock with every order. Never run out.",
        icon: UtensilsCrossed,
    },
    {
        title: "Staff Management",
        desc: "Role-Based Access Control for Owners, Managers, and Chefs.",
        icon: ShieldCheck,
    },
    {
        title: "Deep Analytics",
        desc: "Track revenue, bestsellers, and peak hours.",
        icon: BarChart3,
        className: "md:col-span-2",
        visual: <AnalyticsVisual />
    }
];

export default function FeaturesGrid() {
    return (
        <section className="py-24 px-4 w-full max-w-7xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-white mb-4">Everything You Need to Run a Modern Kitchen</h2>
                <p className="text-xl text-gray-400">Power-packed features in a simple interface.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 auto-rows-[250px]">
                {features.map((item, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: idx * 0.1 }}
                        viewport={{ once: true }}
                        className={`group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/50 p-8 hover:bg-slate-900/80 transition-colors flex flex-col justify-between ${item.className || "md:col-span-1"}`}
                    >
                        {/* Abstract background Icon */}
                        <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                            <item.icon size={160} />
                        </div>

                        {/* Visual Area (Top Half) */}
                        <div className="flex-1 flex items-center justify-center w-full">
                            {item.visual ? (
                                <div className="scale-125 opacity-80 group-hover:opacity-100 group-hover:scale-135 transition-all duration-500">
                                    {item.visual}
                                </div>
                            ) : (
                                <div className="mb-4 inline-block rounded-xl bg-slate-800/50 p-4 text-orange-500/50 group-hover:text-orange-500 group-hover:bg-orange-600/20 transition-all duration-300">
                                    <item.icon size={48} />
                                </div>
                            )}
                        </div>

                        {/* Text Content (Bottom Half) */}
                        <div className="relative z-10 w-full">
                            <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                            <p className="text-sm text-gray-400 font-medium leading-relaxed">{item.desc}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
