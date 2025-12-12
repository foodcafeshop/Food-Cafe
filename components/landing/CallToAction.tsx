"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function CallToAction() {
    return (
        <section className="py-32 px-4 w-full">
            <div className="max-w-4xl mx-auto text-center">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-5xl md:text-7xl font-extrabold text-white mb-8 tracking-tight"
                >
                    Ready to digitize your <span className="text-orange-500">Restaurant?</span>
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto"
                >
                    Join 50+ partners who are saving time, increasing revenue, and delighting customers everyday.
                </motion.p>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-col sm:flex-row gap-6 justify-center"
                >
                    <Link href="/admin/login">
                        <Button size="lg" className="h-16 px-12 text-xl font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-full shadow-2xl shadow-orange-900/50">
                            Partner Login <ArrowRight className="ml-2" />
                        </Button>
                    </Link>
                    <Link href="/food-cafe">
                        <Button size="lg" variant="outline" className="h-16 px-12 text-xl font-bold bg-white text-slate-900 hover:bg-gray-100 border-0 rounded-full">
                            View Demo Shop
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
