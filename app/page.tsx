"use client";

import HeroSection from "@/components/landing/HeroSection";
import StatsTicker from "@/components/landing/StatsTicker";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import PricingSection from "@/components/landing/PricingSection";
import Testimonials from "@/components/landing/Testimonials";
import CallToAction from "@/components/landing/CallToAction";
import DemoPreview from "@/components/landing/DemoPreview";

export default function PlatformLanding() {
    return (
        <main className="min-h-screen bg-slate-950 text-white selection:bg-orange-500 selection:text-white overflow-x-hidden">
            <HeroSection />

            {/* Demo Preview - Overlapping Hero for depth */}
            <div className="relative z-20 -mt-32 mb-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <DemoPreview />
                </div>
            </div>

            <StatsTicker />

            <div className="relative">
                {/* Background Gradient for content area */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950 pointer-events-none" />

                <div className="relative z-10 space-y-32 pb-32">
                    <FeaturesGrid />
                    <PricingSection />
                    <Testimonials />
                    <CallToAction />
                </div>
            </div>

            <footer className="py-12 text-center text-gray-600 border-t border-slate-900 bg-slate-950">
                <p>&copy; {new Date().getFullYear()} Food Cafe. All rights reserved.</p>
            </footer>
        </main>
    );
}


