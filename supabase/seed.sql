-- Seed Data with Variable User ID
DO $$
DECLARE
    -- REPLACE THIS WITH YOUR USER ID
    target_owner_id UUID := '00000000-0000-0000-0000-000000000000'; 
    
    -- Constants
    shop_id UUID := '2e3d8c55-2017-4518-9f30-675454674123';
BEGIN
    -- Clear existing data
    TRUNCATE TABLE public.order_items CASCADE;
    TRUNCATE TABLE public.orders CASCADE;
    TRUNCATE TABLE public.category_items CASCADE;
    TRUNCATE TABLE public.menu_categories CASCADE;
    TRUNCATE TABLE public.menu_items CASCADE;
    TRUNCATE TABLE public.categories CASCADE;
    TRUNCATE TABLE public.menus CASCADE;
    TRUNCATE TABLE public.tables CASCADE;
    TRUNCATE TABLE public.settings CASCADE;
    TRUNCATE TABLE public.shops CASCADE;
    TRUNCATE TABLE public.customers CASCADE;
    TRUNCATE TABLE public.reviews CASCADE;
    TRUNCATE TABLE public.bills CASCADE;
    TRUNCATE TABLE public.user_roles CASCADE;

    -- 1. Create Shop
    INSERT INTO public.shops (id, slug, name, description, address, shop_type, gstin, fssai_license, contact_phone, contact_email, owner_name, logo_url, cover_image, opening_hours, social_links, is_live, owner_id)
    VALUES (
        shop_id,
        'food-cafe',
        'Food Cafe Premium',
        'Premium dining experience',
        '123 Food Street, Bangalore',
        'restaurant',
        '29ABCDE1234F1Z5',
        '12345678901234',
        '+91 9876543210',
        'contact@foodcafe.com',
        'John Doe',
        'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80',
        '{"mon": "09:00-22:00", "tue": "09:00-22:00", "wed": "09:00-22:00", "thu": "09:00-22:00", "fri": "09:00-23:00", "sat": "09:00-23:00", "sun": "09:00-23:00"}',
        '{"instagram": "https://instagram.com/foodcafe", "facebook": "https://facebook.com/foodcafe"}',
        true,
        target_owner_id
    );

    -- 2. Assign Admin Role
    IF target_owner_id IS NOT NULL AND target_owner_id != '00000000-0000-0000-0000-000000000000' THEN
        INSERT INTO public.user_roles (id, role, shop_id)
        VALUES (target_owner_id, 'admin', shop_id)
        ON CONFLICT (id, shop_id) DO NOTHING;
    END IF;

    -- 3. Settings
    INSERT INTO public.settings (shop_id, currency, language, tax_rate, service_charge, dark_mode, sound_notifications, auto_print, enable_otp)
    VALUES (
        shop_id,
        '₹',
        'en',
        5.00,
        2.50,
        false,
        true,
        false,
        false
    );

    -- 4. Menus
    INSERT INTO public.menus (id, shop_id, name, description, is_active, dietary_type, tags)
    VALUES
    ('d290f1ee-6c54-4b01-90e6-d701748f0851', shop_id, 'Dinner Menu', 'Evening selection', true, 'all', ARRAY['evening', 'main']),
    ('78c9309c-872c-4654-895c-567823412312', shop_id, 'Lunch Menu', 'Afternoon specials', false, 'all', ARRAY['lunch', 'specials']);

    -- 5. Categories
    INSERT INTO public.categories (id, shop_id, name, image, tags, dietary_type)
    VALUES
    ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', shop_id, 'Starters', 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=800&q=80', ARRAY['appetizers'], 'all'),
    ('b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', shop_id, 'Mains', 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=800&q=80', ARRAY['entrees'], 'all'),
    ('c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', shop_id, 'Desserts', 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80', ARRAY['sweets'], 'veg'),
    ('d4e5f6a7-b8c9-7d8e-1f2a-3b4c5d6e7f8a', shop_id, 'Beverages', 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=800&q=80', ARRAY['drinks'], 'veg');

    -- 6. Menu Categories
    INSERT INTO public.menu_categories (menu_id, category_id, sort_order)
    VALUES
    ('d290f1ee-6c54-4b01-90e6-d701748f0851', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 0),
    ('d290f1ee-6c54-4b01-90e6-d701748f0851', 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', 1),
    ('d290f1ee-6c54-4b01-90e6-d701748f0851', 'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', 2),
    ('d290f1ee-6c54-4b01-90e6-d701748f0851', 'd4e5f6a7-b8c9-7d8e-1f2a-3b4c5d6e7f8a', 3);

    -- 7. Menu Items
    INSERT INTO public.menu_items (id, shop_id, name, description, price, dietary_type, images, is_available)
    VALUES
    ('e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b', shop_id, 'Spring Rolls', 'Crispy veg rolls', 199.00, 'veg', ARRAY['https://images.unsplash.com/photo-1544510808-91bcbee1df55?auto=format&fit=crop&w=800&q=80'], true),
    ('f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c', shop_id, 'Chicken Wings', 'Spicy buffalo wings', 299.00, 'non_veg', ARRAY['https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=800&q=80'], true),
    ('0a1b2c3d-4e5f-0a1b-4c5d-6e7f8a9b0c1d', shop_id, 'Grilled Salmon', 'With asparagus', 599.00, 'non_veg', ARRAY['https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80'], true),
    ('1b2c3d4e-5f6a-1b2c-5d6e-7f8a9b0c1d2e', shop_id, 'Paneer Tikka', 'Tandoori cottage cheese', 349.00, 'veg', ARRAY['https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80'], true),
    ('2c3d4e5f-6a7b-2c3d-6e7f-8a9b0c1d2e3f', shop_id, 'Chocolate Cake', 'Rich dark chocolate', 249.00, 'veg', ARRAY['https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80'], true),
    ('3d4e5f6a-7b8c-3d4e-7f8a-9b0c1d2e3f4a', shop_id, 'Iced Tea', 'Lemon flavored', 129.00, 'veg', ARRAY['https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80'], true);

    -- 8. Category Items
    INSERT INTO public.category_items (category_id, menu_item_id)
    VALUES
    ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b'),
    ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c'),
    ('b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', '0a1b2c3d-4e5f-0a1b-4c5d-6e7f8a9b0c1d'),
    ('b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', '1b2c3d4e-5f6a-1b2c-5d6e-7f8a9b0c1d2e'),
    ('c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', '2c3d4e5f-6a7b-2c3d-6e7f-8a9b0c1d2e3f'),
    ('d4e5f6a7-b8c9-7d8e-1f2a-3b4c5d6e7f8a', '3d4e5f6a-7b8c-3d4e-7f8a-9b0c1d2e3f4a');

    -- 9. Tables
    INSERT INTO public.tables (id, shop_id, label, seats, x, y, status)
    VALUES
    ('4e5f6a7b-8c9d-4e5f-8a9b-0c1d2e3f4a51', shop_id, 'T1', 4, 0, 0, 'empty'),
    ('4e5f6a7b-8c9d-4e5f-8a9b-0c1d2e3f4a52', shop_id, 'T2', 2, 100, 0, 'empty'),
    ('4e5f6a7b-8c9d-4e5f-8a9b-0c1d2e3f4a53', shop_id, 'T3', 4, 200, 0, 'empty'),
    ('4e5f6a7b-8c9d-4e5f-8a9b-0c1d2e3f4a54', shop_id, 'T4', 2, 0, 100, 'empty'),
    ('4e5f6a7b-8c9d-4e5f-8a9b-0c1d2e3f4a55', shop_id, 'T5', 4, 100, 100, 'empty'),
    ('4e5f6a7b-8c9d-4e5f-8a9b-0c1d2e3f4a56', shop_id, 'T6', 2, 200, 100, 'empty'),
    ('4e5f6a7b-8c9d-4e5f-8a9b-0c1d2e3f4a57', shop_id, 'T7', 6, 0, 200, 'empty'),
    ('4e5f6a7b-8c9d-4e5f-8a9b-0c1d2e3f4a58', shop_id, 'T8', 4, 100, 200, 'empty'),
    ('4e5f6a7b-8c9d-4e5f-8a9b-0c1d2e3f4a59', shop_id, 'T9', 2, 200, 200, 'empty'),
    ('4e5f6a7b-8c9d-4e5f-8a9b-0c1d2e3f4a60', shop_id, 'T10', 8, 100, 300, 'empty');

    -- 10. Customers
    INSERT INTO public.customers (id, shop_id, name, phone, email)
    VALUES
    ('5f6a7b8c-9d0e-5f6a-9b0c-1d2e3f4a5b6c', shop_id, 'Alice Johnson', '+919876543211', 'alice@example.com');

    -- 11. Orders
    INSERT INTO public.orders (id, shop_id, table_id, order_number, status, total_amount, payment_status, customer_id, customer_name)
    VALUES
    ('6a7b8c9d-0e1f-6a7b-0c1d-2e3f4a5b6c7d', shop_id, '4e5f6a7b-8c9d-4e5f-8a9b-0c1d2e3f4a51', 'ORD-001', 'preparing', 498.00, 'pending', '5f6a7b8c-9d0e-5f6a-9b0c-1d2e3f4a5b6c', 'Alice Johnson');

    -- Update table status for the active order
    UPDATE public.tables SET status = 'occupied' WHERE id = '4e5f6a7b-8c9d-4e5f-8a9b-0c1d2e3f4a51';

    -- 12. Order Items
    INSERT INTO public.order_items (order_id, menu_item_id, name, price, quantity)
    VALUES
    ('6a7b8c9d-0e1f-6a7b-0c1d-2e3f4a5b6c7d', 'e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b', 'Spring Rolls', 199.00, 1),
    ('6a7b8c9d-0e1f-6a7b-0c1d-2e3f4a5b6c7d', 'f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c', 'Chicken Wings', 299.00, 1);

END $$;
