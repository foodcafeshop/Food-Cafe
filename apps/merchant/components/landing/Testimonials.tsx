"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
    {
        name: "Ramesh Gupta",
        role: "Owner, Chai Point franchise, Mumbai",
        content: "The free 3-month offer gave us the confidence to switch. Now, my kitchen is 2x faster because of the KDS. No more shouting orders!",
        rating: 5
    },
    {
        name: "Priyal Shah",
        role: "Manager, The Burger Club, Delhi",
        content: "The 'Social Dining' feature is a hit! Groups order so much more when they can all add to the cart together. Revenue is up 30%.",
        rating: 5
    },
    {
        name: "Arjun Reddy",
        role: "Founder, Spicy Wok, Hyderabad",
        content: "I love the Inventory tracking. I know exactly how much chicken is used every day. Simplicity is key for us.",
        rating: 4
    }
];

export default function Testimonials() {
    return (
        <section className="py-24 px-4 w-full max-w-7xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-white mb-4">Trusted by 50+ Indian Kitchens</h2>
                <p className="text-xl text-gray-400">Hear from owners just like you.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {testimonials.map((item, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.2 }}
                        viewport={{ once: true }}
                        className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800"
                    >
                        <div className="flex gap-1 mb-4">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} size={16} className={`${i < item.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-600"}`} />
                            ))}
                        </div>
                        <p className="text-lg text-gray-300 italic mb-6">"{item.content}"</p>
                        <div>
                            <p className="font-bold text-white">{item.name}</p>
                            <p className="text-sm text-gray-500">{item.role}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
