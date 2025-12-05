"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Menu } from "@/lib/types";
import { Edit2, Plus, Search, Trash2, CheckCircle2, Circle, FileUp, FileDown } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DietaryType } from "@/lib/types";

import { toast } from "sonner";
import { exportToCSV, parseCSV } from "@/lib/csv-utils";

import { useShopId } from "@/lib/hooks/use-shop-id";

export default function MenusPage() {
    const { shopId } = useShopId();
    const [menus, setMenus] = useState<Menu[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentMenu, setCurrentMenu] = useState<Partial<Menu>>({});

    useEffect(() => {
        if (shopId) {
            fetchMenus();
        }
    }, [shopId]);

    const fetchMenus = async () => {
        if (!shopId) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('menus')
            .select('*')
            .eq('shop_id', shopId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching menus:', error);
            toast.error('Failed to fetch menus');
        } else {
            setMenus(data || []);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!currentMenu.name || !shopId) return;

        const { data, error } = await supabase
            .from('menus')
            .upsert({ ...currentMenu, shop_id: shopId })
            .select()
            .single();

        if (error) {
            console.error('Error saving menu:', error);
            toast.error('Failed to save menu');
        } else {
            setMenus(prev => {
                const exists = prev.find(m => m.id === data.id);
                if (exists) {
                    return prev.map(m => m.id === data.id ? data : m);
                }
                return [data, ...prev];
            });
            setIsDialogOpen(false);
            toast.success('Menu saved successfully');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this menu?")) {
            const { error } = await supabase.from('menus').delete().eq('id', id);
            if (error) {
                toast.error('Failed to delete menu');
            } else {
                setMenus(menus.filter(m => m.id !== id));
                toast.success('Menu deleted');
            }
        }
    };

    const handleActivate = async (menu: Menu) => {
        // Optimistic update
        setMenus(menus.map(m => ({ ...m, is_active: m.id === menu.id })));

        // 1. Deactivate all
        await supabase.from('menus').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');

        // 2. Activate selected
        const { error } = await supabase.from('menus').update({ is_active: true }).eq('id', menu.id);

        if (error) {
            toast.error('Failed to activate menu');
            fetchMenus(); // Revert
        } else {
            toast.success('Menu activated');
        }
    };

    const handleExport = () => {
        const exportData = menus.map(({ name, description, tags, dietary_type, is_active }) => ({
            name,
            description,
            tags: tags?.join(', '),
            dietary_type,
            is_active
        }));
        exportToCSV(exportData, `menus_${new Date().toISOString().split('T')[0]}`, ['name', 'description', 'dietary_type', 'is_active', 'tags']);
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !shopId) return;

        try {
            const data = await parseCSV(file);
            if (data.length === 0) {
                toast.error("No data found in CSV");
                return;
            }

            let successCount = 0;
            let failCount = 0;

            for (const row of data) {
                if (!row.name) {
                    failCount++;
                    continue;
                }

                const menuData = {
                    shop_id: shopId,
                    name: row.name,
                    description: row.description,
                    dietary_type: row.dietary_type || 'all',
                    is_active: row.is_active === true || row.is_active === 'true',
                    tags: row.tags ? String(row.tags).split(',').map(t => t.trim()) : []
                };

                const { error } = await supabase
                    .from('menus')
                    .insert(menuData);

                if (error) failCount++;
                else successCount++;
            }

            toast.success(`Imported ${successCount} menus. Failed: ${failCount}`);
            fetchMenus();
            e.target.value = '';
        } catch (error) {
            console.error(error);
            toast.error("Failed to process CSV file");
        }
    };

    const filteredMenus = menus.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Menus</h1>
                <div className="flex gap-2">
                    <div className="relative">
                        <input
                            type="file"
                            accept=".csv"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleImport}
                            title="Import Menus CSV"
                        />
                        <Button variant="outline" className="gap-2">
                            <FileUp className="h-4 w-4" /> Import
                        </Button>
                    </div>
                    <Button variant="outline" className="gap-2" onClick={handleExport}>
                        <FileDown className="h-4 w-4" /> Export
                    </Button>
                    <Button className="gap-2" onClick={() => { setCurrentMenu({}); setIsDialogOpen(true); }}>
                        <Plus className="h-4 w-4" /> Create New Menu
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredMenus.map((menu) => (
                    <Card
                        key={menu.id}
                        className={`flex flex-col p-4 gap-4 cursor-pointer hover:border-primary/50 transition-colors ${menu.is_active ? 'border-primary ring-1 ring-primary' : ''}`}
                        onClick={() => window.location.href = `/admin/menus/${menu.id}`}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-lg">{menu.name}</h3>
                                <p className="text-sm text-muted-foreground">{menu.description}</p>
                            </div>
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <Label htmlFor={`active-${menu.id}`} className="text-xs font-medium text-muted-foreground">
                                    {menu.is_active ? 'Active' : 'Inactive'}
                                </Label>
                                <Switch
                                    id={`active-${menu.id}`}
                                    checked={menu.is_active}
                                    onCheckedChange={() => handleActivate(menu)}
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-2">
                            {menu.tags?.map((tag, i) => (
                                <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                            ))}
                            {menu.dietary_type && menu.dietary_type !== 'all' && (
                                <Badge variant="outline" className="text-xs border-primary text-primary">
                                    {menu.dietary_type === 'veg' ? 'VEG ONLY' : menu.dietary_type === 'non_veg' ? 'NON-VEG ONLY' : 'VEGAN ONLY'}
                                </Badge>
                            )}
                        </div>

                        <div className="flex items-center justify-between mt-auto pt-4 border-t">
                            <div className="flex gap-2">
                                <Link href={`/admin/menus/${menu.id}`} onClick={(e) => e.stopPropagation()}>
                                    <Button variant="secondary" size="sm">
                                        Build Menu
                                    </Button>
                                </Link>
                            </div>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setCurrentMenu(menu); setIsDialogOpen(true); }}>
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(menu.id); }}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{currentMenu.id ? 'Edit Menu' : 'Create New Menu'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input id="name" value={currentMenu.name || ''} onChange={e => setCurrentMenu({ ...currentMenu, name: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="desc" className="text-right">Description</Label>
                            <Input id="desc" value={currentMenu.description || ''} onChange={e => setCurrentMenu({ ...currentMenu, description: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="tags" className="text-right">Tags</Label>
                            <Input
                                id="tags"
                                placeholder="Comma separated (e.g. lunch, specials)"
                                value={currentMenu.tags?.join(', ') || ''}
                                onChange={e => setCurrentMenu({ ...currentMenu, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="dietary" className="text-right">Dietary Type</Label>
                            <div className="col-span-3">
                                <Select
                                    value={currentMenu.dietary_type || 'all'}
                                    onValueChange={(val: 'all' | DietaryType) => setCurrentMenu({ ...currentMenu, dietary_type: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Items Allowed</SelectItem>
                                        <SelectItem value="veg">Vegetarian Only</SelectItem>
                                        <SelectItem value="non_veg">Non-Veg Only</SelectItem>
                                        <SelectItem value="vegan">Vegan Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSave}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
