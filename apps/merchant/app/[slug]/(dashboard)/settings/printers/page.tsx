"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { getSettings as fetchSettings } from "@/lib/api";
import { Settings } from "@/lib/types";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Printer } from "lucide-react";
import { useShopId } from "@/lib/hooks/use-shop-id";

export default function PrinterSettingsPage() {
    const { shopId } = useShopId();
    const [loading, setLoading] = useState(true);
    const [shopDetails, setShopDetails] = useState<any>(null);
    const [settings, setSettings] = useState<Partial<Settings>>({
        printer_paper_width: '80mm',
        printer_show_logo: true,
        printer_header_text: '',
        printer_footer_text: 'Thank you for visiting!',
        auto_print: false
    });

    useEffect(() => {
        if (shopId) {
            loadSettings(shopId);
            fetchShopDetails(shopId);
        }
    }, [shopId]);

    const loadSettings = async (id: string) => {
        setLoading(true);
        const settingsData = await fetchSettings(id);
        if (settingsData) {
            setSettings(settingsData);
        }
        setLoading(false);
    };

    const fetchShopDetails = async (id: string) => {
        const { data } = await supabase
            .from('shops')
            .select('name, logo_url')
            .eq('id', id)
            .single();
        if (data) {
            setShopDetails(data);
        }
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
            toast.success('Printer settings saved');
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Failed to save settings');
        }
    };

    if (loading) return <div>Loading settings...</div>;

    return (
        <div className="p-6 space-y-8 max-w-4xl mx-auto">
            <style jsx global>{`
                @media print {
                    @page {
                        size: ${settings.printer_paper_width === '58mm' ? '58mm' : '80mm'} auto;
                        margin: 0mm;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                    }
                    body * {
                        visibility: hidden;
                    }
                    #test-print-area, #test-print-area * {
                        visibility: visible;
                    }
                    #test-print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: ${settings.printer_paper_width === '58mm' ? '58mm' : '80mm'};
                        margin: 0;
                        padding: 5mm 2mm;
                        box-sizing: border-box;
                        visibility: visible; 
                        /* Ensure background/colors are printed */
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            `}</style>

            <div>
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Printer className="h-6 w-6" /> Printer Configuration
                </h2>
                <p className="text-muted-foreground">
                    Customize your thermal receipts and KOTs.
                </p>
                <Separator className="mt-4" />
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Paper & Layout</CardTitle>
                        <CardDescription>Configure physical printer properties.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="paper-width">Paper Width</Label>
                                <Select
                                    value={settings.printer_paper_width}
                                    onValueChange={(val) => setSettings({ ...settings, printer_paper_width: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select width" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="80mm">80mm (Standard)</SelectItem>
                                        <SelectItem value="58mm">58mm (Narrow)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center justify-between border p-3 rounded-lg">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Show Logo</Label>
                                    <p className="text-sm text-muted-foreground">Print shop logo on top of receipt.</p>
                                </div>
                                <Switch
                                    checked={settings.printer_show_logo}
                                    onCheckedChange={(checked) => setSettings({ ...settings, printer_show_logo: checked })}
                                />
                            </div>
                            <div className="flex items-center justify-between border p-3 rounded-lg col-span-1 md:col-span-2">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Auto Print</Label>
                                    <p className="text-sm text-muted-foreground">Automatically trigger print dialog when marking order as paid/served.</p>
                                </div>
                                <Switch
                                    checked={settings.auto_print}
                                    onCheckedChange={(checked) => setSettings({ ...settings, auto_print: checked })}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Receipt Content</CardTitle>
                        <CardDescription>Customize text that appears on your bills.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="header-text">Header Text (Optional)</Label>
                            <Input
                                id="header-text"
                                placeholder="e.g. GSTIN: 12345ABCDE"
                                value={settings.printer_header_text || ''}
                                onChange={(e) => setSettings({ ...settings, printer_header_text: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">Appears below the shop name/logo.</p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="footer-text">Footer Text</Label>
                            <Textarea
                                id="footer-text"
                                placeholder="Thank you message, return policy, etc."
                                value={settings.printer_footer_text || ''}
                                onChange={(e) => setSettings({ ...settings, printer_footer_text: e.target.value })}
                                rows={3}
                            />
                            <p className="text-xs text-muted-foreground">Appears at the bottom of the bill.</p>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button variant="outline" onClick={() => window.print()}>Test Print Page</Button>
                    <Button onClick={handleSave} size="lg">Save Settings</Button>
                </div>
            </div>

            {/* Minimal Preview for context */}
            <div className="mt-8 border-t pt-8">
                <h3 className="font-semibold mb-4">Live Preview (Approximation)</h3>
                <div className="flex justify-center bg-gray-100 p-8 rounded-lg overflow-hidden">
                    <div
                        id="test-print-area"
                        className="bg-white shadow-md transition-all duration-300 flex flex-col items-center text-center p-4 text-black text-sm font-mono leading-tight"
                        style={{ width: settings.printer_paper_width === '58mm' ? '240px' : '320px' }}
                    >
                        {settings.printer_show_logo && (
                            <div className="mb-2 flex justify-center">
                                {shopDetails?.logo_url ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                        src={shopDetails.logo_url}
                                        alt="Logo"
                                        className="w-12 h-12 object-contain grayscale"
                                    />
                                ) : (
                                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center font-bold">
                                        {shopDetails?.name?.[0] || 'LOGO'}
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="font-bold text-base mb-1">{shopDetails?.name || 'Your Shop Name'}</div>
                        {settings.printer_header_text && <div className="text-xs whitespace-pre-wrap mb-2">{settings.printer_header_text}</div>}

                        <div className="w-full border-b border-dashed border-gray-400 my-2"></div>
                        <div className="w-full text-left text-xs mb-2">
                            <div>Table: T1</div>
                            <div>Date: 12/28/2025, 12:44:15 PM</div>
                        </div>

                        {/* Items Header */}
                        <div className="flex w-full text-xs font-bold border-b border-black border-dashed mb-2 pb-1">
                            <span className="text-left flex-1">Item</span>
                            <span className="w-8 text-center">Qty</span>
                            <span className="w-16 text-right">Total</span>
                        </div>

                        {/* Items List */}
                        <div className="w-full text-left text-xs space-y-2 mb-2">
                            <div className="flex">
                                <span className="flex-1">Chicken Wings</span>
                                <span className="w-8 text-center">1</span>
                                <span className="w-16 text-right">{settings.currency || '$'}299.00</span>
                            </div>
                            <div className="flex">
                                <span className="flex-1">Paneer Tikka</span>
                                <span className="w-8 text-center">2</span>
                                <span className="w-16 text-right">{settings.currency || '$'}698.00</span>
                            </div>
                            <div className="flex">
                                <span className="flex-1">Iced Tea</span>
                                <span className="w-8 text-center">1</span>
                                <span className="w-16 text-right">{settings.currency || '$'}129.00</span>
                            </div>
                        </div>

                        <div className="w-full border-b border-black border-dashed my-2"></div>

                        {/* Totals */}
                        <div className="w-full text-xs space-y-1">
                            {(() => {
                                // Mock Totals Calculation
                                const itemTotal = 1126.00; // 299 + 698 + 129
                                const taxRate = settings.tax_rate ?? 5; // Default to 5 if undefined in partial
                                const scRate = settings.service_charge ?? 5; // Default to 5
                                const isTaxIncluded = settings.tax_included_in_price;

                                let subtotalExclusive = 0;
                                let taxAmount = 0;

                                if (isTaxIncluded) {
                                    subtotalExclusive = itemTotal / (1 + (taxRate / 100));
                                    taxAmount = itemTotal - subtotalExclusive;
                                } else {
                                    subtotalExclusive = itemTotal;
                                    taxAmount = subtotalExclusive * (taxRate / 100);
                                }

                                const scAmount = (subtotalExclusive * scRate) / 100;
                                const grandTotal = subtotalExclusive + taxAmount + scAmount;

                                return (
                                    <>
                                        {isTaxIncluded ? (
                                            <div className="flex justify-between">
                                                <span>Subtotal (incl. taxes)</span>
                                                <span>{settings.currency || '$'}{(subtotalExclusive + taxAmount).toFixed(2)}</span>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex justify-between">
                                                    <span>Subtotal</span>
                                                    <span>{settings.currency || '$'}{subtotalExclusive.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Tax ({taxRate}%)</span>
                                                    <span>{settings.currency || '$'}{taxAmount.toFixed(2)}</span>
                                                </div>
                                            </>
                                        )}

                                        {(settings.service_charge ?? 0) > 0 && (
                                            <div className="flex justify-between">
                                                <span>Service Charge ({scRate}%)</span>
                                                <span>{settings.currency || '$'}{scAmount.toFixed(2)}</span>
                                            </div>
                                        )}

                                        <div className="w-full border-b-2 border-black my-2"></div>

                                        <div className="flex justify-between w-full font-bold text-base">
                                            <span>Grand Total</span>
                                            <span>{settings.currency || '$'}{grandTotal.toFixed(2)}</span>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>

                        <div className="w-full border-b border-black border-dashed my-2"></div>

                        <div className="text-xs whitespace-pre-wrap mt-2">{settings.printer_footer_text}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
