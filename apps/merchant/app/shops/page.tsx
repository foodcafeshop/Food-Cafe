"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Store, LogOut, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Shop } from "@/lib/types";

// Helper type for the joined query result
type ShopRole = {
    shop_id: string;
    shops: Shop;
};

export default function ShopsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <ShopsContent />
        </Suspense>
    );
}

function ShopsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [shops, setShops] = useState<Shop[]>([]);
    const [shopRoles, setShopRoles] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchShops();
    }, []);

    const fetchShops = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const email = user.email || '';

            // 1. Fetch shops via roles
            const { data: roles, error: rolesError } = await supabase
                .from('user_roles')
                .select(`
                    shop_id,
                    role,
                    shops (*)
                `)
                .eq('id', user.id);

            if (rolesError) throw rolesError;

            // 2. Fetch shops via ownership
            const { data: ownedShops, error: ownedError } = await supabase
                .from('shops')
                .select('*')
                .eq('owner_id', user.id);

            if (ownedError) throw ownedError;

            // 3. Build Maps
            const rolesMap: Record<string, string> = {};
            const allShopsMap = new Map();

            let isOwnerOrAdmin = false;

            if (roles) {
                roles.forEach((r: any) => {
                    if (r.shops) {
                        allShopsMap.set(r.shops.id, r.shops);
                        rolesMap[r.shops.id] = r.role;
                        if (r.role === 'admin') isOwnerOrAdmin = true;
                    }
                });
            }

            if (ownedShops && ownedShops.length > 0) {
                isOwnerOrAdmin = true; // Owners are admins
                ownedShops.forEach(shop => {
                    allShopsMap.set(shop.id, shop);
                    rolesMap[shop.id] = 'admin';
                });
            }

            const uniqueShops = Array.from(allShopsMap.values()) as Shop[];
            setShops(uniqueShops);
            setShopRoles(rolesMap);

            // 4. Auto-redirect if only one shop
            // If user has only 1 shop, always redirect regardless of source
            if (uniqueShops.length === 1) {
                const shop = uniqueShops[0];
                const role = rolesMap[shop.id];

                if (role === 'staff') {
                    router.replace(`/${shop.slug}/orders`);
                } else {
                    router.replace(`/${shop.slug}`);
                }
                return;
            }

            // 5. Strict Staff Redirection
            // If NOT an Admin/Owner, and IS Staff -> Must Redirect
            // Only runs if user has > 1 shop (otherwise caught by step 4)
            if (!isOwnerOrAdmin && uniqueShops.length > 0) {
                // Try to match slug from email first (e.g. staff@shop-slug)
                // Assumes email format might be "staff@slug" or "staff@slug.com"
                // We'll check if the part after '@' starts with a known shop slug
                const emailDomain = email.split('@')[1] || '';

                // Find a shop where user is staff AND the slug matches the email (loose match)
                const matchedShop = uniqueShops.find(s =>
                    rolesMap[s.id] === 'staff' && emailDomain.includes(s.slug)
                );

                if (matchedShop) {
                    router.replace(`/${matchedShop.slug}/orders`);
                    return;
                }

                // If no email match, just pick the first staff shop
                // (Common for staff with only 1 shop)
                const firstStaffShop = uniqueShops.find(s => rolesMap[s.id] === 'staff');
                if (firstStaffShop) {
                    router.replace(`/${firstStaffShop.slug}/orders`);
                    return;
                }
            }

        } catch (error) {
            console.error("Error fetching shops:", error);
            toast.error("Failed to load your shops");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectShop = (shopId: string, slug: string) => {
        const role = shopRoles[shopId];
        if (role === 'staff') {
            router.push(`/${slug}/orders`);
        } else {
            router.push(`/${slug}`);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-muted/30 p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Your Shops</h1>
                        <p className="text-muted-foreground mt-1">Select a shop to manage or create a new one.</p>
                    </div>
                    <Button variant="outline" onClick={handleSignOut} className="gap-2">
                        <LogOut className="h-4 w-4" /> Sign Out
                    </Button>
                </div>

                {shops.length === 0 ? (
                    <Card className="border-dashed py-12 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                                <Store className="h-8 w-8 text-muted-foreground" />
                            </div>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No Shops Found</h3>
                        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                            You haven't created any shops yet. Get started by creating your first digital storefront.
                        </p>
                        <Button onClick={() => router.push('/create-shop')} size="lg" className="gap-2">
                            <Plus className="h-5 w-5" /> Create New Shop
                        </Button>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {shops.map((shop) => (
                            <Card
                                key={shop.id}
                                className="group hover:border-primary/50 transition-all cursor-pointer hover:shadow-lg"
                                onClick={() => handleSelectShop(shop.id, shop.slug)}
                            >
                                <CardHeader>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                                            <Store className="h-5 w-5 text-primary" />
                                        </div>
                                        {shop.is_live && (
                                            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                                                Live
                                            </span>
                                        )}
                                    </div>
                                    <CardTitle className="truncate">{shop.name}</CardTitle>
                                    <CardDescription className="truncate">/{shop.slug}</CardDescription>
                                </CardHeader>
                                <CardFooter className="pt-2">
                                    <div className="text-sm font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                                        Dashboard <ArrowRight className="h-4 w-4" />
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}

                        <Card
                            className="border-dashed hover:border-primary/50 cursor-pointer flex flex-col items-center justify-center min-h-[200px] hover:bg-muted/50 transition-colors"
                            onClick={() => router.push('/create-shop')}
                        >
                            <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-4 group-hover:bg-background">
                                <Plus className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="font-semibold text-lg">Create New Shop</h3>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
