"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSettings as fetchSettings } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { Settings } from "@/lib/types";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

export default function FinancialSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<Partial<Settings>>({
        tax_rate: 0,
        service_charge: 0
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
            toast.success('Financial settings saved successfully');
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Failed to save settings');
        }
    };

    if (loading) return <div>Loading financials...</div>;

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Financials</h2>
                <p className="text-muted-foreground">
                    Manage taxes and service charges.
                </p>
            </div>
            <Separator />

            <Card>
                <CardHeader>
                    <CardTitle>Charges</CardTitle>
                    <CardDescription>Configure additional charges applied to orders.</CardDescription>
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

            <div className="flex justify-end">
                <Button onClick={handleSave}>Save Financials</Button>
            </div>
        </div>
    );
}
