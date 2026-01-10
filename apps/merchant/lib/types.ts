export type DietaryType = 'veg' | 'non_veg' | 'vegan' | 'jain_veg' | 'contains_egg';

export interface Shop {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    address: string | null;
    location_url: string | null;
    shop_type: string | null;
    gstin: string | null;
    fssai_license: string | null;
    contact_phone: string | null;
    contact_email: string | null;
    owner_name: string | null;
    logo_url: string | null;
    cover_image: string | null;
    gallery_images?: string[];
    opening_hours: any;
    social_links: any;
    average_rating: number;
    rating_count: number;
    is_live?: boolean;
    is_open?: boolean;
    display_ratings?: boolean;
    owner_id?: string;
    created_at: string;
}

export interface Menu {
    id: string;
    name: string;
    description: string | null;
    is_active: boolean;
    images: string[];
    tags: string[];
    hidden_items: string[];
    dietary_type: 'all' | DietaryType;
    created_at: string;
}

export interface Category {
    id: string;
    name: string;
    image: string | null;
    tags: string[];
    dietary_type: 'all' | DietaryType;
    created_at: string;
}

export interface MenuCategory {
    menu_id: string;
    category_id: string;
    sort_order: number;
}

export interface MenuItem {
    id: string;
    name: string;
    description: string | null;
    price: number;
    offer_price: number | null;
    shop_id: string;
    images: string[];
    dietary_type: DietaryType;
    tags: string[];
    is_available: boolean;
    is_popular: boolean;
    created_at: string;
    average_rating: number;
    rating_count: number;
    max_quantity?: number | null;
    // Joined fields
    category_id?: string; // From join
}

export interface CategoryItem {
    category_id: string;
    menu_item_id: string;
    sort_order: number;
}
export interface Settings {
    id: number;
    shop_id: string;
    // restaurant_name: string; // Removed as per schema cleanup
    currency: string;
    language: string;
    tax_rate: number;
    service_charge: number;
    dark_mode: boolean;
    sound_notifications: boolean;
    auto_print: boolean;
    enable_otp: boolean;
    tax_included_in_price: boolean;
    is_customer_phone_mandatory: boolean;
    max_item_quantity: number;
    printer_header_text?: string;
    printer_footer_text?: string;
    printer_show_logo?: boolean;
    printer_paper_width?: string;
    updated_at: string;
}

// Inventory Management Types
export interface InventoryItem {
    id: string;
    shop_id: string;
    name: string;
    image_url?: string | null;
    unit: string; // 'kg', 'g', 'L', 'ml', 'pcs', 'dozen'
    stock_quantity: number;
    low_stock_threshold: number;
    cost_per_unit?: number | null;
    created_at: string;
    updated_at: string;
    menu_item_ingredients?: { count: number }[];
}

export interface MenuItemIngredient {
    id: string;
    menu_item_id: string;
    inventory_item_id: string;
    quantity_required: number;
    created_at: string;
    // Joined fields
    inventory_item?: InventoryItem;
    menu_item?: MenuItem;
}

export type AdjustmentReason = 'restock' | 'usage' | 'order' | 'wastage' | 'damage' | 'theft' | 'correction' | 'other';

export interface InventoryAdjustment {
    id: string;
    shop_id: string;
    inventory_item_id: string;
    previous_quantity: number;
    new_quantity: number;
    adjustment: number;
    reason: AdjustmentReason;
    notes?: string | null;
    reference_id?: string | null;
    created_by?: string | null;
    created_at: string;
    // Joined fields
    inventory_item?: InventoryItem;
}

// Order Types
export type OrderStatus = 'queued' | 'preparing' | 'ready' | 'served' | 'billed' | 'complete' | 'cancelled';

export interface OrderItem {
    id: string;
    order_id: string;
    menu_item_id: string | null;
    name: string;
    price: number;
    quantity: number;
    notes?: string | null;
    created_at: string;
    // Joined fields
    menu_items?: MenuItem;
}

export interface Order {
    id: string;
    shop_id: string;
    table_id: string | null;
    customer_id: string | null;
    order_number: string;
    status: OrderStatus;
    total_amount: number;
    payment_status: 'pending' | 'paid';
    payment_method: string | null;
    customer_name: string | null;
    customer_phone: string | null;
    created_at: string;
    updated_at: string;
    ready_at?: string | null;
    served_at?: string | null;
    // Joined fields
    tables?: { label: string };
    customers?: { name: string; phone: string };
    order_items?: OrderItem[];
    bills?: { bill_number: string };
    is_staff_order?: boolean;
    staff_name?: string;
}

// Review Types
export interface ReviewItem {
    id: string;
    review_id: string;
    menu_item_id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    // Joined fields
    menu_items?: { name: string; images: string[] };
}

export interface Review {
    id: string;
    shop_id: string;
    bill_id: string;
    customer_id: string | null;
    rating: number;
    comment: string | null;
    customer_name: string | null;
    created_at: string;
    // Joined fields
    bills?: { bill_number: string };
    review_items?: ReviewItem[];
}

export interface Bill {
    id: string;
    shop_id: string;
    table_id: string | null;
    bill_number: string;
    total_amount: number;
    payment_method: string;
    created_at: string;
    order_ids: string[];
    items_snapshot: any; // Ideally this should be more specific but start with any for JSONB
    breakdown: { tax?: number; serviceCharge?: number;[key: string]: any } | null;
    discount_amount: number;
    discount_reason: string | null;
    created_by: string | null;
    // Joined fields
    tables?: { label: string };
    shops?: { name: string };
}
