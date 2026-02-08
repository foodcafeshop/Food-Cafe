"use client";

import { useState, useEffect, useRef } from "react";
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
import { ActiveTakeawaysPanel, ActiveTakeawaysPanelRef } from "@/components/features/orders/ActiveTakeawaysPanel";
import { NewOrderDialog } from "@/components/features/orders/NewOrderDialog";
import { ShoppingBag, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTables } from "@/lib/api";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useRouter, useParams } from "next/navigation";

// ...

export default function TakeOrderPage() {
    const { shopId, user } = useShopId();
    const router = useRouter();
    const params = useParams();
    const slug = params.slug as string;
    const activeTakeawaysRef = useRef<ActiveTakeawaysPanelRef>(null);

    const [step, setStep] = useState<'table' | 'order'>('table');
    const [selectedTable, setSelectedTable] = useState<{ id: string; label: string } | null>(null);

    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [discardCartOpen, setDiscardCartOpen] = useState(false);
    const [clearTableId, setClearTableId] = useState<string | null>(null);

    const [orderType, setOrderType] = useState<"dine_in" | "takeaway" | "delivery">("dine_in");

    // Billing State
    const [billingTableId, setBillingTableId] = useState<string | null>(null);
    const [billingTableLabel, setBillingTableLabel] = useState<string>('');
    const [billingOrder, setBillingOrder] = useState<any | null>(null);
    const [settings, setSettings] = useState<any>(null);

    const [activeTab, setActiveTab] = useState<'tables' | 'takeaways'>('tables');

    // New Order Dialog State
    const [isNewOrderDialogOpen, setIsNewOrderDialogOpen] = useState(false);
    const [tables, setTables] = useState<any[]>([]);

    // Customer Details State
    const [customerDetails, setCustomerDetails] = useState({ name: '', phone: '' });

    useEffect(() => {
        if (shopId) {
            import("@/lib/api").then(({ getSettings }) => getSettings(shopId).then(setSettings));
            getTables(shopId).then(setTables);
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

                // Handle Takeaway/Delivery based on hash
                if (label === 'takeaway' || label === 'delivery') {
                    setOrderType(label as any);
                    setSelectedTable(null);
                    setCustomerDetails({ name: '', phone: '' });
                    setStep('order');
                    return;
                }

                try {
                    const { data } = await import("@/lib/supabase").then(async ({ supabase }) =>
                        supabase.from('tables').select('id, label').eq('shop_id', shopId).eq('label', label).single()
                    );

                    if (data) {
                        // Fetch existing orders to check for customer details
                        import("@/lib/api").then(async ({ getTableOrders }) => {
                            const orders = await getTableOrders(data.id);
                            const activeOrder = orders.find((o: any) =>
                                ['queued', 'preparing', 'ready', 'served'].includes(o.status) &&
                                (o.customer_name || o.customer_phone)
                            );

                            if (activeOrder) {
                                setCustomerDetails({
                                    name: activeOrder.customer_name || '',
                                    phone: activeOrder.customer_phone || ''
                                });
                            } else {
                                setCustomerDetails({ name: '', phone: '' });
                            }
                            // Only set step after details are potentially loaded
                            setSelectedTable(data);
                            setOrderType('dine_in');
                            setStep('order');
                        });
                    }
                } catch (e) {
                    console.error("Failed to load table from hash", e);
                }
            } else {
                // If no hash, go back to table view
                // Only if we were in 'dine_in' mode?
                // Actually if we just placed a takeaway order we might want to stay put or go back.
                // But hash change usually implies navigation or reset.
                // Let's rely on explicit state management for non-table orders.
                if (step === 'order' && orderType === 'dine_in') {
                    setStep('table');
                    setSelectedTable(null);
                }
            }
        };

        checkHash();

        window.addEventListener('hashchange', checkHash);
        return () => {
            window.removeEventListener('hashchange', checkHash);
        };
    }, [shopId]);

    const handleTableSelect = (id: string, label: string) => {
        // Reset details first to avoid stale data while fetching
        setCustomerDetails({ name: '', phone: '' });

        // Fetch existing orders
        import("@/lib/api").then(async ({ getTableOrders }) => {
            const orders = await getTableOrders(id);
            const activeOrder = orders.find((o: any) =>
                ['queued', 'preparing', 'ready', 'served'].includes(o.status) &&
                (o.customer_name || o.customer_phone)
            );

            if (activeOrder) {
                setCustomerDetails({
                    name: activeOrder.customer_name || '',
                    phone: activeOrder.customer_phone || ''
                });
            }
            // Move step and router push here
            setSelectedTable({ id, label });
            setOrderType('dine_in');
            setStep('order');
            router.push(`/${slug}/take-order#${label}`);
        });
    };

    const handleBackToTables = () => {
        if (cartItems.length > 0) {
            setDiscardCartOpen(true);
        } else {
            navigateToTables();
        }
    };

    const navigateToTables = () => {
        setCartItems([]);
        setStep('table');
        setSelectedTable(null);
        setOrderType('dine_in'); // Default back
        // Clear hash if present
        if (window.location.hash) {
            router.push(`/${slug}/take-order`);
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
        if (!shopId) return;
        if (orderType === 'dine_in' && !selectedTable) return;

        setIsPlacingOrder(true);
        try {
            // Validate Mandatory Details
            if (settings?.is_customer_phone_mandatory) {
                if (!customerDetails.name) {
                    throw new Error("Customer Name is mandatory.");
                }
                if (!customerDetails.phone) {
                    throw new Error("Customer Phone Number is mandatory.");
                }
                if (customerDetails.phone.length !== 10) {
                    throw new Error("Please enter a valid 10-digit Phone Number.");
                }
            }

            const { createOrder, createOrderItems, updateTableStatus } = await import("@/lib/api");

            const subtotal = cartItems.reduce((sum, item) => sum + ((item.offer_price || item.price) * item.quantity), 0);

            const { taxIncludedInPrice, taxRate, packaging_charge_type, packaging_charge_amount, delivery_charge_type, delivery_charge_amount } = settings || {};
            const currentTaxRate = taxRate ?? 5;
            let totalAmount = subtotal;

            // Calculate Tax
            let taxAmount = 0;
            if (!taxIncludedInPrice) {
                taxAmount = subtotal * (currentTaxRate / 100);
            }

            // Calculate Packaging Charge
            let packagingCharge = 0;
            const isTakeoutOrDelivery = orderType === 'takeaway' || orderType === 'delivery';

            // Assuming packaging charge applies to takeaway/delivery.
            if (isTakeoutOrDelivery) {
                if (packaging_charge_type === 'order') {
                    // 'order' usually means 'flat' per order? 
                    // schema says 'flat'. Let's assume 'flat' = per order.
                    // Previous logic used 'flat' check.
                    // Wait, schema check indicated packaging_charge_type enum? Or string?
                    // settings table has packaging_charge_type default 'flat'.
                    // Let's apply flat amount if set.
                    if (packaging_charge_amount) {
                        packagingCharge = Number(packaging_charge_amount) || 0;
                    }
                }
                // If 'per_item', we'd need item loop. For now focusing on flat/default.
            }

            // Calculate Delivery Fee
            let deliveryFee = 0;
            if (isTakeoutOrDelivery) {
                if (orderType === 'delivery') {
                    if (delivery_charge_type === 'percent') {
                        deliveryFee = subtotal * ((delivery_charge_amount || 0) / 100);
                    } else {
                        deliveryFee = Number(delivery_charge_amount) || 0;
                    }
                }
            }

            totalAmount = subtotal + taxAmount + packagingCharge + deliveryFee;

            const orderPayload = {
                shop_id: shopId,
                table_id: selectedTable?.id || null,
                status: 'queued', // Active
                total_amount: totalAmount,
                payment_status: 'pending',
                customer_name: customerDetails.name || (orderType === 'dine_in' ? 'Walk-in Customer' : 'Takeaway Customer'),
                customer_phone: customerDetails.phone || null,
                is_staff_order: true,
                staff_name: user?.user_metadata?.full_name || 'Staff',
                staff_id: user?.id,
                service_type: orderType,
                packaging_charge: packagingCharge,
                delivery_fee: deliveryFee
            };

            // 1. Create Order
            const newOrder = await createOrder(orderPayload);

            if (!newOrder) throw new Error("Failed to create order");

            // 2. Create Items
            const itemsPayload = cartItems.map(item => ({
                order_id: newOrder.id,
                menu_item_id: item.id,
                quantity: item.quantity,
                price: item.offer_price || item.price,
                name: item.name,
                notes: item.notes || ''
            }));

            await createOrderItems(itemsPayload);

            // 3. Update Table Status (Only for Dine-in)
            if (orderType === 'dine_in' && selectedTable) {
                await updateTableStatus(selectedTable.id, 'occupied');
            }

            toast.success("Order placed successfully");
            setCartItems([]);

            // Navigate back
            if (orderType === 'dine_in') {
                setStep('table');
                setSelectedTable(null);
            } else {
                // For takeaway, maybe stay or go to list? 
                // Going back to tables/list view seems best to see the new order.
                setStep('table');
                // Could switch activeTab to 'takeaways'?
                setActiveTab('takeaways');
            }

        } catch (error: any) {
            console.error("Failed to place order", error);
            toast.error(error.message || "Failed to place order");
        } finally {
            setIsPlacingOrder(false);
        }
    };

    const handleBill = (tableId: string) => {
        setBillingTableId(tableId);
        setBillingTableLabel("Table");
    };

    const handleBillingSuccess = () => {
        setRefreshKey(prev => prev + 1);
        setBillingTableId(null);
        // Refresh takeaway list
        activeTakeawaysRef.current?.refresh();
    };

    const [refreshKey, setRefreshKey] = useState(0);

    const handleClearTable = (tableId: string) => {
        setClearTableId(tableId);
    };

    const confirmClearTable = async () => {
        if (!clearTableId) return;
        try {
            const { clearTable } = await import("@/lib/api");
            await clearTable(clearTableId);
            toast.success("Table marked as empty");
            setRefreshKey(prev => prev + 1);
            if (selectedTable?.id === clearTableId) {
                setSelectedTable(null);
                setStep('table');
                router.push(`/${slug}/take-order`);
            }
        } catch (error) {
            console.error("Failed to clear table", error);
            toast.error("Failed to mark table as empty");
        } finally {
            setClearTableId(null);
        }
    };

    // Helper for display title
    const getOrderModeLabel = () => {
        if (orderType === 'takeaway') return 'Takeaway Order';
        if (orderType === 'delivery') return 'Delivery Order';
        return `Taking Order: ${selectedTable?.label}`;
    };

    return (
        <div className="h-full flex flex-col p-4 md:p-6">
            <div className={`flex items-center gap-4 mb-6 ${step === 'order' ? 'hidden lg:flex' : ''}`}>
                {step === 'order' && (
                    <Button variant="ghost" size="icon" onClick={handleBackToTables}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                )}
                <h1 className="text-2xl font-bold">
                    {step === 'table' ? 'Take Order' : getOrderModeLabel()}
                </h1>
                {step === 'table' && (
                    <Button
                        onClick={() => setIsNewOrderDialogOpen(true)}
                        className="gap-2 bg-blue-600 hover:bg-blue-700 text-white ml-auto sm:ml-4"
                    >
                        <ShoppingBag className="h-4 w-4" /> New Order
                    </Button>
                )}
            </div>

            <div className="flex-1 min-h-0">
                {step === 'table' ? (
                    <div className="flex flex-col h-full overflow-hidden">
                        {/* Mobile/Tablet Tabs */}
                        <div className="flex lg:hidden border-b mb-4 shrink-0">
                            <button
                                className={cn(
                                    "flex-1 pb-2 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5",
                                    activeTab === 'tables' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                                )}
                                onClick={() => setActiveTab('tables')}
                            >
                                <Utensils className="h-4 w-4" />
                                Dine In
                            </button>
                            <button
                                className={cn(
                                    "flex-1 pb-2 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5",
                                    activeTab === 'takeaways' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                                )}
                                onClick={() => setActiveTab('takeaways')}
                            >
                                <ShoppingBag className="h-4 w-4" />
                                Takeaways
                            </button>
                        </div>

                        <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
                            {/* Main Table Selector - Hidden on mobile/tablet if Takeaways active */}
                            <div className={cn("flex-1 min-w-0 transition-opacity flex flex-col gap-4", activeTab === 'takeaways' ? "hidden lg:flex" : "flex")}>
                                <div className="hidden lg:flex items-center justify-between shrink-0 mb-4 md:mb-0">
                                    <h2 className="font-semibold text-lg flex items-center gap-2">
                                        <Utensils className="h-5 w-5" /> Dine In
                                    </h2>
                                </div>
                                <div className="flex-1 overflow-y-auto min-h-0 pr-1">
                                    <TableSelector
                                        key={refreshKey}
                                        onSelect={handleTableSelect}
                                        onBill={handleBill}
                                        onClear={handleClearTable}
                                        selectedTableId={null}
                                    />
                                </div>
                            </div>

                            {/* Takeout Side Panel */}
                            <div className={cn("w-full lg:w-80 lg:border-l lg:pl-6 flex-col gap-4 min-h-0 overflow-hidden", activeTab === 'tables' ? "hidden lg:flex" : "flex")}>
                                {shopId && (
                                    <ActiveTakeawaysPanel
                                        ref={activeTakeawaysRef}
                                        shopId={shopId}
                                        onSettle={(order: any) => setBillingOrder(order)}
                                        hideHeader={activeTab === 'takeaways'}
                                        className="lg:!block [&>div:first-child]:lg:flex"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 lg:h-full gap-6">
                        <div className="lg:col-span-2 lg:h-full flex flex-col min-h-0">
                            <MenuBrowser
                                onAddToCart={addToCart}
                                onBack={handleBackToTables}
                                tableLabel={selectedTable?.label || (orderType === 'takeaway' ? 'Takeaway' : 'Delivery')}
                            />
                        </div>
                        <div className="lg:col-span-1 lg:h-full min-h-0 bg-background border rounded-lg shadow-sm overflow-hidden sticky bottom-0 lg:static">
                            <OrderCart
                                key={selectedTable?.id || 'new-order'}
                                items={cartItems}
                                onUpdateQuantity={updateQuantity}
                                onRemove={removeItem}
                                onUpdateNote={updateItemNote}
                                onPlaceOrder={handlePlaceOrder}
                                loading={isPlacingOrder}
                                tableLabel={selectedTable?.label || (orderType === 'takeaway' ? 'Takeaway' : 'Delivery')}
                                customerName={customerDetails.name}
                                customerPhone={customerDetails.phone}
                                onCustomerDetailsChange={(updates) => setCustomerDetails(prev => ({ ...prev, ...updates }))}
                                isPhoneMandatory={settings?.is_customer_phone_mandatory}
                            />
                        </div>
                    </div>
                )}
            </div>

            <BillingDialog
                open={!!billingTableId || !!billingOrder}
                onOpenChange={(open) => {
                    if (!open) {
                        setBillingTableId(null);
                        setBillingOrder(null);
                    }
                }}
                tableId={billingTableId}
                tableLabel={billingTableLabel}
                orderId={billingOrder?.id || null}
                shopId={shopId}
                onSuccess={handleBillingSuccess}
            />

            <NewOrderDialog
                open={isNewOrderDialogOpen}
                onOpenChange={setIsNewOrderDialogOpen}
                tables={tables}
                shopSlug={slug}
                onOrderConfirmed={(type, tableId) => {
                    setOrderType(type);
                    if (type === 'dine_in' && tableId) {
                        const table = tables.find(t => t.id === tableId);
                        setSelectedTable(table || null);
                    } else {
                        setSelectedTable(null);
                        setCustomerDetails({ name: '', phone: '' });
                    }
                    setStep('order');
                    setIsNewOrderDialogOpen(false);
                }}
            />

            <AlertDialog open={discardCartOpen} onOpenChange={setDiscardCartOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Discard Cart?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Going back will clear your current cart. Are you sure you want to continue?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                navigateToTables();
                                setDiscardCartOpen(false);
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Discard & Leave
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!clearTableId} onOpenChange={() => setClearTableId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Clear Table?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to mark this table as empty? This will clear active sessions.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                confirmClearTable();
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Clear Table
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
