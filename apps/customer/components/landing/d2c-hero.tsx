"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { MapPin, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWA } from "@/components/providers/pwa-provider";
import { cn } from "@/lib/utils";

const stats = [
    { value: "50+", label: "Partner Restaurants" },
    { value: "10K+", label: "Orders Placed" },
    { value: "4.8", label: "Average Rating" },
];

interface D2CHeroProps {
    searchValue: string;
    onSearchChange: (value: string) => void;
}

export default function D2CHero({ searchValue, onSearchChange }: D2CHeroProps) {
    const { isStandalone } = usePWA();

    return (
        <section className={cn(
            "relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-orange-50 via-white to-amber-50",
            isStandalone ? "min-h-[30vh] pt-20 pb-6" : "min-h-[85vh]"
        )}>
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Gradient orbs */}
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-200/40 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl" />

                {/* Floating food icons - Keep them for vibe but maybe fewer? Keeping same for now */}
                <motion.div
                    animate={{ y: [-10, 10, -10], rotate: [0, 5, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-20 left-[10%] text-6xl opacity-20"
                >
                    🍕
                </motion.div>
                <motion.div
                    animate={{ y: [10, -10, 10], rotate: [0, -5, 0] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute top-32 right-[15%] text-5xl opacity-20"
                >
                    🍔
                </motion.div>
                <motion.div
                    animate={{ y: [-15, 15, -15], rotate: [0, 8, 0] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute bottom-40 left-[20%] text-4xl opacity-15"
                >
                    🥗
                </motion.div>
                <motion.div
                    animate={{ y: [12, -12, 12], rotate: [0, -6, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    className="absolute bottom-32 right-[10%] text-5xl opacity-20"
                >
                    🍜
                </motion.div>
            </div>

            <div className={cn(
                "relative z-10 container mx-auto px-4 text-center",
                isStandalone ? "pt-4 pb-4" : "pt-24 pb-8"
            )}>
                {/* Badge - Hide in PWA */}
                {!isStandalone && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-orange-100 border border-orange-200"
                    >
                        <Sparkles className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-700">No App Download Required</span>
                    </motion.div>
                )}

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className={cn(
                        "font-black tracking-tight text-zinc-900 leading-tight",
                        isStandalone ? "text-4xl md:text-5xl mb-6" : "text-4xl md:text-6xl lg:text-7xl mb-6"
                    )}
                >
                    Scan. Order.
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-600">
                        Enjoy.
                    </span>
                </motion.h1>

                {/* Subtitle - Hide in PWA */}
                {!isStandalone && (
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-lg md:text-xl text-zinc-600 max-w-2xl mx-auto mb-10 leading-relaxed"
                    >
                        The modern dine-in experience. Scan the QR code at your table,
                        browse the menu, and order directly – no app needed.
                    </motion.p>
                )}

                {/* Search Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className={cn(
                        "max-w-2xl mx-auto",
                        isStandalone ? "mb-0" : "mb-12"
                    )}
                >
                    <div className="relative flex items-center bg-white rounded-2xl shadow-xl shadow-orange-100/50 border border-zinc-100 p-2">
                        <div className="flex items-center gap-2 px-4 text-zinc-400 border-r border-zinc-100">
                            <MapPin className="w-5 h-5" />
                            <span className="text-sm font-medium hidden sm:inline">Near You</span>
                        </div>
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                            <input
                                type="text"
                                placeholder="Search for restaurants or cuisines..."
                                value={searchValue}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="w-full py-3 pl-12 pr-4 text-zinc-900 placeholder:text-zinc-400 focus:outline-none rounded-xl"
                            />
                        </div>
                        <Button className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-3 rounded-xl h-auto">
                            Find
                        </Button>
                    </div>
                </motion.div>

                {/* Stats - Hide in PWA */}
                {!isStandalone && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="flex flex-wrap justify-center gap-8 md:gap-16"
                    >
                        {stats.map((stat, idx) => (
                            <div key={idx} className="text-center">
                                <div className="text-3xl md:text-4xl font-black text-zinc-900">{stat.value}</div>
                                <div className="text-sm text-zinc-500 font-medium">{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </div>

            {/* Bottom wave - Hide in PWA to reduce height */}
            {!isStandalone && (
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
                        <path
                            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
                            fill="#f8fafc"
                        />
                    </svg>
                </div>
            )}
        </section>
    );
}
