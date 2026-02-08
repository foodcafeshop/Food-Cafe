"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MenuItem } from "@/lib/types";
import { getCurrencySymbol } from "@/lib/utils";
import { Trash2, Minus, Plus, ShoppingBag, Edit2, User, Phone, ChevronDown, ChevronUp, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";

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
    customerName: string;
    customerPhone: string;
    onCustomerDetailsChange: (details: { name?: string; phone?: string }) => void;
    isPhoneMandatory?: boolean;
}

export function OrderCart({
    items,
    onUpdateQuantity,
    onUpdateNote,
    onRemove,
    onPlaceOrder,
    loading,
    tableLabel,
    customerName,
    customerPhone,
    onCustomerDetailsChange,
    isPhoneMandatory
}: OrderCartProps) {
    const currency = getCurrencySymbol('INR');
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<'cart' | 'customer' | 'none'>('cart');
    const [isCustomerDesktopOpen, setIsCustomerDesktopOpen] = useState(!customerName && !customerPhone);

    const subtotal = items.reduce((sum, item) => sum + ((item.offer_price || item.price) * item.quantity), 0);
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

    const toggleMainSection = () => {
        if (activeSection === 'none') {
            setActiveSection('cart');
        } else {
            setActiveSection('none');
        }
    };

    const toggleCustomerSection = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Mobile Toggle Logic
        if (activeSection === 'customer') {
            setActiveSection('cart');
        } else {
            setActiveSection('customer');
        }
        // Desktop Toggle Logic (Independent)
        setIsCustomerDesktopOpen(prev => !prev);
    };

    const handlePlaceOrderClick = async () => {
        // Local Validation for Mandatory Details to UX guidance
        if (isPhoneMandatory) {
            if (!customerName) {
                setActiveSection('customer');
                setIsCustomerDesktopOpen(true);
                toast.error("Customer Name is mandatory.");
                return;
            }
            if (!customerPhone) {
                setActiveSection('customer');
                setIsCustomerDesktopOpen(true);
                toast.error("Customer Phone Number is mandatory.");
                return;
            }
            if (customerPhone.length !== 10) {
                setActiveSection('customer');
                setIsCustomerDesktopOpen(true);
                toast.error("Please enter a valid 10-digit Phone Number.");
                return;
            }
        }

        try {
            await onPlaceOrder();
        } catch (error: any) {
            // Fallback for other errors
            console.error("Order error", error);
        }
    };

    return (
        <div className="flex flex-col h-full lg:border-l bg-background">
            <div className="p-4 border-b bg-muted/30 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
                <div
                    className="flex items-center gap-2 cursor-pointer select-none"
                    onClick={toggleMainSection}
                >
                    <h2 className="font-semibold flex items-center gap-2">
                        <span className="lg:hidden">{activeSection === 'customer' ? 'Customer Details' : 'Current Order'}</span>
                        <span className="hidden lg:inline">Current Order</span>
                        {tableLabel && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{tableLabel}</span>}
                    </h2>
                    <div className="lg:hidden">
                        {activeSection !== 'none' ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleCustomerSection}
                    className={activeSection === 'customer' || isCustomerDesktopOpen ? "bg-accent text-accent-foreground" : "text-muted-foreground"}
                >
                    <span className="lg:hidden">
                        {activeSection === 'customer' ? <List className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    </span>
                    <span className="hidden lg:inline">
                        <User className="h-4 w-4" />
                    </span>
                </Button>
            </div>

            <div className="flex-1 flex flex-col min-h-0 relative">
                <div className={`${activeSection === 'customer' ? 'block' : 'hidden'} ${isCustomerDesktopOpen ? 'lg:block' : 'lg:hidden'} p-4 bg-background space-y-3 animate-in slide-in-from-top-2 duration-200 border-b`}>
                    <div className="space-y-1">
                        <Label htmlFor="customerName" className="text-xs text-muted-foreground">
                            Customer Name {isPhoneMandatory ? <span className="text-destructive">*</span> : ''}
                        </Label>
                        <div className="relative">
                            <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="customerName"
                                placeholder="Guest Name"
                                className="pl-9 h-9"
                                value={customerName}
                                onChange={(e) => onCustomerDetailsChange({ name: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="customerPhone" className="text-xs text-muted-foreground">
                            Phone Number {isPhoneMandatory ? <span className="text-destructive">*</span> : '(Optional)'}
                        </Label>
                        <div className="relative">
                            <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="customerPhone"
                                type="tel"
                                placeholder="10-digits phone number"
                                className="pl-9 h-9"
                                value={customerPhone}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                    onCustomerDetailsChange({ phone: val });
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div className={`${activeSection === 'cart' ? 'flex flex-col flex-1 overflow-y-auto min-h-0 max-h-[40vh] lg:max-h-none' : 'hidden'} lg:flex lg:flex-col lg:flex-1 lg:overflow-y-auto lg:min-h-0`}>
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
            </div>

            <div className="p-4 border-t bg-muted/10">
                <Button className="w-full" size="lg" onClick={handlePlaceOrderClick} disabled={loading}>
                    {loading ? "Placing Order..." : `Place Order • ${currency}${total.toFixed(2)}`}
                </Button>
            </div>
        </div>
    );
}
