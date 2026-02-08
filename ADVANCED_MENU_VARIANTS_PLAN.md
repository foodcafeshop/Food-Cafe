# Advanced Menu Variants Implementation Plan

This plan adds support for complex, multi-dimensional menu item variants (e.g., Size + Crust + Toppings) with price overrides and inventory linking.

## User Review Required

> [!IMPORTANT]
> **Breaking Changes**: This feature adds new database tables and updates the order item structure to store selected variants. Existing orders will not have variant data, but this is non-destructive.

> [!WARNING]
> **Complexity**: This feature introduces a multi-table relational structure for variants. The implementation requires careful consideration of:
> - How variants affect pricing (base price overrides vs. additive pricing)
> - How variants link to inventory for stock deduction
> - How the customer selects and views variant combinations

## Proposed Changes

### Database Schema

#### [NEW] [variant_option_groups.sql](file:///Users/shubham/Developer/Gemini/food-cafe/supabase/migrations/create_variant_option_groups.sql)

Creates the `variant_option_groups` table to define groups like "Size", "Crust", "Toppings".

```sql
CREATE TABLE public.variant_option_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Size", "Crust"
  display_type TEXT CHECK (display_type IN ('single', 'multiple')) DEFAULT 'single',
  is_required BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### [NEW] [variant_options.sql](file:///Users/shubham/Developer/Gemini/food-cafe/supabase/migrations/create_variant_options.sql)

Creates the `variant_options` table for individual options like "Small", "Medium", "Large".

```sql
CREATE TABLE public.variant_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  option_group_id UUID REFERENCES public.variant_option_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Small", "Medium", "Large"
  price_modifier DECIMAL(10, 2) DEFAULT 0, -- Additional cost (+2.00) or discount (-1.00)
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  is_available BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### [NEW] [menu_item_variant_groups.sql](file:///Users/shubham/Developer/Gemini/food-cafe/supabase/migrations/create_menu_item_variant_groups.sql)

Junction table linking menu items to variant option groups.

```sql
CREATE TABLE public.menu_item_variant_groups (
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE,
  option_group_id UUID REFERENCES public.variant_option_groups(id) ON DELETE CASCADE,
  PRIMARY KEY (menu_item_id, option_group_id)
);
```

#### [NEW] [variant_combinations.sql](file:///Users/shubham/Developer/Gemini/food-cafe/supabase/migrations/create_variant_combinations.sql)

Stores specific variant combinations with base price overrides (optional).

```sql
CREATE TABLE public.variant_combinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE,
  option_ids JSONB NOT NULL, -- Array of selected variant_option IDs
  base_price_override DECIMAL(10, 2), -- If set, overrides menu_item.price
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### [MODIFY] [schema.sql](file:///Users/shubham/Developer/Gemini/food-cafe/supabase/schema.sql)

Update `order_items` table to store selected variants:
- Add `selected_variants` JSONB column to store variant selection

---

### Merchant App - Variant Management

#### [NEW] [variant-option-groups-page.tsx](file:///Users/shubham/Developer/Gemini/food-cafe/apps/merchant/app/[slug]/(dashboard)/menu/variant-groups/page.tsx)

Management UI for creating and editing variant option groups.

Features:
- List all variant option groups
- Create new groups (Name, Display Type: single/multiple, Required)
- Edit existing groups
- Delete groups
- Manage options within each group

#### [NEW] [VariantGroupBuilder.tsx](file:///Users/shubham/Developer/Gemini/food-cafe/apps/merchant/components/features/menu/VariantGroupBuilder.tsx)

Component for building variant groups with drag-drop sorting for options.

Features:
- Add/remove options
- Set price modifiers
- Link options to inventory items
- Toggle availability

#### [MODIFY] [MenuBuilder component](file:///Users/shubham/Developer/Gemini/food-cafe/apps/merchant/app/[slug]/(dashboard)/menu/builder/page.tsx)

Add variant configuration to menu item editing flow:
- Select which variant groups apply to this menu item
- Configure variant combinations if needed
- Set base price overrides for specific combinations

---

### Customer App - Variant Selection

#### [NEW] [VariantSelector.tsx](file:///Users/shubham/Developer/Gemini/food-cafe/apps/customer/components/features/menu/VariantSelector.tsx)

Modal/drawer component for selecting variants when adding item to cart.

Features:
- Display all applicable variant option groups
- Single/multiple selection based on group type
- Show price modifiers in real-time
- Validate required selections
- Display final price before adding to cart

#### [MODIFY] [menu-item-card.tsx](file:///Users/shubham/Developer/Gemini/food-cafe/apps/customer/components/features/menu/menu-item-card.tsx)

Update "Add to Cart" button to:
- Check if item has variants
- If yes, open VariantSelector dialog
- If no, add directly to cart

#### [MODIFY] [store.ts](file:///Users/shubham/Developer/Gemini/food-cafe/apps/customer/lib/store.ts)

Update `CartItem` type and store logic:
- Add `selectedVariants` field to CartItem
- Update item matching logic to consider variant combinations
- Items with different variants should be separate cart entries

#### [MODIFY] [cart-content.tsx](file:///Users/shubham/Developer/Gemini/food-cafe/apps/customer/components/features/cart/cart-content.tsx)

Display selected variants below each cart item:
- Show variant selections (e.g., "Size: Large", "Crust: Thin")
- Include variant info in order placement

---

### Type Definitions

#### [MODIFY] [types.ts (Merchant)](file:///Users/shubham/Developer/Gemini/food-cafe/apps/merchant/lib/types.ts)

Add new interface types:
```typescript
export interface VariantOptionGroup {
  id: string;
  shop_id: string;
  name: string;
  display_type: 'single' | 'multiple';
  is_required: boolean;
  sort_order: number;
  created_at: string;
  variant_options?: VariantOption[];
}

