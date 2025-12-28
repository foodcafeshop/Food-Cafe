"use client";

import { MenuItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useState } from "react";
import { Minus, Plus, Star, X, Flame, Leaf } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ItemDetailModalProps {
    item: MenuItem | null;
    isOpen: boolean;
    onClose: () => void;
    currencySymbol: string;
    maxQuantity?: number;
}

export function ItemDetailModal({ item, isOpen, onClose, currencySymbol, maxQuantity = 10 }: ItemDetailModalProps) {
    const effectiveMaxQty = item?.max_quantity || maxQuantity;
    const [quantity, setQuantity] = useState(1);
    const [instructions, setInstructions] = useState("");
    const { addItem } = useCartStore();

    if (!item) return null;

    const handleAddToCart = () => {
        addItem({ ...item, quantity, notes: instructions });
        onClose();
        setQuantity(1);
        setInstructions("");
    };

    // Dietary type styling
    const getDietaryStyle = () => {
        switch (item.dietary_type) {
            case 'veg':
                return { bg: 'bg-green-500/90', icon: <Leaf className="h-3.5 w-3.5" />, label: 'Veg' };
            case 'vegan':
                return { bg: 'bg-emerald-600/90', icon: <Leaf className="h-3.5 w-3.5" />, label: 'Vegan' };
            case 'jain_veg':
                return { bg: 'bg-teal-500/90', icon: <Leaf className="h-3.5 w-3.5" />, label: 'Jain' };
            case 'contains_egg':
                return { bg: 'bg-amber-500/90', icon: <Flame className="h-3.5 w-3.5" />, label: 'Egg' };
            case 'non_veg':
            default:
                return { bg: 'bg-red-500/90', icon: <Flame className="h-3.5 w-3.5" />, label: 'Non-Veg' };
        }
    };
    const dietaryStyle = getDietaryStyle();
    const hasOffer = item.offer_price && item.offer_price < item.price;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden gap-0 rounded-2xl">
                {/* Hero Image Section */}
                <div className="relative h-64 w-full overflow-hidden">
                    <img
                        src={item.images[0] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Dietary Badge */}
                    <div className="absolute top-3 left-3">
                        <div className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm text-white",
                            dietaryStyle.bg
                        )}>
                            {dietaryStyle.icon}
                            {dietaryStyle.label}
                        </div>
                    </div>

                    {/* Rating Badge (if available) */}
                    {item.average_rating && (
                        <div className="absolute bottom-3 left-3">
                            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-sm font-bold bg-white/95 text-gray-900 shadow-lg backdrop-blur-sm">
                                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                <span>{item.average_rating.toFixed(1)}</span>
                                {item.rating_count && (
                                    <span className="text-gray-500 font-normal">({item.rating_count})</span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Popular/Bestseller Badge */}
                    {item.is_popular && (
                        <div className="absolute bottom-3 right-3">
                            <Badge className="bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg">
                                🔥 Bestseller
                            </Badge>
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <div className="p-5 space-y-5">
                    <DialogHeader className="space-y-3 text-left p-0">
                        {/* Title and Price Row */}
                        <div className="flex justify-between items-start gap-3">
                            <DialogTitle className="text-xl font-bold leading-tight">
                                {item.name}
                            </DialogTitle>
                            <div className="flex flex-col items-end shrink-0">
                                <span className="text-xl font-bold text-orange-600">
                                    {currencySymbol}{item.offer_price ?? item.price}
                                </span>
                                {hasOffer && (
                                    <span className="text-sm text-gray-400 line-through">
                                        {currencySymbol}{item.price}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        <DialogDescription className="text-sm text-gray-600 leading-relaxed">
                            {item.description}
                        </DialogDescription>

                        {/* Tags */}
                        {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {item.tags.slice(0, 4).map((tag, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </DialogHeader>

                    {/* Special Instructions */}
                    <div className="space-y-2">
                        <label htmlFor="instructions" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Special Instructions
                        </label>
                        <textarea
                            id="instructions"
                            className="flex min-h-[70px] w-full rounded-xl border-2 border-gray-100 bg-gray-50/50 px-4 py-3 text-sm placeholder:text-gray-400 focus:border-orange-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all duration-200 resize-none"
                            placeholder="E.g. No onions, extra spicy, allergy info..."
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                        />
                    </div>

                    <DialogFooter className="flex-col sm:flex-col gap-4 p-0">
                        {/* Quantity Selector */}
                        <div className="flex items-center justify-between w-full p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl border border-gray-100">
                            <span className="font-semibold text-gray-700">Quantity</span>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className={cn(
                                        "h-10 w-10 rounded-full border-2 transition-all duration-200",
                                        quantity <= 1
                                            ? "border-gray-200 text-gray-300"
                                            : "border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300"
                                    )}
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    disabled={quantity <= 1}
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <span className="font-bold text-xl w-8 text-center tabular-nums">{quantity}</span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className={cn(
                                        "h-10 w-10 rounded-full border-2 transition-all duration-200",
                                        quantity >= effectiveMaxQty
                                            ? "border-gray-200 text-gray-300"
                                            : "border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300"
                                    )}
                                    onClick={() => setQuantity(Math.min(effectiveMaxQty, quantity + 1))}
                                    disabled={quantity >= effectiveMaxQty}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Add to Order Button */}
                        <Button
                            className="w-full h-14 text-base font-bold rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-200 transition-all duration-300 hover:shadow-xl hover:shadow-orange-300/50 hover:-translate-y-0.5"
                            onClick={handleAddToCart}
                        >
                            Add to Order — {currencySymbol}{((item.offer_price ?? item.price) * quantity).toFixed(2)}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}

