import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export function usePushSubscription(shopId: string, role: 'staff' | 'merchant' | 'customer' | 'admin' = 'staff') {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermission(Notification.permission);
            checkSubscription();
        }
    }, []);

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
            if (!user) throw new Error("User must be logged in to subscribe");

            const { error } = await supabase
                .from('push_subscriptions')
                .upsert({
                    user_id: user.id,
                    shop_id: shopId,
                    role: role,
                    subscription: subscription.toJSON(), // Important: Store as JSON
                    user_agent: navigator.userAgent
                }, { onConflict: 'endpoint' });

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
