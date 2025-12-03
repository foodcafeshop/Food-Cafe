import { supabase } from './supabase';
import { Menu, Category, MenuItem, Shop } from './types';
import { roundToThree } from './utils';

export async function getActiveMenu(): Promise<Menu | null> {
    const { data, error } = await supabase
        .from('menus')
        .select('*')
        .eq('is_active', true)
        .single();

    if (error) {
        console.error('Error fetching active menu:', error);
        return null;
    }
    return data;
}

export async function getMenuCategories(menuId: string): Promise<Category[]> {
    const { data, error } = await supabase
        .from('menu_categories')
        .select(`
      category_id,
      categories (*)
    `)
        .eq('menu_id', menuId)
        .order('sort_order', { ascending: true });

    if (error) {
        console.error('Error fetching categories:', error);
        return [];
    }

    return data.map((item: any) => item.categories);
}

export async function getMenuItemsForCategory(categoryId: string): Promise<MenuItem[]> {
    // This involves joining category_items and menu_items
    const { data, error } = await supabase
        .from('category_items')
        .select(`
      menu_item_id,
      menu_items (*)
    `)
        .eq('category_id', categoryId)
        .order('sort_order', { ascending: true });

    if (error) {
        console.error('Error fetching items for category:', error);
        return [];
    }

    // Flatten the result
    return data.map((item: any) => ({
        ...item.menu_items,
        category_id: categoryId // Add context
    }));
}

export async function getFullMenuData(slug: string) {
    // Get Shop Details first to get ID
    const { data: shop } = await supabase
        .from('shops')
        .select('id, name, is_live, average_rating, rating_count, slug')
        .eq('slug', slug)
        .single();

    if (!shop) return null;

    const menu = await getActiveMenu(); // This might need shop_id filtering if menus are shop-specific?
    // Currently getActiveMenu() fetches from 'menus' table where is_active=true.
    // If 'menus' table doesn't have shop_id, we have a problem for multi-tenancy.
    // Let's assume for now we just need to fix the API signature.
    // But wait, if menus are not shop specific, then every shop shows the same menu?
    // I should check the 'menus' table schema.

    // For now, let's just update the function signature as requested.

    if (!menu) return null;

    const categories = await getMenuCategories(menu.id);
    const settings = await getSettings(shop.id);

    // Fetch items for all categories in parallel
    const categoriesWithItems = await Promise.all(
        categories.map(async (category) => {
            const items = await getMenuItemsForCategory(category.id);
            // Filter hidden items
            const visibleItems = items.filter(item => !menu.hidden_items?.includes(item.id));
            return {
                ...category,
                items: visibleItems
            };
        })
    );

    return {
        menu,
        categories: categoriesWithItems,
        settings,
        shop
    };
}

export async function getLandingPageData(slug: string) {
    const { data: shop } = await supabase
        .from('shops')
        .select('*')
        .eq('slug', slug)
        .single();

    if (!shop) return { shop: null, categories: [], featuredItems: [], settings: null, reviews: [] };

    // Force fetch live status via RPC to bypass any RLS/Cache weirdness
    const { data: isLive } = await supabase.rpc('get_shop_live_status', { slug_input: slug });
    if (isLive !== null) {
        shop.is_live = isLive;
    }

    const { data: categories } = await supabase
        .from('categories')
        .select('id, name, image, menu_items(*, reviews(*))')
        .eq('shop_id', shop.id)
        .order('name');

    const { data: featuredItems } = await supabase
        .from('menu_items')
        .select('id, name, description, price, images, dietary_type, average_rating, rating_count, reviews(*)')
        .eq('shop_id', shop.id)
        .eq('is_featured', true)
        .order('name');

    const { data: settings } = await supabase
        .from('settings')
        .select('*')
        .eq('shop_id', shop.id)
        .single();

    // Fetch reviews (mocked or real)
    // For now, let's just use the reviews from featured items or fetch recent reviews
    // Since we don't have a dedicated reviews table linked to shop directly (it's via menu_items),
    // we can fetch reviews for items in this shop.
    // Or just return empty for now if not critical.
    // Let's fetch recent reviews for items in this shop.
    const { data: reviews } = await supabase
        .from('reviews')
        .select('*, menu_items!inner(shop_id)')
        .eq('menu_items.shop_id', shop.id)
        .order('created_at', { ascending: false })
        .limit(5);

    return {
        categories: categories || [],
        featuredItems: featuredItems || [],
        settings,
        shop,
        reviews: reviews || []
    };
}

