"use client";

import { useCartStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ChevronLeft, Banknote } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOrderStore } from "@/lib/order-store";
import { useSettingsStore } from "@/lib/settings-store";
import { useEffect } from "react";
import { createOrder, createOrderItems, validateOrderItemsAvailability } from "@/lib/api";
import { toast } from "sonner";
import { getCurrencySymbol } from "@/lib/utils";
import { PlacedOrders } from "@/components/features/cart/placed-orders";
import { OrderDetailsDialog } from "@/components/features/order/order-details-dialog";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCartAvailability } from "@/lib/hooks/use-cart-availability";

import { ShopHeader } from "@/components/features/landing/shop-header";
import { QuickActionsBar } from "@/components/features/landing/quick-actions-bar";

interface CartContentProps {
    initialSettings: any;
    shopId: string;
    shop: any;
}

export function CartContent({ initialSettings, shopId, shop }: CartContentProps) {
    const { items, updateQuantity, totalPrice, clearCart, tableId } = useCartStore();
    const { taxRate, taxIncludedInPrice, updateSettings } = useSettingsStore();
    const router = useRouter();

    const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

    // Sync settings from server to store
    useEffect(() => {
        if (initialSettings) {
            updateSettings({
                taxRate: initialSettings.tax_rate,
                taxIncludedInPrice: initialSettings.tax_included_in_price,
                currency: initialSettings.currency,
            });
        }
    }, [initialSettings, updateSettings]);

    // Use custom hook for availability
    const { unavailableItemIds } = useCartAvailability(items, shopId);

    // Calculate total only for available items
    const availableItems = items.filter(i => !unavailableItemIds.has(i.id));
    const subtotal = availableItems.reduce((acc, item) => acc + (item.offer_price ?? item.price) * item.quantity, 0);

    // Priority: Props (Server) -> Store (Client) -> Default
    const activeTaxRate = initialSettings?.tax_rate ?? taxRate ?? 5;
    const activeTaxIncluded = initialSettings?.tax_included_in_price ?? taxIncludedInPrice ?? false;

    let taxAmount = 0;
    let totalAmount = 0;

    if (activeTaxIncluded) {
        // If tax is included, the subtotal IS the total amount the user pays
        totalAmount = subtotal;
        // Back-calculate tax: Price = Cost * (1 + TaxRate/100) -> Cost = Price / (1 + TaxRate/100) -> Tax = Price - Cost
        taxAmount = subtotal - (subtotal / (1 + activeTaxRate / 100));
    } else {
        // If tax is excluded, add tax on top
        taxAmount = subtotal * (activeTaxRate / 100);
        totalAmount = subtotal + taxAmount;
    }

    // Use prop settings for immediate render, fallback to store if needed
    const currencySymbol = getCurrencySymbol(initialSettings?.currency);

    const handlePlaceOrder = async () => {
        // Get the latest tableId and calculate total from the store directly to avoid stale closures
        const currentTableId = useCartStore.getState().tableId;
        const allItems = useCartStore.getState().items;
        // Re-validate availability just in case (using local state is risky inside async handler if it's stale, but we use realtime)
        // Better to filter `allItems` against `unavailableItemIds` from state (which is kept fresh).
        const currentItems = allItems.filter(i => !unavailableItemIds.has(i.id));

        if (currentItems.length === 0) {
            toast.error("No available items in cart to place order.");
            return;
        }

        // Re-calculate totals inside handler to ensure freshness
        // useSettingsStore state should be updated by useEffect, but we use fallback just in case
        const { taxRate, taxIncludedInPrice } = useSettingsStore.getState();

        // Prefer store value if set (by effect), otherwise fallback to props/defaults
        // Note: initialSettings is available in closure
        const currentRate = taxRate ?? initialSettings?.tax_rate ?? 5;
        const isTaxIncluded = taxIncludedInPrice ?? initialSettings?.tax_included_in_price ?? false;

        const currentSubtotal = currentItems.reduce((acc, item) => acc + (item.offer_price ?? item.price) * item.quantity, 0);
        let currentTax = 0;
        let currentTotal = 0;

        if (isTaxIncluded) {
            currentTotal = currentSubtotal;
            currentTax = currentSubtotal - (currentSubtotal / (1 + currentRate / 100));
        } else {
            currentTax = currentSubtotal * (currentRate / 100);
            currentTotal = currentSubtotal + currentTax;
        }

        if (!currentTableId) {
            toast.error("Please scan a QR code to place an order.");
            return;
        }

        try {
            // 1. Create Order
            // 1. Validate Item Availability (Real-time check)
            const { valid, unavailableItems } = await validateOrderItemsAvailability(currentItems.map(i => ({ id: i.id, name: i.name })));

            if (!valid) {
                toast.error(`Some items are no longer available: ${unavailableItems.join(", ")}. Please remove them to proceed.`);
                return;
            }

            const { customerName, customerPhone, setWelcomeOpen } = useCartStore.getState();

            if (!customerName) {
                setWelcomeOpen(true, 'checkout');
                return;
            }

            const orderData = {
                shop_id: shopId,
                table_id: currentTableId,
                status: 'queued',
                total_amount: currentTotal,
                payment_status: 'pending',
                payment_method: 'cash', // Default
                customer_name: customerName,
                customer_phone: customerPhone
            };

            const newOrder = await createOrder(orderData);

            if (!newOrder) {
                throw new Error("Failed to create order");
            }

            if (currentItems.length === 0) {
                toast.error("No available items to order. Please update your cart.");
                return;
            }

            // 2. Create Order Items
            const orderItems = currentItems.map(item => ({
                order_id: newOrder.id,
                menu_item_id: item.id,
                name: item.name,
                price: item.offer_price ?? item.price,
                quantity: item.quantity,
                notes: item.notes
            }));

            await createOrderItems(orderItems);

            // 3. Clear Cart & Open Dialog
            clearCart();
            toast.success("Order placed successfully!");

            // Open Dialog instead of redirecting
            setSelectedOrderId(newOrder.id);
            setIsOrderDialogOpen(true);

        } catch (error: any) {
            console.error("Order placement failed:", error);
            // Display specific error message if available (e.g. "Table is currently billed")
            if (error instanceof Error || (error && error.message)) {
                toast.error(error.message || "Failed to place order.");
                // Refresh the page to update shop status (is_open/is_live flags)
                router.refresh();
            } else {
                toast.error("Failed to place order. Please try again.");
            }
        }
    };

    const handleOrderClick = (orderId: string) => {
        setSelectedOrderId(orderId);
        setIsOrderDialogOpen(true);
    };

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 pb-20">
                <ShopHeader shop={shop} slug={shop.slug} showHomeLink={true} showMenuLink={true} showCartLink={false} showSearch={false} />

                <main className="container max-w-7xl mx-auto px-4 py-6 space-y-8">
                    {/* Empty Cart Message */}
                    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-gray-100 text-center">
                        <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <img src="https://cdni.iconscout.com/illustration/premium/thumb/empty-cart-2130356-1800917.png" alt="Empty Cart" className="w-24 opacity-50 mix-blend-multiply" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Your Cart is Empty</h2>
                        <p className="text-gray-500 max-w-xs mt-2">Ready to order? Browse our menu for delicious options.</p>
                        <Link href={`/${shop.slug}/menu`}>
                            <Button className="bg-orange-500 hover:bg-orange-600 text-white mt-4">Browse Menu</Button>
                        </Link>
                    </div>

                    {/* Placed Orders */}
                    <PlacedOrders currencySymbol={currencySymbol} onOrderClick={handleOrderClick} />
                </main>

                <OrderDetailsDialog
                    isOpen={isOrderDialogOpen}
                    onClose={() => setIsOrderDialogOpen(false)}
                    orderId={selectedOrderId}
                    currencySymbol={currencySymbol}
                />

                <QuickActionsBar slug={shop.slug} activePage="cart" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-32 md:pb-12">
            <ShopHeader shop={shop} slug={shop.slug} showHomeLink={true} showMenuLink={true} showCartLink={false} showSearch={false} />

            <main className="container max-w-7xl mx-auto px-4 py-6">
                <div className="grid md:grid-cols-3 gap-8 items-start">
                    {/* Left Column: Cart Items */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            {items.map((item) => {
                                const isUnavailable = unavailableItemIds.has(item.id);
                                return (
                                    <div key={item.id} className={`flex gap-4 p-4 border-b border-gray-100 last:border-none ${isUnavailable ? 'opacity-60 bg-gray-50' : ''}`}>
                                        <div className="w-24 h-24 shrink-0 relative">
                                            <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover rounded-lg grayscale-[50%]" style={{ filter: isUnavailable ? 'grayscale(100%)' : 'none' }} />
                                            {isUnavailable && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                                                    <span className="text-white text-xs font-bold px-2 py-1 bg-red-600 rounded">Out of Stock</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-800 text-sm md:text-base line-clamp-1">{item.name}</h3>
                                            <div className="font-medium text-gray-600 text-sm mt-1">
                                                {isUnavailable ? (
                                                    <span className="text-red-500 text-xs">Item unavailable</span>
                                                ) : (
                                                    <>{currencySymbol}{((item.offer_price ?? item.price) * item.quantity).toFixed(2)}</>
                                                )}
                                            </div>
                                            {item.notes && (
                                                <p className="text-xs text-gray-400 italic mt-1 line-clamp-2">
                                                    Note: {item.notes}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end justify-between gap-2">
                                            {/* Allow removing even if out of stock */}
                                            {(() => {
                                                const maxQty = item.max_quantity || initialSettings?.max_item_quantity || 10;
                                                return (
                                                    <div className="flex items-center justify-between bg-white border border-gray-200 rounded-md shadow-sm h-8 w-20 px-2">
                                                        <button
                                                            className="text-gray-400 hover:text-green-600"
                                                            onClick={() => updateQuantity(item.id, -1)}
                                                        >
                                                            <Minus className="w-3 h-3" />
                                                        </button>
                                                        <span className={`font-bold text-sm ${isUnavailable ? 'text-gray-400' : 'text-green-600'}`}>{item.quantity}</span>
                                                        <button
                                                            className={isUnavailable || item.quantity >= maxQty ? "text-gray-300 cursor-not-allowed" : "text-green-600 hover:text-green-700"}
                                                            disabled={isUnavailable || item.quantity >= maxQty}
                                                            onClick={() => item.quantity < maxQty && updateQuantity(item.id, 1)}
                                                        >
                                                            <Plus className={`w-3 h-3 ${isUnavailable || item.quantity >= maxQty ? 'text-gray-300' : ''}`} />
                                                        </button>
                                                    </div>
                                                );
                                            })()}
                                            <span className="text-xs text-gray-400 font-medium">
                                                {currencySymbol}{item.offer_price ?? item.price} x {item.quantity}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Placed Orders Section */}
                        <div className="pt-4">
                            <PlacedOrders currencySymbol={currencySymbol} onOrderClick={handleOrderClick} />
                        </div>
                    </div>

                    <OrderDetailsDialog
                        isOpen={isOrderDialogOpen}
                        onClose={() => setIsOrderDialogOpen(false)}
                        orderId={selectedOrderId}
                        currencySymbol={currencySymbol}
                    />

                    {/* Right Column: Bill & Payment (Sticky on Desktop) */}
                    <div className="space-y-6 md:sticky md:top-24">
                        {/* Bill Details */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-2">Bill Details</h3>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Item Total</span>
                                <span>{currencySymbol}{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600 border-b border-dashed border-gray-200 pb-4">
                                <span>
                                    {taxIncludedInPrice ? `Tax (Included in price)` : `Tax (${taxRate}%)`}
                                </span>
                                <span>{currencySymbol}{taxAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-gray-800 text-lg pt-2">
                                <span>To Pay</span>
                                <span>{currencySymbol}{totalAmount.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Payment Method</h3>
                            <div className="grid grid-cols-1 gap-3">
                                <Button variant="outline" className="h-auto py-4 justify-start gap-4 border-green-500 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800">
                                    <Banknote className="h-6 w-6" />
                                    <div className="flex flex-col items-start">
                                        <span className="font-bold text-sm">Pay Cash / UPI at Counter</span>
                                        <span className="text-xs opacity-80">Pay after eating</span>
                                    </div>
                                </Button>
                            </div>
                        </div>

                        {/* Desktop Checkout Button */}
                        <Button
                            size="lg"
                            className={`w-full text-lg font-bold h-14 text-white shadow-lg hidden md:flex justify-between px-6 ${(!shop.is_open || !shop.is_live) ? 'bg-gray-400 cursor-not-allowed shadow-none' : 'bg-green-600 hover:bg-green-700 shadow-green-200'}`}
                            onClick={handlePlaceOrder}
                            disabled={!shop.is_open || !shop.is_live}
                        >
                            <div className="flex flex-col items-start leading-none">
                                <span className="text-[10px] font-medium opacity-80 uppercase">Total</span>
                                <span>{currencySymbol}{totalAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span>{shop.is_open && shop.is_live ? 'Place Order' : 'Shop Closed'}</span>
                                {shop.is_open && shop.is_live && <ChevronLeft className="h-5 w-5 rotate-180" />}
                            </div>
                        </Button>
                        {(!shop.is_open || !shop.is_live) && (
                            <p className="text-red-500 text-sm font-medium text-center bg-red-50 p-2 rounded-lg border border-red-100">
                                This shop is currently not accepting orders.
                            </p>
                        )}
                    </div>
                </div>
            </main>

            {/* Mobile Checkout Footer - floating button above navigation */}
            <div className="md:hidden fixed bottom-20 left-0 right-0 px-4 z-40">
                <div className="container max-w-md mx-auto space-y-2">
                    {(!shop.is_open || !shop.is_live) && (
                        <div className="bg-red-600 text-white text-xs font-bold py-2 px-4 rounded-xl text-center shadow-lg animate-in slide-in-from-bottom-5">
                            Shop is currently closed for orders
                        </div>
                    )}
                    <Button
                        size="lg"
                        className={`w-full text-lg font-bold h-14 text-white shadow-xl flex justify-between px-6 rounded-2xl ${(!shop.is_open || !shop.is_live) ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                        onClick={handlePlaceOrder}
                        disabled={!shop.is_open || !shop.is_live}
                    >
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-[10px] font-medium opacity-80 uppercase">Total</span>
                            <span className="font-extrabold">{currencySymbol}{totalAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2 font-bold">
                            <span>{shop.is_open && shop.is_live ? 'Place Order' : 'Shop Closed'}</span>
                            {shop.is_open && shop.is_live && <ChevronLeft className="h-5 w-5 rotate-180" />}
                        </div>
                    </Button>
                </div>
            </div>

            {/* Mobile Navigation Footer */}
            <QuickActionsBar slug={shop.slug} activePage="cart" />
        </div>
    );
}
