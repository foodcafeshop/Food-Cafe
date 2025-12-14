export type Category = {
    id: string;
    name: string;
    slug: string;
};

export type MenuItem = {
    id: string;
    categoryId: string;
    name: string;
    description: string;
    price: number;
    image: string;
    isVeg: boolean;
    isSpicy?: boolean;
    isPopular?: boolean;
};

export const categories: Category[] = [
    { id: '1', name: 'Starters', slug: 'starters' },
    { id: '2', name: 'Mains', slug: 'mains' },
    { id: '3', name: 'Burgers', slug: 'burgers' },
    { id: '4', name: 'Drinks', slug: 'drinks' },
    { id: '5', name: 'Desserts', slug: 'desserts' },
];

export const menuItems: MenuItem[] = [
    {
        id: '101',
        categoryId: '1',
        name: 'Crispy Corn',
        description: 'Sweet corn kernels fried to perfection with spices.',
        price: 6.99,
        image: 'https://images.unsplash.com/photo-1554502078-ef0fc409efce?auto=format&fit=crop&w=800&q=80',
        isVeg: true,
        isPopular: true,
    },
    {
        id: '102',
        categoryId: '1',
        name: 'Chicken Wings',
        description: 'Spicy buffalo wings served with ranch dip.',
        price: 9.99,
        image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=800&q=80',
        isVeg: false,
        isSpicy: true,
    },
    {
        id: '201',
        categoryId: '2',
        name: 'Grilled Salmon',
        description: 'Fresh salmon fillet with asparagus and lemon butter sauce.',
        price: 18.99,
        image: 'https://images.unsplash.com/photo-1467003909585-2f8a7270028d?auto=format&fit=crop&w=800&q=80',
        isVeg: false,
    },
    {
        id: '202',
        categoryId: '2',
        name: 'Paneer Tikka Masala',
        description: 'Cottage cheese cubes in rich tomato gravy.',
        price: 14.99,
        image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80',
        isVeg: true,
        isPopular: true,
    },
    {
        id: '301',
        categoryId: '3',
        name: 'Classic Cheeseburger',
        description: 'Juicy beef patty with cheddar, lettuce, and tomato.',
        price: 12.99,
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
        isVeg: false,
    },
    {
        id: '401',
        categoryId: '4',
        name: 'Mojito',
        description: 'Refreshing mint and lime cocktail.',
        price: 7.99,
        image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
        isVeg: true,
    },
];
