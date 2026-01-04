"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

import { QRScannerDialog } from "@/components/features/scan/qr-scanner-dialog";

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isScanOpen, setIsScanOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 md:px-8",
                isScrolled
                    ? "py-3 bg-white/80 backdrop-blur-md shadow-sm border-b border-zinc-100"
                    : "py-6 bg-transparent"
            )}
        >

            <div className="container mx-auto flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-orange-200">
                        <Image
                            src="/fc_logo_orange.webp"
                            alt="Food Cafe Logo"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <span className={cn(
                        "text-xl font-bold transition-colors sm:inline-block", // Hidden on mobile
                        isScrolled ? "text-orange-600" : "text-orange-600"
                    )}>
                        Food Cafe
                    </span>
                </div>

                {/* Actions */}
                <button
                    onClick={() => setIsScanOpen(true)}
                    className={cn(
                        "flex items-center gap-2 text-sm font-semibold transition-colors rounded-full px-5 py-2.5",
                        isScrolled
                            ? "border-2 border-orange-600 text-orange-600 hover:bg-orange-50"
                            : "bg-white/90 backdrop-blur text-orange-600 shadow-lg shadow-orange-900/5 hover:bg-white hover:scale-105 transition-all"
                    )}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    <span className="hidden sm:inline">Scan QR</span>
                    <span className="sm:hidden">Scan</span>
                </button>
            </div>

            <QRScannerDialog open={isScanOpen} onOpenChange={setIsScanOpen} />
        </nav>
    );
}
