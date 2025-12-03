"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getSettings } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<any>({
        restaurant_name: '',
        currency: '$',
        language: 'en',
        tax_rate: 0,
        service_charge: 0,
        dark_mode: false,
        sound_notifications: true,
        auto_print: false
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        const data = await getSettings();
        if (data) {
            setSettings(data);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        const { error } = await supabase
            .from('settings')
            .upsert({
                id: 1,
                ...settings,
                updated_at: new Date().toISOString()
            });

        if (error) {
            console.error('Error saving settings:', error);
            toast.error('Failed to save settings');
        } else {
            toast.success('Settings saved successfully');
            // Force reload to ensure other components pick up the change if they don't have real-time listeners
            window.location.reload();
        }
    };

    if (loading) return <div className="p-8">Loading settings...</div>;

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto pb-24">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Settings</h1>
                    <p className="text-muted-foreground">Manage your restaurant preferences</p>
                </div>
                <Button onClick={handleSave}>Save Changes</Button>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>General Information</CardTitle>
                        <CardDescription>Basic details about your establishment.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Restaurant Name</Label>
                            <Input
                                id="name"
                                value={settings.restaurant_name}
                                onChange={(e) => setSettings({ ...settings, restaurant_name: e.target.value })}
                            />
                        </div>
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
                        <CardTitle>Financials</CardTitle>
                        <CardDescription>Tax and service charge configurations.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="tax">Tax Rate (%)</Label>
                                <Input
                                    id="tax"
                                    type="number"
                                    value={settings.tax_rate}
                                    onChange={(e) => setSettings({ ...settings, tax_rate: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="service">Service Charge (%)</Label>
                                <Input
                                    id="service"
                                    type="number"
                                    value={settings.service_charge}
                                    onChange={(e) => setSettings({ ...settings, service_charge: parseFloat(e.target.value) })}
                                />
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
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
