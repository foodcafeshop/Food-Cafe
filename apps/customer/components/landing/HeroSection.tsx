"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChefHat } from "lucide-react";
import { useState, useEffect } from "react";

const badges = [
    "✨ Launch Offer: Get 3 Months Free",
    "🚀 New: Zero-Touch AI Menu Builder",
    "🔥 Trusted by 50+ Modern Kitchens"
];

export default function HeroSection() {
    const [currentBadge, setCurrentBadge] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentBadge((prev) => (prev + 1) % badges.length);
        }, 3000);
        return () => clearInterval(timer);
    }, []);
    return (
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden bg-slate-950 pt-20 pb-32">
            {/* Background Effects */}
            <div className="absolute top-0 inset-x-0 h-[500px] w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-400/20 via-slate-950/0 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />


            {/* Brand Logo */}
            <div className="absolute top-6 left-6 md:left-12 z-20 flex items-center gap-3">
                <div className="relative h-10 w-10">
                    <Image
                        src="/fc_logo_orange.webp"
                        alt="Food Cafe Logo"
                        fill
                        className="object-contain rounded-xl shadow-sm"
                    />
                </div>
                <span className="text-2xl font-bold text-white tracking-tight">Food Cafe</span>
            </div>

            <div className="relative z-10 container mx-auto px-4 text-center">
                <div className="inline-flex items-center justify-center p-2 mb-8 rounded-full bg-slate-900/80 border border-slate-800 overflow-hidden">
                    <div className="relative h-6 w-6 mr-3 flex-shrink-0">
                        <Image
                            src="/fc_logo_orange.webp"
                            alt="Logo"
                            fill
                            className="object-contain rounded-md"
                        />
                    </div>
                    <div className="h-6 overflow-hidden relative w-64 md:w-80 text-left">
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={currentBadge}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -20, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="text-sm font-medium text-gray-300 absolute inset-0 flex items-center"
                            >
                                {badges[currentBadge]}
                            </motion.span>
                        </AnimatePresence>
                    </div>
                </div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-5xl md:text-8xl font-extrabold tracking-tight text-white mb-8 leading-tight"
                >
                    Revolutionize the <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-600">Dining Experience</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed"
                >
                    The All-in-One Restaurant Operating System. <br className="hidden md:block" />
                    Streamline bills, kitchen orders, and inventory. Simple, affordable, and powerful.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                    <Link href={`${process.env.NEXT_PUBLIC_MERCHANT_URL}/login?signup=true`}>
                        <Button size="lg" className="h-14 px-8 text-lg font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-full transition-all hover:scale-105 shadow-[0_0_40px_-10px_rgba(234,88,12,0.5)]">
                            Start for Free <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </Link>
                    <Link href="/food-cafe">
                        <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold bg-transparent border-slate-700 text-white hover:bg-slate-800 rounded-full transition-all">
                            View Demo Shop
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
