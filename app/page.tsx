import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingBag, ChefHat, Utensils, ArrowRight, LayoutDashboard, MapPin, ChevronDown } from "lucide-react";
import Link from "next/link";
import { getLandingPageData } from "@/lib/api";
import { MenuItemCard } from "@/components/features/menu/menu-item-card";
import { getCurrencySymbol } from "@/lib/utils";
import { HeaderSearch } from "@/components/features/landing/header-search";
import { CartBadge } from "@/components/features/cart/cart-badge";

export default async function Home() {
  const { categories, featuredItems, settings, shop } = await getLandingPageData();

  // Determine currency symbol from settings or default
  const currencySymbol = getCurrencySymbol(settings?.currency);

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="container max-w-7xl mx-auto flex h-20 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 font-bold text-2xl text-orange-500">
              {shop?.logo_url ? (
                <img src={shop.logo_url} alt="Logo" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <ChefHat className="h-8 w-8" />
              )}
              <span className="tracking-tight">{shop?.name || 'Food Cafe'}</span>
            </div>
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-500 ml-8 hover:text-orange-500 cursor-pointer transition-colors">
              <span className="font-bold text-gray-700 border-b-2 border-gray-700 pb-0.5">Location</span>
              <span className="truncate max-w-[200px]">{shop?.address || 'Select Location'}</span>
              <ChevronDown className="h-4 w-4 text-orange-500" />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <HeaderSearch />
            <Link href="/admin" className="hidden md:flex items-center gap-2 text-gray-700 hover:text-orange-500 cursor-pointer font-medium">
              <LayoutDashboard className="h-5 w-5" />
              <span>Admin</span>
            </Link>
            <Link href="/cart" className="flex items-center gap-2 text-gray-700 hover:text-orange-500 cursor-pointer font-medium relative">
              <ShoppingBag className="h-5 w-5" />
              <span className="hidden md:inline">Cart</span>
              <CartBadge />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      {shop?.cover_image && (
        <div className="relative h-[300px] w-full">
          <img src={shop.cover_image} alt="Cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
            <div className="container max-w-7xl mx-auto px-4 pb-8 text-white">
              <h1 className="text-4xl font-bold mb-2">{shop.name}</h1>
              <p className="text-lg opacity-90">{shop.description}</p>
              <div className="flex gap-4 mt-4 text-sm font-medium">
                {shop.opening_hours && (
                  <span className="bg-green-500/20 backdrop-blur-md px-3 py-1 rounded-full border border-green-500/30 text-green-100">
                    Open Now
                  </span>
                )}
                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30">
                  {shop.shop_type || 'Restaurant'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="container max-w-7xl mx-auto px-4 py-8 space-y-12">

        {/* What's on your mind? (Categories) */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h2 className="text-2xl font-extrabold tracking-tight text-gray-800">What's on your mind?</h2>
          </div>

          <div className="flex gap-8 overflow-x-auto no-scrollbar pb-4">
            {categories.map((cat: any) => (
              <Link href={`/menu#category-${cat.id}`} key={cat.id} className="flex flex-col items-center gap-3 min-w-[100px] group cursor-pointer">
                <div className="w-32 h-32 rounded-full overflow-hidden shadow-md group-hover:shadow-lg transition-all duration-300 border-4 border-transparent group-hover:border-orange-100">
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <Utensils className="h-10 w-10 text-gray-400" />
                    </div>
                  )}
                </div>
                <span className="font-bold text-gray-700 text-lg group-hover:text-orange-500 transition-colors">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>

        <div className="h-2 bg-gray-100 -mx-4 md:-mx-0 rounded-xl"></div>

        {/* Top Picks (Featured Items) */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold tracking-tight text-gray-800">Top Picks for You</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {featuredItems.map((item: any) => (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4">
                <MenuItemCard item={item} currencySymbol={currencySymbol} />
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-4">
            <Link href="/menu">
              <Button size="lg" className="rounded-full gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 h-12 text-base font-bold shadow-lg shadow-orange-200">
                See Full Menu <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
