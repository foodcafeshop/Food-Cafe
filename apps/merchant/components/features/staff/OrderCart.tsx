"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MenuItem } from "@/lib/types";
import { getCurrencySymbol } from "@/lib/utils";
import { Trash2, Minus, Plus, ShoppingBag, Edit2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export interface CartItem extends MenuItem {
    quantity: number;
    notes?: string;
}

interface OrderCartProps {
    items: CartItem[];
    onUpdateQuantity: (itemId: string, delta: number) => void;
    onUpdateNote: (itemId: string, note: string) => void;
    onRemove: (itemId: string) => void;
    onPlaceOrder: () => void;
    loading?: boolean;
    tableLabel?: string;
}

export function OrderCart({ items, onUpdateQuantity, onUpdateNote, onRemove, onPlaceOrder, loading, tableLabel }: OrderCartProps) {
    const currency = getCurrencySymbol('INR');
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

    const subtotal = items.reduce((sum, item) => sum + ((item.offer_price || item.price) * item.quantity), 0);
    const tax = subtotal * 0.05; // Assuming 5% tax for display or simple calc
    // Ideally tax calculation logic should be shared or consistent. 
    // For now, let's just show Total Amount roughly or just subtotal if tax logic is complex on backend.
    // The backend `createOrder` might handle re-calc.
    // Let's show "Total" as sum of prices for now.

    const total = subtotal;

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center border-l bg-muted/10">
                <ShoppingBag className="h-12 w-12 mb-4 opacity-20" />
                <p>Cart is empty</p>
                <p className="text-sm">Select items from the menu to add them here.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full border-l bg-background">
            <div className="p-4 border-b bg-muted/30">
                <h2 className="font-semibold flex items-center justify-between">
                    <span>Current Order</span>
                    {tableLabel && <span className="text-sm bg-primary/10 text-primary px-2 py-0.5 rounded">Table {tableLabel}</span>}
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="p-4 flex flex-col gap-4">
                    {items.map((item) => (
                        <div key={item.id} className="flex flex-col gap-1 pb-3 border-b last:border-0 border-dashed">
                            <div className="flex gap-2">
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm truncate">{item.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {currency}{item.offer_price || item.price}
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => onUpdateQuantity(item.id, -1)}
                                    >
                                        <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-4 text-center text-sm font-medium">{item.quantity}</span>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => onUpdateQuantity(item.id, 1)}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={() => onRemove(item.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            {item.notes ? (
                                <div className="text-xs text-muted-foreground bg-muted/50 p-1.5 rounded flex justify-between items-start group-hover:bg-muted/80">
                                    <span>Note: {item.notes}</span>
                                    <Button variant="ghost" size="icon" className="h-4 w-4 -mt-0.5 ml-2" onClick={() => setEditingNoteId(item.id)}>
                                        <Edit2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            ) : (
                                <Button variant="link" size="sm" className="h-auto p-0 text-xs text-muted-foreground self-start" onClick={() => setEditingNoteId(item.id)}>
                                    + Add Note
                                </Button>
                            )}
                            {editingNoteId === item.id && (
                                <div className="flex gap-2 mt-1">
                                    <Input
                                        value={item.notes || ''}
                                        onChange={(e) => onUpdateNote(item.id, e.target.value)}
                                        placeholder="Add instructions..."
                                        className="h-7 text-xs"
                                        autoFocus
                                        onBlur={() => setEditingNoteId(null)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') setEditingNoteId(null) }}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-4 border-t bg-muted/10">
                <div className="flex justify-between items-center mb-4">
                    <span className="font-medium">Total</span>
                    <span className="font-bold text-lg">{currency}{total.toFixed(2)}</span>
                </div>
                <Button className="w-full" size="lg" onClick={onPlaceOrder} disabled={loading}>
                    {loading ? "Placing Order..." : `Place Order • ${currency}${total.toFixed(2)}`}
                </Button>
            </div>
        </div>
    );
}
