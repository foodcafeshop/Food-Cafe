import { create } from 'zustand';
import { MenuItem } from './types';

export type OrderStatus = 'queued' | 'preparing' | 'ready' | 'served' | 'cancelled';

export type OrderItem = MenuItem & {
    quantity: number;
    notes?: string;
};

export type Order = {
    id: string;
    tableId: string;
    items: OrderItem[];
    status: OrderStatus;
    createdAt: Date;
};

type OrderStore = {
    orders: Order[];
    addOrder: (order: Order) => void;
    updateOrderStatus: (orderId: string, status: OrderStatus) => void;
    activeOrdersCount: () => number;
};

// Mock initial orders
const initialOrders: Order[] = [
    {
        id: 'ORD-001',
        tableId: '4',
        status: 'queued',
        createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
        items: [
            {
                id: '101',
                name: 'Crispy Corn',
                description: '',
                price: 6.99,
                original_price: null,
                images: ['https://images.unsplash.com/photo-1554502078-ef0fc409efce?auto=format&fit=crop&w=800&q=80'],
                dietary_type: 'veg',
                tags: [],
                is_available: true,
                is_popular: true,
                created_at: new Date().toISOString(),
                average_rating: 0,
                rating_count: 0,
                quantity: 1
            },
            {
                id: '401',
                name: 'Mojito',
                description: '',
                price: 7.99,
                original_price: null,
                images: ['https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80'],
                dietary_type: 'veg',
                tags: [],
                is_available: true,
                is_popular: true,
                created_at: new Date().toISOString(),
                average_rating: 0,
                rating_count: 0,
                quantity: 2
            },
        ]
    },
];

export const useOrderStore = create<OrderStore>((set, get) => ({
    orders: initialOrders,
    addOrder: (order) => set((state) => ({ orders: [...state.orders, order] })),
    updateOrderStatus: (orderId, status) => set((state) => ({
        orders: state.orders.map((o) => o.id === orderId ? { ...o, status } : o)
    })),
    activeOrdersCount: () => get().orders.filter(o => o.status !== 'served' && o.status !== 'cancelled').length,
}));
