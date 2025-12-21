"use client";

import { motion } from "framer-motion";

const stats = [
    { label: "Active Partners", value: "50+" },
    { label: "Orders Processed", value: "10k+" },
    { label: "Uptime", value: "99.9%" },
    { label: "Customer Satisfaction", value: "4.9/5" },
];

export default function StatsTicker() {
    return (
        <section className="py-10 border-y border-white/5 bg-slate-900/80">
            <div className="container mx-auto px-4">
                <div className="flex flex-wrap justify-center gap-8 md:gap-16">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="flex flex-col items-center">
                            <span className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.value}</span>
                            <span className="text-sm text-gray-400 uppercase tracking-widest">{stat.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