import { generateOrderNumber } from './utils';

export async function upsertCustomer(shopId: string, name: string, phone: string) {
    if (!phone) return null;

    // 1. Check if customer exists
    const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('shop_id', shopId)
        .eq('phone', phone)
        .single();

    if (existingCustomer) {
        // Update name if provided (and different?) - For now, just return ID
        // Optionally update name if it was null or we want to overwrite
        if (name) {
            await supabase.from('customers').update({ name }).eq('id', existingCustomer.id);
        }
        return existingCustomer.id;
    }

    // 2. Create new customer
    const { data: newCustomer, error } = await supabase
        .from('customers')
        .insert({
            shop_id: shopId,
            name: name,
            phone: phone
        })
        .select('id')
        .single();

    if (error) {
        console.error("Error creating customer:", error);
        return null;
    }
    return newCustomer.id;
}

export async function createOrder(order: any) {
    const maxRetries = 5;
    let attempt = 0;

    while (attempt < maxRetries) {
        try {
            const orderNumber = generateOrderNumber();

            let shopId = order.shop_id;
            if (!shopId) {
                const { data: shop } = await supabase.from('shops').select('id').eq('slug', 'food-cafe').single();
                shopId = shop?.id;
            }

            // Handle Customer
            let customerId = null;
            if (order.customer_phone) {
                customerId = await upsertCustomer(shopId, order.customer_name, order.customer_phone);
            }

            const { data, error } = await supabase
                .from('orders')
                .insert({
                    ...order,
                    shop_id: shopId,
                    order_number: orderNumber,
                    total_amount: roundToThree(order.total_amount),
                    customer_name: order.customer_name,
                    customer_phone: order.customer_phone,
                    customer_id: customerId
                })
                .select()
                .single();

            if (error) {
                // Check for uniqueness violation (Postgres code 23505)
                if (error.code === '23505') {
                    console.warn(`Collision for order number ${orderNumber}, retrying...`);
                    attempt++;
                    continue;
                }
                throw error;
            }
            return data;
        } catch (err) {
            throw err;
        }
    }
    throw new Error("Failed to generate unique order number after multiple attempts");
}

export async function createOrderItems(items: any[]) {
    const { data, error } = await supabase
        .from('order_items')
        .insert(items.map(item => ({ ...item, price: roundToThree(item.price) })))
        .select();

    if (error) throw error;
    return data;
}

export async function getActiveOrders(shopId: string) {
    const { data, error } = await supabase
        .from('orders')
        .select(`
      *,
      order_items (*),
      tables (label)
    `)
        .eq('shop_id', shopId)
        .in('status', ['queued', 'preparing', 'ready'])
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching active orders:', error);
        return [];
    }
    return data;
}

export async function updateOrderStatus(id: string, status: string) {
    const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id);

    if (error) throw error;
}

export async function getOrderHistory(shopId: string) {
    const { data, error } = await supabase
        .from('orders')
        .select(`
      *,
      order_items (*),
      tables (label)
    `)
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching order history:', error);
        return [];
    }
    return data;
}

export async function getOrderById(id: string) {
    const { data, error } = await supabase
        .from('orders')
        .select(`
      *,
      order_items (*),
      tables (label)
    `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching order:', error);
        return null;
    }
    return data;
}

