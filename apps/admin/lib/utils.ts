import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function getCurrencySymbol(code: string | undefined | null): string {
    if (!code) return '₹';
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

export function roundToThree(num: number): number {
    return Math.round((num + Number.EPSILON) * 1000) / 1000;
}

export function generateOrderNumber(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export function generateBillNumber(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
