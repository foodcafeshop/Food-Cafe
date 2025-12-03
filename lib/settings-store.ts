import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Currency = 'USD' | 'EUR' | 'INR' | 'GBP';
export type Language = 'en' | 'es' | 'fr' | 'hi';

interface SettingsState {
    restaurantName: string;
    currency: Currency;
    language: Language;
    taxRate: number;
    serviceCharge: number;
    darkMode: boolean;
    soundNotifications: boolean;
    autoPrint: boolean;

    updateSettings: (settings: Partial<SettingsState>) => void;
    getCurrencySymbol: () => string;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set, get) => ({
            restaurantName: 'FoodCafe Premium',
            currency: 'USD',
            language: 'en',
            taxRate: 10,
            serviceCharge: 5,
            darkMode: false,
            soundNotifications: true,
            autoPrint: false,

            updateSettings: (newSettings) => set((state) => ({ ...state, ...newSettings })),

            getCurrencySymbol: () => {
                const { currency } = get();
                switch (currency) {
                    case 'USD': return '$';
                    case 'EUR': return '€';
                    case 'INR': return '₹';
                    case 'GBP': return '£';
                    default: return '$';
                }
            },
        }),
        {
            name: 'food-cafe-settings',
        }
    )
);
