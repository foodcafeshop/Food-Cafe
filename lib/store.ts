import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MenuItem } from './types';

export type CartItem = MenuItem & {
    quantity: number;
    notes?: string;
};

type CartStore = {
    items: CartItem[];
    addItem: (item: MenuItem & { quantity?: number; notes?: string }) => void;
    removeItem: (itemId: string) => void;
    updateQuantity: (itemId: string, delta: number) => void;
    clearCart: () => void;
    totalItems: () => number;
    totalPrice: () => number;
    tableId: string | null;
    setTableId: (id: string | null) => void;
    customerName: string | null;
    setCustomerName: (name: string | null) => void;
    customerPhone: string | null;
    setCustomerPhone: (phone: string | null) => void;
    sessionId: string | null;
    setSessionId: (id: string | null) => void;
    isWelcomeOpen: boolean;
    welcomeMode: 'welcome' | 'checkout';
    setWelcomeOpen: (isOpen: boolean, mode?: 'welcome' | 'checkout') => void;
    logout: () => void;
};

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (item) => {
                set((state) => {
                    const existing = state.items.find((i) => i.id === item.id);
                    if (existing) {
                        return {
                            items: state.items.map((i) =>
                                i.id === item.id ? { ...i, quantity: i.quantity + (item.quantity || 1) } : i
                            ),
                        };
                    }
                    return { items: [...state.items, { ...item, quantity: item.quantity || 1 }] };
                });
            },
            removeItem: (itemId) => {
                set((state) => ({
                    items: state.items.filter((i) => i.id !== itemId),
                }));
            },
            updateQuantity: (itemId, delta) => {
                set((state) => {
                    const newItems = state.items.map((i) => {
                        if (i.id === itemId) {
                            return { ...i, quantity: Math.max(0, i.quantity + delta) };
                        }
                        return i;
                    }).filter(i => i.quantity > 0);
                    return { items: newItems };
                });
            },
            clearCart: () => set({ items: [] }),
            totalItems: () => get().items.reduce((acc, item) => acc + item.quantity, 0),
            totalPrice: () => get().items.reduce((acc, item) => acc + item.price * item.quantity, 0),
            tableId: null,
            setTableId: (id) => set({ tableId: id }),
            customerName: null,
            setCustomerName: (name) => set({ customerName: name }),
            customerPhone: null,
            setCustomerPhone: (phone) => set({ customerPhone: phone }),
            sessionId: null,
            setSessionId: (id) => set({ sessionId: id }),
            isWelcomeOpen: false,
            welcomeMode: 'welcome',
            setWelcomeOpen: (isOpen, mode = 'welcome') => set({ isWelcomeOpen: isOpen, welcomeMode: mode }),
            logout: () => set({ customerName: null, customerPhone: null, sessionId: null, items: [] }),
        }),
        {
            name: 'food-cafe-cart',
            partialize: (state) => ({
                items: state.items,
                tableId: state.tableId,
                customerName: state.customerName,
                customerPhone: state.customerPhone,
                sessionId: state.sessionId
            }),
        }
    )
);
