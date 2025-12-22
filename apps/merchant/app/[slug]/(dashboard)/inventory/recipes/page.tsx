"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { InventoryItem, MenuItem } from "@/lib/types";
import { Search, Plus, Trash2, FileText, UtensilsCrossed } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useShopId } from "@/lib/hooks/use-shop-id";
import { supabase } from "@/lib/supabase";
import {
    getInventoryItems,
    getAllRecipes,
    getMenuItemIngredients,
    setMenuItemIngredients
} from "@/lib/api";

interface RecipeIngredient {
    inventory_item_id: string;
    quantity_required: number;
    inventory_item?: InventoryItem;
    selected_unit?: string;
}

const UNIT_CONVERSIONS: Record<string, { unit: string; factor: number }> = {
    'kg': { unit: 'g', factor: 1000 },
    'L': { unit: 'ml', factor: 1000 },
    'dozen': { unit: 'pcs', factor: 12 },
};

interface MenuItemWithRecipe extends MenuItem {
    menu_item_ingredients: {
        id: string;
        quantity_required: number;
        inventory_items: InventoryItem;
        unit?: string;
    }[];
}

export default function RecipesPage() {
    const { shopId } = useShopId();
    const [menuItems, setMenuItems] = useState<MenuItemWithRecipe[]>([]);
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Recipe Dialog
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItemWithRecipe | null>(null);
    const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);

    useEffect(() => {
        if (shopId) fetchData();
    }, [shopId]);

    const fetchData = async () => {
        if (!shopId) return;
        setLoading(true);

        const [recipes, inventory] = await Promise.all([
            getAllRecipes(shopId),
            getInventoryItems(shopId)
        ]);

        setMenuItems(recipes as any);
        setInventoryItems(inventory);
        setLoading(false);
    };

    const filteredItems = menuItems.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase())
    );

    const openRecipeDialog = (item: MenuItemWithRecipe) => {
        setEditingItem(item);
        setIngredients(
            item.menu_item_ingredients?.map(ing => {
                const baseUnit = ing.inventory_items?.unit;
                const persistedUnit = ing.unit;
                let displayQty = ing.quantity_required;

                // If persisted unit exists and differs from base, convert quantity for display
                if (baseUnit && persistedUnit && persistedUnit !== baseUnit) {
                    const conversion = UNIT_CONVERSIONS[baseUnit];
                    if (conversion && persistedUnit === conversion.unit) {
                        displayQty = displayQty * conversion.factor;
                    }
                }

                return {
                    inventory_item_id: ing.inventory_items?.id || '',
                    quantity_required: parseFloat(displayQty.toFixed(3)),
                    inventory_item: ing.inventory_items,
                    selected_unit: persistedUnit || baseUnit
                };
            }) || []
        );
        setIsDialogOpen(true);
    };

    const addIngredient = () => {
        setIngredients([...ingredients, { inventory_item_id: '', quantity_required: 0 }]);
    };

    const removeIngredient = (index: number) => {
        setIngredients(ingredients.filter((_, i) => i !== index));
    };

    const updateIngredient = (index: number, field: 'inventory_item_id' | 'quantity_required', value: string | number) => {
        const updated = [...ingredients];
        if (field === 'inventory_item_id') {
            updated[index].inventory_item_id = value as string;
            const item = inventoryItems.find(i => i.id === value);
            updated[index].inventory_item = item;

            // Smart Unit Default: Check if smaller unit exists
            let defaultUnit = item?.unit;
            if (item?.unit && UNIT_CONVERSIONS[item.unit]) {
                defaultUnit = UNIT_CONVERSIONS[item.unit].unit;
            }

            updated[index].selected_unit = defaultUnit;
            updated[index].quantity_required = 0;
        } else {
            updated[index].quantity_required = value as number;
        }
        setIngredients(updated);
    };

    const updateUnit = (index: number, newUnit: string) => {
        const updated = [...ingredients];
        const ing = updated[index];
        const baseUnit = ing.inventory_item?.unit;

        if (!baseUnit) return;

        // 1. Convert current display value to BASE unit value
        let baseValue = ing.quantity_required;
        const currentConversion = UNIT_CONVERSIONS[baseUnit];
        // If we are currently in the ALT unit (e.g. 'g'), divide by factor to get base (kg)
        if (currentConversion && ing.selected_unit === currentConversion.unit) {
            baseValue = ing.quantity_required / currentConversion.factor;
        }

        // 2. Convert BASE unit value to NEW unit value
        let newValue = baseValue;
        // If we are switching TO the ALT unit (e.g. 'g'), multiply base by factor
        if (currentConversion && newUnit === currentConversion.unit) {
            newValue = baseValue * currentConversion.factor;
        }

        updated[index].selected_unit = newUnit;
        updated[index].quantity_required = parseFloat(newValue.toFixed(3));
        setIngredients(updated);
    };

    const saveRecipe = async () => {
        if (!editingItem) return;

        // Filter out empty ingredients
        // Filter out empty ingredients and normalize units
        const validIngredients = ingredients
            .filter(ing => ing.inventory_item_id && ing.quantity_required > 0)
            .map(ing => {
                let qty = ing.quantity_required;
                const baseUnit = ing.inventory_item?.unit;

                // Convert back to base unit if necessary
                if (baseUnit) {
                    const conversion = UNIT_CONVERSIONS[baseUnit];
                    if (conversion && ing.selected_unit === conversion.unit) {
                        qty = qty / conversion.factor;
                    }
                }

                return {
                    inventory_item_id: ing.inventory_item_id,
                    quantity_required: qty,
                    unit: ing.selected_unit
                };
            });

        try {
            await setMenuItemIngredients(editingItem.id, validIngredients);
            toast.success('Recipe saved successfully');
            setIsDialogOpen(false);
            fetchData(); // Refresh
        } catch (error: any) {
            toast.error(error.message || 'Failed to save recipe');
        }
    };

    const getRecipeStatus = (item: MenuItemWithRecipe) => {
        if (!item.menu_item_ingredients || item.menu_item_ingredients.length === 0) {
            return { status: 'none', label: 'No Recipe', color: 'bg-gray-100 text-gray-600' };
        }
        return { status: 'set', label: `${item.menu_item_ingredients.length} ingredients`, color: 'bg-green-100 text-green-700' };
    };

    const itemsWithRecipes = menuItems.filter(i => i.menu_item_ingredients?.length > 0).length;
    const itemsWithoutRecipes = menuItems.length - itemsWithRecipes;

    return (
        <div className="min-h-full bg-background">
            <div className="p-6 pb-6 space-y-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <FileText className="h-6 w-6" />
                            Recipes
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Link raw materials (ingredients) to menu items
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">With Recipes</p>
                                    <p className="text-2xl font-bold text-green-600">{itemsWithRecipes}</p>
                                </div>
                                <FileText className="h-8 w-8 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Without Recipes</p>
                                    <p className="text-2xl font-bold text-muted-foreground">{itemsWithoutRecipes}</p>
                                </div>
                                <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Search - Sticky */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 px-6 border-y shadow-sm">
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search menu items..."
                        className="pl-9 bg-background"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Scrollable Items Section */}
            <div className="p-6 pt-6">
                <div className="grid gap-4">
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading recipes...</div>
                    ) : filteredItems.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            {search ? 'No items match your search.' : 'No menu items found. Create menu items first.'}
                        </div>
                    ) : (
                        filteredItems.map((item) => {
                            const recipeStatus = getRecipeStatus(item);
                            return (
                                <Card key={item.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => openRecipeDialog(item)}>
                                    <div className="flex items-center gap-4">
                                        {/* Image */}
                                        <div className="h-14 w-14 rounded-md overflow-hidden shrink-0 bg-muted">
                                            {item.images?.[0] ? (
                                                <img src={item.images[0]} alt={item.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center">
                                                    <UtensilsCrossed className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-semibold">{item.name}</h3>
                                                <Badge className={recipeStatus.color}>{recipeStatus.label}</Badge>
                                            </div>
                                            {item.menu_item_ingredients?.length > 0 && (
                                                <p className="text-sm text-muted-foreground mt-1 truncate">
                                                    {item.menu_item_ingredients.map(ing => ing.inventory_items?.name).filter(Boolean).join(', ')}
                                                </p>
                                            )}
                                        </div>

                                        <Button variant="outline" size="sm">
                                            Edit Recipe
                                        </Button>
                                    </div>
                                </Card>
                            );
                        })
                    )}
                </div>

                {/* Recipe Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                Edit Recipe: {editingItem?.name}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="flex items-center justify-between">
                                <Label>Ingredients</Label>
                                <Button variant="outline" size="sm" onClick={addIngredient}>
                                    <Plus className="h-4 w-4 mr-1" /> Add Ingredient
                                </Button>
                            </div>

                            {ingredients.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground border rounded-lg">
                                    No ingredients added. Click "Add Ingredient" to start.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {ingredients.map((ing, index) => (
                                        <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn(
                                                            "flex-1 justify-between",
                                                            !ing.inventory_item_id && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {ing.inventory_item_id
                                                            ? inventoryItems.find((item) => item.id === ing.inventory_item_id)?.name
                                                            : "Select ingredient"}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="p-0" align="start">
                                                    <Command>
                                                        <CommandInput placeholder="Search ingredient..." />
                                                        <CommandList>
                                                            <CommandEmpty>No ingredient found.</CommandEmpty>
                                                            <CommandGroup>
                                                                {inventoryItems.map((item) => {
                                                                    const isSelected = ingredients.some(
                                                                        (i, iIndex) => i.inventory_item_id === item.id && iIndex !== index
                                                                    );
                                                                    if (isSelected) return null; // Hide already selected items

                                                                    return (
                                                                        <CommandItem
                                                                            value={item.name}
                                                                            key={item.id}
                                                                            onSelect={() => {
                                                                                updateIngredient(index, "inventory_item_id", item.id);
                                                                            }}
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    "mr-2 h-4 w-4",
                                                                                    item.id === ing.inventory_item_id
                                                                                        ? "opacity-100"
                                                                                        : "opacity-0"
                                                                                )}
                                                                            />
                                                                            {item.name} ({item.unit})
                                                                        </CommandItem>
                                                                    );
                                                                })}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                            <Input
                                                type="number"
                                                step="0.001"
                                                min="0"
                                                className="w-24"
                                                placeholder="Qty"
                                                value={ing.quantity_required || ''}
                                                onChange={(e) => updateIngredient(index, 'quantity_required', parseFloat(e.target.value) || 0)}
                                            />
                                            <div className="w-24">
                                                {ing.inventory_item && UNIT_CONVERSIONS[ing.inventory_item.unit] ? (
                                                    <Select
                                                        value={ing.selected_unit || ing.inventory_item.unit}
                                                        onValueChange={(val) => updateUnit(index, val)}
                                                    >
                                                        <SelectTrigger className="h-9">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value={ing.inventory_item.unit}>
                                                                {ing.inventory_item.unit}
                                                            </SelectItem>
                                                            <SelectItem value={UNIT_CONVERSIONS[ing.inventory_item.unit].unit}>
                                                                {UNIT_CONVERSIONS[ing.inventory_item.unit].unit}
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground pl-2">
                                                        {ing.inventory_item?.unit || ''}
                                                    </span>
                                                )}
                                            </div>
                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeIngredient(index)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {inventoryItems.length === 0 && (
                                <div className="text-center py-4 text-yellow-600 bg-yellow-50 rounded-lg">
                                    No inventory items found. Add raw materials in the Inventory page first.
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={saveRecipe}>Save Recipe</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
