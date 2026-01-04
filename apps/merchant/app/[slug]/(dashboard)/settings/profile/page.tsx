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
            const cleanedShop = {
                ...shop,
                gallery_images: shop.gallery_images?.filter(url => url.trim() !== '') || []
            };
            await updateShopDetails(slug, cleanedShop);
            setShop(cleanedShop);
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
                        <CardDescription>Control your shop's public availability.</CardDescription>
                    </div>
                    <div className="flex flex-col gap-4 items-end">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="isLive" className={shop.is_live ? "text-green-600 font-bold" : "text-muted-foreground"}>
                                {shop.is_live ? "Live" : "Draft Mode"}
                            </Label>
                            <Switch
                                id="isLive"
                                checked={shop.is_live || false}
                                onCheckedChange={(checked) => setShop({ ...shop, is_live: checked })}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="isOpen" className={shop.is_open ? "text-green-600 font-bold" : "text-red-500 font-bold"}>
                                {shop.is_open ? "Accepting Orders" : "Closed"}
                            </Label>
                            <Switch
                                id="isOpen"
                                checked={shop.is_open !== false} // Default to true if undefined
                                onCheckedChange={(checked) => setShop({ ...shop, is_open: checked })}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="displayRatings" className="text-muted-foreground">
                                Display Ratings
                            </Label>
                            <Switch
                                id="displayRatings"
                                checked={shop.display_ratings !== false}
                                onCheckedChange={(checked) => setShop({ ...shop, display_ratings: checked })}
                            />
                        </div>
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
                    <CardTitle>Location & Social Media</CardTitle>
                    <CardDescription>Help customers find you and connect on social media.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="locationUrl">Google Maps Location URL</Label>
                        <Input
                            id="locationUrl"
                            placeholder="https://maps.google.com/..."
                            value={shop.location_url || ''}
                            onChange={(e) => setShop({ ...shop, location_url: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">Paste your Google Maps share link for the &quot;Directions&quot; button.</p>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="instagram">Instagram</Label>
                            <Input
                                id="instagram"
                                placeholder="https://instagram.com/yourshop"
                                value={(shop.social_links as any)?.instagram || ''}
                                onChange={(e) => setShop({
                                    ...shop,
                                    social_links: { ...(shop.social_links as any || {}), instagram: e.target.value }
                                })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="facebook">Facebook</Label>
                            <Input
                                id="facebook"
                                placeholder="https://facebook.com/yourshop"
                                value={(shop.social_links as any)?.facebook || ''}
                                onChange={(e) => setShop({
                                    ...shop,
                                    social_links: { ...(shop.social_links as any || {}), facebook: e.target.value }
                                })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="website">Website</Label>
                            <Input
                                id="website"
                                placeholder="https://yourshop.com"
                                value={(shop.social_links as any)?.website || ''}
                                onChange={(e) => setShop({
                                    ...shop,
                                    social_links: { ...(shop.social_links as any || {}), website: e.target.value }
                                })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="youtube">YouTube</Label>
                            <Input
                                id="youtube"
                                placeholder="https://youtube.com/@yourshop"
                                value={(shop.social_links as any)?.youtube || ''}
                                onChange={(e) => setShop({
                                    ...shop,
                                    social_links: { ...(shop.social_links as any || {}), youtube: e.target.value }
                                })}
                            />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="googleMaps">Google Maps Profile</Label>
                        <Input
                            id="googleMaps"
                            placeholder="https://g.page/yourshop"
                            value={(shop.social_links as any)?.google_maps || ''}
                            onChange={(e) => setShop({
                                ...shop,
                                social_links: { ...(shop.social_links as any || {}), google_maps: e.target.value }
                            })}
                        />
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

            <Card>
                <CardHeader>
                    <CardTitle>Gallery Images</CardTitle>
                    <CardDescription>Add up to 16 images to be displayed in the gallery section of your shop's landing page.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-4">
                        {(shop.gallery_images || []).map((url, index) => (
                            <div key={index} className="flex gap-2">
                                <Input
                                    value={url}
                                    placeholder="https://..."
                                    onChange={(e) => {
                                        const newImages = [...(shop.gallery_images || [])];
                                        newImages[index] = e.target.value;
                                        setShop({ ...shop, gallery_images: newImages });
                                    }}
                                />
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => {
                                        const newImages = [...(shop.gallery_images || [])];
                                        newImages.splice(index, 1);
                                        setShop({ ...shop, gallery_images: newImages });
                                    }}
                                >
                                    X
                                </Button>
                            </div>
                        ))}
                    </div>
                    {(shop.gallery_images?.length || 0) < 16 && (
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShop({ ...shop, gallery_images: [...(shop.gallery_images || []), ''] });
                            }}
                            className="w-full"
                        >
                            + Add Image
                        </Button>
                    )}
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave}>Save Profile</Button>
            </div>
        </div>
    );
}

import { Separator } from "@/components/ui/separator";
