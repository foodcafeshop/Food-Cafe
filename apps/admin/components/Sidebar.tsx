
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Store, CreditCard, Radio, Flag, MessageSquare, ShieldAlert, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Shops', href: '/shops', icon: Store },
    { name: 'SaaS Ops', href: '/saas', icon: CreditCard },
    { name: 'Broadcasts', href: '/broadcasts', icon: Radio },
    { name: 'Feature Flags', href: '/flags', icon: Flag },
    { name: 'Support', href: '/support', icon: MessageSquare },
    { name: 'Audit Logs', href: '/audit', icon: ShieldAlert },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        toast.success('Logged out successfully');
        router.push('/login');
        router.refresh();
    };

    return (
        <div className="flex h-screen w-64 flex-col bg-slate-900 border-r border-slate-800">
            <div className="flex bg-orange-600 h-16 items-center justify-center border-b border-slate-800">
                <h1 className="text-xl font-bold text-white">FoodCafe Admin</h1>
            </div>
            <nav className="flex-1 space-y-1 px-2 py-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive
                                    ? 'bg-slate-800 text-white'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <item.icon
                                className={`mr-3 h-6 w-6 flex-shrink-0 ${isActive ? 'text-orange-500' : 'text-slate-400 group-hover:text-orange-500'
                                    }`}
                            />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center px-2 py-2 text-sm font-medium text-red-400 hover:bg-slate-800 hover:text-red-300 rounded-md"
                >
                    <LogOut className="mr-3 h-6 w-6" />
                    Logout
                </button>
                <div className="mt-4 flex items-center">
                    <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white">
                        SA
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-medium text-white">Super Admin</p>
                        <p className="text-xs text-slate-500">Only you can see this.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
