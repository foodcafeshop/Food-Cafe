import { supabase } from './supabase';
import { Menu, Category, MenuItem } from './types';

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

export async function getFullMenuData() {
    const menu = await getActiveMenu();
    if (!menu) return null;

    const categories = await getMenuCategories(menu.id);
    const settings = await getSettings();

    // Fetch items for all categories in parallel
    const categoriesWithItems = await Promise.all(
        categories.map(async (category) => {
            const items = await getMenuItemsForCategory(category.id);
            return {
                ...category,
                items
            };
        })
    );

    return {
        menu,
        categories: categoriesWithItems,
        settings
    };
}

export async function createOrder(order: any) {
    const { data, error } = await supabase
        .from('orders')
        .insert(order)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function createOrderItems(items: any[]) {
    const { data, error } = await supabase
        .from('order_items')
        .insert(items)
        .select();

    if (error) throw error;
    return data;
}

export async function getActiveOrders() {
    const { data, error } = await supabase
        .from('orders')
        .select(`
      *,
      order_items (*),
      tables (label)
    `)
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

export async function getOrderHistory() {
    const { data, error } = await supabase
        .from('orders')
        .select(`
      *,
      order_items (*),
      tables (label)
    `)
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
            price: item.price,
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
        .update({ total_amount: total, updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .select()
        .single();

    if (error) {
        console.error('Error updating order:', error);
        return null;
    }
    return data;
};

export async function getSettings() {
    const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single();

    if (error) {
        console.error('Error fetching settings:', error);
        return null;
    }
    return data;
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

export async function settleTableBill(tableId: string, orderIds: string[], paymentMethod: string, serviceCharge: number = 0) {
    // 1. Fetch order details for snapshot
    const { data: orders, error: fetchError } = await supabase
        .from('orders')
        .select(`
            *,
            order_items (*)
        `)
        .in('id', orderIds);

    if (fetchError) throw fetchError;

    // Calculate total and prepare snapshot
    const ordersTotal = orders.reduce((sum, order) => sum + order.total_amount, 0);
    const totalAmount = ordersTotal + serviceCharge;
    const itemsSnapshot = orders.flatMap(order => order.order_items);

    // 2. Create Bill Record
    const { error: billError } = await supabase
        .from('bills')
        .insert({
            table_id: tableId,
            total_amount: totalAmount,
            payment_method: paymentMethod,
            order_ids: orderIds,
            items_snapshot: itemsSnapshot
        });

    if (billError) throw billError;

    // 3. Mark orders as billed and paid
    const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'billed', payment_status: 'paid' })
        .in('id', orderIds);

    if (orderError) throw orderError;

    // 4. Mark table as billed
    const { error: tableError } = await supabase
        .from('tables')
        .update({ status: 'billed' })
        .eq('id', tableId);

    if (tableError) throw tableError;

    return true;
}

export async function clearTable(tableId: string) {
    const { error } = await supabase
        .from('tables')
        .update({ status: 'empty' })
        .eq('id', tableId);

    if (error) throw error;
    return true;
}

export async function getBills() {
    const { data, error } = await supabase
        .from('bills')
        .select(`
            *,
            tables (label)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching bills:', error);
        return [];
    }
    return data;
}

export async function updateMenuItem(id: string, updates: Partial<MenuItem>) {
    const { data, error } = await supabase
        .from('menu_items')
        .update(updates)
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
        .select('total_amount, created_at, payment_method')
        .gte('created_at', startDate.toISOString());

    if (range === 'custom') {
        billsQuery = billsQuery.lte('created_at', endDate.toISOString());
    }

    const { data: bills, error: billsError } = await billsQuery;

    if (billsError) {
        console.error('Error fetching bills for stats:', billsError);
        return null;
    }

    const totalRevenue = bills.reduce((sum, bill) => sum + bill.total_amount, 0);

    // 2. Active Orders Count (Real-time, not filtered by range)
    const { count: activeOrdersCount, error: ordersError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['queued', 'preparing', 'ready']);

    if (ordersError) {
        console.error('Error fetching active orders count:', ordersError);
    }

    // 3. Active Tables Count (Real-time, not filtered by range)
    const { count: occupiedTablesCount, error: tablesError } = await supabase
        .from('tables')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'empty');

    const { count: totalTablesCount } = await supabase
        .from('tables')
        .select('*', { count: 'exact', head: true });

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
    let orderItemsQuery = supabase
        .from('order_items')
        .select('name, quantity, created_at')
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
    const revenueChartDataMap: Record<string, number> = {};

    // Initialize chart keys
    if (range === 'today') {
        // For today, maybe we just show one bar? Or hourly?
        // Let's do hourly for today
        for (let i = 0; i <= 23; i++) {
            const hourStr = `${i}:00`;
            revenueChartDataMap[hourStr] = 0;
        }
    } else if (range === 'custom') {
        // For custom range, calculate days between start and end
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        for (let i = 0; i <= diffDays; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            revenueChartDataMap[dateStr] = 0;
        }
    } else {
        // Daily breakdown
        const days = range === 'week' ? 7 : range === 'month' ? 30 : 365;
        // For year, maybe monthly? 365 points is too many.
        if (range === 'year') {
            for (let i = 11; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const monthStr = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                revenueChartDataMap[monthStr] = 0;
            }
        } else {
            for (let i = days - 1; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                revenueChartDataMap[dateStr] = 0;
            }
        }
    }

    if (bills) { // Re-using bills fetched in step 1 which are already filtered by startDate
        bills.forEach(bill => {
            let key = '';
            const billDate = new Date(bill.created_at);

            if (range === 'today') {
                key = `${billDate.getHours()}:00`;
            } else if (range === 'year') {
                key = billDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            } else {
                key = billDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }

            if (revenueChartDataMap[key] !== undefined) {
                revenueChartDataMap[key] += bill.total_amount;
            }
        });
    }

    const revenueChartData = Object.entries(revenueChartDataMap).map(([date, revenue]) => ({ date, revenue }));

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
            .select('menu_item_id, quantity')
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
        activeOrdersCount: activeOrdersCount || 0,
        occupiedTablesCount: occupiedTablesCount || 0,
        totalTablesCount: totalTablesCount || 0,
        recentSales: recentSales || [],
        popularItems,
        revenueChartData,
        categoryChartData
    };
}

export async function getLandingPageData() {
    // 1. Get Active Menu & Categories
    const menu = await getActiveMenu();
    let categories: any[] = [];
    if (menu) {
        categories = await getMenuCategories(menu.id);
    }
    const settings = await getSettings();

    // 2. Get Featured Items (just take 3 random or first 3 for now)
    const { data: featuredItems, error } = await supabase
        .from('menu_items')
        .select('*')
        .limit(3);

    if (error) {
        console.error('Error fetching featured items:', error);
    }

    return {
        categories: categories || [],
        featuredItems: featuredItems || [],
        settings
    };
}
