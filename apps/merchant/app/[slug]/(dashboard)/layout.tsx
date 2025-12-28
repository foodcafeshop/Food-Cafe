"use client";

import { Button } from "@/components/ui/button";
import { LayoutDashboard, Menu, Grid, Settings, LogOut, UtensilsCrossed, ShoppingBag, Receipt, ChefHat, Users, List, Plus, Camera, PlusCircle, Package, FileText, Store } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useParams, useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { useShopId } from "@/lib/hooks/use-shop-id";
import { supabase } from "@/lib/supabase";
import { MenuDigitizationProvider } from "../context/MenuDigitizationContext";
import { ThemeProvider } from "@/components/theme-provider";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const params = useParams();
    const slug = params.slug as string;
    const [open, setOpen] = useState(false);
    const [shopDetails, setShopDetails] = useState<{ name: string; slug: string } | null>(null);
    const { shopId, role, user, loading, error } = useShopId();
    const router = useRouter();

    useEffect(() => {
        if (!loading && role === 'staff') {
            const allowedPaths = [`/${slug}/orders`, `/${slug}/bills`, `/${slug}/kds`, `/${slug}/take-order`];
            const isAllowed = allowedPaths.some(path => pathname.startsWith(path));

            if (!isAllowed) {
                router.push(`/${slug}/orders`);
            }
        }
    }, [loading, role, pathname, router, slug]);

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

    // Access Control Errors
    if (error === 'Unauthorized' || (error === 'Shop not found' && slug)) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4">
                <div className="bg-destructive/10 p-4 rounded-full">
                    <LogOut className="h-8 w-8 text-destructive" />
                </div>
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold">Access Denied</h1>
                    <p className="text-muted-foreground max-w-sm">
                        {error === 'Shop not found'
                            ? "The shop you are looking for does not exist."
                            : "You do not have permission to access this shop."}
                    </p>
                </div>
                <Button onClick={() => router.push('/shops')} variant="outline">
                    Back to My Shops
                </Button>
            </div>
        );
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
                        Please select a shop to continue.
                    </p>
                </div>

                <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                    <Button className="w-full gap-2" onClick={() => router.push('/shops')}>
                        <Store className="h-4 w-4" /> Go to My Shops
                    </Button>
                    <div className="flex flex-col gap-2 w-full">
                        <Button
                            variant="outline"
                            className="w-full gap-2 text-destructive hover:text-destructive"
                            onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
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
                        <Link href={`/${slug}`} onClick={() => setOpen(false)}>
                            <Button variant={pathname === `/${slug}` ? "secondary" : "ghost"} className="w-full justify-start gap-2">
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
                    <Link href={`/${slug}/kds`} onClick={() => setOpen(false)}>
                        <Button variant={pathname === `/${slug}/kds` ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                            <UtensilsCrossed className="h-4 w-4" />
                            Kitchen Display
                        </Button>
                    </Link>

                    <Link href={`/${slug}/orders`} onClick={() => setOpen(false)}>
                        <Button variant={pathname === `/${slug}/orders` ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                            <List className="h-4 w-4" />
                            Orders
                        </Button>
                    </Link>
                    <Link href={`/${slug}/bills`} onClick={() => setOpen(false)}>
                        <Button variant={pathname === `/${slug}/bills` ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                            <Receipt className="h-4 w-4" />
                            Bills
                        </Button>
                    </Link>
                    <Link href={`/${slug}/take-order`} onClick={() => setOpen(false)}>
                        <Button variant={pathname === `/${slug}/take-order` ? "secondary" : "ghost"} className="w-full justify-start gap-2">
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
                            <Link href={`/${slug}/menus`} onClick={() => setOpen(false)}>
                                <Button variant={pathname.startsWith(`/${slug}/menus`) ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                                    <Menu className="h-4 w-4" />
                                    Menus
                                </Button>
                            </Link>
                            <Link href={`/${slug}/categories`} onClick={() => setOpen(false)}>
                                <Button variant={pathname === `/${slug}/categories` ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                                    <List className="h-4 w-4" />
                                    Categories
                                </Button>
                            </Link>
                            <Link href={`/${slug}/menu`} onClick={() => setOpen(false)}>
                                <Button variant={pathname === `/${slug}/menu` ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                                    <UtensilsCrossed className="h-4 w-4" />
                                    Items
                                </Button>
                            </Link>
                            <Link href={`/${slug}/menu-digitization`} onClick={() => setOpen(false)}>
                                <Button variant={pathname === `/${slug}/menu-digitization` ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                                    <Camera className="h-4 w-4" />
                                    Menu Digitization
                                </Button>
                            </Link>
                        </div>

                        <div className="space-y-2">
                            <h4 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Inventory
                            </h4>
                            <Link href={`/${slug}/inventory`} onClick={() => setOpen(false)}>
                                <Button variant={pathname === `/${slug}/inventory` ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                                    <Package className="h-4 w-4" />
                                    Stock Levels
                                </Button>
                            </Link>
                            <Link href={`/${slug}/inventory/recipes`} onClick={() => setOpen(false)}>
                                <Button variant={pathname === `/${slug}/inventory/recipes` ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                                    <FileText className="h-4 w-4" />
                                    Recipes
                                </Button>
                            </Link>
                        </div>

                        <div className="space-y-2">
                            <h4 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Management
                            </h4>
                            <Link href={`/${slug}/tables`} onClick={() => setOpen(false)}>
                                <Button variant={pathname === `/${slug}/tables` ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                                    <Grid className="h-4 w-4" />
                                    Tables
                                </Button>
                            </Link>
                            <Link href={`/${slug}/reviews`} onClick={() => setOpen(false)}>
                                <Button variant={pathname === `/${slug}/reviews` ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                                    <Users className="h-4 w-4" />
                                    Reviews
                                </Button>
                            </Link>
                            <Link href={`/${slug}/settings/staff`} onClick={() => setOpen(false)}>
                                <Button variant={pathname === `/${slug}/settings/staff` ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                                    <Users className="h-4 w-4" />
                                    Team
                                </Button>
                            </Link>
                        </div>

                        <div className="space-y-2">
                            <h4 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Configuration
                            </h4>
                            <Link href={`/${slug}/settings/profile`} onClick={() => setOpen(false)}>
                                <Button variant={pathname === `/${slug}/settings/profile` ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                                    <ChefHat className="h-4 w-4" />
                                    Shop Profile
                                </Button>
                            </Link>
                            <Link href={`/${slug}/settings/general`} onClick={() => setOpen(false)}>
                                <Button variant={pathname === `/${slug}/settings/general` ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                                    <Settings className="h-4 w-4" />
                                    General Settings
                                </Button>
                            </Link>
                            <Link href={`/${slug}/settings/financials`} onClick={() => setOpen(false)}>
                                <Button variant={pathname === `/${slug}/settings/financials` ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                                    <Receipt className="h-4 w-4" />
                                    Financials
                                </Button>
                            </Link>
                            <Link href={`/${slug}/settings/printers`} onClick={() => setOpen(false)}>
                                <Button variant={pathname === `/${slug}/settings/printers` ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                                    <div className="relative h-4 w-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-printer"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect width="12" height="8" x="6" y="14" /></svg>
                                    </div>
                                    Printer Settings
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
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}>
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
                                    src="/fc_logo_orange.webp"
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
