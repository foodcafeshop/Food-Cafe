"use client";

import { useState, useEffect } from 'react';
import D2CHero from '@/components/landing/d2c-hero';
import Navbar from '@/components/landing/navbar';
import HowItWorks from '@/components/landing/how-it-works';
import WhyFoodCafe from '@/components/landing/why-food-cafe';
import AppDownloadCTA from '@/components/landing/app-download-cta';
import Footer from '@/components/landing/footer';
import CategoryRail from '@/components/landing/category-rail';
import ShopCard from '@/components/landing/shop-card';
import { getAllShops } from '@/lib/api';

export default function LandingPage() {
    const [shops, setShops] = useState<any[]>([]); // "All Restaurants" (Filtered)
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Initial Load
    useEffect(() => {
        fetchFilteredShops();
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchFilteredShops();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, selectedCategory]);

    const fetchFilteredShops = async () => {
        setIsLoading(true);
        const data = await getAllShops({
            search: searchQuery,
            tags: selectedCategory ? [selectedCategory.toLowerCase()] : undefined,
            limit: 9 // API Level Limit
        });
        setShops(data || []);
        setIsLoading(false);
    };

    return (
        <main className="min-h-screen bg-white">
            {/* Navbar */}
            <Navbar />

            {/* Hero Section */}
            <D2CHero searchValue={searchQuery} onSearchChange={setSearchQuery} />

            {/* Restaurants Section */}
            <section id="restaurants" className="py-20 bg-gradient-to-b from-white via-orange-50/30 to-white px-4">
                <div className="container mx-auto px-4">
                    {/* Category Rail */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <h2 className="font-bold text-xl text-zinc-900">Explore by Category</h2>
                        </div>
                        <CategoryRail selected={selectedCategory} onSelect={setSelectedCategory} />
                    </div>



                    {/* All Restaurants */}
                    <div>
                        <div className="flex items-center justify-between mb-8 px-1">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center">
                                    <span className="text-lg">🍽️</span>
                                </div>
                                <div>
                                    <h2 className="font-bold text-2xl text-zinc-900">Popular Restaurants</h2>
                                    <p className="text-sm text-zinc-500">Browse {shops.length} restaurants near you</p>
                                </div>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="bg-white rounded-3xl h-64 animate-pulse shadow-sm border border-zinc-100" />
                                ))}
                            </div>
                        ) : shops.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {shops.map((shop) => (
                                    <ShopCard key={shop.id} shop={shop} />
                                ))}
                            </div>
                        ) : (
                            <div className="py-16 text-center">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-zinc-100 rounded-full mb-6">
                                    <svg className="w-10 h-10 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-zinc-700 mb-2">No restaurants found</h3>
                                <p className="text-zinc-500 mb-6 max-w-md mx-auto">
                                    We couldn't find any restaurants matching your criteria. Try adjusting your filters.
                                </p>
                                <button
                                    onClick={() => { setSearchQuery(''); setSelectedCategory(''); }}
                                    className="inline-flex items-center px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl transition-colors"
                                >
                                    Clear All Filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works">
                <HowItWorks />
            </section>

            {/* Why Food Cafe */}
            <WhyFoodCafe />

            {/* App Download CTA */}
            <AppDownloadCTA />

            {/* Footer */}
            <Footer />
        </main>
    );
}
