export type DietaryType = 'veg' | 'non_veg' | 'vegan';

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
    opening_hours: any;
    social_links: any;
    average_rating: number;
    rating_count: number;
    is_live?: boolean;
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
    original_price: number | null;
    images: string[];
    dietary_type: DietaryType;
    tags: string[];
    is_available: boolean;
    is_popular: boolean;
    created_at: string;
    average_rating: number;
    rating_count: number;
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
    updated_at: string;
}
