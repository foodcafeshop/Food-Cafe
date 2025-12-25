
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Store, CreditCard, Radio, Flag, MessageSquare, ShieldAlert, LogOut, Ticket } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import Image from 'next/image';

export const navGroups = [
    {
        title: "Main",
        items: [
            { name: 'Dashboard', href: '/', icon: LayoutDashboard },
            { name: 'Shops', href: '/shops', icon: Store },
        ]
    },
    {
        title: "SaaS",
        items: [
            { name: 'Plans', href: '/saas/plans', icon: CreditCard },
            { name: 'Platform Coupons', href: '/saas/coupons', icon: Ticket },
        ]
    },
    {
        title: "System",
        items: [
            { name: 'Broadcasts', href: '/broadcasts', icon: Radio },
            { name: 'Feature Flags', href: '/flags', icon: Flag },
            { name: 'Support', href: '/support', icon: MessageSquare },
            { name: 'Audit Logs', href: '/audit', icon: ShieldAlert },
        ]
    }
];

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
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
        <div className={cn("pb-2 min-h-screen bg-card flex flex-col", className)}>
            <div className="space-y-4 py-4">
                <div className="px-6 py-4 flex items-center gap-3">
                    <div className="relative h-8 w-8">
                        <Image
                            src="/fc_logo_orange.webp"
                            alt="FoodCafe"
                            fill
                            className="object-contain rounded-md"
                        />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-primary">
                        FoodCafe
                    </h1>
                </div>
                <div className="px-3 py-2">
                    <div className="space-y-6">
                        {navGroups.map((group) => (
                            <div key={group.title}>
                                <h3 className="mb-2 px-4 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                                    {group.title}
                                </h3>
                                <div className="space-y-1">
                                    {group.items.map((item) => {
                                        const isActive = pathname === item.href;
                                        return (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                className={cn(
                                                    "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                                                    isActive ? "bg-accent/50 text-accent-foreground" : "text-muted-foreground"
                                                )}
                                            >
                                                <item.icon
                                                    className={cn(
                                                        "mr-2 h-4 w-4 transition-colors",
                                                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                                                    )}
                                                />
                                                {item.name}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="px-3 py-2 mt-auto mb-2">
                <div className="px-2 flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Settings
                    </p>
                    <ThemeToggle />
                </div>

                <div className="border-t pt-2 px-2 flex items-center justify-between group">
                    <div className="flex items-center min-w-0 mr-2">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            SA
                        </div>
                        <div className="ml-3 overflow-hidden">
                            <p className="text-sm font-medium leading-none truncate">Super Admin</p>
                            <p className="text-xs text-muted-foreground mt-1 truncate">super@food.cafe</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLogout}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Logout"
                    >
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
