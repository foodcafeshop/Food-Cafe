import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

// Update hook signature
export function usePushSubscription(shopId: string, role: 'staff' | 'merchant' | 'customer' | 'admin' = 'staff', customerId?: string) {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermission(Notification.permission);
            checkSubscription();
        }
    }, [customerId]); // Re-check if customerId changes? Mostly runs once.

    const checkSubscription = async () => {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
        }
    };

    const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const subscribeToPush = async () => {
        if (!VAPID_PUBLIC_KEY) {
            console.error("VAPID Public Key not found");
            toast.error("Push notification configuration missing");
            return;
        }

        try {
            setLoading(true);
            const registration = await navigator.serviceWorker.ready;

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            // Save to Supabase
            const { data: { user } } = await supabase.auth.getUser();

            // Allow subscription if User OR CustomerId is present
            if (!user && !customerId) {
                // Determine if we should allow anonymous usage? Ideally we want at least a customer ID.
                // If role is 'customer' and no ID, maybe we can't notify them specifically yet.
                console.warn("No user or customer ID found, skipping database save (browser only)");
                // We might still want to return success for browser-only usage?
                // But for our use case we need to target them.
                throw new Error("User must be logged in or have a guest session");
            }

            const upsertData: any = {
                shop_id: shopId,
                role: role,
                subscription: subscription.toJSON(),
                user_agent: navigator.userAgent
            };

            if (user) upsertData.user_id = user.id;
            if (customerId) upsertData.customer_id = customerId;

            const { error } = await supabase
                .from('push_subscriptions')
                .upsert(upsertData, { onConflict: 'endpoint' }); // Use the generated column or unique index
            // Note: We need to ensure Schema supports UNIQUE(endpoint) or we rely on (user, endpoint)
            // If schema changed to UNIQUE(endpoint), this works.
            // If schema is (user_id, endpoint), then guest rows might duplicate?
            // For Phase 3, we hopefully updated schema to handle this.

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            setIsSubscribed(true);
            setPermission('granted');
            toast.success("Notifications enabled!");
        } catch (error) {
            console.error('Failed to subscribe:', error);
            toast.error("Failed to enable notifications. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const unsubscribeFromPush = async () => {
        try {
            setLoading(true);
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                // Unsubscribe from browser
                await subscription.unsubscribe();

                // Remove from Supabase
                // Note: Without the subscription endpoint, we might delete all for user? 
                // Best practice: Delete by matching endpoint.
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const endpoint = subscription.endpoint;
                    await supabase.from('push_subscriptions')
                        .delete()
                        .match({ user_id: user.id })
                        .filter('subscription->>endpoint', 'eq', endpoint);
                }
            }

            setIsSubscribed(false);
            toast.success("Notifications disabled.");
        } catch (error) {
            console.error('Error unsubscribing', error);
            toast.error("Failed to disable notifications");
        } finally {
            setLoading(false);
        }
    };

    return {
        isSubscribed,
        loading,
        permission,
        subscribeToPush,
        unsubscribeFromPush
    };
}
