"use client";

import { useState, useEffect } from "react";
import { TableSelector } from "@/components/features/staff/TableSelector";
import { MenuBrowser } from "@/components/features/staff/MenuBrowser";
import { OrderCart, CartItem } from "@/components/features/staff/OrderCart";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { MenuItem } from "@/lib/types";
import { createOrder, joinTable } from "@/lib/api";
import { useShopId } from "@/lib/hooks/use-shop-id";
import { toast } from "sonner";
import { generateOrderNumber } from "@/lib/utils";

import { BillingDialog } from "@/components/features/staff/BillingDialog";

import { useRouter } from "next/navigation";

// ...

export default function TakeOrderPage() {
    const { shopId, user } = useShopId();
    const router = useRouter();
    const [step, setStep] = useState<'table' | 'order'>('table');
    const [selectedTable, setSelectedTable] = useState<{ id: string; label: string } | null>(null);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);

    // Billing State
    const [billingTableId, setBillingTableId] = useState<string | null>(null);
    const [billingTableLabel, setBillingTableLabel] = useState<string>('');
    const [settings, setSettings] = useState<any>(null);

    useEffect(() => {
        if (shopId) {
            import("@/lib/api").then(({ getSettings }) => getSettings(shopId).then(setSettings));
        }
    }, [shopId]);

    // Check Hash and Listen for Changes
    useEffect(() => {
        const checkHash = async () => {
            // Wait for window to be available
            if (typeof window === 'undefined') return;

            const hash = window.location.hash;
            if (hash && hash.length > 1 && shopId) {
                const label = hash.substring(1);
                try {
                    const { data } = await import("@/lib/supabase").then(async ({ supabase }) =>
                        supabase.from('tables').select('id, label').eq('shop_id', shopId).eq('label', label).single()
                    );

                    if (data) {
                        setSelectedTable(data);
                        setStep('order');
                    }
                } catch (e) {
                    console.error("Failed to load table from hash", e);
                }
            } else {
                // If no hash, go back to table view
                setStep('table');
                setSelectedTable(null);
            }
        };

        checkHash();

        window.addEventListener('hashchange', checkHash);
        return () => {
            window.removeEventListener('hashchange', checkHash);
        };
    }, [shopId]);

    const handleTableSelect = (id: string, label: string) => {
        setSelectedTable({ id, label });
        setStep('order');
        router.push(`/admin/take-order#${label}`);
    };

    const handleBackToTables = () => {
        if (cartItems.length > 0) {
            if (confirm("Cart will be cleared. Continue?")) {
                setCartItems([]);
                setStep('table');
                setSelectedTable(null);
                router.push('/admin/take-order');
            }
        } else {
            setStep('table');
            setSelectedTable(null);
            router.push('/admin/take-order');
        }
    };

    const addToCart = (item: MenuItem) => {
        setCartItems(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...item, quantity: 1 }];
        });
        toast.success(`Added ${item.name}`);
    };

    const updateQuantity = (itemId: string, delta: number) => {
        setCartItems(prev => {
            return prev.map(i => {
                if (i.id === itemId) {
                    return { ...i, quantity: Math.max(0, i.quantity + delta) };
                }
                return i;
            }).filter(i => i.quantity > 0);
        });
    };

    const removeItem = (itemId: string) => {
        setCartItems(prev => prev.filter(i => i.id !== itemId));
    };

    const updateItemNote = (itemId: string, note: string) => {
        setCartItems(prev => prev.map(i => i.id === itemId ? { ...i, notes: note } : i));
    };

    const handlePlaceOrder = async () => {
        if (!shopId || !selectedTable) return;

        setIsPlacingOrder(true);
        try {
            // Standard import handling or assuming supabase is available via import in a separate module if needed.
            // But since this is client side, let's use the standard import pattern if possible, 
            // or just ensure we await correctly.
            // The previous issue was likely error handling inside the callback not propagating or 
            // the async promise not being tracked by the button state correctly if waiting.

            // Let's use the top-level import for supabase if we can, but since the file 
            // didn't import it at top level in the previous `view_file` (it did import createOrder/joinTable from api?),
            // let's check imports.
            // Line 10: import { createOrder, joinTable } from "@/lib/api";
            // We can use `createOrder` directly! 
            // The previous implementation was re-implementing logic with raw supabase calls.
            // Let's use `createOrder` from `lib/api` which we imported!

            // Wait, `createOrder` in `lib/api` (as seen in `view_file` of `api.ts` earlier) 
            // takes an `order` object and inserts it.
            // But it doesn't handle `order_items`. 
            // `createOrderItems` exists in `api.ts` too.
            // Let's use those helpers.

            const subtotal = cartItems.reduce((sum, item) => sum + ((item.offer_price || item.price) * item.quantity), 0);

            const { taxIncludedInPrice, taxRate } = settings || {};
            const currentTaxRate = taxRate ?? 10;
            let totalAmount = subtotal;

            if (settings && !taxIncludedInPrice) {
                const taxAmount = subtotal * (currentTaxRate / 100);
                totalAmount = subtotal + taxAmount;
            }
            const orderNumber = generateOrderNumber(); // We need to import this or move it. 
            // util imports: `import { generateOrderNumber } from "@/lib/utils";` (Line 13)

            // 1. Create Order
            // We need to pass `order` object to `createOrder`. 
            // `createOrder` in `api.ts` handles `order_number` generation if not provided?
            // Checking `api.ts` `createOrder`:
            // It generates order number internally! `const orderNumber = generateOrderNumber();` (Line 248)
            // So we don't need to generate it here.

            const orderPayload = {
                shop_id: shopId,
                table_id: selectedTable.id,
                status: 'queued',
                total_amount: totalAmount,
                payment_status: 'pending',
                customer_name: 'Staff Order',
                // customer_phone: ... // Optional
                is_staff_order: true,
                staff_name: user?.user_metadata?.full_name || 'Staff',
                staff_id: user?.id,
            };

            // We need `createOrder` to return the created order so we get the ID.
            const newOrder = await createOrder(orderPayload);

            if (!newOrder) throw new Error("Failed to create order");

            // 2. Create Items
            // We need `createOrderItems` from `api.ts`. 
            // Let's import it.

            // We need to dynamcially import/use `createOrderItems` if not imported.
            // Or just add it to imports.
            // I will use `import("@/lib/api").then...` for `createOrderItems` if I don't change top imports.
            // But better to update top imports.
            // For now, let's stick to the cleanest fix.
            const { createOrderItems, updateTableStatus } = await import("@/lib/api");

            const itemsPayload = cartItems.map(item => ({
                order_id: newOrder.id,
                menu_item_id: item.id,
                quantity: item.quantity,
                price: item.offer_price || item.price,
                name: item.name, // order_items usually needs name/Snapshot? 
                // checking api.ts: `createOrderItems` inserts `...item`.
                // DB `order_items` usually has `name`, `price` snapshot.
                notes: item.notes || ''
            }));

            await createOrderItems(itemsPayload);

            // 3. Update Table Status
            // `updateTableStatus` is in `api.ts`.
            await updateTableStatus(selectedTable.id, 'occupied');

            toast.success("Order placed successfully");
            setCartItems([]);
            setStep('table');
            setSelectedTable(null);

        } catch (error: any) {
            console.error("Failed to place order", error);
            toast.error(error.message || "Failed to place order");
        } finally {
            setIsPlacingOrder(false);
        }
    };

    const handleBill = (tableId: string) => {
        // Need to find label?
        // We don't have tables list here in state directly (TableSelector has it).
        // Let's pass simple label or just ID. Or rely on TableSelector calling it with Label (if updated).
        // TableSelector `onBill` only passed ID.
        // I'll update `handleBill` to set state.

        setBillingTableId(tableId);
        // Ideally we fetch label or pass it. 
        // For now, let's just show "Table" or fetch it in dialog if needed? 
        // Dialog takes label.
        // TableSelector is a child.
        // I can just set ID.
        setBillingTableLabel("Table"); // Placeholder or improved later if needed.
    };

    const handleBillingSuccess = () => {
        setRefreshKey(prev => prev + 1);
        setBillingTableId(null);
    };

    const [refreshKey, setRefreshKey] = useState(0);

    const handleClearTable = async (tableId: string) => {
        try {
            // Dynamically import clearTable to avoid top-level import issues if any, 
            // though we could add to top imports. Sticking to pattern used for some other actions or just import it.
            // Actually, let's use the top-level import we will add.
            const { clearTable } = await import("@/lib/api");
            await clearTable(tableId);
            toast.success("Table marked as empty");
            setRefreshKey(prev => prev + 1);
            if (selectedTable?.id === tableId) {
                setSelectedTable(null);
                setStep('table');
                router.push('/admin/take-order');
            }
        } catch (error) {
            console.error("Failed to clear table", error);
            toast.error("Failed to mark table as empty");
        }
    };

    return (
        <div className="h-full flex flex-col p-6">
            <div className="flex items-center gap-4 mb-6">
                {step === 'order' && (
                    <Button variant="ghost" size="icon" onClick={handleBackToTables}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                )}
                <h1 className="text-2xl font-bold">
                    {step === 'table' ? 'Select Table' : `Taking Order: ${selectedTable?.label}`}
                </h1>
            </div>

            <div className="flex-1 min-h-0">
                {step === 'table' ? (
                    <TableSelector
                        key={refreshKey}
                        onSelect={handleTableSelect}
                        onBill={handleBill}
                        onClear={handleClearTable}
                        selectedTableId={null}
                    />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 h-full gap-6">
                        <div className="lg:col-span-2 h-full flex flex-col min-h-0">
                            <MenuBrowser onAddToCart={addToCart} />
                        </div>
                        <div className="lg:col-span-1 h-full min-h-0 bg-background border rounded-lg shadow-sm overflow-hidden">
                            <OrderCart
                                items={cartItems}
                                onUpdateQuantity={updateQuantity}
                                onRemove={removeItem}
                                onUpdateNote={updateItemNote}
                                onPlaceOrder={handlePlaceOrder}
                                loading={isPlacingOrder}
                                tableLabel={selectedTable?.label}
                            />
                        </div>
                    </div>
                )}
            </div>

            <BillingDialog
                open={!!billingTableId}
                onOpenChange={(open) => !open && setBillingTableId(null)}
                tableId={billingTableId}
                tableLabel={billingTableLabel}
                shopId={shopId}
                onSuccess={handleBillingSuccess}
            />
        </div>
    );
}
