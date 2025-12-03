"use client";

import { Button } from "@/components/ui/button";
import { LayoutDashboard, Menu, Grid, Settings, LogOut, UtensilsCrossed, ShoppingBag, Receipt, ChefHat, Users, List } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    const NavContent = () => (
        <div className="flex flex-col h-full">
            <div className="h-16 flex items-center px-6 border-b">
                <ChefHat className="h-6 w-6 text-primary mr-2" />
                <span className="font-bold text-lg">Food Cafe Admin</span>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                <Link href="/admin" onClick={() => setOpen(false)}>
                    <Button variant={pathname === "/admin" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
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
                <Link href="/admin/kds" onClick={() => setOpen(false)}>
                    <Button variant={pathname === "/admin/kds" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                        <UtensilsCrossed className="h-4 w-4" />
                        Kitchen Display
                    </Button>
                </Link>

                <div className="pt-4 pb-2">
                    <h4 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Menu Management
                    </h4>
                </div>

                <Link href="/admin/menus" onClick={() => setOpen(false)}>
                    <Button variant={pathname.startsWith("/admin/menus") ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                        <List className="h-4 w-4" />
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
                        Menu Items
                    </Button>
                </Link>

                <div className="pt-4 pb-2">
                    <h4 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Other
                    </h4>
                </div>

                <Link href="/admin/tables" onClick={() => setOpen(false)}>
                    <Button variant={pathname === "/admin/tables" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                        <Users className="h-4 w-4" />
                        Table Management
                    </Button>
                </Link>
                <Link href="/admin/settings" onClick={() => setOpen(false)}>
                    <Button variant={pathname === "/admin/settings" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                        <Settings className="h-4 w-4" />
                        Settings
                    </Button>
                </Link>
            </nav>

            <div className="p-4 border-t">
                <Button variant="outline" className="w-full gap-2 text-destructive hover:text-destructive">
                    <LogOut className="h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex bg-muted/20">
            {/* Desktop Sidebar */}
            <aside className="w-64 bg-card border-r hidden md:flex flex-col">
                <NavContent />
            </aside>

            {/* Mobile Header & Content */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden h-16 border-b bg-card flex items-center px-4 justify-between">
                    <div className="flex items-center">
                        <ChefHat className="h-6 w-6 text-primary mr-2" />
                        <span className="font-bold text-lg">Food Cafe Admin</span>
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
                    {children}
                </main>
            </div>
        </div>
    );
}
