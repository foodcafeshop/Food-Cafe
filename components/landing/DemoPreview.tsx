"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";

export default function DemoPreview() {
    return (
        <section className="py-24 px-4 w-full pointer-events-none">
            <div className="max-w-6xl mx-auto pointer-events-auto">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-white mb-4">Powerful Dashboard</h2>
                    <p className="text-xl text-gray-400">Manage your entire restaurant from one screen.</p>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 40 }}
                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="relative aspect-video bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden group"
                >
                    <iframe
                        className="absolute inset-0 w-full h-full"
                        src="https://www.youtube.com/embed/F3NRkNitkvY?autoplay=0&rel=0&controls=1&modestbranding=1"
                        title="Food Cafe Demo"
                        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </motion.div>
            </div>
        </section>
    );
}
