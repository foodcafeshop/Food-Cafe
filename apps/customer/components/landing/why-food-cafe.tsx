"use client";

import { motion } from "framer-motion";
import {
    Smartphone,
    Users,
    Zap,
    Bell,
    Leaf,
    Clock,
} from "lucide-react";

const features = [
    {
        icon: Smartphone,
        title: "No App Download",
        description: "Works directly in your browser. Just scan and order – it's that simple.",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
    },
    {
        icon: Users,
        title: "Group Ordering",
        description: "Everyone at the table can add items to a shared cart in real-time.",
        color: "text-purple-600",
        bgColor: "bg-purple-50",
    },
    {
        icon: Zap,
        title: "Lightning Fast",
        description: "Your order goes directly to the kitchen. No waiting for waiters.",
        color: "text-amber-600",
        bgColor: "bg-amber-50",
    },
    {
        icon: Bell,
        title: "Real-Time Tracking",
        description: "Get notified when your food is being prepared and when it's ready.",
        color: "text-rose-600",
        bgColor: "bg-rose-50",
    },
    {
        icon: Leaf,
        title: "Dietary Filters",
        description: "Easily filter by Veg, Non-Veg, Vegan, Jain, and more.",
        color: "text-emerald-600",
        bgColor: "bg-emerald-50",
    },
    {
        icon: Clock,
        title: "Order History",
        description: "View past orders and quickly reorder your favorites.",
        color: "text-cyan-600",
        bgColor: "bg-cyan-50",
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5 },
    },
};

export default function WhyFoodCafe() {
    return (
        <section className="py-20 md:py-28 bg-gradient-to-b from-white via-amber-50/30 to-white">
            <div className="container mx-auto px-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <span className="inline-block px-4 py-1.5 mb-4 text-sm font-semibold text-orange-600 bg-orange-100 rounded-full">
                        Why Food Cafe?
                    </span>
                    <h2 className="text-3xl md:text-5xl font-black text-zinc-900 mb-4">
                        The Smarter Way to Dine
                    </h2>
                    <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
                        Experience the future of restaurant dining with features designed for you.
                    </p>
                </motion.div>

                {/* Features Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
                >
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            variants={itemVariants}
                            className="group relative bg-white rounded-2xl p-6 border border-zinc-100 hover:border-zinc-200 hover:shadow-lg transition-all duration-300"
                        >
                            {/* Icon */}
                            <div className={`inline-flex items-center justify-center w-14 h-14 ${feature.bgColor} rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                <feature.icon className={`w-7 h-7 ${feature.color}`} />
                            </div>

                            {/* Content */}
                            <h3 className="text-lg font-bold text-zinc-900 mb-2">{feature.title}</h3>
                            <p className="text-zinc-600 text-sm leading-relaxed">{feature.description}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
