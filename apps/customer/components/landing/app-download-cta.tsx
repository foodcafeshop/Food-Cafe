"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Download, Star, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

import { usePWA } from "@/components/providers/pwa-provider";

export default function AppDownloadCTA() {
    const { handleInstallClick } = usePWA();

    const handleInstall = async () => {
        await handleInstallClick();
    };

    return (
        <section className="py-20 md:py-28 bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />

                {/* Floating icons */}
                <motion.div
                    animate={{ y: [-5, 5, -5], rotate: [0, 10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-20 left-[10%] text-white/20"
                >
                    <Star className="w-12 h-12" />
                </motion.div>
                <motion.div
                    animate={{ y: [5, -5, 5], rotate: [0, -10, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-20 right-[15%] text-white/20"
                >
                    <Smartphone className="w-16 h-16" />
                </motion.div>
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-white/20 backdrop-blur-sm border border-white/30"
                    >
                        <Download className="w-4 h-4 text-white" />
                        <span className="text-sm font-medium text-white">Add to Home Screen</span>
                    </motion.div>

                    {/* Headline */}
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight"
                    >
                        Get the Full Experience
                    </motion.h2>

                    {/* Description */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-lg text-white/90 max-w-2xl mx-auto mb-8"
                    >
                        Install Food Cafe on your phone for instant access.
                        Get notified when your order is ready and enjoy a seamless dine-in experience.
                    </motion.p>

                    {/* Features */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex flex-wrap justify-center gap-4 mb-10"
                    >
                        {["Order Notifications", "Offline Menu", "Quick Reorder"].map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                                <div className="w-2 h-2 bg-white rounded-full" />
                                <span className="text-sm font-medium text-white">{feature}</span>
                            </div>
                        ))}
                    </motion.div>

                    {/* CTA Button */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                    >
                        <Button
                            onClick={handleInstall}
                            size="lg"
                            className="h-14 px-10 text-lg font-bold bg-white text-orange-600 hover:bg-zinc-100 rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-105"
                        >
                            <Download className="w-5 h-5 mr-2" />
                            Install App
                        </Button>
                        <p className="mt-4 text-sm text-white/70">Works on iOS & Android • No app store needed</p>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
