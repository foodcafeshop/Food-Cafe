"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCartStore } from "@/lib/store";
import { ChefHat, ShoppingBag, UtensilsCrossed, Bike } from "lucide-react";
import { ServiceType } from "@/lib/types";
import Image from "next/image";

import { usePathname, useSearchParams } from "next/navigation";
import { verifyTableOtp, getShopDetails, getSettings, getTableByLabel, joinTable, upsertCustomer } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function WelcomeDialog() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const {
        customerName,
        setCustomerName,
        setCustomerPhone,
        isWelcomeOpen,
        setWelcomeOpen,
        welcomeMode,
        tableId,
        setTableId,
        setTableLabel,
        logout,
        sessionId,
        setSessionId,
        setCustomerId,
        serviceType,
        setServiceType
    } = useCartStore();

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState(""); // For table OTP
    const [takeawayOtp, setTakeawayOtp] = useState(""); // For takeaway OTP
    const [error, setError] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [otpEnabled, setOtpEnabled] = useState<boolean | null>(null);
    const [shopName, setShopName] = useState("");
    const [shopLogo, setShopLogo] = useState("");
    const [currentShopId, setCurrentShopId] = useState("");
    const [manualTableLabel, setManualTableLabel] = useState("");
    const [isPhoneMandatory, setIsPhoneMandatory] = useState(false);
    const [enabledServiceTypes, setEnabledServiceTypes] = useState<ServiceType[]>(['dine_in']);
    const [selectedOrderType, setSelectedOrderType] = useState<ServiceType>('dine_in');



    useEffect(() => {
        const init = async () => {
            // Extract slug from pathname (e.g. /food-cafe/...)
            const slug = pathname?.split('/')[1];
            if (!slug) return;

            // 1. Resolve Table Label from URL
            const tableLabel = searchParams?.get('table');
            const tableIdParam = searchParams?.get('tableId');

            // Auto-detect order type based on URL parameters
            if (tableIdParam || tableLabel) {
                setSelectedOrderType('dine_in');
            }

            if (tableIdParam) {
                setTableId(tableIdParam);
                // We should fetch label if needed, but if we have ID we can fetch later or let other components handle it.
                // But wait, if we have tableLabel from param, we should set it!
            }

            if (tableLabel) {
                // If we have the label from the URL, set it immediately
                setTableLabel(tableLabel);
            }

            const shop = await getShopDetails(slug);
            if (shop) {
                setShopName(shop.name);
                setShopLogo(shop.logo_url || "");
                setCurrentShopId(shop.id);
                // 2. Fetch Settings
                const settings = await getSettings(shop.id);
                setOtpEnabled(settings?.enable_otp ?? false);
                setIsPhoneMandatory(settings?.is_customer_phone_mandatory ?? false);
                setEnabledServiceTypes(settings?.enabled_service_types ?? ['dine_in']);

                // Auto-select first enabled service type if not coming from table URL
                if (!tableIdParam && !tableLabel && settings?.enabled_service_types?.length) {
                    setSelectedOrderType(settings.enabled_service_types[0]);
                }

                // 3. Resolve Label if needed (if we have label but no ID)
                if (tableLabel && !tableIdParam) {
                    const table = await getTableByLabel(shop.id, tableLabel);
                    if (table) {
                        setTableId(table.id);
                        setTableLabel(table.label);
                    }
                } else if (tableIdParam && !tableLabel) {
                    // If we have ID but no Label, fetch it?
                    // Let's do it to be safe.
                    import("@/lib/api").then(async ({ getTableById }) => {
                        const table = await getTableById(tableIdParam);
                        if (table) setTableLabel(table.label);
                    });
                }
            }
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname, searchParams, setTableId, setTableLabel]);

    useEffect(() => {
        // Show dialog if no customer name is set on mount
        // Small delay to avoid hydration mismatch and let store rehydrate
        const timer = setTimeout(() => {
            if (!customerName) {
                setWelcomeOpen(true, 'welcome');
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [customerName, setWelcomeOpen]);

    // Initialize Local State from Store when dialog opens or store changes
    useEffect(() => {
        if (isWelcomeOpen) {
            if (customerName) setName(customerName);
            if (useCartStore.getState().customerPhone) setPhone(useCartStore.getState().customerPhone || "");
        }
    }, [isWelcomeOpen, customerName]);

    // Check URL and Force Open if needed (New Scan / URL Entry)
    useEffect(() => {
        if (!tableId || !sessionId) return;
        if (!customerName) return; // Handled by the other effect

        const validateSession = async () => {
            // Basic fetch to check if our session ID is still valid for this table
            // This handles the "Scan QR -> Redirect -> Table ID changes -> Valid?" flow
            const { data: table } = await supabase
                .from('tables')
                .select('active_customers, status')
                .eq('id', tableId)
                .single();

            if (table) {
                let activeCustomers = table.active_customers;
                if (!Array.isArray(activeCustomers)) activeCustomers = [];

                const isSessionValid = activeCustomers.some((c: any) => c.sessionId === sessionId);

                if (table.status === 'empty' || !isSessionValid) {
                    // We are logged in conceptually, but not valid for THIS table.
                    // Don't fully logout (keep name/phone), just force re-entry (OTP).
                    setWelcomeOpen(true, 'welcome');
                    // Optional: Clearning sessionId might be needed to force a new join
                    // logout(); // Keeping logout for now to ensure clean state as per current architecture
                }
            }
        };

        validateSession();
    }, [tableId, sessionId, customerName, setWelcomeOpen]);

    // Realtime Logout Listener
    useEffect(() => {
        if (!tableId || !sessionId) return;

        const channel = supabase
            .channel(`table-status-${tableId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'tables',
                    filter: `id=eq.${tableId}`
                },
                (payload) => {
                    // Guard Rail: Ensure we are still strictly on this table
                    if (payload.new.id !== useCartStore.getState().tableId) return;

                    const newStatus = payload.new.status;
                    let activeCustomers = payload.new.active_customers;
                    if (!Array.isArray(activeCustomers)) activeCustomers = [];

                    const isSessionValid = activeCustomers.some((c: any) => c.sessionId === sessionId);

                    if (newStatus === 'empty' || !isSessionValid) {
                        logout();
                        setWelcomeOpen(true, 'welcome');
                        toast.info("Session ended by staff.");
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [tableId, sessionId, logout, setWelcomeOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!name.trim()) return;

        if (isPhoneMandatory && !phone.trim()) {
            setError("Please enter your Phone Number.");
            return;
        }

        if (isPhoneMandatory && !/^\d{10}$/.test(phone.trim())) {
            setError("Please enter a valid 10-digit Phone Number.");
            return;
        }

        // Handle Takeaway Orders (skip table logic entirely)
        if (selectedOrderType === 'takeaway') {
            // Verify takeaway OTP for remote orders (not at a table)
            // OTP is always required for takeaway now, regardless of rotation setting
            if (!tableId) {
                if (!takeawayOtp.trim()) {
                    setError('Please enter the Takeaway OTP to proceed');
                    return;
                }

                setIsVerifying(true);
                const { verifyTakeawayOtp } = await import('@/lib/api');
                const otpValid = await verifyTakeawayOtp(currentShopId, takeawayOtp.trim());
                setIsVerifying(false);

                if (!otpValid) {
                    setError('Invalid Takeaway OTP. Please check with staff.');
                    return;
                }
            }

            // Upsert Customer
            try {
                const cId = await upsertCustomer(currentShopId, name.trim(), phone?.trim());
                if (cId) setCustomerId(cId);
            } catch (err) {
                console.error("Failed to bind customer:", err);
                // Continue anyway
            }

            // Set customer info and service type
            setCustomerName(name.trim());
            if (phone.trim()) setCustomerPhone(phone.trim());
            setServiceType('takeaway');
            setWelcomeOpen(false);
            return;
        }

        // Resolve Table ID if manual
        let targetTableId = tableId;

        if (!targetTableId) {
            if (!manualTableLabel.trim()) {
                setError("Please enter your Table Number.");
                return;
            }
            setIsVerifying(true);
            try {
                const table = await getTableByLabel(currentShopId, manualTableLabel.trim());
                if (!table) {
                    setError("Invalid Table Number. Please check and try again.");
                    setIsVerifying(false);
                    return;
                }
                targetTableId = table.id;
                // Update global state
                setTableId(targetTableId);
                setTableLabel(table.label);
            } catch (err) {
                console.error(err);
                setError("Failed to verify table. Please try again.");
                setIsVerifying(false);
                return;
            }
            setIsVerifying(false); // Reset for OTP check
        }

        // Verify OTP if tableId is present (now it should be)
        if (targetTableId) {
            if (otpEnabled !== false && !otp.trim()) {
                setError("Please enter the Table OTP provided by staff.");
                return;
            }

            // Local check for disabled OTP
            if (otpEnabled === false) {
                if (otp.trim() !== '0000') {
                    setError("Invalid OTP. (Hint: Default is 0000)");
                    return;
                }
            } else {
                // Try remote check
                setIsVerifying(true);
                const isValid = await verifyTableOtp(targetTableId, otp.trim());
                setIsVerifying(false);

                if (!isValid) {
                    setError("Invalid OTP. Please ask staff for the correct code.");
                    return;
                }
            }

            // Join Table
            const newSessionId = sessionId || crypto.randomUUID();
            const customerInfo = {
                sessionId: newSessionId,
                name: name.trim(),
                phone: phone.trim(),
                joinedAt: new Date().toISOString()
            };

            console.log('Attempting to join table:', targetTableId);
            await joinTable(targetTableId, customerInfo);
            setSessionId(newSessionId);

            // Upsert Customer to bind to Shop (Always do this, even for guests)
            try {
                const cId = await upsertCustomer(currentShopId, name.trim(), phone?.trim());
                if (cId) setCustomerId(cId);
            } catch (err) {
                console.error("Failed to bind customer:", err);
                // Continue anyway, don't block login
            }

            console.log('Table join request sent');

            // Set customer info and service type
            setCustomerName(name.trim());
            if (phone.trim()) setCustomerPhone(phone.trim());
            setServiceType('dine_in');
            setWelcomeOpen(false);
        }
    };

    const handleSkip = () => {
        if (welcomeMode === 'welcome') {
            setWelcomeOpen(false);
        }
    };

    const segments = pathname?.split('/').filter(Boolean) ?? [];
    const firstSegment = segments[0];
    const reservedRoutes = ['auth', 'api'];

    // Shop slugs must contain a hyphen (e.g. 'food-cafe')
    if (!firstSegment || reservedRoutes.includes(firstSegment) || !firstSegment.includes('-')) return null;

    return (
        <Dialog open={isWelcomeOpen} onOpenChange={(open) => {
            // Only allow closing if in welcome mode or if name is set
            if (welcomeMode === 'welcome' || customerName) {
                setWelcomeOpen(open);
            }
        }}>
            <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => {
                if (welcomeMode === 'checkout' && !customerName) {
                    e.preventDefault();
                }
            }} onEscapeKeyDown={(e) => {
                if (welcomeMode === 'checkout' && !customerName) {
                    e.preventDefault();
                }
            }}>
                <DialogHeader className="flex flex-col items-center text-center space-y-4">
                    <div className="relative h-16 w-16 rounded-full flex items-center justify-center overflow-hidden shadow-sm">
                        {shopLogo ? (
                            <img src={shopLogo} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                            <Image
                                src="/fc_logo_orange.webp"
                                alt="Logo"
                                fill
                                className="object-contain rounded-lg"
                            />
                        )}
                    </div>
                    <div>
                        <DialogTitle className="text-2xl font-bold text-center">
                            {welcomeMode === 'checkout' ? 'Details Required' : `Welcome to ${shopName || 'Food Cafe'}!`}
                        </DialogTitle>
                        <DialogDescription className="text-base mt-2">
                            {welcomeMode === 'checkout'
                                ? 'Please enter your name to place the order.'
                                : 'Please enter your details to start ordering.'}
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {/* Order Type Selection - Only show if multiple service types enabled and no table in URL */}
                    {!tableId && enabledServiceTypes.length > 1 && (
                        <div className="space-y-2">
                            <Label>Order Type <span className="text-red-500">*</span></Label>
                            <div className={`grid gap-2 ${enabledServiceTypes.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                                {enabledServiceTypes.includes('dine_in') && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedOrderType('dine_in')}
                                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${selectedOrderType === 'dine_in'
                                            ? 'border-orange-600 bg-orange-50 text-orange-600'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <UtensilsCrossed className="h-6 w-6" />
                                        <span className="text-sm font-medium">Dine In</span>
                                    </button>
                                )}
                                {enabledServiceTypes.includes('takeaway') && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedOrderType('takeaway')}
                                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${selectedOrderType === 'takeaway'
                                            ? 'border-blue-600 bg-blue-50 text-blue-600'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <ShoppingBag className="h-6 w-6" />
                                        <span className="text-sm font-medium">Takeaway</span>
                                    </button>
                                )}
                                {enabledServiceTypes.includes('delivery') && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedOrderType('delivery')}
                                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${selectedOrderType === 'delivery'
                                            ? 'border-purple-600 bg-purple-50 text-purple-600'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <Bike className="h-6 w-6" />
                                        <span className="text-sm font-medium">Delivery</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                    {/* Table Details - Only for Dine In */}
                    {selectedOrderType === 'dine_in' && (
                        <div className="flex gap-4">
                            {/* Manual Table Entry if no tableId from URL */}
                            {!tableId && (
                                <div className="space-y-2 flex-1">
                                    <Label htmlFor="tableLabel">Table Name <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="tableLabel"
                                        placeholder="e.g. Table 1"
                                        value={manualTableLabel}
                                        onChange={(e) => setManualTableLabel(e.target.value)}
                                        required
                                        className="h-11"
                                        maxLength={10}
                                    />
                                </div>
                            )}

                            {/* Table OTP */}
                            <div className={`space-y-2 ${!tableId ? 'flex-1' : 'w-full'}`}>
                                <Label htmlFor="otp">Table OTP <span className="text-red-500">*</span></Label>
                                <Input
                                    id="otp"
                                    placeholder="4-digit code"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                    className="h-11"
                                    maxLength={6}
                                />
                                <p className="text-xs text-gray-500 line-clamp-1">Ask staff for code.</p>
                            </div>
                        </div>
                    )}

                    {/* Takeaway OTP - Only for remote takeaway orders */}
                    {selectedOrderType === 'takeaway' && !tableId && (
                        <div className="space-y-2">
                            <Label htmlFor="takeaway-otp">Takeaway OTP <span className="text-red-500">*</span></Label>
                            <Input
                                id="takeaway-otp"
                                value={takeawayOtp}
                                onChange={(e) => setTakeawayOtp(e.target.value)}
                                placeholder="Enter 4-digit code"
                                maxLength={4}
                                className="h-11 font-mono text-lg tracking-wider text-center"
                            />
                            <p className="text-xs text-gray-500">Ask staff for the current takeaway OTP</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="name">Your Name <span className="text-red-500">*</span></Label>
                        <Input
                            id="name"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="h-11"
                        />
                    </div>

                    {isPhoneMandatory && (
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="9876543210"
                                value={phone}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                    setPhone(val);
                                }}
                                required
                                className="h-11"
                            />
                        </div>
                    )}







                    {error && (
                        <div className="text-sm text-red-500 font-medium text-center bg-red-50 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <Button type="submit" disabled={isVerifying} className="w-full h-11 text-base font-bold bg-orange-600 hover:bg-orange-700">
                            {isVerifying ? 'Verifying...' : (welcomeMode === 'checkout' ? 'Continue to Order' : 'Start Ordering')}
                        </Button>
                        {welcomeMode === 'welcome' && (
                            <Button type="button" variant="ghost" onClick={handleSkip} className="w-full text-gray-500">
                                Skip for now
                            </Button>
                        )}
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
