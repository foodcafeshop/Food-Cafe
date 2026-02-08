export type DietaryType = 'veg' | 'non_veg' | 'vegan' | 'jain_veg' | 'contains_egg';
export type ServiceType = 'dine_in' | 'takeaway' | 'delivery';
export type PackagingChargeType = 'flat' | 'item';
export type DeliveryChargeType = 'flat' | 'percent';

export interface PackagingItem {
    id: string;
    shop_id: string;
    name: string;
    price: number;
    cost_price: number | null;
    is_active: boolean;
    created_at: string;
}

export interface MenuItemPackaging {
    menu_item_id: string;
    packaging_item_id: string;
    quantity: number;
    packaging_items?: PackagingItem;
}

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
    menu_item_packaging?: MenuItemPackaging[];
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
    enabled_service_types?: ServiceType[];
    packaging_charge_type?: PackagingChargeType;
    packaging_charge_amount?: number;
    delivery_charge_type?: DeliveryChargeType;
    delivery_charge_amount?: number;
    takeaway_otp?: string;
    updated_at: string;
}
