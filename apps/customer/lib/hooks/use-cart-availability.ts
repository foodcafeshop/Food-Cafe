
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { validateOrderItemsAvailability } from '@/lib/api';
import { toast } from 'sonner';

export function useCartAvailability(items: { id: string; name: string }[], shopId: string) {
    const [unavailableItemIds, setUnavailableItemIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (items.length === 0) {
            setUnavailableItemIds(new Set());
            return;
        }

        const checkAvailability = async () => {
            // Initial check
            const ids = items.map(i => i.id);
            const { data } = await supabase.from('menu_items').select('id, is_available').in('id', ids);

            if (data) {
                const newUnavailable = new Set<string>();
                data.forEach((item: any) => {
                    if (!item.is_available) newUnavailable.add(item.id);
                });
                setUnavailableItemIds(newUnavailable);
            }
        };

        checkAvailability();

        // Realtime Subscription
        const channel = supabase
            .channel('cart-availability-global')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'menu_items',
                    filter: `shop_id=eq.${shopId}`
                },
                (payload: any) => {
                    const newItem = payload.new;
                    setUnavailableItemIds(prev => {
                        const next = new Set(prev);
                        // Only care if it's in our cart (or relevant list of items passed)
                        if (items.some(i => i.id === newItem.id)) {
                            if (!newItem.is_available) {
                                next.add(newItem.id);
                                // Optional: Toast here might duplicate if hook is used in multiple places. 
                                // Better to let the component handle toasts or use a ref/flag, but for now filtering is key.
                                // We'll suppress toast here to avoid spam if multiple components verify.
                            } else {
                                next.delete(newItem.id);
                            }
                        }
                        return next;
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [items, shopId]);

    return { unavailableItemIds };
}
