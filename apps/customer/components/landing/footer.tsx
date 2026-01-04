"use client";

import Link from "next/link";
import Image from "next/image";
import { Instagram, Youtube, Facebook, Mail, MapPin, ChefHat } from "lucide-react";

const quickLinks = [
    { label: "Browse Restaurants", href: "#restaurants" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "For Restaurant Owners", href: `${process.env.NEXT_PUBLIC_MERCHANT_URL || '/'}` },
];

const legalLinks = [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
];

const socialLinks = [
    { icon: Instagram, href: "https://www.instagram.com/foodcafeshop/", label: "Instagram" },
    { icon: Facebook, href: "https://www.facebook.com/foodcafeshop/", label: "Facebook" },
    { icon: Youtube, href: "https://www.youtube.com/@FoodCafeShop", label: "YouTube" },
];

export default function Footer() {
    return (
        <footer className="bg-zinc-900 text-white">
            <div className="container mx-auto px-4 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Brand */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="relative h-10 w-10">
                                <Image
                                    src="/fc_logo_orange.webp"
                                    alt="Food Cafe Logo"
                                    fill
                                    className="object-contain rounded-xl"
                                />
                            </div>
                            <span className="text-2xl font-bold tracking-tight">Food Cafe</span>
                        </div>
                        <p className="text-zinc-400 max-w-md mb-6 leading-relaxed">
                            The modern dine-in experience. Scan the QR at your table,
                            browse the menu, and order directly – no app downloads required.
                        </p>

                        {/* Social Links */}
                        <div className="flex gap-3">
                            {socialLinks.map((social, idx) => (
                                <a
                                    key={idx}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={social.label}
                                    className="w-10 h-10 bg-zinc-800 hover:bg-orange-600 rounded-full flex items-center justify-center transition-colors"
                                >
                                    <social.icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-bold text-lg mb-4">Quick Links</h4>
                        <ul className="space-y-3">
                            {quickLinks.map((link, idx) => (
                                <li key={idx}>
                                    <Link
                                        href={link.href}
                                        className="text-zinc-400 hover:text-orange-500 transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="font-bold text-lg mb-4">Contact Us</h4>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3 text-zinc-400">
                                <Mail className="w-5 h-5 mt-0.5 text-orange-500" />
                                <a href="mailto:foodcafeshop@gmail.com" className="hover:text-orange-500 transition-colors">foodcafeshop@gmail.com</a>
                            </li>
                            <li className="flex items-start gap-3 text-zinc-400">
                                <MapPin className="w-5 h-5 mt-0.5 text-orange-500" />
                                <span>Delhi NCR, India</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-zinc-800">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-zinc-500 text-sm">
                            © {new Date().getFullYear()} Food Cafe. All rights reserved.
                        </p>
                        <div className="flex flex-wrap gap-6">
                            {legalLinks.map((link, idx) => (
                                <Link
                                    key={idx}
                                    href={link.href}
                                    className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Restaurant Owner CTA */}
            <div className="bg-zinc-800 py-6">
                <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
                    <div className="flex items-center gap-2">
                        <ChefHat className="w-5 h-5 text-orange-500" />
                        <span className="text-zinc-300">Own a restaurant?</span>
                    </div>
                    <Link
                        href={process.env.NEXT_PUBLIC_MERCHANT_URL || '/'}
                        className="text-orange-500 hover:text-orange-400 font-semibold transition-colors"
                    >
                        Partner with Food Cafe →
                    </Link>
                </div>
            </div>
        </footer>
    );
}
