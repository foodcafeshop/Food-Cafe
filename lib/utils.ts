import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function getCurrencySymbol(code: string | undefined | null): string {
    if (!code) return '$';
    const upperCode = code.toUpperCase();
    switch (upperCode) {
        case 'INR': return '₹';
        case 'EUR': return '€';
        case 'GBP': return '£';
        case 'USD': return '$';
        case '₹': return '₹'; // Handle case where symbol is already stored
        case '€': return '€';
        case '£': return '£';
        case '$': return '$';
        default: return '₹';
    }
}
