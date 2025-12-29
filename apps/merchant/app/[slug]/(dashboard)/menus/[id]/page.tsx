"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Menu, Category, MenuItem, DietaryType } from "@/lib/types";
import { ArrowLeft, GripVertical, Plus, Trash2, X, Edit2, Eye, EyeOff } from "lucide-react";
import { VegIcon, NonVegIcon, VeganIcon, JainVegIcon, ContainsEggIcon } from "@/components/ui/icons";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { getSettings, updateMenuItem, updateMenuCategoryOrder } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getCurrencySymbol } from "@/lib/utils";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Section Component
function SortableSection({ section, sectionItems, menu, currency, onAddItem, onRemoveSection, onRemoveItem, onRestoreItem, onToggleStock, onSelectSection }: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: section.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="mb-6">
            <Card className="overflow-hidden">
                <div className="bg-muted/50 p-4 flex items-center justify-between border-b">
                    <div className="flex items-center gap-3">
                        <div {...attributes} {...listeners} className="cursor-move touch-none">
                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <h3 className="font-bold text-lg">{section.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => { onSelectSection(section.id); onAddItem(); }}>
                            <Plus className="h-4 w-4 mr-2" /> Add Item
                        </Button>
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => onRemoveSection(section.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <div className="p-2">
                    {sectionItems?.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg m-2">
                            No items in this category. Add some!
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            {sectionItems?.map((item: any) => {
                                const isHidden = menu?.hidden_items?.includes(item.id);
                                if (isHidden) return null;

                                if (menu.dietary_type === 'veg' && !['veg', 'vegan', 'jain_veg'].includes(item.dietary_type)) return null;
                                if (menu.dietary_type === 'contains_egg' && item.dietary_type === 'non_veg') return null;
                                if (menu.dietary_type === 'non_veg' && item.dietary_type !== 'non_veg') return null;
                                if (menu.dietary_type === 'vegan' && item.dietary_type !== 'vegan') return null;
                                if (menu.dietary_type === 'jain_veg' && item.dietary_type !== 'jain_veg') return null;

                                return (
                                    <div key={item.id} className="flex items-center gap-4 p-2 rounded-md hover:bg-muted/50 group">
                                        <img src={item.images[0]} className="h-10 w-10 rounded object-cover bg-muted" />
                                        <div className="flex-1">
                                            <div className="font-medium flex items-center gap-1.5">
                                                <span className="shrink-0">
                                                    {item.dietary_type === 'non_veg' && <NonVegIcon className="h-3 w-3" />}
                                                    {item.dietary_type === 'veg' && <VegIcon className="h-3 w-3" />}
                                                    {item.dietary_type === 'vegan' && <VeganIcon className="h-3 w-3" />}
                                                    {item.dietary_type === 'jain_veg' && <JainVegIcon className="h-3 w-3" />}
                                                    {item.dietary_type === 'contains_egg' && <ContainsEggIcon className="h-3 w-3" />}
                                                </span>
                                                {item.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground line-clamp-1">{item.description}</div>
                                        </div>
                                        <div className="font-medium text-sm">{currency}{item.price}</div>
                                        <div className="flex items-center gap-2 mr-2">
                                            <Switch
                                                checked={item.is_available}
                                                onCheckedChange={() => onToggleStock(section.id, item)}
                                                className="scale-75"
                                            />
                                        </div>
                                        <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => onRemoveItem(section.id, item.id)} title="Hide from Menu">
                                            <EyeOff className="h-4 w-4" />
                                        </Button>
                                    </div>
                                );
                            })}

                            {sectionItems?.some((item: any) => {
                                const isExplicitlyHidden = menu?.hidden_items?.includes(item.id);
                                const isIncompatible =
                                    (menu.dietary_type === 'veg' && !['veg', 'vegan', 'jain_veg'].includes(item.dietary_type)) ||
                                    (menu.dietary_type === 'contains_egg' && item.dietary_type === 'non_veg') ||
                                    (menu.dietary_type === 'non_veg' && item.dietary_type !== 'non_veg') ||
                                    (menu.dietary_type === 'vegan' && item.dietary_type !== 'vegan') ||
                                    (menu.dietary_type === 'jain_veg' && item.dietary_type !== 'jain_veg');
                                return isExplicitlyHidden || isIncompatible;
                            }) && (
                                    <div className="mt-4 pt-4 border-t">
                                        <div className="text-xs font-medium text-muted-foreground mb-2">Hidden / Unavailable Items</div>
                                        {sectionItems?.filter((item: any) => {
                                            const isExplicitlyHidden = menu?.hidden_items?.includes(item.id);
                                            const isIncompatible =
                                                (menu.dietary_type === 'veg' && !['veg', 'vegan', 'jain_veg'].includes(item.dietary_type)) ||
                                                (menu.dietary_type === 'contains_egg' && item.dietary_type === 'non_veg') ||
                                                (menu.dietary_type === 'non_veg' && item.dietary_type !== 'non_veg') ||
                                                (menu.dietary_type === 'vegan' && item.dietary_type !== 'vegan') ||
                                                (menu.dietary_type === 'jain_veg' && item.dietary_type !== 'jain_veg');
                                            return isExplicitlyHidden || isIncompatible;
                                        }).map((item: any) => {
                                            const isCompatible =
                                                (menu.dietary_type === 'all') ||
                                                (menu.dietary_type === 'veg' && ['veg', 'vegan', 'jain_veg'].includes(item.dietary_type)) ||
                                                (menu.dietary_type === 'contains_egg' && item.dietary_type !== 'non_veg') ||
                                                (menu.dietary_type === 'non_veg' && item.dietary_type === 'non_veg') ||
                                                (menu.dietary_type === 'vegan' && item.dietary_type === 'vegan') ||
                                                (menu.dietary_type === 'jain_veg' && item.dietary_type === 'jain_veg');

                                            return (
                                                <div key={item.id} className="flex items-center gap-4 p-2 rounded-md opacity-60 hover:opacity-100 bg-muted/30">
                                                    <img src={item.images[0]} className="h-8 w-8 rounded object-cover bg-muted grayscale" />
                                                    <div className="flex-1">
                                                        <div className="font-medium text-sm">{item.name}</div>
                                                        {!isCompatible && <div className="text-[10px] text-destructive">Incompatible with Menu Type</div>}
                                                    </div>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className={`h-8 w-8 ${!isCompatible ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        onClick={() => isCompatible && onRestoreItem(item)}
                                                        title={isCompatible ? "Restore to Menu" : "Cannot restore: Incompatible Dietary Type"}
                                                        disabled={!isCompatible}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}

import { useShopId } from "@/lib/hooks/use-shop-id";

export default function MenuBuilderPage() {
    const { shopId } = useShopId();
    const params = useParams();
    const id = params.id as string;
    const slug = params.slug as string;
    const router = useRouter();
    const [menu, setMenu] = useState<Menu | null>(null);
    const [sections, setSections] = useState<Category[]>([]); // Global sections
    const [menuSections, setMenuSections] = useState<Category[]>([]); // Sections in this menu
    const [sectionItems, setSectionItems] = useState<Record<string, MenuItem[]>>({}); // Items in each section
    const [allItems, setAllItems] = useState<MenuItem[]>([]); // Global items for selection
    const [currency, setCurrency] = useState("$");

    const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
    const [isAddItemOpen, setIsAddItemOpen] = useState(false);
    const [isEditDetailsOpen, setIsEditDetailsOpen] = useState(false);
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (id && shopId) {
            fetchMenuData();
            fetchGlobalData();
        }
    }, [id, shopId]);

    const fetchMenuData = async () => {
        if (!shopId) return;
        // 0. Fetch Settings
        const settings = await getSettings(shopId);
        if (settings?.currency) setCurrency(getCurrencySymbol(settings.currency));

        // 1. Fetch Menu
        const { data: menuData } = await supabase.from('menus').select('*').eq('id', id).single();
        setMenu(menuData);

        // 2. Fetch Sections linked to this Menu
        const { data: menuCats } = await supabase
            .from('menu_categories')
            .select(`
                category_id,
                categories (*)
            `)
            .eq('menu_id', id)
            .order('sort_order');

        if (menuCats) {
            const cats = menuCats.map((mc: any) => mc.categories);
            setMenuSections(cats);

            // 3. Fetch Items for each Section
            const itemsMap: Record<string, MenuItem[]> = {};
            for (const cat of cats) {
                const { data: catItems } = await supabase
                    .from('category_items')
                    .select(`
                        menu_item_id,
                        menu_items (*)
                    `)
                    .eq('category_id', cat.id)
                    .order('sort_order');

                if (catItems) {
                    itemsMap[cat.id] = catItems.map((ci: any) => ci.menu_items);
                }
            }
            setSectionItems(itemsMap);
        }
    };

    const fetchGlobalData = async () => {
        if (!shopId) return;
        const { data: cats } = await supabase.from('categories').select('*').eq('shop_id', shopId);
        setSections(cats || []);

        const { data: items } = await supabase.from('menu_items').select('*').eq('shop_id', shopId);
        setAllItems(items || []);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setMenuSections((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over?.id);
                const newOrder = arrayMove(items, oldIndex, newIndex);

                // Update backend
                updateMenuCategoryOrder(id as string, newOrder.map(c => c.id));

                return newOrder;
            });
        }
    };

    const handleAddSection = async (categoryId: string) => {
        const { error } = await supabase.from('menu_categories').insert({
            menu_id: id,
            category_id: categoryId,
            sort_order: menuSections.length
        });

        if (!error) {
            fetchMenuData();
            setIsAddSectionOpen(false);
        }
    };

    const handleRemoveSection = async (categoryId: string) => {
        if (confirm("Remove this section from the menu?")) {
            await supabase.from('menu_categories').delete().match({ menu_id: id, category_id: categoryId });
            fetchMenuData();
        }
    };

    const handleAddItem = async (itemId: string) => {
        if (!selectedSectionId) return;

        const currentItems = sectionItems[selectedSectionId] || [];
        const { error } = await supabase.from('category_items').insert({
            category_id: selectedSectionId,
            menu_item_id: itemId,
            sort_order: currentItems.length
        });

        if (!error) {
            fetchMenuData();
            setIsAddItemOpen(false);
        }
    };

    const handleRemoveItem = async (categoryId: string, itemId: string) => {
        if (!menu) return;

        // Hide item from this menu (add to hidden_items)
        const newHiddenItems = [...(menu.hidden_items || []), itemId];

        const { error } = await supabase.from('menus').update({
            hidden_items: newHiddenItems
        }).eq('id', menu.id);

        if (error) {
            console.error("Error hiding item:", error);
            toast.error("Failed to hide item");
        } else {
            setMenu({ ...menu, hidden_items: newHiddenItems });
            toast.success("Item hidden from menu");
        }
    };

    const handleRestoreItem = async (item: MenuItem) => {
        if (!menu) return;

        // Validation: Check dietary compatibility
        if (menu.dietary_type === 'veg' && !['veg', 'vegan', 'jain_veg'].includes(item.dietary_type)) {
            toast.error("Cannot restore non-veg/egg item to a veg menu");
            return;
        }
        if (menu.dietary_type === 'contains_egg' && item.dietary_type === 'non_veg') {
            toast.error("Cannot restore non-veg item to an egg+veg menu");
            return;
        }
        if (menu.dietary_type === 'non_veg' && item.dietary_type !== 'non_veg') {
            toast.error("Cannot restore item to non-veg only menu");
            return;
        }
        if (menu.dietary_type === 'vegan' && item.dietary_type !== 'vegan') {
            toast.error("Cannot restore non-vegan item to a vegan menu");
            return;
        }
        if (menu.dietary_type === 'jain_veg' && item.dietary_type !== 'jain_veg') {
            toast.error("Cannot restore non-jain item to a jain menu");
            return;
        }

        // Unhide item (remove from hidden_items)
        const newHiddenItems = (menu.hidden_items || []).filter(id => id !== item.id);

        const { error } = await supabase.from('menus').update({
            hidden_items: newHiddenItems
        }).eq('id', menu.id);

        if (error) {
            console.error("Error restoring item:", error);
            toast.error("Failed to restore item");
        } else {
            setMenu({ ...menu, hidden_items: newHiddenItems });
            toast.success("Item restored to menu");
        }
    };

    const handleToggleStock = async (sectionId: string, item: MenuItem) => {
        try {
            const newStatus = !item.is_available;
            await updateMenuItem(item.id, { is_available: newStatus });

            // Optimistic update
            setSectionItems(prev => ({
                ...prev,
                [sectionId]: prev[sectionId].map(i => i.id === item.id ? { ...i, is_available: newStatus } : i)
            }));
            toast.success(`Item marked as ${newStatus ? 'In Stock' : 'Out of Stock'}`);
        } catch (e) {
            console.error(e);
            toast.error("Failed to update stock status");
        }
    };

    const handleUpdateMenu = async () => {
        if (!menu) return;
        const { error } = await supabase.from('menus').update({
            name: menu.name,
            description: menu.description,
            tags: menu.tags,
            dietary_type: menu.dietary_type
        }).eq('id', menu.id);

        if (error) {
            console.error("Error updating menu:", error);
        } else {
            setIsEditDetailsOpen(false);
        }
    };

    if (!menu) return <div className="p-8">Loading...</div>;
    return (
        <div className="p-6 space-y-6 pb-24">
            <div className="flex items-center gap-4">
                <Link href={`/${slug}/menus`}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold">{menu.name}</h1>
                        <Button variant="ghost" size="icon" onClick={() => setIsEditDetailsOpen(true)}>
                            <Edit2 className="h-4 w-4" />
                        </Button>
                    </div>
                    <p className="text-muted-foreground">Builder</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {menu.tags?.map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                        {menu.dietary_type && menu.dietary_type !== 'all' && (
                            <Badge variant="outline" className="text-xs border-primary text-primary">
                                {menu.dietary_type === 'veg' ? 'VEG ONLY' :
                                    menu.dietary_type === 'non_veg' ? 'NON-VEG ONLY' :
                                        menu.dietary_type === 'vegan' ? 'VEGAN ONLY' :
                                            menu.dietary_type === 'jain_veg' ? 'JAIN ONLY' : 'EGG + VEG'}
                            </Badge>
                        )}
                    </div>
                </div>
                <Button className="ml-auto gap-2" onClick={() => setIsAddSectionOpen(true)}>
                    <Plus className="h-4 w-4" /> Add Category
                </Button>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={menuSections.map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-6">
                        {menuSections.map((section) => (
                            <SortableSection
                                key={section.id}
                                section={section}
                                sectionItems={sectionItems[section.id]}
                                menu={menu}
                                currency={currency}
                                onAddItem={() => setIsAddItemOpen(true)}
                                onSelectSection={setSelectedSectionId}
                                onRemoveSection={handleRemoveSection}
                                onRemoveItem={handleRemoveItem}
                                onRestoreItem={handleRestoreItem}
                                onToggleStock={handleToggleStock}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {/* Add Section Dialog */}
            <Dialog open={isAddSectionOpen} onOpenChange={setIsAddSectionOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Category to Menu</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {sections.filter(s => !menuSections.find(ms => ms.id === s.id)).map(section => (
                            <div key={section.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted cursor-pointer" onClick={() => handleAddSection(section.id)}>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{section.name}</span>
                                    {section.dietary_type && section.dietary_type !== 'all' && (
                                        <Badge variant="outline" className="text-[10px] h-5 border-primary text-primary px-1">
                                            {section.dietary_type === 'veg' ? 'VEG' :
                                                section.dietary_type === 'non_veg' ? 'NON-VEG' :
                                                    section.dietary_type === 'vegan' ? 'VEGAN' :
                                                        section.dietary_type === 'jain_veg' ? 'JAIN' : 'EGG'}
                                        </Badge>
                                    )}
                                </div>
                                <Plus className="h-4 w-4" />
                            </div>
                        ))}
                        {sections.length === 0 && <div className="text-center text-muted-foreground">No categories found. Create one in Category Management.</div>}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Item Dialog */}
            <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add Item to Section</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-2 py-4">
                        {allItems.map(item => {
                            const isAdded = selectedSectionId && sectionItems[selectedSectionId]?.find(i => i.id === item.id);
                            if (isAdded) return null;

                            // Filter based on dietary type
                            if (menu.dietary_type === 'veg' && !['veg', 'vegan', 'jain_veg'].includes(item.dietary_type)) return null;
                            if (menu.dietary_type === 'contains_egg' && item.dietary_type === 'non_veg') return null;
                            if (menu.dietary_type === 'non_veg' && item.dietary_type !== 'non_veg') return null;
                            if (menu.dietary_type === 'vegan' && item.dietary_type !== 'vegan') return null;
                            if (menu.dietary_type === 'jain_veg' && item.dietary_type !== 'jain_veg') return null;

                            return (
                                <div key={item.id} className="flex items-center gap-4 p-2 border rounded-lg hover:bg-muted cursor-pointer" onClick={() => handleAddItem(item.id)}>
                                    <img src={item.images[0]} className="h-12 w-12 rounded object-cover bg-muted" />
                                    <div className="flex-1">
                                        <div className="font-medium flex items-center gap-1.5">
                                            <span className="shrink-0">
                                                {item.dietary_type === 'non_veg' && <NonVegIcon className="h-3 w-3" />}
                                                {item.dietary_type === 'veg' && <VegIcon className="h-3 w-3" />}
                                                {item.dietary_type === 'vegan' && <VeganIcon className="h-3 w-3" />}
                                                {item.dietary_type === 'jain_veg' && <JainVegIcon className="h-3 w-3" />}
                                                {item.dietary_type === 'contains_egg' && <ContainsEggIcon className="h-3 w-3" />}
                                            </span>
                                            {item.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground">{item.description}</div>
                                    </div>
                                    <div className="font-bold">{currency}{item.price}</div>
                                    <Plus className="h-4 w-4" />
                                </div>
                            );
                        })}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Menu Details Dialog */}
            <Dialog open={isEditDetailsOpen} onOpenChange={setIsEditDetailsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Menu Details</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input id="name" value={menu.name} onChange={e => setMenu({ ...menu, name: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="desc" className="text-right">Description</Label>
                            <Input id="desc" value={menu.description || ''} onChange={e => setMenu({ ...menu, description: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="tags" className="text-right">Tags</Label>
                            <Input
                                id="tags"
                                placeholder="Comma separated"
                                value={menu.tags?.join(', ') || ''}
                                onChange={e => setMenu({ ...menu, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="dietary" className="text-right">Dietary Type</Label>
                            <div className="col-span-3">
                                <Select
                                    value={menu.dietary_type || 'all'}
                                    onValueChange={(val: 'all' | DietaryType) => setMenu({ ...menu, dietary_type: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Items Allowed</SelectItem>
                                        <SelectItem value="veg">Vegetarian Only</SelectItem>
                                        <SelectItem value="contains_egg">Egg + Veg</SelectItem>
                                        <SelectItem value="non_veg">Non-Veg Only</SelectItem>
                                        <SelectItem value="vegan">Vegan Only</SelectItem>
                                        <SelectItem value="jain_veg">Jain Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleUpdateMenu}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
