"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
    {
        name: "QSR / Cafe",
        price: "FREE",
        originalPrice: "₹499",
        period: "/ 3 months",
        description: "For small cafes & quick service restaurants.",
        features: ["Smart QR Menu (No App)", "Up to 10 Tables", "Basic KDS", "Order Management", "WhatsApp Support"],
        highlight: false,
        launchOffer: "Launch Offer (Then ₹499/mo)"
    },
    {
        name: "Restaurant",
        price: "₹999",
        originalPrice: "₹1999",
        period: "/mo",
        description: "Full-stack system for growing restaurants.",
        features: ["Everything in QSR", "Unlimited Tables", "Advanced KDS", "Inventory Management", "Staff Roles & RBAC", "Sales Analytics"],
        highlight: true,
        launchOffer: "Save 50% (Launch Offer)"
    },
    {
        name: "Enterprise",
        price: "Custom",
        description: "For multi-chain brands & franchises.",
        features: ["Everything in Restaurant", "Centralized Dashboard", "Custom Integrations", "Dedicated Success Manager", "API Access"],
        highlight: false
    }
];

export default function PricingSection() {
    return (
        <section className="py-24 px-4 w-full max-w-7xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-white mb-4">Unbeatable Pricing</h2>
                <p className="text-xl text-gray-400">Premium features, affordable for every outlet.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map((plan, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.1 }}
                        className={`relative p-8 rounded-2xl border backdrop-blur-sm flex flex-col ${plan.highlight
                            ? "bg-slate-900/80 border-orange-500 shadow-2xl shadow-orange-900/20"
                            : "bg-slate-950/50 border-slate-800"
                            }`}
                    >
                        {plan.launchOffer && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg whitespace-nowrap">
                                {plan.launchOffer}
                            </div>
                        )}

                        <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>

                        <div className="flex flex-col mb-4">
                            {plan.originalPrice && (
                                <span className="text-gray-500 line-through text-sm font-medium">Was {plan.originalPrice}</span>
                            )}
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                                {plan.period && <span className="text-gray-400">{plan.period}</span>}
                            </div>
                        </div>

                        <p className="text-gray-400 mb-8 h-12">{plan.description}</p>

                        <div className="space-y-4 mb-8 flex-1">
                            {plan.features.map((feature, fIdx) => (
                                <div key={fIdx} className="flex items-center gap-3">
                                    <div className={`rounded-full p-1 ${plan.highlight ? "bg-orange-500/20" : "bg-slate-800"}`}>
                                        <Check className={`h-4 w-4 ${plan.highlight ? "text-orange-500" : "text-gray-400"}`} />
                                    </div>
                                    <span className="text-gray-300 text-sm">{feature}</span>
                                </div>
                            ))}
                        </div>

                        <Button
                            className={`w-full h-12 font-bold rounded-xl ${plan.highlight
                                ? "bg-orange-600 hover:bg-orange-700 text-white"
                                : "bg-slate-800 hover:bg-slate-700 text-white"
                                }`}
                        >
                            Get Started
                        </Button>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
