"use client";

import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingBag, RefreshCw } from "lucide-react";
import { TakeawayList, TakeawayListRef } from "@/components/features/tables/TakeawayList";
import { cn } from "@/lib/utils";

export interface ActiveTakeawaysPanelRef {
    refresh: () => Promise<void>;
}

interface ActiveTakeawaysPanelProps {
    shopId: string;
    className?: string;
    onSettle: (order: any) => void;
    hideHeader?: boolean;
}

export const ActiveTakeawaysPanel = forwardRef<ActiveTakeawaysPanelRef, ActiveTakeawaysPanelProps>(({ shopId, className, onSettle, hideHeader = false }, ref) => {
    const listRef = useRef<TakeawayListRef>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [takeawayOtp, setTakeawayOtp] = useState<string | null>(null);
    const [otpEnabled, setOtpEnabled] = useState(false);

    const handleRefresh = async () => {
        if (!listRef.current) return;
        setIsRefreshing(true);
        try {
            await listRef.current.refresh();
        } finally {
            setIsRefreshing(false);
        }
    };

    useImperativeHandle(ref, () => ({
        refresh: handleRefresh
    }));

    useEffect(() => {
        const fetchSettings = async () => {
            const { supabase } = await import('@/lib/supabase');
            const { data } = await supabase.from('settings').select('takeaway_otp, enable_otp').eq('shop_id', shopId).single();
            if (data) {
                setTakeawayOtp(data.takeaway_otp || null);
                setOtpEnabled(data.enable_otp || false);
            }
        };

        if (shopId) {
            fetchSettings();

            // Subscribe to settings changes
            const setupSubscription = async () => {
                const { supabase } = await import('@/lib/supabase');
                const channel = supabase
                    .channel(`takeaway-otp-${shopId}`)
                    .on(
                        'postgres_changes',
                        {
                            event: 'UPDATE',
                            schema: 'public',
                            table: 'settings',
                            filter: `shop_id=eq.${shopId}`
                        },
                        (payload) => {
                            if (payload.new.takeaway_otp) setTakeawayOtp(payload.new.takeaway_otp);
                            if (typeof payload.new.enable_otp === 'boolean') setOtpEnabled(payload.new.enable_otp);
                        }
                    )
                    .subscribe();

                return channel;
            };

            let channelPromise = setupSubscription();

            return () => {
                channelPromise.then(async (channel) => {
                    const { supabase } = await import('@/lib/supabase');
                    supabase.removeChannel(channel);
                });
            };
        }
    }, [shopId]);

    return (
        <div className={cn("flex flex-col h-full bg-sidebar", className)}>
            {!hideHeader && (
                <div className="p-4 border-b border-border flex items-center justify-between bg-sidebar-accent/10">
                    <div className="flex items-center gap-2 text-primary">
                        <ShoppingBag className="h-5 w-5" />
                        <h2 className="font-semibold">Active Takeaways</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        {takeawayOtp && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">OTP:</span>
                                <span className={cn(
                                    "font-mono font-bold text-base px-2.5 py-1 rounded border",
                                    otpEnabled
                                        ? "text-orange-600 bg-orange-50 border-orange-200"
                                        : "text-muted-foreground bg-muted border-border"
                                )}>
                                    {takeawayOtp}
                                </span>
                            </div>
                        )}
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            title="Refresh List"
                            className="h-8 w-8 hover:bg-background"
                        >
                            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                        </Button>
                    </div>
                </div>
            )}

            <div className="flex-1 min-h-0">
                <TakeawayList
                    ref={listRef}
                    shopId={shopId}
                    onSettle={onSettle}
                    showOtpHeader={hideHeader}
                />
            </div>
        </div>
    );
});

ActiveTakeawaysPanel.displayName = "ActiveTakeawaysPanel";
