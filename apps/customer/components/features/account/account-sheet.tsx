"use client";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store";
import { Utensils, LogOut, ShoppingBag, BookOpen, MapPin } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface AccountSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AccountSheet({ open, onOpenChange }: AccountSheetProps) {
    const { customerName, customerPhone, tableLabel, logout, totalItems } = useCartStore();
    const params = useParams();
    const slug = params?.slug as string;
    const cartCount = totalItems();

    const handleLogout = () => {
        logout();
        onOpenChange(false);
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    };

    if (!customerName) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="rounded-t-3xl p-0 max-h-[85vh] bg-white">
                {/* Handle bar */}
                <div className="flex justify-center py-3">
                    <div className="w-12 h-1.5 bg-gray-100 rounded-full" />
                </div>

                <div className="px-6 pb-8 space-y-6">
                    {/* Header Section */}
                    <div className="flex items-center gap-4 pt-2">
                        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xl font-bold shadow-md shadow-orange-100">
                            {customerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="text-sm text-gray-500 font-medium">{getGreeting()},</div>
                            <div className="text-xl font-bold text-gray-900 leading-tight">{customerName}</div>
                            {customerPhone && (
                                <div className="text-sm text-gray-500 font-medium mt-0.5">{customerPhone}</div>
                            )}
                        </div>
                    </div>

                    {/* Table Status Card */}
                    {tableLabel && (
                        <div className="flex items-center justify-between p-4 bg-orange-50/50 border border-orange-100 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                                    <MapPin className="h-5 w-5 text-orange-600" />
                                </div>
                                <div>
                                    <div className="text-xs text-orange-600/80 font-bold uppercase tracking-wider">Current Table</div>
                                    <div className="text-lg font-bold text-gray-900">{tableLabel}</div>
                                </div>
                            </div>
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        </div>
                    )}

                    {/* Quick Actions Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <Link
                            href={`/${slug}/menu`}
                            onClick={() => onOpenChange(false)}
                            className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-orange-50/50 border border-orange-100 active:scale-95 transition-all hover:bg-orange-50"
                        >
                            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                                <Utensils className="h-5 w-5 text-orange-600" />
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="font-semibold text-gray-900">Browse Menu</span>
                            </div>
                        </Link>
                        <Link
                            href={`/${slug}/cart`}
                            onClick={() => onOpenChange(false)}
                            className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-purple-50/50 border border-purple-100 active:scale-95 transition-all hover:bg-purple-50 relative"
                        >
                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                <ShoppingBag className="h-5 w-5 text-purple-600" />
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="font-semibold text-gray-900">View Cart</span>
                            </div>
                            {cartCount > 0 && (
                                <span className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full shadow-sm ring-2 ring-white">
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                    </div>

                    <div className="h-px bg-gray-100" />

                    {/* Logout Button */}
                    <div className="flex justify-center pt-2">
                        <Button
                            variant="outline"
                            className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-full px-8 h-10 shadow-sm font-medium"
                            onClick={handleLogout}
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