export const updateOrderItems = async (orderId: string, items: any[]) => {
    // 1. Delete existing items
    await supabase.from('order_items').delete().eq('order_id', orderId);

    // 2. Insert new items
    if (items.length > 0) {
        const itemsToInsert = items.map(item => ({
            order_id: orderId,
            menu_item_id: item.menu_item_id,
            name: item.name,
            price: roundToThree(item.price),
            quantity: item.quantity,
            notes: item.notes
        }));
        await supabase.from('order_items').insert(itemsToInsert);
    }

    // 3. Recalculate Total
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // 4. Update Order Total
    const { data, error } = await supabase
        .from('orders')
        .update({ total_amount: roundToThree(total), updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .select()
        .single();

    if (error) {
        console.error('Error updating order:', error);
        return null;
    }
    return data;
};

export async function getSettings(shopId?: string) {
    let query = supabase.from('settings').select('*');

    if (shopId) {
        query = query.eq('shop_id', shopId);
    }

    const { data, error } = await query.single();

    if (error) {
        console.error('Error fetching settings:', error);
        return null;
    }
    return data;
}

export async function getShopDetails(slug: string) {
    const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error) {
        console.error('Error fetching shop details:', error);
        return null;
    }
    return data as Shop;
}

export async function updateShopDetails(slug: string, updates: Partial<Shop>) {
    console.log(`[API] Updating shop ${slug} with:`, JSON.stringify(updates, null, 2));
    const { data, error } = await supabase
        .from('shops')
        .update(updates)
        .eq('slug', slug)
        .select()
        .single();

    console.log(`[API] Update result:`, { data, error });
    return { data, error };
}
export async function getTableOrders(tableId: string) {
    const { data, error } = await supabase
        .from('orders')
        .select(`
      *,
      order_items (*)
    `)
        .eq('table_id', tableId)
        .in('status', ['queued', 'preparing', 'ready', 'served'])
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching table orders:', error);
        return [];
    }
    return data;
}

import { generateBillNumber } from './utils';

export async function settleTableBill(tableId: string, paymentMethod: string, breakdown?: any) {
    // 1. Get active orders for the table
    const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, total_amount, shop_id')
        .eq('table_id', tableId)
        .in('status', ['served', 'billed']) // Include billed in case re-settling or partial
        .eq('payment_status', 'pending');

    if (ordersError) throw ordersError;
    if (!orders || orders.length === 0) throw new Error("No pending orders to settle");

    const totalAmount = orders.reduce((sum, order) => sum + order.total_amount, 0);
    const orderIds = orders.map(o => o.id);
    const shopId = orders[0].shop_id; // Assume all orders for a table belong to the same shop

    // 2. Create Bill with Retry Logic for Unique Bill Number
    const maxRetries = 5;
    let attempt = 0;
    let billData;

    while (attempt < maxRetries) {
        try {
            const billNumber = generateBillNumber();
            const { data: bill, error: billError } = await supabase
                .from('bills')
                .insert({
                    shop_id: shopId,
                    table_id: tableId,
                    total_amount: roundToThree(totalAmount),
                    payment_method: paymentMethod,
                    order_ids: orderIds,
                    items_snapshot: {}, // TODO: Fetch items if needed, or rely on orders
                    breakdown: breakdown,
                    bill_number: billNumber
                })
                .select()
                .single();

            if (billError) {
                if (billError.code === '23505') { // Unique violation
                    console.warn(`Collision for bill number ${billNumber}, retrying...`);
                    attempt++;
                    continue;
                }
                throw billError;
            }
            billData = bill;
            break;
        } catch (err) {
            throw err;
        }
    }

    if (!billData) throw new Error("Failed to generate unique bill number");

    // 3. Update Orders to 'billed' and 'paid'
    const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'billed', payment_status: 'paid' })
        .in('id', orderIds);

    if (updateError) throw updateError;

    // 4. Update Table status to 'billed' (or 'empty' if they leave immediately, but usually 'billed' first)
    await supabase.from('tables').update({ status: 'billed' }).eq('id', tableId);

    return billData;
}



