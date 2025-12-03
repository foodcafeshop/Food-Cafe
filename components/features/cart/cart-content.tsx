"use client";

import { useCartStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ChevronLeft, Banknote } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOrderStore } from "@/lib/order-store";
import { useSettingsStore } from "@/lib/settings-store";
import { useEffect } from "react";
import { createOrder, createOrderItems } from "@/lib/api";
import { toast } from "sonner";
import { getCurrencySymbol } from "@/lib/utils";
import { PlacedOrders } from "@/components/features/cart/placed-orders";

interface CartContentProps {
    initialSettings: any;
}

export function CartContent({ initialSettings }: CartContentProps) {
    const { items, updateQuantity, totalPrice, clearCart, tableId } = useCartStore();
    const { updateSettings } = useSettingsStore();
    const router = useRouter();

    // Sync settings on mount
    useEffect(() => {
        if (initialSettings) {
            updateSettings({
                currency: initialSettings.currency,
                taxRate: initialSettings.tax_rate,
                serviceCharge: initialSettings.service_charge,
                restaurantName: initialSettings.restaurant_name
            });
        }
    }, [initialSettings, updateSettings]);

    const subtotal = totalPrice();
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    // Use prop settings for immediate render, fallback to store if needed
    const currencySymbol = getCurrencySymbol(initialSettings?.currency);

    const handlePlaceOrder = async () => {
        // Get the latest tableId and calculate total from the store directly to avoid stale closures
        const currentTableId = useCartStore.getState().tableId;
        const currentItems = useCartStore.getState().items;
        const currentSubtotal = currentItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const currentTax = currentSubtotal * 0.1;
        const currentTotal = currentSubtotal + currentTax;

        if (!currentTableId) {
            toast.error("Please scan a QR code to place an order.");
            return;
        }

        try {
            // 1. Create Order
            const orderData = {
                table_id: currentTableId,
                status: 'queued',
                total_amount: currentTotal,
                payment_status: 'pending',
                payment_method: 'cash' // Default
            };

            const newOrder = await createOrder(orderData);

            if (!newOrder) {
                throw new Error("Failed to create order");
            }

            // 2. Create Order Items
            const orderItems = items.map(item => ({
                order_id: newOrder.id,
                menu_item_id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                notes: item.notes
            }));

            await createOrderItems(orderItems);

            // 3. Clear Cart & Redirect
            clearCart();
            toast.success("Order placed successfully!");
            router.push(`/order/${newOrder.id}`);

        } catch (error) {
            console.error("Order placement failed:", error);
            toast.error("Failed to place order. Please try again.");
        }
    };

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 pb-20">
                <header className="sticky top-0 z-50 bg-white shadow-sm">
                    <div className="container max-w-7xl mx-auto flex h-20 items-center justify-between px-4">
                        <div className="flex items-center gap-4">
                            <Link href="/menu">
                                <Button variant="ghost" size="icon" className="-ml-2 text-gray-600">
                                    <ChevronLeft className="h-6 w-6" />
                                </Button>
                            </Link>
                            <h1 className="font-bold text-lg text-gray-800">Your Orders</h1>
                        </div>
                    </div>
                </header>

                <main className="container max-w-7xl mx-auto px-4 py-6 space-y-8">
                    {/* Empty Cart Message */}
                    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-gray-100 text-center">
                        <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <img src="https://cdni.iconscout.com/illustration/premium/thumb/empty-cart-2130356-1800917.png" alt="Empty Cart" className="w-24 opacity-50 mix-blend-multiply" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Your Cart is Empty</h2>
                        <p className="text-gray-500 max-w-xs mt-2">Ready to order? Browse our menu for delicious options.</p>
                        <Link href="/menu">
                            <Button className="bg-orange-500 hover:bg-orange-600 text-white mt-4">Browse Menu</Button>
                        </Link>
                    </div>

                    {/* Placed Orders */}
                    <PlacedOrders currencySymbol={currencySymbol} />
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-32 md:pb-12">
            <header className="sticky top-0 z-50 bg-white shadow-sm">
                <div className="container max-w-7xl mx-auto flex h-20 items-center justify-between px-4">
                    <div className="flex items-center gap-4">
                        <Link href="/menu">
                            <Button variant="ghost" size="icon" className="-ml-2 text-gray-600">
                                <ChevronLeft className="h-6 w-6" />
                            </Button>
                        </Link>
                        <div className="flex flex-col">
                            <h1 className="font-bold text-lg text-gray-800 leading-none">Cart</h1>
                            <p className="text-xs text-gray-500 mt-1">{items.length} Items</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href="/">
                            <Button variant="ghost" className="text-gray-600 font-medium hidden md:flex">
                                Home
                            </Button>
                        </Link>
                        <Link href="/menu">
                            <Button variant="ghost" className="text-orange-500 font-medium hidden md:flex">
                                Menu
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="container max-w-7xl mx-auto px-4 py-6">
                <div className="grid md:grid-cols-3 gap-8 items-start">
                    {/* Left Column: Cart Items */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            {items.map((item) => (
                                <div key={item.id} className="flex gap-4 p-4 border-b border-gray-100 last:border-none">
                                    <div className="w-24 h-24 shrink-0">
                                        <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-800 text-sm md:text-base line-clamp-1">{item.name}</h3>
                                        <div className="font-medium text-gray-600 text-sm mt-1">{currencySymbol}{(item.price * item.quantity).toFixed(2)}</div>
                                    </div>
                                    <div className="flex flex-col items-end justify-between gap-2">
                                        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-md shadow-sm h-8 w-20 px-2">
                                            <button
                                                className="text-gray-400 hover:text-green-600"
                                                onClick={() => updateQuantity(item.id, -1)}
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="text-green-600 font-bold text-sm">{item.quantity}</span>
                                            <button
                                                className="text-green-600 hover:text-green-700"
                                                onClick={() => updateQuantity(item.id, 1)}
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <span className="text-xs text-gray-400 font-medium">
                                            {currencySymbol}{item.price} x {item.quantity}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Placed Orders Section */}
                        <div className="pt-4">
                            <PlacedOrders currencySymbol={currencySymbol} />
                        </div>
                    </div>

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
                                <span>Taxes & Charges (10%)</span>
                                <span>{currencySymbol}{tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-gray-800 text-lg pt-2">
                                <span>To Pay</span>
                                <span>{currencySymbol}{total.toFixed(2)}</span>
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
                        <Button size="lg" className="w-full text-lg font-bold h-14 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200 hidden md:flex justify-between px-6" onClick={handlePlaceOrder}>
                            <div className="flex flex-col items-start leading-none">
                                <span className="text-[10px] font-medium opacity-80 uppercase">Total</span>
                                <span>{currencySymbol}{total.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span>Place Order</span>
                                <ChevronLeft className="h-5 w-5 rotate-180" />
                            </div>
                        </Button>
                    </div>
                </div>
            </main>

            {/* Mobile Checkout Footer */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-50">
                <div className="container max-w-7xl mx-auto">
                    <Button size="lg" className="w-full text-lg font-bold h-12 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200 flex justify-between px-6" onClick={handlePlaceOrder}>
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-[10px] font-medium opacity-80 uppercase">Total</span>
                            <span>{currencySymbol}{total.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span>Place Order</span>
                            <ChevronLeft className="h-5 w-5 rotate-180" />
                        </div>
                    </Button>
                </div>
            </div>
        </div>
    );
}
