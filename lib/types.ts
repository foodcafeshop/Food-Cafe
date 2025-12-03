export type DietaryType = 'veg' | 'non_veg' | 'vegan';

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
    // Joined fields
    category_id?: string; // From join
}

export interface CategoryItem {
    category_id: string;
    menu_item_id: string;
    sort_order: number;
}
