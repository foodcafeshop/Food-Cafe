"use client";

import { motion } from "framer-motion";
import { QrCode, UtensilsCrossed, Sparkles } from "lucide-react";

const steps = [
    {
        icon: QrCode,
        title: "Scan",
        description: "Point your camera at the QR code on your table",
        gradient: "from-blue-500 to-indigo-600",
        bgLight: "bg-blue-50",
        textColor: "text-blue-600",
        number: "01",
    },
    {
        icon: UtensilsCrossed,
        title: "Order",
        description: "Browse menu, customize items & place your order",
        gradient: "from-orange-500 to-red-500",
        bgLight: "bg-orange-50",
        textColor: "text-orange-600",
        number: "02",
    },
    {
        icon: Sparkles,
        title: "Enjoy",
        description: "Get notified when your food is ready",
        gradient: "from-emerald-500 to-teal-600",
        bgLight: "bg-emerald-50",
        textColor: "text-emerald-600",
        number: "03",
    },
];

export default function HowItWorks() {
    return (
        <section className="py-24 md:py-32 bg-gradient-to-b from-white via-orange-50/30 to-white relative overflow-hidden">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-30">
                <div className="absolute top-20 left-10 w-72 h-72 bg-orange-200 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-10 w-72 h-72 bg-blue-200 rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-20"
                >
                    <span className="inline-block px-4 py-1.5 mb-4 text-sm font-semibold text-orange-600 bg-orange-100 rounded-full">
                        How It Works
                    </span>
                    <h2 className="text-4xl md:text-6xl font-black text-zinc-900 mb-4">
                        Three Steps to
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
                            Delicious Food
                        </span>
                    </h2>
                    <p className="text-lg text-zinc-600 max-w-xl mx-auto">
                        No app downloads. No sign-ups. Just scan and order.
                    </p>
                </motion.div>

                {/* Steps */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {steps.map((step, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: idx * 0.2 }}
                            className="group"
                        >
                            <div className="relative bg-white rounded-3xl p-8 shadow-xl shadow-zinc-200/50 border border-zinc-100 hover:shadow-2xl hover:shadow-orange-100/50 hover:-translate-y-2 transition-all duration-500 h-full">
                                {/* Large Step Number */}
                                <div className="absolute -top-3 -right-3 w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-700 flex items-center justify-center shadow-lg">
                                    <span className="text-white font-bold text-lg">{idx + 1}</span>
                                </div>

                                {/* Glowing Icon */}
                                <div className="mb-8">
                                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                        <step.icon className="w-10 h-10 text-white" />
                                    </div>
                                </div>

                                {/* Content */}
                                <h3 className="text-2xl font-bold text-zinc-900 mb-3">{step.title}</h3>
                                <p className="text-zinc-600 leading-relaxed">{step.description}</p>

                                {/* Connector Arrow (desktop) */}
                                {idx < steps.length - 1 && (
                                    <div className="hidden md:flex absolute top-1/2 -right-4 z-20 transform -translate-y-1/2">
                                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                                            <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
