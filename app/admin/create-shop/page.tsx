"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChefHat, Store } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function CreateShopPage() {
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const router = useRouter();

    useEffect(() => {
        checkExistingShop();
    }, []);

    const checkExistingShop = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: role } = await supabase
                .from('user_roles')
                .select('shop_id')
                .eq('id', user.id)
                .single();

            if (role) {
                toast.success("You already have a shop!");
                router.push('/admin');
                return;
            }

            // Repair Logic: Check if user owns a shop but has no role
            const { data: ownedShop } = await supabase
                .from('shops')
                .select('id')
                .eq('owner_id', user.id)
                .single();

            if (ownedShop) {
                console.log("Found owned shop without role. Attempting repair...");
                const { error: repairError } = await supabase.rpc('assign_shop_admin', {
                    target_shop_id: ownedShop.id
                });

                if (!repairError) {
                    toast.success("Restored admin access to your shop!");
                    router.push('/admin');
                } else {
                    console.error("Repair failed:", repairError);
                }
            }
        } catch (error) {
            // Ignore error if no role found
        } finally {
            setChecking(false);
        }
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setName(val);
        // Auto-generate slug
        let newSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        // Ensure at least one hyphen if the name is a single word
        if (newSlug && !newSlug.includes('-')) {
            newSlug = `${newSlug}-shop`;
        }
        setSlug(newSlug);
    };

    if (checking) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    const handleCreateShop = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Validate Slug: must contain at least 2 alphanumeric words separated by a hyphen
        const slugRegex = /^[a-z0-9]+-[a-z0-9]+.*$/;
        if (!slugRegex.test(slug)) {
            toast.error("Shop URL must contain at least two words separated by a hyphen (e.g., 'burger-cafe').");
            setLoading(false);
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            // 1. Create Shop
            const { data: shop, error: shopError } = await supabase
                .from('shops')
                .insert({
                    name,
                    slug,
                    is_live: false,
                    owner_id: user.id
                })
                .select()
                .single();

            if (shopError) throw shopError;

            // 2. Assign Admin Role - Handled by Database Trigger on shops insert
            // const { error: roleError } = await supabase.from('user_roles')...

            // 3. Create Default Settings
            await supabase.from('settings').insert({ shop_id: shop.id });

            // 4. Wait for Trigger to Assign Role (Polling)
            let roleAssigned = false;
            let attempts = 0;
            while (!roleAssigned && attempts < 10) {
                const { data: role } = await supabase
                    .from('user_roles')
                    .select('id')
                    .eq('id', user.id)
                    .eq('shop_id', shop.id)
                    .single();

                if (role) {
                    roleAssigned = true;
                } else {
                    await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
                    attempts++;
                }
            }

            if (!roleAssigned) {
                // Fallback: Use RPC to securely assign role
                console.warn("Trigger failed. Attempting RPC role assignment...");
                const { error: rpcError } = await supabase.rpc('assign_shop_admin', {
                    target_shop_id: shop.id
                });

                if (rpcError) {
                    console.error("RPC role assignment failed:", rpcError);
                    toast.error("Shop created, but admin role assignment failed. Please contact support.");
                    setLoading(false);
                    return;
                } else {
                    console.log("RPC role assignment succeeded.");
                }
            }

            toast.success("Shop created successfully!");
            router.push('/admin');
            router.refresh();
        } catch (error: any) {
            console.error("Error creating shop:", error);
            toast.error(error.message || "Failed to create shop");
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/admin/login');
    };

    if (checking) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 relative">
            <Button
                variant="ghost"
                onClick={handleSignOut}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
                Sign Out
            </Button>
            <Card className="w-full max-w-md border-none shadow-lg">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center">
                            <Store className="h-6 w-6 text-primary-foreground" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Create Your Shop</CardTitle>
                    <CardDescription>
                        Let's get your digital storefront ready.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleCreateShop}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Shop Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. My Awesome Burger Joint"
                                value={name}
                                onChange={handleNameChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="slug">Shop URL</Label>
                            <div className="flex items-center gap-1 text-muted-foreground bg-muted p-2 rounded-md border text-sm">
                                <span>your-domain.com/</span>
                                <input
                                    className="bg-transparent border-none focus:outline-none flex-1 text-foreground font-medium"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    required
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">This will be your unique link.</p>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" type="submit" disabled={loading}>
                            {loading ? "Creating Shop..." : "Create Shop"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
