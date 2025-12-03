import { supabase } from './supabase';
import { generateOrderNumber, generateBillNumber } from './utils';

export async function seedData() {
    console.log("Starting seed...");

    // 1. Clear existing data
    console.log("Clearing existing data...");
    // Delete in order of dependencies (Child -> Parent)
    await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('category_items').delete().neq('category_id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('menu_categories').delete().neq('menu_id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('bills').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('menu_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('menus').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('tables').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('settings').delete().neq('id', 0); // Delete settings (id is usually 1)
    await supabase.from('shops').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 2. Create Shop
    console.log("Creating default shop...");
    const { data: shop, error: shopError } = await supabase.from('shops').upsert({
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
        opening_hours: {
            mon: '09:00-22:00',
            tue: '09:00-22:00',
            wed: '09:00-22:00',
            thu: '09:00-22:00',
            fri: '09:00-23:00',
            sat: '09:00-23:00',
            sun: '09:00-23:00'
        },
        social_links: {
            instagram: 'https://instagram.com/foodcafe',
            facebook: 'https://facebook.com/foodcafe'
        }
    }, { onConflict: 'slug' }).select().single();

    if (shopError) {
        console.error("Shop creation error:", shopError);
        throw new Error(`Shop creation failed: ${shopError.message}`);
    }
    const shopId = shop.id;
    console.log("Shop created:", shopId);

    // 3. Create Tables
    console.log("Attempting to create tables...");
    const tables = [];
    for (let i = 1; i <= 10; i++) {
        tables.push({
            shop_id: shopId,
            label: `${i}`,
            seats: i % 2 === 0 ? 4 : 2,
            x: (i - 1) * 100,
            y: 100,
            status: 'empty'
        });
    }

    const { data: tablesData, error: tablesError } = await supabase.from('tables').upsert(tables, { onConflict: 'label' }).select();

    if (tablesError) {
        console.error("Tables insert error:", tablesError);
        throw new Error(`Tables insert failed: ${tablesError.message} (${tablesError.code})`);
    }
    console.log("Tables created:", tablesData?.length);

    // 4. Create Menus
    const { data: menus, error: menuError } = await supabase.from('menus').insert([
        { shop_id: shopId, name: 'Dinner Menu', description: 'Evening selection', is_active: true, tags: ['evening', 'main'], dietary_type: 'all' },
        { shop_id: shopId, name: 'Lunch Menu', description: 'Afternoon specials', is_active: false, tags: ['lunch', 'specials'], dietary_type: 'all' },
        { shop_id: shopId, name: 'Veg Delight', description: 'Pure vegetarian', is_active: false, tags: ['veg', 'healthy'], dietary_type: 'veg' }
    ]).select();
    if (menuError) {
        console.error("Menu error", menuError);
        throw new Error(`Menu insert failed: ${menuError.message}`);
    }

    // 5. Create Categories
    const { data: categories, error: catError } = await supabase.from('categories').insert([
        { shop_id: shopId, name: 'Starters', image: 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=800&q=80', tags: ['appetizers', 'small-plates'], dietary_type: 'all' },
        { shop_id: shopId, name: 'Mains', image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=800&q=80', tags: ['entrees', 'big-plates'], dietary_type: 'all' },
        { shop_id: shopId, name: 'Desserts', image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80', tags: ['sweets', 'treats'], dietary_type: 'veg' },
        { shop_id: shopId, name: 'Beverages', image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=800&q=80', tags: ['drinks', 'cold'], dietary_type: 'veg' }
    ]).select();
    if (catError) {
        console.error("Category error", catError);
        throw new Error(`Category insert failed: ${catError.message}`);
    }

    // Link Menu -> Categories
    if (menus && categories) {
        // Link all categories to the first menu (Dinner)
        const dinnerCats = categories.map((c: any, i: number) => ({
            menu_id: menus[0].id,
            category_id: c.id,
            sort_order: i
        }));
        await supabase.from('menu_categories').insert(dinnerCats);

        // Link Veg categories to Veg Menu
        const vegCats = categories.filter((c: any) => c.dietary_type === 'veg').map((c: any, i: number) => ({
            menu_id: menus[2].id,
            category_id: c.id,
            sort_order: i
        }));
        if (vegCats.length > 0) {
            await supabase.from('menu_categories').insert(vegCats);
        }
    }

    // 6. Create Menu Items
    const { data: items, error: itemError } = await supabase.from('menu_items').insert([
        { shop_id: shopId, name: 'Spring Rolls', description: 'Crispy veg rolls', price: 199, dietary_type: 'veg', images: ['https://images.unsplash.com/photo-1544510808-91bcbee1df55?auto=format&fit=crop&w=800&q=80'] },
        { shop_id: shopId, name: 'Chicken Wings', description: 'Spicy buffalo wings', price: 299, dietary_type: 'non_veg', images: ['https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=800&q=80'] },
        { shop_id: shopId, name: 'Grilled Salmon', description: 'With asparagus', price: 599, dietary_type: 'non_veg', images: ['https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80'] },
        { shop_id: shopId, name: 'Paneer Tikka', description: 'Tandoori cottage cheese', price: 349, dietary_type: 'veg', images: ['https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80'] },
        { shop_id: shopId, name: 'Chocolate Cake', description: 'Rich dark chocolate', price: 249, dietary_type: 'veg', images: ['https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80'] },
        { shop_id: shopId, name: 'Iced Tea', description: 'Lemon flavored', price: 129, dietary_type: 'veg', images: ['https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80'] }
    ]).select();
    if (itemError) console.error("Items error", itemError);

    // Link Items -> Categories
    if (items && categories) {
        const catItems = [
            { category_id: categories[0].id, menu_item_id: items[0].id }, // Spring Rolls -> Starters
            { category_id: categories[0].id, menu_item_id: items[1].id }, // Wings -> Starters
            { category_id: categories[1].id, menu_item_id: items[2].id }, // Salmon -> Mains
            { category_id: categories[1].id, menu_item_id: items[3].id }, // Paneer -> Mains
            { category_id: categories[2].id, menu_item_id: items[4].id }, // Cake -> Desserts
            { category_id: categories[3].id, menu_item_id: items[5].id }, // Tea -> Beverages
        ];
        await supabase.from('category_items').insert(catItems);
    }

    // 7. Create Orders
    if (tablesData && tablesData.length > 0) {
        // Fetch a few items to add to orders
        const { data: menuItems } = await supabase.from('menu_items').select('*').limit(5);

        // Order 1: Table 1 (Occupied, Preparing)
        const t1 = tablesData.find((t: any) => t.label === '1');
        if (t1 && menuItems && menuItems.length > 0) {
            await supabase.from('tables').update({ status: 'occupied' }).eq('id', t1.id);

            const item1 = menuItems[0];
            const item2 = menuItems[1];
            const total = (item1.price * 2) + item2.price;

            const { data: ord1 } = await supabase.from('orders').insert({
                shop_id: shopId,
                table_id: t1.id,
                order_number: generateOrderNumber(),
                status: 'preparing',
                total_amount: total,
                payment_status: 'pending'
            }).select().single();

            if (ord1) {
                await supabase.from('order_items').insert([
                    { order_id: ord1.id, menu_item_id: item1.id, name: item1.name, price: item1.price, quantity: 2 },
                    { order_id: ord1.id, menu_item_id: item2.id, name: item2.name, price: item2.price, quantity: 1, notes: 'Extra spicy' }
                ]);
            }
        }

        // Order 2: Table 2 (Served, Unpaid)
        const t2 = tablesData.find((t: any) => t.label === '2');
        if (t2 && menuItems && menuItems.length > 2) {
            await supabase.from('tables').update({ status: 'occupied' }).eq('id', t2.id);

            const item3 = menuItems[2];
            const total = item3.price;

            const { data: ord2 } = await supabase.from('orders').insert({
                shop_id: shopId,
                table_id: t2.id,
                order_number: generateOrderNumber(),
                status: 'served',
                total_amount: total,
                payment_status: 'pending'
            }).select().single();

            if (ord2) {
                await supabase.from('order_items').insert([
                    { order_id: ord2.id, menu_item_id: item3.id, name: item3.name, price: item3.price, quantity: 1 }
                ]);
            }
        }

        // Order 3: Table 3 (Billed, Paid) -> Create Bill
        const t3 = tablesData.find((t: any) => t.label === '3');
        if (t3 && menuItems && menuItems.length > 3) {
            await supabase.from('tables').update({ status: 'billed' }).eq('id', t3.id);

            const item4 = menuItems[3];
            const total = item4.price * 2;

            const { data: ord3 } = await supabase.from('orders').insert({
                shop_id: shopId,
                table_id: t3.id,
                order_number: generateOrderNumber(),
                status: 'billed',
                total_amount: total,
                payment_status: 'paid'
            }).select().single();

            if (ord3) {
                const orderItems = [
                    { order_id: ord3.id, menu_item_id: item4.id, name: item4.name, price: item4.price, quantity: 2 }
                ];
                await supabase.from('order_items').insert(orderItems);

                // Create Bill
                // Calculate breakdown manually for seed
                const subtotal = total / 1.1;
                const tax = total - subtotal;
                const serviceCharge = 0; // No service charge in seed

                await supabase.from('bills').insert({
                    shop_id: shopId,
                    table_id: t3.id,
                    total_amount: total,
                    payment_method: 'card',
                    order_ids: [ord3.id],
                    items_snapshot: orderItems,
                    breakdown: {
                        subtotal: parseFloat(subtotal.toFixed(3)),
                        tax: parseFloat(tax.toFixed(3)),
                        serviceCharge: serviceCharge,
                        total: total
                    },
                    bill_number: generateBillNumber()
                });
            }
        }
    }

    // 8. Update Settings
    const { error: settingsError } = await supabase.from('settings').upsert({
        id: 1,
        shop_id: shopId,
        restaurant_name: 'Food Cafe Premium',
        currency: '₹',
        language: 'en'
    });
    if (settingsError) console.error("Settings error", settingsError);

    console.log("Seed complete!");
    return "Success";
}
