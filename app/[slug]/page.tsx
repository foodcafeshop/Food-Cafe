import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingBag, ChefHat, Utensils, ArrowRight, LayoutDashboard, MapPin, ChevronDown, Star, Phone, Mail, Clock, FileText } from "lucide-react";
import Link from "next/link";
import { getLandingPageData } from "@/lib/api";
import { MenuItemCard } from "@/components/features/menu/menu-item-card";
import { getCurrencySymbol, cn } from "@/lib/utils";
import { HeaderSearch } from "@/components/features/landing/header-search";
import { CartBadge } from "@/components/features/cart/cart-badge";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export default async function Home({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const data = await getLandingPageData(slug);

  if (!data || !data.shop) {
    return notFound();
  }

  const { categories, featuredItems, settings, shop, reviews } = data;

  // Check if shop is live
  if (!shop.is_live) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center space-y-6">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full space-y-6">
          <div className="flex justify-center">
            {shop.logo_url ? (
              <img src={shop.logo_url} alt="Logo" className="h-20 w-20 rounded-full object-cover" />
            ) : (
              <div className="h-20 w-20 bg-orange-100 rounded-full flex items-center justify-center">
                <ChefHat className="h-10 w-10 text-orange-600" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{shop.name}</h1>
            <p className="text-gray-500 mt-2">is coming soon!</p>
          </div>
          <div className="pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              We are currently setting up our digital menu. Please check back later.
            </p>
          </div>
          <Link href="/admin">
            <Button variant="outline" className="w-full">Admin Login</Button>
          </Link>
        </div>
      </div>
    );
  }

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
              {shop?.average_rating > 0 && (
                <div className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-full border border-orange-100 ml-2">
                  <Star className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
                  <span className="text-xs font-bold text-orange-700">{shop.average_rating}</span>
                  <span className="text-[10px] text-orange-400">({shop.rating_count})</span>
                </div>
              )}
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
            <Link href={`/${slug}/cart`} className="flex items-center gap-2 text-gray-700 hover:text-orange-500 cursor-pointer font-medium relative">
              <ShoppingBag className="h-5 w-5" />
              <span className="hidden md:inline">Cart</span>
              <CartBadge />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative h-[300px] w-full bg-gradient-to-r from-orange-500 to-red-600">
        {shop?.cover_image ? (
          <img src={shop.cover_image} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
          <div className="container max-w-7xl mx-auto px-4 pb-8 text-white">
            <h1 className="text-4xl font-bold mb-2">{shop.name}</h1>
            {shop.description && <p className="text-lg opacity-90">{shop.description}</p>}
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

      <main className="container max-w-7xl mx-auto px-4 py-8 space-y-12">

        {/* What's on your mind? (Categories) */}
        {categories && categories.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="text-2xl font-extrabold tracking-tight text-gray-800">What's on your mind?</h2>
            </div>

            <div className="flex gap-8 overflow-x-auto no-scrollbar pb-4">
              {categories.map((cat: any) => (
                <Link href={`/${slug}/menu#category-${cat.id}`} key={cat.id} className="flex flex-col items-center gap-3 min-w-[100px] group cursor-pointer">
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
        )}

        {categories && categories.length > 0 && <div className="h-2 bg-gray-100 -mx-4 md:-mx-0 rounded-xl"></div>}

        {/* Top Picks (Featured Items) */}
        {featuredItems && featuredItems.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-extrabold tracking-tight text-gray-800">Top Picks for You</h2>
            </div>

            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0">
              {featuredItems.map((item: any) => (
                <div key={item.id} className="min-w-[200px] max-w-[200px] bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-3 flex flex-col gap-2">
                  <div className="relative h-24 w-full rounded-xl overflow-hidden bg-gray-100">
                    {item.images && item.images[0] ? (
                      <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50">
                        <Utensils className="h-8 w-8 text-gray-300" />
                      </div>
                    )}
                    {item.dietary_type && (
                      <div className="absolute top-2 right-2">
                        <div className={cn(
                          "h-4 w-4 rounded-sm border flex items-center justify-center bg-white",
                          item.dietary_type === 'veg' ? "border-green-600" : "border-red-600"
                        )}>
                          <div className={cn(
                            "h-2 w-2 rounded-full",
                            item.dietary_type === 'veg' ? "bg-green-600" : "bg-red-600"
                          )} />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm line-clamp-1">{item.name}</h3>
                      <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold text-gray-900 text-sm">{currencySymbol}{item.price}</span>
                      {item.average_rating > 0 && (
                        <div className="flex items-center gap-0.5 text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-md font-medium">
                          <Star className="h-2.5 w-2.5 fill-current" />
                          {item.average_rating}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center pt-4">
              <Link href={`/${slug}/menu`}>
                <Button size="lg" className="rounded-full gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 h-12 text-base font-bold shadow-lg shadow-orange-200">
                  See Full Menu <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </section>
        )}

        {featuredItems && featuredItems.length > 0 && <div className="h-2 bg-gray-100 -mx-4 md:-mx-0 rounded-xl"></div>}

        {/* Empty State */}
        {(!categories || categories.length === 0) && (!featuredItems || featuredItems.length === 0) && (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <div className="h-24 w-24 bg-orange-50 rounded-full flex items-center justify-center">
              <Utensils className="h-12 w-12 text-orange-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Menu Coming Soon</h3>
            <p className="text-gray-500 max-w-sm">
              We are currently updating our menu with delicious items. Please check back shortly!
            </p>
          </div>
        )}

        {/* Reviews Section */}
        {reviews && reviews.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-extrabold tracking-tight text-gray-800">What People Say</h2>
            </div>

            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0">
              {reviews.map((review: any, i: number) => (
                <div key={i} className="min-w-[280px] max-w-[300px] bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">
                      {review.customer_name?.[0] || 'G'}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-sm text-gray-800">{review.customer_name || 'Guest'}</div>
                      <div className="flex text-yellow-400 text-xs">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={cn("w-3 h-3", i < review.rating ? "fill-current" : "text-gray-200")} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm italic line-clamp-3">"{review.comment}"</p>
                </div>
              ))}
            </div>
          </section>
        )}
        {/* About Us Section */}
        <section className="space-y-6 pb-8">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h2 className="text-2xl font-extrabold tracking-tight text-gray-800">Visit Us</h2>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
            {shop?.description && (
              <p className="text-gray-600 leading-relaxed">
                {shop.description}
              </p>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-orange-500" /> Location
                </h3>
                <p className="text-gray-600 pl-7">
                  {shop?.address || 'Address not available'}
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" /> Opening Hours
                </h3>
                <div className="text-gray-600 pl-7">
                  <p>{shop.opening_hours || 'Hours not available'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Phone className="h-5 w-5 text-orange-500" /> Contact
                </h3>
                <div className="space-y-2 pl-7">
                  {shop?.contact_phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <span>{shop.contact_phone}</span>
                    </div>
                  )}
                  {shop?.contact_email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span>{shop.contact_email}</span>
                    </div>
                  )}
                </div>
              </div>

              {(shop?.gstin || shop?.fssai_license) && (
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-orange-500" /> Licenses
                  </h3>
                  <div className="space-y-2 pl-7 text-sm text-gray-500">
                    {shop?.gstin && <p>GSTIN: {shop.gstin}</p>}
                    {shop?.fssai_license && <p>FSSAI: {shop.fssai_license}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
