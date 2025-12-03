"use client";

import { MenuItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";



interface ItemDetailModalProps {
    item: MenuItem | null;
    isOpen: boolean;
    onClose: () => void;
    currencySymbol: string;
}

export function ItemDetailModal({ item, isOpen, onClose, currencySymbol }: ItemDetailModalProps) {
    const [quantity, setQuantity] = useState(1);
    const { addItem } = useCartStore();

    if (!item) return null;

    const handleAddToCart = () => {
        addItem({ ...item, quantity });
        onClose();
        setQuantity(1);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden gap-0">
                <div className="relative h-56 w-full">
                    <img
                        src={item.images[0] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'}
                        alt={item.name}
                        className="w-full h-full object-cover"
                    />
                    <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-4 right-4 rounded-full opacity-80 hover:opacity-100"
                        onClick={onClose}
                    >
                        <span className="sr-only">Close</span>
                        ×
                    </Button>
                </div>

                <div className="p-6 space-y-6">
                    <DialogHeader className="space-y-2 text-left">
                        <div className="flex justify-between items-start">
                            <DialogTitle className="text-2xl font-bold">{item.name}</DialogTitle>
                            <Badge variant="outline" className="text-lg font-bold border-primary text-primary">
                                {currencySymbol}{item.price}
                            </Badge>
                        </div>
                        <DialogDescription className="text-base">
                            {item.description}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Customizations Placeholder */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Preferences</h4>
                        <div className="grid gap-2">
                            <div className="flex items-center space-x-2">
                                <input type="checkbox" id="spicy" className="rounded border-gray-300 text-primary focus:ring-primary" />
                                <label htmlFor="spicy" className="text-sm font-medium">Make it Spicy</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input type="checkbox" id="cutlery" className="rounded border-gray-300 text-primary focus:ring-primary" defaultChecked />
                                <label htmlFor="cutlery" className="text-sm font-medium">Include Cutlery</label>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex-col sm:flex-col gap-4">
                        <div className="flex items-center justify-between w-full p-4 bg-muted/30 rounded-lg">
                            <span className="font-medium">Quantity</span>
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-full"
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    disabled={quantity <= 1}
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <span className="font-bold w-4 text-center">{quantity}</span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-full"
                                    onClick={() => setQuantity(quantity + 1)}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <Button className="w-full h-12 text-lg font-bold" onClick={handleAddToCart}>
                            Add to Order - {currencySymbol}{(item.price * quantity).toFixed(2)}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