export interface VariantOption {
  id: string;
  option_group_id: string;
  name: string;
  price_modifier: number;
  inventory_item_id: string | null;
  is_available: boolean;
  sort_order: number;
  created_at: string;
}

export interface VariantCombination {
  id: string;
  menu_item_id: string;
  option_ids: string[];
  base_price_override: number | null;
  is_available: boolean;
  created_at: string;
}
```

Update `MenuItem` interface:
```typescript
export interface MenuItem {
  // ... existing fields
  variant_option_groups?: VariantOptionGroup[];
}
```

Update `OrderItem` interface:
```typescript
export interface OrderItem {
  // ... existing fields
  selected_variants?: Record<string, string[]>; // { groupId: [optionId1, optionId2] }
}
```

#### [MODIFY] [types.ts (Customer)](file:///Users/shubham/Developer/Gemini/food-cafe/apps/customer/lib/types.ts)

Mirror the merchant app type updates for customer-facing types.

---

### Integration & Stock Management

#### [MODIFY] [deduct_inventory_on_order trigger](file:///Users/shubham/Developer/Gemini/food-cafe/supabase/schema.sql)

Update inventory deduction logic to:
- Check if order item has selected variants
- If variant options are linked to inventory items, deduct from those items instead of/in addition to the base menu item recipe
- Handle cases where variants have their own inventory items (e.g., "Large Pizza Base" vs "Small Pizza Base")

#### [MODIFY] [KDS Display](file:///Users/shubham/Developer/Gemini/food-cafe/apps/merchant/app/[slug]/(dashboard)/kds/page.tsx)

Display variant selections for each order item:
- Show selected variants below the menu item name
- Highlight variant details for kitchen staff

#### [MODIFY] [Bill/Receipt Printing](file:///Users/shubham/Developer/Gemini/food-cafe/apps/merchant/components/features/staff/BillingDialog.tsx)

Include variant details in printed receipts:
- List selected variants for each item
- Show price breakdown if variants have modifiers

---

## Verification Plan

### Automated Tests

No existing unit tests found for this module. Testing will rely on manual verification.

### Manual Verification

1. **Variant Group Creation (Merchant App)**
   - Navigate to `/[slug]/menu/variant-groups`
   - Create a new variant group "Size" with options: Small (+0), Medium (+2), Large (+5)
   - Create another group "Toppings" with display_type='multiple' and options: Cheese (+1), Mushrooms (+1.5)
   - Verify groups appear in the list

2. **Menu Item Variant Configuration (Merchant App)**
   - Navigate to Menu Builder
   - Edit a menu item (e.g., "Pizza")
   - Attach "Size" and "Toppings" variant groups
   - Save and verify the item shows "Has Variants" badge

3. **Customer Variant Selection (Customer App)**
   - Browse menu as customer
   - Click "Add to Cart" on a menu item with variants
   - Verify VariantSelector modal opens
   - Select "Large" size and "Cheese" topping
   - Verify price updates to reflect modifiers
   - Add to cart and verify cart shows variant details

4. **Order Placement with Variants**
   - Place an order with variant items
   - Verify order appears in KDS with variant details displayed
   - Verify bill/receipt shows variants and correct pricing

5. **Inventory Deduction for Variants**
   - Link a variant option (e.g., "Large Pizza Base") to an inventory item
   - Create a recipe for the base menu item
   - Place an order with the "Large" variant
   - Verify both the base recipe ingredients AND the variant-specific inventory item are deducted

6. **Price Override Testing**
   - Create a variant combination with a base price override
   - Verify the overridden price is used instead of calculating from base + modifiers

7. **Multiple Selections**
   - Test a variant group with display_type='multiple' (e.g., Toppings)
   - Select multiple options
   - Verify all selected options are saved and displayed

8. **Required Validation**
   - Mark a variant group as required
   - Attempt to add item to cart without selecting from required group
   - Verify validation error is shown
