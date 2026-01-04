"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, Utensils } from 'lucide-react';
import { motion } from 'framer-motion';

interface ShopCardProps {
    shop: any;
    priority?: boolean;
    variant?: 'default' | 'featured';
}

export default function ShopCard({ shop, priority = false, variant = 'default' }: ShopCardProps) {
    const isFeatured = variant === 'featured';

    // Featured/Trending card - larger and more prominent
    if (isFeatured) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="group"
            >
                <Link
                    href={`/${shop.slug}`}
                    className="block h-full bg-white rounded-2xl overflow-hidden border-2 border-orange-100 shadow-lg shadow-orange-100/50 hover:shadow-2xl hover:shadow-orange-200/50 hover:border-orange-200 transition-all duration-300 flex flex-col"
                >
                    <div className="relative aspect-video bg-zinc-100 overflow-hidden">
                        {shop.cover_image ? (
                            <div className="w-full h-full relative">
                                <Image
                                    src={shop.cover_image}
                                    alt={shop.name}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                                    priority={priority}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                            </div>
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center">
                                <Utensils className="w-16 h-16 text-orange-300" />
                            </div>
                        )}

                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex gap-2">
                            <span className="px-2.5 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] uppercase font-bold tracking-wider rounded-full shadow-lg flex items-center gap-1">
                                🔥 Trending
                            </span>
                            {shop.is_live && shop.is_open ? (
                                <span className="px-2.5 py-1 bg-emerald-500 text-white text-[10px] uppercase font-bold tracking-wider rounded-full shadow-sm flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                    Open
                                </span>
                            ) : (
                                <span className="px-2.5 py-1 bg-zinc-700 text-white text-[10px] uppercase font-bold tracking-wider rounded-full shadow-sm">
                                    Closed
                                </span>
                            )}
                        </div>

                        {/* Rating */}
                        {shop.average_rating > 0 && (
                            <div className="absolute top-3 right-3">
                                <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-full shadow-lg">
                                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                    <span className="text-sm font-bold text-zinc-900">{Number(shop.average_rating).toFixed(1)}</span>
                                </div>
                            </div>
                        )}

                        {/* Shop Info Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-5">
                            <div className="flex items-end gap-4">
                                {/* Logo */}
                                <div className="w-16 h-16 rounded-xl bg-white p-1.5 shadow-xl border-2 border-white flex-shrink-0">
                                    <div className="relative w-full h-full rounded-lg overflow-hidden bg-zinc-50">
                                        {shop.logo_url ? (
                                            /* Using standard img to avoid next/image domain config issues for dynamic user uploads */
                                            <img
                                                src={shop.logo_url}
                                                alt={shop.name}
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-500 to-amber-500 text-white font-bold text-2xl">
                                                {shop.name?.[0]}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {/* Name & Type */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-xl text-white leading-tight truncate drop-shadow-md">
                                        {shop.name}
                                    </h3>
                                    <p className="text-sm text-white/80 truncate">{shop.shop_type || 'Restaurant'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                        <p className="text-sm text-zinc-600 line-clamp-2 mb-4">
                            {shop.description || "Discover delicious food and great dining experience."}
                        </p>

                        {/* Footer */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-zinc-500 text-sm">
                                <MapPin className="w-4 h-4" />
                                <span className="truncate max-w-[150px]">{shop.address ? shop.address.split(',')[0] : 'View Location'}</span>
                            </div>
                            <Link
                                href={`/${shop.slug}/menu`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-orange-600 font-bold text-sm hover:text-orange-700 px-4 py-2 bg-orange-50 hover:bg-orange-100 rounded-full transition-colors"
                            >
                                Menu →
                            </Link>
                        </div>
                    </div>
                </Link>
            </motion.div>
        );
    }

    // Default/Compact card for All Restaurants
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="group"
        >
            <div className="h-full bg-white rounded-xl overflow-hidden border border-zinc-200 hover:border-orange-300 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row">
                {/* Image Section */}
                <Link href={`/${shop.slug}`} className="block relative w-full md:w-48 h-40 md:h-auto bg-zinc-100 overflow-hidden flex-shrink-0">
                    {shop.cover_image ? (
                        <Image
                            src={shop.cover_image}
                            alt={shop.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            priority={priority}
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-zinc-100 to-zinc-50 flex items-center justify-center">
                            <Utensils className="w-10 h-10 text-zinc-300" />
                        </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-2 left-2">
                        {shop.is_live && shop.is_open ? (
                            <span className="px-2 py-0.5 bg-emerald-500 text-white text-[9px] uppercase font-bold tracking-wider rounded-full shadow-sm flex items-center gap-1">
                                <span className="w-1 h-1 bg-white rounded-full animate-pulse" />
                                Open
                            </span>
                        ) : (
                            <span className="px-2 py-0.5 bg-zinc-600 text-white text-[9px] uppercase font-bold tracking-wider rounded-full">
                                Closed
                            </span>
                        )}
                    </div>
                </Link>

                {/* Content Section */}
                <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                    <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <Link href={`/${shop.slug}`} className="flex items-center gap-3 min-w-0 flex-1">
                                {/* Logo */}
                                <div className="w-10 h-10 rounded-lg bg-zinc-100 overflow-hidden flex-shrink-0 border border-zinc-200">
                                    {shop.logo_url ? (
                                        <div className="relative w-full h-full">
                                            {/* Using standard img to avoid next/image domain config issues for dynamic user uploads */}
                                            <img
                                                src={shop.logo_url}
                                                alt={shop.name}
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-500 to-amber-500 text-white font-bold text-sm">
                                            {shop.name?.[0]}
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-bold text-zinc-900 truncate group-hover:text-orange-600 transition-colors">
                                        {shop.name}
                                    </h3>
                                    <p className="text-xs text-zinc-500">{shop.shop_type || 'Restaurant'}</p>
                                </div>
                            </Link>

                            {/* Rating */}
                            {shop.average_rating > 0 && (
                                <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full flex-shrink-0">
                                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                    <span className="text-xs font-bold text-zinc-700">{Number(shop.average_rating).toFixed(1)}</span>
                                </div>
                            )}
                        </div>

                        <p className="text-sm text-zinc-500 line-clamp-2 mb-3">
                            {shop.description || "Discover delicious food."}
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                        <div className="flex items-center gap-1 text-zinc-400 text-xs">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[120px]">{shop.address ? shop.address.split(',')[0] : 'Location'}</span>
                        </div>
                        <Link
                            href={`/${shop.slug}/menu`}
                            className="text-orange-600 font-semibold text-sm hover:text-orange-700 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                        >
                            View Menu
                        </Link>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
