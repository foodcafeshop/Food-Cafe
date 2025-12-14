import React from 'react';

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
