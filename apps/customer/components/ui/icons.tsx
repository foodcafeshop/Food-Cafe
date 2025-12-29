import React from 'react';
import { Leaf } from 'lucide-react';

export const VegIcon = ({ className }: { className?: string }) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect x="0.5" y="0.5" width="15" height="15" rx="3.5" stroke="#0f8a65" />
        <circle cx="8" cy="8" r="4" fill="#0f8a65" />
    </svg>
);

export const NonVegIcon = ({ className }: { className?: string }) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect x="0.5" y="0.5" width="15" height="15" rx="3.5" stroke="#e43b4f" />
        <path d="M8 4L12 11H4L8 4Z" fill="#e43b4f" />
    </svg>
);

export const VeganIcon = ({ className }: { className?: string }) => (
    <Leaf className={className} size={16} color="#0f8a65" fill="#0f8a65" />
);

export const JainVegIcon = ({ className }: { className?: string }) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect x="0.5" y="0.5" width="15" height="15" rx="3.5" stroke="#0f8a65" />
        <path d="M8 3L13 8L8 13L3 8L8 3Z" fill="#0f8a65" />
    </svg>
);

export const ContainsEggIcon = ({ className }: { className?: string }) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect x="0.5" y="0.5" width="15" height="15" rx="3.5" stroke="#A0522D" />
        <ellipse cx="8" cy="8" rx="3.5" ry="5" fill="#A0522D" />
    </svg>
);
