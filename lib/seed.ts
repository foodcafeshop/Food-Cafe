import { supabase } from './supabase';

// Constants (Matching supabase/seed.sql)
const SHOP_ID = '2e3d8c55-2017-4518-9f30-675454674123';

const MENUS = [
    { id: 'd290f1ee-6c54-4b01-90e6-d701748f0851', shop_id: SHOP_ID, name: 'Dinner Menu', description: 'Evening selection', is_active: true, dietary_type: 'all', tags: ['evening', 'main'] },
    { id: '78c9309c-872c-4654-895c-567823412312', shop_id: SHOP_ID, name: 'Lunch Menu', description: 'Afternoon specials', is_active: false, dietary_type: 'all', tags: ['lunch', 'specials'] }
];

const CATEGORIES = [
    { id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', shop_id: SHOP_ID, name: 'Starters', image: 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=800&q=80', tags: ['appetizers'], dietary_type: 'all' },
    { id: 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', shop_id: SHOP_ID, name: 'Mains', image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=800&q=80', tags: ['entrees'], dietary_type: 'all' },
    { id: 'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', shop_id: SHOP_ID, name: 'Desserts', image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80', tags: ['sweets'], dietary_type: 'veg' },
    { id: 'd4e5f6a7-b8c9-7d8e-1f2a-3b4c5d6e7f8a', shop_id: SHOP_ID, name: 'Beverages', image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=800&q=80', tags: ['drinks'], dietary_type: 'veg' }
];

const MENU_ITEMS = [
    { id: 'e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b', shop_id: SHOP_ID, name: 'Spring Rolls', description: 'Crispy veg rolls', price: 199.00, dietary_type: 'veg', images: ['https://images.unsplash.com/photo-1544510808-91bcbee1df55?auto=format&fit=crop&w=800&q=80'], is_available: true },
    { id: 'f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c', shop_id: SHOP_ID, name: 'Chicken Wings', description: 'Spicy buffalo wings', price: 299.00, dietary_type: 'non_veg', images: ['https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=800&q=80'], is_available: true },
    { id: '0a1b2c3d-4e5f-0a1b-4c5d-6e7f8a9b0c1d', shop_id: SHOP_ID, name: 'Grilled Salmon', description: 'With asparagus', price: 599.00, dietary_type: 'non_veg', images: ['https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80'], is_available: true },
    { id: '1b2c3d4e-5f6a-1b2c-5d6e-7f8a9b0c1d2e', shop_id: SHOP_ID, name: 'Paneer Tikka', description: 'Tandoori cottage cheese', price: 349.00, dietary_type: 'veg', images: ['https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80'], is_available: true },
    { id: '2c3d4e5f-6a7b-2c3d-6e7f-8a9b0c1d2e3f', shop_id: SHOP_ID, name: 'Chocolate Cake', description: 'Rich dark chocolate', price: 249.00, dietary_type: 'veg', images: ['https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80'], is_available: true },
    { id: '3d4e5f6a-7b8c-3d4e-7f8a-9b0c1d2e3f4a', shop_id: SHOP_ID, name: 'Iced Tea', description: 'Lemon flavored', price: 129.00, dietary_type: 'veg', images: ['https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80'], is_available: true }
];

const TABLES = [
    { id: '4e5f6a7b-8c9d-4e5f-8a9b-0c1d2e3f4a51', shop_id: SHOP_ID, label: 'T1', seats: 4, x: 0, y: 0, status: 'empty' },
    { id: '4e5f6a7b-8c9d-4e5f-8a9b-0c1d2e3f4a52', shop_id: SHOP_ID, label: 'T2', seats: 2, x: 100, y: 0, status: 'empty' },
    { id: '4e5f6a7b-8c9d-4e5f-8a9b-0c1d2e3f4a53', shop_id: SHOP_ID, label: 'T3', seats: 4, x: 200, y: 0, status: 'empty' },
    { id: '4e5f6a7b-8c9d-4e5f-8a9b-0c1d2e3f4a54', shop_id: SHOP_ID, label: 'T4', seats: 2, x: 0, y: 100, status: 'empty' },
    { id: '4e5f6a7b-8c9d-4e5f-8a9b-0c1d2e3f4a55', shop_id: SHOP_ID, label: 'T5', seats: 4, x: 100, y: 100, status: 'empty' },
    { id: '4e5f6a7b-8c9d-4e5f-8a9b-0c1d2e3f4a56', shop_id: SHOP_ID, label: 'T6', seats: 2, x: 200, y: 100, status: 'empty' },
    { id: '4e5f6a7b-8c9d-4e5f-8a9b-0c1d2e3f4a57', shop_id: SHOP_ID, label: 'T7', seats: 6, x: 0, y: 200, status: 'empty' },
    { id: '4e5f6a7b-8c9d-4e5f-8a9b-0c1d2e3f4a58', shop_id: SHOP_ID, label: 'T8', seats: 4, x: 100, y: 200, status: 'empty' },
    { id: '4e5f6a7b-8c9d-4e5f-8a9b-0c1d2e3f4a59', shop_id: SHOP_ID, label: 'T9', seats: 2, x: 200, y: 200, status: 'empty' },
    { id: '4e5f6a7b-8c9d-4e5f-8a9b-0c1d2e3f4a60', shop_id: SHOP_ID, label: 'T10', seats: 8, x: 100, y: 300, status: 'empty' }
];

const CUSTOMERS = [
    { id: '5f6a7b8c-9d0e-5f6a-9b0c-1d2e3f4a5b6c', shop_id: SHOP_ID, name: 'Alice Johnson', phone: '+919876543211', email: 'alice@example.com' }
];

const ORDERS = [
    { id: '6a7b8c9d-0e1f-6a7b-0c1d-2e3f4a5b6c7d', shop_id: SHOP_ID, table_id: TABLES[0].id, order_number: 'ORD-001', status: 'preparing', total_amount: 498.00, payment_status: 'pending', customer_id: CUSTOMERS[0].id, customer_name: 'Alice Johnson' }
];

const ORDER_ITEMS = [
    { order_id: ORDERS[0].id, menu_item_id: MENU_ITEMS[0].id, name: 'Spring Rolls', price: 199.00, quantity: 1 },
    { order_id: ORDERS[0].id, menu_item_id: MENU_ITEMS[1].id, name: 'Chicken Wings', price: 299.00, quantity: 1 }
];

export async function seedData() {
    console.log("Starting seed...");

    // 1. Clear existing data
    console.log("Clearing existing data...");
    await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('category_items').delete().neq('category_id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('menu_categories').delete().neq('menu_id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('menu_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('menus').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('tables').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('settings').delete().neq('id', 0);
    await supabase.from('shops').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('bills').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 2. Create Shop
    console.log("Creating shop...");
    const { error: shopError } = await supabase.from('shops').insert({
        id: SHOP_ID,
        slug: 'food-cafe',
        name: 'Food Cafe Premium',
        description: 'Premium dining experience',
        address: '123 Food Street, Bangalore',
        shop_type: 'restaurant',
        gstin: '29ABCDE1234F1Z5',
        fssai_license: '12345678901234',
        contact_phone: '+91 9876543210',
        contact_email: 'contact@foodcafe.com',
        owner_name: 'John Doe',
        logo_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
        cover_image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80',
        opening_hours: { mon: '09:00-22:00', tue: '09:00-22:00', wed: '09:00-22:00', thu: '09:00-22:00', fri: '09:00-23:00', sat: '09:00-23:00', sun: '09:00-23:00' },
        social_links: { instagram: 'https://instagram.com/foodcafe', facebook: 'https://facebook.com/foodcafe' },
        is_live: true
    });
    if (shopError) throw new Error(`Shop creation failed: ${shopError.message}`);

    // 3. Settings
    console.log("Creating settings...");
    await supabase.from('settings').insert({
        shop_id: SHOP_ID,
        currency: '₹',
        language: 'en',
        tax_rate: 5.00,
        service_charge: 2.50,
        dark_mode: false,
        sound_notifications: true,
        auto_print: false,
        enable_otp: false
    });

    // 4. Menus
    console.log("Creating menus...");
    await supabase.from('menus').insert(MENUS);

    // 5. Categories
    console.log("Creating categories...");
    await supabase.from('categories').insert(CATEGORIES);

    // 6. Menu Categories
    console.log("Linking menus and categories...");
    await supabase.from('menu_categories').insert([
        { menu_id: MENUS[0].id, category_id: CATEGORIES[0].id, sort_order: 0 },
        { menu_id: MENUS[0].id, category_id: CATEGORIES[1].id, sort_order: 1 },
        { menu_id: MENUS[0].id, category_id: CATEGORIES[2].id, sort_order: 2 },
        { menu_id: MENUS[0].id, category_id: CATEGORIES[3].id, sort_order: 3 }
    ]);

    // 7. Menu Items
    console.log("Creating menu items...");
    await supabase.from('menu_items').insert(MENU_ITEMS);

    // 8. Category Items
    console.log("Linking categories and items...");
    await supabase.from('category_items').insert([
        { category_id: CATEGORIES[0].id, menu_item_id: MENU_ITEMS[0].id },
        { category_id: CATEGORIES[0].id, menu_item_id: MENU_ITEMS[1].id },
        { category_id: CATEGORIES[1].id, menu_item_id: MENU_ITEMS[2].id },
        { category_id: CATEGORIES[1].id, menu_item_id: MENU_ITEMS[3].id },
        { category_id: CATEGORIES[2].id, menu_item_id: MENU_ITEMS[4].id },
        { category_id: CATEGORIES[3].id, menu_item_id: MENU_ITEMS[5].id }
    ]);

    // 9. Tables
    console.log("Creating tables...");
    await supabase.from('tables').insert(TABLES);

    // 10. Customers
    console.log("Creating customers...");
    await supabase.from('customers').insert(CUSTOMERS);

    // 11. Orders
    console.log("Creating orders...");
    await supabase.from('orders').insert(ORDERS);

    // Update table status
    await supabase.from('tables').update({ status: 'occupied' }).eq('id', TABLES[0].id);

    // 12. Order Items
    console.log("Creating order items...");
    await supabase.from('order_items').insert(ORDER_ITEMS);

    console.log("Seed complete!");
    return "Success";
}
