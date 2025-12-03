"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getShopDetails, updateShopDetails } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { Shop } from "@/lib/types";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ProfileSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [shop, setShop] = useState<Partial<Shop>>({});
    const [slug, setSlug] = useState<string | null>(null);

    useEffect(() => {
        const fetchShopInfo = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: role } = await supabase
                    .from('user_roles')
                    .select('shop_id')
                    .eq('id', user.id)
                    .maybeSingle();

                if (role) {
                    // Fetch slug
                    const { data: shopData } = await supabase
                        .from('shops')
                        .select('slug')
                        .eq('id', role.shop_id)
                        .single();
                    if (shopData) {
                        setSlug(shopData.slug);
                        loadShopData(shopData.slug);
                    }
                }
            }
        };
        fetchShopInfo();
    }, []);

    const loadShopData = async (shopSlug: string) => {
        setLoading(true);
        const shopData = await getShopDetails(shopSlug);
        if (shopData) {
            setShop(shopData);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!slug) return;
        try {
            await updateShopDetails(slug, shop);
            toast.success('Profile updated successfully');
        } catch (error) {
            console.error('Error saving profile:', error);
            toast.error('Failed to save profile');
        }
    };

    if (loading) return <div>Loading profile...</div>;

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Shop Profile</h2>
                <p className="text-muted-foreground">
                    This is how your shop appears to the public.
                </p>
            </div>
            <Separator />

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Visibility</CardTitle>
                        <CardDescription>Control if your shop is visible to the public.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label htmlFor="isLive" className={shop.is_live ? "text-green-600 font-bold" : "text-muted-foreground"}>
                            {shop.is_live ? "Live" : "Offline"}
                        </Label>
                        <Switch
                            id="isLive"
                            checked={shop.is_live || false}
                            onCheckedChange={(checked) => setShop({ ...shop, is_live: checked })}
                        />
                    </div>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="shopName">Shop Name</Label>
                            <Input
                                id="shopName"
                                value={shop.name || ''}
                                onChange={(e) => setShop({ ...shop, name: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="shopType">Shop Type</Label>
                            <Input
                                id="shopType"
                                value={shop.shop_type || ''}
                                placeholder="e.g. Restaurant, Cafe, Bakery"
                                onChange={(e) => setShop({ ...shop, shop_type: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            value={shop.description || ''}
                            onChange={(e) => setShop({ ...shop, description: e.target.value })}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                            id="address"
                            value={shop.address || ''}
                            onChange={(e) => setShop({ ...shop, address: e.target.value })}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="openingHours">Opening Hours</Label>
                        <Input
                            id="openingHours"
                            value={shop.opening_hours || ''}
                            placeholder="e.g. Mon-Sun: 9am - 10pm"
                            onChange={(e) => setShop({ ...shop, opening_hours: e.target.value })}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Contact Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Contact Phone</Label>
                            <Input
                                id="phone"
                                value={shop.contact_phone || ''}
                                onChange={(e) => setShop({ ...shop, contact_phone: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Contact Email</Label>
                            <Input
                                id="email"
                                value={shop.contact_email || ''}
                                onChange={(e) => setShop({ ...shop, contact_email: e.target.value })}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Branding</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="logo">Logo URL</Label>
                        <Input
                            id="logo"
                            value={shop.logo_url || ''}
                            onChange={(e) => setShop({ ...shop, logo_url: e.target.value })}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="cover">Cover Image URL</Label>
                        <Input
                            id="cover"
                            value={shop.cover_image || ''}
                            onChange={(e) => setShop({ ...shop, cover_image: e.target.value })}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave}>Save Profile</Button>
            </div>
        </div>
    );
}

import { Separator } from "@/components/ui/separator";
