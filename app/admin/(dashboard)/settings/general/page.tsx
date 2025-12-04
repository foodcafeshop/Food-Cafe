"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import { getSettings as fetchSettings } from "@/lib/api";
import { Settings } from "@/lib/types";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

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

            <div className="flex justify-end">
                <Button onClick={handleSave}>Save Settings</Button>
            </div>
        </div>
    );
}
