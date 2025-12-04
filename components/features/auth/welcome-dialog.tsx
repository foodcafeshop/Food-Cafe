"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCartStore } from "@/lib/store";
import { ChefHat } from "lucide-react";

import { usePathname, useSearchParams } from "next/navigation";
import { verifyTableOtp, getShopDetails, getSettings, getTableByLabel, joinTable } from "@/lib/api";
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
        logout,
        sessionId,
        setSessionId
    } = useCartStore();

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [otpEnabled, setOtpEnabled] = useState<boolean | null>(null);



    useEffect(() => {
        const init = async () => {
            // Extract slug from pathname (e.g. /food-cafe/...)
            const slug = pathname?.split('/')[1];
            if (!slug || slug === 'admin') return;

            // 1. Resolve Table Label from URL
            const tableLabel = searchParams?.get('table');
            const tableIdParam = searchParams?.get('tableId');

            if (tableIdParam) {
                setTableId(tableIdParam);
            }

            const shop = await getShopDetails(slug);
            if (shop) {
                // 2. Fetch Settings
                const settings = await getSettings(shop.id);
                setOtpEnabled(settings?.enable_otp ?? false);

                // 3. Resolve Label if needed
                if (tableLabel && !tableIdParam) {
                    const table = await getTableByLabel(shop.id, tableLabel);
                    if (table) {
                        setTableId(table.id);
                    }
                }
            }
        };
        init();
    }, [pathname, searchParams, setTableId]);

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

    // Realtime Logout Listener & Offline Recovery
    useEffect(() => {
        if (!tableId || !sessionId) return;

        // 1. Initial Check (for offline recovery)
        const checkStatus = async () => {
            if (!customerName) return; // Only check if logged in

            const { data: table } = await supabase
                .from('tables')
                .select('status, active_customers')
                .eq('id', tableId)
                .single();

            if (table) {
                const activeCustomers = table.active_customers as any[] || [];
                const isSessionValid = activeCustomers.some((c: any) => c.sessionId === sessionId);

                if (table.status === 'empty' || !isSessionValid) {
                    logout();
                    setWelcomeOpen(true, 'welcome');
                    toast.info("Session expired.");
                }
            }
        };
        checkStatus();

        // 2. Realtime Listener
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
                    const newStatus = payload.new.status;
                    const activeCustomers = payload.new.active_customers as any[] || [];
                    const isSessionValid = activeCustomers.some((c: any) => c.sessionId === sessionId);

                    if (newStatus === 'empty' || !isSessionValid) {
                        // Table cleared or user removed
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
    }, [tableId, sessionId, logout, setWelcomeOpen, customerName]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!name.trim()) return;

        // Verify OTP if tableId is present
        if (tableId) {
            if (!otp.trim()) {
                setError("Please enter the Table OTP provided by staff.");
                return;
            }

            // Local check for disabled OTP
            if (otpEnabled === false) {
                if (otp.trim() !== '0000') {
                    setError("Invalid OTP. (Hint: Default is 0000)");
                    return;
                }
                // Success, proceed
            } else {
                // Remote check
                setIsVerifying(true);
                const isValid = await verifyTableOtp(tableId, otp.trim());
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

            console.log('Attempting to join table:', tableId);
            await joinTable(tableId, customerInfo);
            setSessionId(newSessionId);
            console.log('Table join request sent');
        }

        if (name.trim()) {
            setCustomerName(name.trim());
            if (phone.trim()) {
                setCustomerPhone(phone.trim());
            }
            setWelcomeOpen(false);
        }
    };

    const handleSkip = () => {
        if (welcomeMode === 'welcome') {
            setWelcomeOpen(false);
        }
    };

    if (pathname?.startsWith('/admin')) return null;

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
                    <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center">
                        <ChefHat className="h-8 w-8 text-orange-600" />
                    </div>
                    <div>
                        <DialogTitle className="text-2xl font-bold">
                            {welcomeMode === 'checkout' ? 'Details Required' : 'Welcome to Food Cafe!'}
                        </DialogTitle>
                        <DialogDescription className="text-base mt-2">
                            {welcomeMode === 'checkout'
                                ? 'Please enter your name to place the order.'
                                : 'Please enter your details to start ordering.'}
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
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
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number (Optional)</Label>
                        <Input
                            id="phone"
                            placeholder="+91 98765 43210"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="h-11"
                            type="tel"
                        />
                    </div>

                    {tableId && (
                        <div className="space-y-2">
                            <Label htmlFor="otp">Table OTP <span className="text-red-500">*</span></Label>
                            <Input
                                id="otp"
                                placeholder="Enter 4-digit code"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                                className="h-11"
                                maxLength={6}
                            />
                            <p className="text-xs text-gray-500">Please ask the staff for the table code.</p>
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
