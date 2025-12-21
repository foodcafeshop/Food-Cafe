"use client";

import { Button } from "@/components/ui/button";
import { LayoutDashboard, Menu, Grid, Settings, LogOut, UtensilsCrossed, ShoppingBag, Receipt, ChefHat, Users, List, Plus, Camera, PlusCircle, Package, FileText } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { useShopId } from "@/lib/hooks/use-shop-id";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { MenuDigitizationProvider } from "../context/MenuDigitizationContext";
import { ThemeProvider } from "@/components/theme-provider";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const [shopDetails, setShopDetails] = useState<{ name: string; slug: string } | null>(null);
    const { shopId, role, user, loading } = useShopId();
    const router = useRouter();

    useEffect(() => {
        if (!loading && role === 'staff') {
            const allowedPaths = ['/admin/orders', '/admin/bills', '/admin/kds', '/admin/take-order'];
            const isAllowed = allowedPaths.some(path => pathname.startsWith(path));

            if (!isAllowed) {
                router.push('/admin/orders');
            }
        }
    }, [loading, role, pathname, router]);

    useEffect(() => {
        if (shopId) {
            const fetchShopDetails = async () => {
                const { data } = await supabase
                    .from('shops')
                    .select('name, slug')
                    .eq('id', shopId)
                    .single();
                if (data) {
                    setShopDetails(data);
                }
            };
            fetchShopDetails();
        }
    }, [shopId]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!shopId) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4">
                <div className="text-center space-y-1">
                    <h1 className="text-2xl font-bold">Welcome, {user?.user_metadata?.full_name || 'User'}!</h1>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>

                <div className="text-center space-y-2 py-4">
                    <h2 className="text-lg font-semibold">No Shop Found</h2>
                    <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                        It looks like you don't have a shop associated with your account yet.
                    </p>
                </div>

                <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                    <div className="flex flex-col gap-2 w-full">
                        {role !== 'staff' && (
                            <Button className="w-full gap-2" onClick={() => router.push('/admin/create-shop')}>
                                <Plus className="h-4 w-4" /> Create Shop
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            className="w-full gap-2 text-destructive hover:text-destructive"
                            onClick={() => supabase.auth.signOut().then(() => router.push('/admin/login'))}
                        >
                            <LogOut className="h-4 w-4" /> Logout
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const NavContent = () => (
        <div className="flex flex-col h-full">
            <div className="h-auto py-4 flex flex-col justify-center px-6 border-b">
                <div className="flex items-center">
                    <div className="relative h-8 w-8 mr-2">
                        <Image
                            src="/fc_logo_orange.webp"
                            alt="Logo"
                            fill
                            priority
                            className="object-contain rounded-md"
                        />
                    </div>
                    <span className="font-bold text-lg">
                        FC {role === 'staff' ? 'Staff Panel' : 'Merchant Panel'}
                    </span>
                </div>
                {shopDetails && (
                    <div className="mt-1 ml-8 flex flex-col overflow-hidden">
                        <span className="font-bold text-sm truncate" title={shopDetails.name}>
                            {shopDetails.name}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                            slug: @{shopDetails.slug}
                        </span>
                    </div>
                )}
            </div>

            <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
                {/* Overview - Admin Only */}
                {role === 'admin' && (
                    <div className="space-y-2">
                        <h4 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Overview
                        </h4>
                        <Link href="/admin" onClick={() => setOpen(false)}>
                            <Button variant={pathname === "/admin" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                                <LayoutDashboard className="h-4 w-4" />
                                Dashboard
                            </Button>
                        </Link>
                    </div>
                )}

                {/* Operations - Everyone */}
                <div className="space-y-2">
                    <h4 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Operations
                    </h4>
                    <Link href="/admin/kds" onClick={() => setOpen(false)}>
                        <Button variant={pathname === "/admin/kds" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                            <UtensilsCrossed className="h-4 w-4" />
                            Kitchen Display
                        </Button>
                    </Link>

                    <Link href="/admin/orders" onClick={() => setOpen(false)}>
                        <Button variant={pathname === "/admin/orders" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                            <List className="h-4 w-4" />
                            Orders
                        </Button>
                    </Link>
                    <Link href="/admin/bills" onClick={() => setOpen(false)}>
                        <Button variant={pathname === "/admin/bills" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                            <Receipt className="h-4 w-4" />
                            Bills
                        </Button>
                    </Link>
                    <Link href="/admin/take-order" onClick={() => setOpen(false)}>
                        <Button variant={pathname === "/admin/take-order" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                            <PlusCircle className="h-4 w-4" />
                            Take Order
                        </Button>
                    </Link>
                </div>

                {/* Admin Sections */}
                {role === 'admin' && (
                    <>
                        <div className="space-y-2">
                            <h4 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Menu & Catalog
                            </h4>
                            <Link href="/admin/menus" onClick={() => setOpen(false)}>
                                <Button variant={pathname.startsWith("/admin/menus") ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                                    <Menu className="h-4 w-4" />
                                    Menus
                                </Button>
                            </Link>
                            <Link href="/admin/categories" onClick={() => setOpen(false)}>
                                <Button variant={pathname === "/admin/categories" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                                    <List className="h-4 w-4" />
                                    Categories
                                </Button>
                            </Link>
                            <Link href="/admin/menu" onClick={() => setOpen(false)}>
                                <Button variant={pathname === "/admin/menu" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                                    <UtensilsCrossed className="h-4 w-4" />
                                    Items
                                </Button>
                            </Link>
                            <Link href="/admin/menu-digitization" onClick={() => setOpen(false)}>
                                <Button variant={pathname === "/admin/menu-digitization" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                                    <Camera className="h-4 w-4" />
                                    Menu Digitization
                                </Button>
                            </Link>
                        </div>

                        <div className="space-y-2">
                            <h4 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Inventory
                            </h4>
                            <Link href="/admin/inventory" onClick={() => setOpen(false)}>
                                <Button variant={pathname === "/admin/inventory" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                                    <Package className="h-4 w-4" />
                                    Stock Levels
                                </Button>
                            </Link>
                            <Link href="/admin/inventory/recipes" onClick={() => setOpen(false)}>
                                <Button variant={pathname === "/admin/inventory/recipes" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                                    <FileText className="h-4 w-4" />
                                    Recipes
                                </Button>
                            </Link>
                        </div>

                        <div className="space-y-2">
                            <h4 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Management
                            </h4>
                            <Link href="/admin/tables" onClick={() => setOpen(false)}>
                                <Button variant={pathname === "/admin/tables" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                                    <Grid className="h-4 w-4" />
                                    Tables
                                </Button>
                            </Link>
                            <Link href="/admin/reviews" onClick={() => setOpen(false)}>
                                <Button variant={pathname === "/admin/reviews" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                                    <Users className="h-4 w-4" />
                                    Reviews
                                </Button>
                            </Link>
                            <Link href="/admin/settings/staff" onClick={() => setOpen(false)}>
                                <Button variant={pathname === "/admin/settings/staff" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                                    <Users className="h-4 w-4" />
                                    Team
                                </Button>
                            </Link>
                        </div>

                        <div className="space-y-2">
                            <h4 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Configuration
                            </h4>
                            <Link href="/admin/settings/profile" onClick={() => setOpen(false)}>
                                <Button variant={pathname === "/admin/settings/profile" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                                    <ChefHat className="h-4 w-4" />
                                    Shop Profile
                                </Button>
                            </Link>
                            <Link href="/admin/settings/general" onClick={() => setOpen(false)}>
                                <Button variant={pathname === "/admin/settings/general" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                                    <Settings className="h-4 w-4" />
                                    General Settings
                                </Button>
                            </Link>
                            <Link href="/admin/settings/financials" onClick={() => setOpen(false)}>
                                <Button variant={pathname === "/admin/settings/financials" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                                    <Receipt className="h-4 w-4" />
                                    Financials
                                </Button>
                            </Link>
                        </div>
                    </>
                )}
            </nav>

            {/* User Profile Footer */}
            <div className="p-4 border-t bg-muted/10">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                        {user?.user_metadata?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                            {user?.user_metadata?.full_name || 'User'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                            {user?.email}
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => supabase.auth.signOut().then(() => router.push('/admin/login'))}>
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-screen w-full flex bg-muted/20 overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className="w-64 bg-card border-r hidden md:flex flex-col h-full">
                <NavContent />
            </aside>

            {/* Mobile Header & Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden h-16 border-b bg-card flex items-center px-4 justify-between shrink-0">
                    <div className="flex flex-col">
                        <div className="flex items-center">
                            <div className="relative h-8 w-8 mr-2">
                                <Image
                                    src="/fc_logo_v2.webp"
                                    alt="Logo"
                                    fill
                                    priority
                                    className="object-contain rounded-lg shadow-sm"
                                />
                            </div>
                            <span className="font-bold text-lg">
                                FC {role === 'staff' ? 'Staff Panel' : 'Merchant Panel'}
                            </span>
                        </div>
                        {shopDetails && (
                            <div className="text-xs text-muted-foreground ml-8">
                                {shopDetails.name} (@{shopDetails.slug})
                            </div>
                        )}
                    </div>
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-64">
                            <NavContent />
                        </SheetContent>
                    </Sheet>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-auto">
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <MenuDigitizationProvider>
                            {children}
                        </MenuDigitizationProvider>
                    </ThemeProvider>
                </main>
            </div>
        </div>
    );
}
