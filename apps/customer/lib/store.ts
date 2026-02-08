import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MenuItem, ServiceType } from './types';

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
    tableLabel: string | null;
    setTableLabel: (label: string | null) => void;
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
    customerId: string | null;
    setCustomerId: (id: string | null) => void;
    shopId: string | null;
    setShopId: (id: string | null) => void;
    serviceType: ServiceType;
    setServiceType: (type: ServiceType) => void;
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
            totalPrice: () => get().items.reduce((acc, item) => acc + (item.offer_price ?? item.price) * item.quantity, 0),
            tableId: null,
            setTableId: (id) => set({ tableId: id }),
            tableLabel: null,
            setTableLabel: (label) => set({ tableLabel: label }),
            customerName: null,
            setCustomerName: (name) => set({ customerName: name }),
            customerPhone: null,
            setCustomerPhone: (phone) => set({ customerPhone: phone }),
            sessionId: null,
            setSessionId: (id) => set({ sessionId: id }),
            isWelcomeOpen: false,
            welcomeMode: 'welcome',
            setWelcomeOpen: (isOpen, mode = 'welcome') => set({ isWelcomeOpen: isOpen, welcomeMode: mode }),
            customerId: null,
            setCustomerId: (id) => set({ customerId: id }),
            shopId: null,
            setShopId: (id) => set({ shopId: id }),
            serviceType: 'dine_in',
            setServiceType: (type) => set({ serviceType: type }),
            logout: () => set({ customerName: null, customerPhone: null, sessionId: null, items: [], tableId: null, tableLabel: null, customerId: null, shopId: null, serviceType: 'dine_in' }),
        }),
        {
            name: 'food-cafe-cart',
            partialize: (state) => ({
                items: state.items,
                tableId: state.tableId,
                tableLabel: state.tableLabel,
                customerName: state.customerName,
                customerPhone: state.customerPhone,
                sessionId: state.sessionId,
                customerId: state.customerId,
                shopId: state.shopId,
                serviceType: state.serviceType
            }),
        }
    )
);
