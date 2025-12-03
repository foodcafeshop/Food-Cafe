"use client";

import { MenuItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store";
import { Minus, Plus, Star } from "lucide-react";
import { useState } from "react";
import { ItemDetailModal } from "./item-detail-modal";
import { VegIcon, NonVegIcon } from "@/components/ui/icons";

interface MenuItemCardProps {
    item: MenuItem;
    currencySymbol?: string;
}

export function MenuItemCard({ item, currencySymbol = '$' }: MenuItemCardProps) {
    const { items, addItem, updateQuantity } = useCartStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const cartItem = items.find((i) => i.id === item.id);
    const quantity = cartItem ? cartItem.quantity : 0;

    const handleAdd = () => {
        addItem(item);
    };

    return (
        <>
            <div className="flex justify-between py-6 border-b border-gray-200 last:border-none gap-4">
                {/* Left Side: Text Info */}
                <div className="flex-1 flex flex-col gap-1">
                    <div className="mb-1">
                        {item.dietary_type === 'veg' ? (<VegIcon />) : (<NonVegIcon />)}
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg">{item.name}</h3>
                    <div className="font-medium text-gray-700 text-sm">{currencySymbol}{item.price}</div>
                    {item.is_popular && (
                        <div className="flex items-center gap-1 text-xs font-semibold text-yellow-500 mt-1">
                            <Star className="w-3 h-3 fill-current" />
                            <span>Bestseller</span>
                        </div>
                    )}
                    {item.average_rating > 0 && (
                        <div className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 w-fit px-1.5 py-0.5 rounded mt-1 border border-green-100">
                            <Star className="w-3 h-3 fill-green-700" />
                            <span>{item.average_rating}</span>
                            <span className="text-gray-400 font-normal">({item.rating_count})</span>
                        </div>
                    )}
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed">{item.description}</p>
                </div>

                {/* Right Side: Image & Add Button */}
                <div className="relative w-32 h-32 shrink-0">
                    <div className="w-full h-28 rounded-xl overflow-hidden shadow-sm">
                        <img src={item.images[0] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'} alt={item.name} className="w-full h-full object-cover" onClick={() => setIsModalOpen(true)} />
                    </div>

                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24">
                        {!item.is_available ? (
                            <Button disabled className="w-full bg-gray-100 text-gray-400 border-gray-200 font-bold shadow-none h-9 uppercase text-xs z-10 relative cursor-not-allowed">
                                Sold Out
                            </Button>
                        ) : quantity === 0 ? (
                            <Button variant="outline" className="w-full bg-white text-green-600 border-gray-300 hover:bg-green-50 font-bold shadow-md h-9 uppercase text-sm z-10 relative" onClick={() => setIsModalOpen(true)}>ADD</Button>
                        ) : (
                            <div className="flex items-center justify-between bg-white border border-gray-300 rounded-md shadow-sm h-9 px-2">
                                <button className="text-gray-500 hover:text-green-600" onClick={() => updateQuantity(item.id, -1)}><Minus className="w-3 h-3" /></button>
                                <span className="text-green-600 font-bold text-sm">{quantity}</span>
                                <button className="text-green-600 hover:text-green-700" onClick={() => updateQuantity(item.id, 1)}><Plus className="w-3 h-3" /></button>
                            </div>
                        )}
                    </div>
                    {quantity === 0 && item.is_available && (
                        <div className="text-[10px] text-gray-500 text-center mt-3">Customisable</div>
                    )}
                </div>
            </div>

            <ItemDetailModal
                item={item}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                currencySymbol={currencySymbol}
            />
        </>
    );
}
