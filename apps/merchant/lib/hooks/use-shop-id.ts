import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';

export function useShopId() {
    const [shopId, setShopId] = useState<string | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const params = useParams();
    const slug = params?.slug as string | undefined;

    useEffect(() => {
        const fetchShopId = async () => {
            try {
                setLoading(true);
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setLoading(false);
                    return;
                }
                setUser(user);

                if (slug) {
                    // 1. Resolve by Slug
                    const { data: shop, error: shopError } = await supabase
                        .from('shops')
                        .select('id, owner_id')
                        .eq('slug', slug)
                        .single();

                    if (shopError || !shop) {
                        setError('Shop not found');
                        setLoading(false);
                        return;
                    }

                    // 2. Check Permissions
                    const isOwner = shop.owner_id === user.id;
                    const { data: roleData } = await supabase
                        .from('user_roles')
                        .select('role')
                        .eq('id', user.id) // Assuming 'id' is user_id based on schema
                        .eq('shop_id', shop.id)
                        .maybeSingle();

                    if (isOwner || roleData) {
                        setShopId(shop.id);
                        setRole(roleData?.role || (isOwner ? 'admin' : null));
                        setError(null);
                    } else {
                        setError('Unauthorized');
                        setShopId(null);
                    }

                } else {
                    // 3. Fallback: Resolve by User Role (Legacy/No-Slug context)
                    const { data: roleData } = await supabase
                        .from('user_roles')
                        .select('shop_id, role')
                        .eq('id', user.id)
                        .maybeSingle();

                    if (roleData) {
                        setShopId(roleData.shop_id);
                        setRole(roleData.role);
                        setError(null);
                    } else {
                        // Try finding owned shop if no role (Repair/Safety)
                        const { data: ownedShop } = await supabase
                            .from('shops')
                            .select('id')
                            .eq('owner_id', user.id)
                            .limit(1)
                            .maybeSingle();

                        if (ownedShop) {
                            setShopId(ownedShop.id);
                            setRole('admin');
                            setError(null);
                        }
                    }
                }
            } catch (error: any) {
                console.error('Error fetching shop ID:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchShopId();
    }, [slug]);

    return { shopId, role, user, loading, error };
}
