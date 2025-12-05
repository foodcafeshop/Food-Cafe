"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { getSettings as fetchSettings } from "@/lib/api";
import { Settings } from "@/lib/types";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Download } from "lucide-react";
import JSZip from "jszip";
import { generateCSV } from "@/lib/csv-utils";

export default function GeneralSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<Partial<Settings>>({
        currency: '$',
        language: 'en',
        dark_mode: false,
        sound_notifications: true,
        auto_print: false
    });
    const [shopId, setShopId] = useState<string | null>(null);
    const [shopSlug, setShopSlug] = useState<string | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState("");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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
                    setShopId(role.shop_id);
                    loadSettings(role.shop_id);

                    // Fetch shop slug for deletion confirmation
                    const { data: shop } = await supabase
                        .from('shops')
                        .select('slug')
                        .eq('id', role.shop_id)
                        .single();
                    if (shop) setShopSlug(shop.slug);
                }
            }
        };
        fetchShopInfo();
    }, []);

    const loadSettings = async (id: string) => {
        setLoading(true);
        const settingsData = await fetchSettings(id);
        if (settingsData) {
            setSettings(settingsData);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!shopId) return;
        try {
            const { error } = await supabase
                .from('settings')
                .upsert({
                    shop_id: shopId,
                    ...settings,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'shop_id' });

            if (error) throw error;
            toast.success('Settings saved successfully');
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Failed to save settings');
        }
    };

    const handleExportAll = async () => {
        if (!shopId) return;
        try {
            toast.loading("Preparing full backup...");

            // Fetch all data in parallel
            const [
                { data: shop },
                { data: tables },
                { data: menus },
                { data: categories },
                { data: menuItems },
                { data: settingsData },
                { data: orders },
                { data: bills },
                { data: reviews }
            ] = await Promise.all([
                supabase.from('shops').select('*').eq('id', shopId).single(),
                supabase.from('tables').select('*').eq('shop_id', shopId),
                supabase.from('menus').select('*').eq('shop_id', shopId),
                supabase.from('categories').select('*').eq('shop_id', shopId),
                supabase.from('menu_items').select('*').eq('shop_id', shopId),
                supabase.from('settings').select('*').eq('shop_id', shopId).single(),
                supabase.from('orders').select('*').eq('shop_id', shopId).order('created_at', { ascending: false }),
                supabase.from('bills').select('*').eq('shop_id', shopId).order('created_at', { ascending: false }),
                supabase.from('reviews').select('*').eq('shop_id', shopId).order('created_at', { ascending: false })
            ]);

            const zip = new JSZip();
            const dateStr = new Date().toISOString().split('T')[0];

            // Add Shop details as JSON (metadata)
            zip.file("shop.json", JSON.stringify(shop, null, 2));
            if (settingsData) {
                zip.file("settings.json", JSON.stringify(settingsData, null, 2));
            }

            // Convert lists to CSVs with specific columns to exclude system fields
            if (tables?.length) {
                const tableCols = ['label', 'seats', 'x', 'y'];
                zip.file("tables.csv", generateCSV(tables, tableCols));
            }
            if (menus?.length) {
                const menuCols = ['name', 'description', 'dietary_type', 'tags', 'images'];
                zip.file("menus.csv", generateCSV(menus, menuCols));
            }
            if (categories?.length) {
                const catCols = ['name', 'image', 'tags', 'dietary_type'];
                zip.file("categories.csv", generateCSV(categories, catCols));
            }
            if (menuItems?.length) {
                const itemCols = ['name', 'description', 'price', 'original_price', 'images', 'dietary_type', 'tags', 'is_available', 'is_popular', 'is_featured'];
                zip.file("menu_items.csv", generateCSV(menuItems, itemCols));
            }
            if (orders?.length) {
                const orderCols = ['order_number', 'status', 'total_amount', 'payment_status', 'payment_method', 'customer_name', 'customer_phone', 'created_at', 'ready_at', 'served_at'];
                zip.file("orders.csv", generateCSV(orders, orderCols));
            }
            if (bills?.length) {
                const billCols = ['bill_number', 'total_amount', 'payment_method', 'created_at'];
                zip.file("bills.csv", generateCSV(bills, billCols));
            }
            if (reviews?.length) {
                const reviewCols = ['rating', 'comment', 'customer_name', 'created_at'];
                zip.file("reviews.csv", generateCSV(reviews, reviewCols));
            }

            // Generate ZIP
            const content = await zip.generateAsync({ type: "blob" });
            const url = window.URL.createObjectURL(content);
            const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false }).replace(/:/g, '-');

            // Download
            const a = document.createElement('a');
            a.href = url;
            a.download = `shop_backup_${shopId}_${dateStr}_${timestamp}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            toast.dismiss();
            toast.success("Full backup (ZIP) exported successfully");
        } catch (error) {
            console.error('Export error:', error);
            toast.dismiss();
            toast.error("Failed to export data");
        }
    };

    if (loading) return <div>Loading settings...</div>;

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">General Settings</h2>
                <p className="text-muted-foreground">
                    Configure your application preferences.
                </p>
            </div>
            <Separator />

            <Card>
                <CardHeader>
                    <CardTitle>Localization</CardTitle>
                    <CardDescription>Set your preferred currency and language.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="currency">Currency</Label>
                            <Select
                                value={settings.currency}
                                onValueChange={(val) => setSettings({ ...settings, currency: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="$">USD ($)</SelectItem>
                                    <SelectItem value="€">EUR (€)</SelectItem>
                                    <SelectItem value="£">GBP (£)</SelectItem>
                                    <SelectItem value="₹">INR (₹)</SelectItem>
                                    <SelectItem value="¥">JPY (¥)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="language">Language</Label>
                            <Select
                                value={settings.language}
                                onValueChange={(val) => setSettings({ ...settings, language: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="es">Spanish</SelectItem>
                                    <SelectItem value="fr">French</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>System Preferences</CardTitle>
                    <CardDescription>Customize your admin experience.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Sound Notifications</Label>
                            <p className="text-sm text-muted-foreground">Play a sound when a new order arrives.</p>
                        </div>
                        <Switch
                            checked={settings.sound_notifications}
                            onCheckedChange={(checked) => setSettings({ ...settings, sound_notifications: checked })}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Auto Print</Label>
                            <p className="text-sm text-muted-foreground">Automatically print receipts when order is completed.</p>
                        </div>
                        <Switch
                            checked={settings.auto_print}
                            onCheckedChange={(checked) => setSettings({ ...settings, auto_print: checked })}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Table OTP</Label>
                            <p className="text-sm text-muted-foreground">Require a unique OTP for customers to place orders.</p>
                        </div>
                        <Switch
                            checked={settings.enable_otp}
                            onCheckedChange={(checked) => setSettings({ ...settings, enable_otp: checked })}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Data Management</CardTitle>
                    <CardDescription>Manage your shop's data and backups.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Export All Data</Label>
                            <p className="text-sm text-muted-foreground">Download a full JSON backup of your shop's data.</p>
                        </div>
                        <Button variant="outline" onClick={handleExportAll} className="gap-2">
                            <Download className="h-4 w-4" />
                            Export Data
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-destructive/50">
                <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    <CardDescription>Irreversible actions for your shop.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Delete Shop</Label>
                            <p className="text-sm text-muted-foreground">
                                Permanently delete your shop and all associated data. This action cannot be undone.
                            </p>
                        </div>
                        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="destructive">Delete Shop</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                                    <DialogDescription>
                                        This action cannot be undone. This will permanently delete your shop, all associated data, and all staff accounts.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <Label>
                                        Type <span className="font-bold">{shopSlug}</span> to confirm
                                    </Label>
                                    <Input
                                        value={deleteConfirmation}
                                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                                        placeholder={shopSlug || ""}
                                    />
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        disabled={deleteConfirmation !== shopSlug}
                                        onClick={async () => {
                                            if (!shopId) return;
                                            try {
                                                toast.loading("Deleting shop and staff...");

                                                // 1. Fetch all staff members
                                                const staffRes = await fetch('/api/admin/staff');
                                                if (staffRes.ok) {
                                                    const staff = await staffRes.json();

                                                    // 2. Delete each staff member using the API (same method as Team page)
                                                    // We filter out the current user (admin) because the API blocks deleting admins
                                                    // The admin will be deleted by the database trigger when the shop is removed
                                                    const { data: { user: currentUser } } = await supabase.auth.getUser();

                                                    const deletePromises = staff
                                                        .filter((member: any) => member.id !== currentUser?.id)
                                                        .map((member: any) =>
                                                            fetch(`/api/admin/staff?id=${member.id}`, { method: 'DELETE' })
                                                        );

                                                    await Promise.all(deletePromises);
                                                }

                                                // 3. Delete the shop (Triggers cascade for Admin and data)
                                                const { error } = await supabase.from('shops').delete().eq('id', shopId);
                                                if (error) throw error;

                                                toast.success("Shop deleted successfully");
                                                await supabase.auth.signOut();
                                                window.location.href = '/admin/login';
                                            } catch (error: any) {
                                                console.error(error);
                                                toast.error("Failed to delete shop: " + error.message);
                                                toast.dismiss();
                                            }
                                        }}
                                    >
                                        Delete Shop
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave}>Save Settings</Button>
            </div>
        </div>
    );
}