export async function clearTable(tableId: string) {
    const { error } = await supabase
        .from('tables')
        .update({ status: 'empty' })
        .eq('id', tableId);

    if (error) throw error;
    return true;
}

export async function getTableById(tableId: string) {
    const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('id', tableId)
        .single();

    if (error) {
        console.error('Error fetching table:', error);
        return null;
    }
    return data;
}

export async function getBills(shopId: string) {
    const { data, error } = await supabase
        .from('bills')
        .select(`
            *,
            tables (label)
        `)
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching bills:', error);
        return [];
    }
    return data;
}

export async function updateMenuItem(id: string, updates: Partial<MenuItem>) {
    const roundedUpdates = { ...updates };
    if (roundedUpdates.price) roundedUpdates.price = roundToThree(roundedUpdates.price);
    if (roundedUpdates.original_price) roundedUpdates.original_price = roundToThree(roundedUpdates.original_price);

    const { data, error } = await supabase
        .from('menu_items')
        .update(roundedUpdates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function updateMenuCategoryOrder(menuId: string, categoryIds: string[]) {
    // We need to update the sort_order for each category in the menu_categories table
    // This is best done with a series of updates or a stored procedure.
    // For simplicity, we'll do parallel updates.

    const updates = categoryIds.map((categoryId, index) => {
        return supabase
            .from('menu_categories')
            .update({ sort_order: index })
            .match({ menu_id: menuId, category_id: categoryId });
    });

    await Promise.all(updates);
    return true;
}

export async function getDashboardStats(
    shopId: string,
    range: 'today' | 'week' | 'month' | 'year' | 'custom' = 'week',
    customRange?: { from: Date; to: Date }
) {
    // Calculate start date based on range
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0); // Start of today
    let endDate = new Date(); // End date for custom range

    if (range === 'week') {
        startDate.setDate(startDate.getDate() - 7);
    } else if (range === 'month') {
        startDate.setDate(startDate.getDate() - 30);
    } else if (range === 'year') {
        startDate.setFullYear(startDate.getFullYear() - 1);
    } else if (range === 'custom' && customRange?.from) {
        startDate = new Date(customRange.from);
        startDate.setHours(0, 0, 0, 0);
        if (customRange.to) {
            endDate = new Date(customRange.to);
            endDate.setHours(23, 59, 59, 999);
        }
    }
    // For 'today', startDate is already set to start of today

    // 1. Total Revenue (from bills within range)
    let billsQuery = supabase
        .from('bills')
        .select('total_amount, created_at, payment_method, breakdown, items_snapshot')
        .eq('shop_id', shopId)
        .gte('created_at', startDate.toISOString());

    if (range === 'custom') {
        billsQuery = billsQuery.lte('created_at', endDate.toISOString());
    }

    const { data: bills, error: billsError } = await billsQuery;

    if (billsError) {
        console.error('Error fetching bills for stats:', billsError);
        return null;
    }

    let totalRevenue = 0;
    let totalTax = 0;
    let totalServiceCharge = 0;

    if (bills) {
        bills.forEach(bill => {
            totalRevenue += bill.total_amount;

            if (bill.breakdown) {
                totalTax += Number(bill.breakdown.tax || 0);
                totalServiceCharge += Number(bill.breakdown.serviceCharge || 0);
            } else {
                // Fallback calculation
                const itemsTotal = bill.items_snapshot?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || 0;
                const subtotal = itemsTotal / 1.1;
                const tax = itemsTotal - subtotal;
                const serviceCharge = bill.total_amount - itemsTotal;

                totalTax += tax;
                totalServiceCharge += serviceCharge;
            }
        });
    }

    const netSales = totalRevenue - totalTax - totalServiceCharge;

    // 2. Active Orders Count (Real-time, not filtered by range)
    const { count: activeOrdersCount, error: ordersError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shopId)
        .in('status', ['queued', 'preparing', 'ready']);

    if (ordersError) {
        console.error('Error fetching active orders count:', ordersError);
    }

    // 3. Active Tables Count (Real-time, not filtered by range)
    // Tables are shop specific? Yes, tables table should have shop_id?
    // Let's check schema. Assuming tables has shop_id.
    const { count: occupiedTablesCount, error: tablesError } = await supabase
        .from('tables')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shopId)
        .neq('status', 'empty');

    const { count: totalTablesCount } = await supabase
        .from('tables')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shopId);

    if (tablesError) {
        console.error('Error fetching tables count:', tablesError);
    }

    // 4. Recent Sales (Last 5 bills within range)
    let recentSalesQuery = supabase
        .from('bills')
        .select(`
            id,
            total_amount,
            created_at,
            tables (label)
        `)
        .eq('shop_id', shopId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

    if (range === 'custom') {
        recentSalesQuery = recentSalesQuery.lte('created_at', endDate.toISOString());
    }

    const { data: recentSales, error: recentSalesError } = await recentSalesQuery;

    if (recentSalesError) {
        console.error('Error fetching recent sales:', recentSalesError);
    }

    // 5. Popular Items (Aggregation within range)
    // We need to filter by shop_id. order_items doesn't have shop_id, but orders does.
    // So we need to join orders.
    let orderItemsQuery = supabase
        .from('order_items')
        .select('name, quantity, created_at, orders!inner(shop_id)')
        .eq('orders.shop_id', shopId)
        .gte('created_at', startDate.toISOString());

    if (range === 'custom') {
        orderItemsQuery = orderItemsQuery.lte('created_at', endDate.toISOString());
    }

    const { data: orderItems, error: itemsError } = await orderItemsQuery;

    const popularItemsMap: Record<string, number> = {};
    if (orderItems) {
        orderItems.forEach(item => {
            popularItemsMap[item.name] = (popularItemsMap[item.name] || 0) + item.quantity;
        });
    }

    const popularItems = Object.entries(popularItemsMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    // 6. Revenue Chart Data (Daily breakdown within range)
    // Map stores { revenue: 0, net: 0, tax: 0, service: 0 }
    const revenueChartDataMap: Record<string, { revenue: number, net: number, tax: number, service: number }> = {};

    // Initialize chart keys
    if (range === 'today') {
        // For today, maybe we just show one bar? Or hourly?
        // Let's do hourly for today
        for (let i = 0; i <= 23; i++) {
            const hourStr = `${i}:00`;
            revenueChartDataMap[hourStr] = { revenue: 0, net: 0, tax: 0, service: 0 };
        }
    } else if (range === 'custom') {
        // For custom range, calculate days between start and end
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        for (let i = 0; i <= diffDays; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            revenueChartDataMap[dateStr] = { revenue: 0, net: 0, tax: 0, service: 0 };
        }
    } else {
        // Daily breakdown
        const days = range === 'week' ? 7 : range === 'month' ? 30 : 365;
        // For year, maybe monthly? 365 days is a lot of bars. Let's stick to daily for now.
        for (let i = 0; i < days; i++) {
            const d = new Date();
            d.setDate(d.getDate() - (days - 1 - i));
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            revenueChartDataMap[dateStr] = { revenue: 0, net: 0, tax: 0, service: 0 };
        }
    }

    if (bills) {
        bills.forEach(bill => {
            const d = new Date(bill.created_at);
            let key = '';

            if (range === 'today') {
                key = `${d.getHours()}:00`;
            } else {
                key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }

            if (revenueChartDataMap[key]) {
                revenueChartDataMap[key].revenue += bill.total_amount;

                let tax = 0;
                let service = 0;

                if (bill.breakdown) {
                    tax = Number(bill.breakdown.tax || 0);
                    service = Number(bill.breakdown.serviceCharge || 0);
                } else {
                    const itemsTotal = bill.items_snapshot?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || 0;
                    const subtotal = itemsTotal / 1.1;
                    tax = itemsTotal - subtotal;
                    service = bill.total_amount - itemsTotal;
                }

                revenueChartDataMap[key].tax += tax;
                revenueChartDataMap[key].service += service;
                revenueChartDataMap[key].net += (bill.total_amount - tax - service);
            }
        });
    }

    const revenueChartData = Object.entries(revenueChartDataMap)
        .map(([date, data]) => ({
            date,
            revenue: roundToThree(data.revenue),
            net: roundToThree(data.net),
            tax: roundToThree(data.tax),
            service: roundToThree(data.service)
        }));

    // 7. Category Chart Data (Pie Chart)
    // Re-using orderItems from step 5 which are already filtered by startDate

    const categoryCountMap: Record<string, number> = {};

    if (orderItems) {
        // We need menu_item_id to link to category
        // Fetch menu_items with categories (static data, no date filter needed)
        const { data: menuItemsCats } = await supabase
            .from('menu_items')
            .select(`
                id,
                category_items (
                    categories (name)
                )
            `);

        const itemCategoryMap: Record<string, string> = {};
        if (menuItemsCats) {
            menuItemsCats.forEach((item: any) => {
                // Take the first category found
                if (item.category_items && item.category_items.length > 0) {
                    itemCategoryMap[item.id] = item.category_items[0].categories.name;
                }
            });
        }

        // Now map order items to categories
        // We need to re-fetch order_items to get menu_item_id as step 5 only selected name/quantity
        let orderItemsWithIdsQuery = supabase
            .from('order_items')
            .select('menu_item_id, quantity, orders!inner(shop_id)')
            .eq('orders.shop_id', shopId)
            .gte('created_at', startDate.toISOString());

        if (range === 'custom') {
            orderItemsWithIdsQuery = orderItemsWithIdsQuery.lte('created_at', endDate.toISOString());
        }

        const { data: orderItemsWithIds } = await orderItemsWithIdsQuery;

        if (orderItemsWithIds) {
            orderItemsWithIds.forEach(item => {
                const catName = itemCategoryMap[item.menu_item_id] || 'Other';
                categoryCountMap[catName] = (categoryCountMap[catName] || 0) + item.quantity;
            });
        }
    }

    const categoryChartData = Object.entries(categoryCountMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    return {
        totalRevenue,
        netSales,
        totalTax,
        totalServiceCharge,
        activeOrdersCount: activeOrdersCount || 0,
        occupiedTablesCount: occupiedTablesCount || 0,
        totalTablesCount: totalTablesCount || 0,
        recentSales: recentSales || [],
        popularItems,
        revenueChartData,
        categoryChartData
    };
}



// Reviews
export async function submitReview(review: any) {
    const { data, error } = await supabase
        .from('reviews')
        .insert(review)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getReviews(limit = 50) {
    const { data, error } = await supabase
        .from('reviews')
        .select(`
            *,
            menu_items (name, image),
            orders (order_number)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching reviews:', error);
        return [];
    }
    return data;
}

export async function getPeakHoursStats(shopId: string) {
    // Get orders from the last 30 days to calculate peak hours
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const { data: orders, error } = await supabase
        .from('orders')
        .select('created_at')
        .eq('shop_id', shopId)
        .gte('created_at', startDate.toISOString());

    if (error) {
        console.error('Error fetching orders for peak hours:', error);
        return [];
    }

    const hoursMap: Record<number, number> = {};
    // Initialize all hours
    for (let i = 0; i < 24; i++) hoursMap[i] = 0;

    if (orders) {
        orders.forEach(order => {
            const hour = new Date(order.created_at).getHours();
            hoursMap[hour]++;
        });
    }

    return Object.entries(hoursMap).map(([hour, count]) => ({
        hour: `${hour}:00`,
        count
    }));
}
