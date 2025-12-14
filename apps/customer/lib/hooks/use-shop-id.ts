import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useShopId() {
    const [shopId, setShopId] = useState<string | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchShopId = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                console.log("useShopId: User", user?.id);
                if (user) {
                    setUser(user);
                    const { data: roleData, error } = await supabase
                        .from('user_roles')
                        .select('shop_id, role')
                        .eq('id', user.id)
                        .maybeSingle(); // Use maybeSingle to avoid error on 0 rows

                    console.log("useShopId: Role Query Result", { roleData, error });

                    if (roleData) {
                        setShopId(roleData.shop_id);
                        setRole(roleData.role);
                    }
                }
            } catch (error) {
                console.error('Error fetching shop ID:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchShopId();
    }, []);

    return { shopId, role, user, loading };
}
