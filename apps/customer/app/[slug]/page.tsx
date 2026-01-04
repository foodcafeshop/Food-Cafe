import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingBag, ChefHat, Utensils, ArrowRight, LayoutDashboard, MapPin, ChevronDown, Star, Phone, Mail, Clock, FileText, Sparkles, Quote, Instagram, Facebook, Globe, Leaf, Navigation, ExternalLink, Youtube, Egg, Diamond, Flame } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getLandingPageData } from "@/lib/api";
import { MenuItemCard } from "@/components/features/menu/menu-item-card";
import { getCurrencySymbol, cn } from "@/lib/utils";

import { CartBadge } from "@/components/features/cart/cart-badge";
import { ShopHeader } from "@/components/features/landing/shop-header";
import { VegIcon, NonVegIcon, VeganIcon, JainVegIcon, ContainsEggIcon } from "@/components/ui/icons";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { GallerySection } from "@/components/features/landing/gallery-section";
import { QuickActionsBar } from "@/components/features/landing/quick-actions-bar";

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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-white to-red-50 p-4 text-center space-y-6">
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl max-w-md w-full space-y-6 border border-white/50">
          <div className="flex justify-center">
            {shop.logo_url ? (
              <img src={shop.logo_url} alt="Logo" className="h-20 w-20 rounded-full object-cover ring-4 ring-orange-100" />
            ) : (
              <div className="relative h-20 w-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center overflow-hidden ring-4 ring-orange-100">
                <Image
                  src="/fc_logo_orange.webp"
                  alt="Logo"
                  fill
                  className="object-contain p-2"
                />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">{shop.name}</h1>
            <p className="text-gray-500 mt-2">is coming soon!</p>
          </div>
          <div className="pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              We are currently setting up our digital menu. Please check back later.
            </p>
          </div>
          <Link href={`${process.env.NEXT_PUBLIC_MERCHANT_URL}/login`}>
            <Button variant="outline" className="w-full">Admin Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Determine currency symbol from settings or default
  const currencySymbol = getCurrencySymbol(settings?.currency);

  // Compute available dietary types from menu items
  const allItems = [
    ...(featuredItems || []),
    ...(categories?.flatMap((cat: any) => cat.menu_items || []) || [])
  ];
  const dietaryTypes = {
    veg: allItems.some((item: any) => item.dietary_type === 'veg'),
    nonVeg: allItems.some((item: any) => item.dietary_type === 'non_veg'),
    vegan: allItems.some((item: any) => item.dietary_type === 'vegan'),
    jain: allItems.some((item: any) => item.dietary_type === 'jain_veg'),
    egg: allItems.some((item: any) => item.dietary_type === 'contains_egg')
  };

  // Parse social links
  const socialLinks = shop.social_links as { instagram?: string; facebook?: string; website?: string; google_maps?: string; youtube?: string } | null;

  // Helper function to extract username from social URLs
  const extractUsername = (url: string, platform: string): string => {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname.replace(/^\//, '').replace(/\/$/, '');
      if (platform === 'instagram' || platform === 'facebook') {
        return '@' + path.split('/')[0];
      }
      if (platform === 'youtube') {
        if (path.startsWith('@')) return path;
        if (path.includes('channel/')) return 'YouTube';
        return '@' + path.split('/')[0];
      }
      return urlObj.hostname.replace('www.', '');
    } catch {
      return platform.charAt(0).toUpperCase() + platform.slice(1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-orange-50/30 to-white pb-20 food-pattern-bg">
      {/* Header */}
      <ShopHeader shop={shop} slug={slug} showMenuLink={true} showCartLink={true} showSearch={false} />

      {/* Shop Closed Banner */}
      {!shop.is_open && (
        <div className="bg-red-600 text-white px-4 py-3 text-center font-bold sticky top-[60px] z-30 shadow-md">
          <div className="flex items-center justify-center gap-2">
            <Clock className="h-5 w-5" />
            <span>This shop is currently not accepting orders. You can still browse the menu.</span>
          </div>
        </div>
      )}

      {/* Hero Section - Enhanced */}
      <div className="relative h-[350px] md:h-[400px] w-full overflow-hidden">
        {/* Background */}
        {shop?.cover_image ? (
          <img src={shop.cover_image} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-red-500 to-orange-600 animated-gradient">
            {/* Decorative pattern */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
          </div>
        )}

        {/* Floating Decorative Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-16 right-16 text-5xl float-animation opacity-80 drop-shadow-lg">🍽️</div>
          <div className="absolute top-32 left-20 text-4xl float-animation-delayed opacity-70 drop-shadow-lg">🍛</div>
          <div className="absolute bottom-32 right-24 text-4xl float-animation-slow opacity-75 drop-shadow-lg">🍲</div>
          <div className="absolute top-20 left-1/2 text-3xl float-animation opacity-60 drop-shadow-lg hidden md:block">🥘</div>
          <div className="absolute bottom-40 left-32 text-3xl float-animation-delayed opacity-65 drop-shadow-lg hidden md:block">🍕</div>
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40"></div>

        {/* Hero Content */}
        <div className="absolute inset-0 flex items-end">
          <div className="container max-w-7xl mx-auto px-4 pb-8 text-white">
            <div className="max-w-2xl space-y-4">
              {/* Shop Name + Rating */}
              <div className="flex flex-wrap items-center gap-4">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-lg">
                  {shop.name}
                </h1>

              </div>
              {shop.description && (
                <p className="text-lg md:text-xl opacity-90 drop-shadow-md line-clamp-2">
                  {shop.description}
                </p>
              )}

              {/* Badges - Single Row */}
              <div className="flex flex-wrap gap-2 pt-2">
                {shop.is_open ? (
                  <span className="bg-green-500/60 px-3 py-1.5 rounded-full border border-green-400/40 text-green-100 font-medium flex items-center gap-2 pulse-glow text-sm">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    Open Now
                  </span>
                ) : (
                  <span className="bg-red-500/60 px-3 py-1.5 rounded-full border border-red-400/40 text-red-100 font-medium flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                    Closed
                  </span>
                )}
                {dietaryTypes.veg && (
                  <span className="bg-green-600/60 px-3 py-1.5 rounded-full border border-green-500/40 text-green-100 font-medium flex items-center gap-1.5 text-sm">
                    <Leaf className="h-3.5 w-3.5" />
                    Veg
                  </span>
                )}
                {dietaryTypes.nonVeg && (
                  <span className="bg-red-600/60 px-3 py-1.5 rounded-full border border-red-500/40 text-red-100 font-medium flex items-center gap-1.5 text-sm">
                    <span className="h-3 w-3 rounded-sm border-2 border-red-300 flex items-center justify-center">
                      <span className="h-1.5 w-1.5 bg-red-300 rounded-full" />
                    </span>
                    Non-Veg
                  </span>
                )}
                {dietaryTypes.vegan && (
                  <span className="bg-emerald-600/60 px-3 py-1.5 rounded-full border border-emerald-500/40 text-emerald-100 font-medium flex items-center gap-1.5 text-sm">
                    <Leaf className="h-3.5 w-3.5" />
                    Vegan
                  </span>
                )}
                {dietaryTypes.jain && (
                  <span className="bg-teal-600/60 px-3 py-1.5 rounded-full border border-teal-500/40 text-teal-100 font-medium flex items-center gap-1.5 text-sm">
                    <Diamond className="h-3.5 w-3.5" />
                    Jain
                  </span>
                )}
                {dietaryTypes.egg && (
                  <span className="bg-amber-600/60 px-3 py-1.5 rounded-full border border-amber-500/40 text-amber-100 font-medium flex items-center gap-1.5 text-sm">
                    <Egg className="h-3.5 w-3.5" />
                    Egg
                  </span>
                )}
              </div>

              {/* CTA Button */}
              <div className="pt-4">
                <Link href={`/${slug}/menu`}>
                  <Button size="lg" className="rounded-full gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 h-14 text-lg font-bold shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105">
                    <Utensils className="h-5 w-5" />
                    Explore Our Menu
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>



      <main className="container max-w-7xl mx-auto px-4 py-6 space-y-10">

        {/* What's on your mind? (Categories) - Enhanced */}
        {categories && categories.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                  What's on your mind?
                </h2>
                <p className="text-gray-500 mt-1">Explore by category</p>
              </div>
            </div>

            {/* Outer wrapper with negative margin to allow shadows at edges */}
            <div className="-mx-4 md:-mx-6">
              <div className="flex gap-4 md:gap-8 overflow-x-auto no-scrollbar snap-scroll-x p-6" role="list" aria-label="Food categories">
                {categories.map((cat: any, index: number) => (
                  <Link
                    href={`/${slug}/menu#category-${cat.id}`}
                    key={cat.id}
                    className="flex flex-col items-center gap-3 min-w-[100px] group cursor-pointer touch-active shrink-0"
                    role="listitem"
                    aria-label={`Browse ${cat.name} category`}
                  >
                    {/* Outer ring with gradient */}
                    <div className="relative">
                      {/* Animated pulse ring */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-400 to-red-400 opacity-0 group-hover:opacity-100 scale-100 group-hover:scale-110 transition-all duration-500 blur-md"></div>

                      {/* Main circle */}
                      <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden shadow-lg group-hover:shadow-xl transition-all duration-500 ring-4 ring-orange-100 group-hover:ring-orange-300 hover-scale">
                        {cat.image ? (
                          <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                            <Utensils className="h-8 w-8 text-orange-400" />
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="font-bold text-gray-700 text-base md:text-lg group-hover:text-orange-600 transition-colors text-center">
                      {cat.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {categories && categories.length > 0 && <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>}

        {/* Top Picks (Featured Items) - Enhanced */}
        {featuredItems && featuredItems.length > 0 && (
          <section className="space-y-6" aria-labelledby="featured-heading">
            <div className="flex items-center justify-between">
              <div>
                <h2 id="featured-heading" className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-orange-500" />
                  Top Picks for You
                </h2>
                <p className="text-gray-500 mt-1">Customer favorites</p>
              </div>
            </div>

            <div className="flex gap-4 overflow-x-auto no-scrollbar snap-scroll-x pb-4 -mx-4 px-4 md:mx-0 md:px-0" role="list" aria-label="Featured menu items">
              {featuredItems.map((item: any, index: number) => (
                <div key={item.id} role="listitem" className="min-w-[200px] max-w-[200px] bg-white rounded-2xl border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 p-3 flex flex-col gap-2 card-lift shimmer-hover touch-active">
                  <div className="relative h-28 w-full rounded-xl overflow-hidden bg-gray-100">
                    {item.images && item.images[0] ? (
                      <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
                        <Utensils className="h-8 w-8 text-orange-300" />
                      </div>
                    )}
                    {/* Featured badge */}
                    <div className="absolute top-2 left-2">
                      <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                        Featured
                      </span>
                    </div>
                    {item.dietary_type && (
                      <div className="absolute top-2 right-2">
                        {item.dietary_type === 'veg' && <VegIcon />}
                        {item.dietary_type === 'non_veg' && <NonVegIcon />}
                        {item.dietary_type === 'vegan' && <VeganIcon />}
                        {item.dietary_type === 'jain_veg' && <JainVegIcon />}
                        {item.dietary_type === 'contains_egg' && <ContainsEggIcon />}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm line-clamp-1">{item.name}</h3>
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{item.description}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex flex-col">
                        {item.offer_price && item.offer_price < item.price ? (
                          <>
                            <span className="text-[10px] text-gray-400 line-through">{currencySymbol}{item.price}</span>
                            <span className="font-bold text-orange-600 text-sm">{currencySymbol}{item.offer_price}</span>
                          </>
                        ) : (
                          <span className="font-bold text-gray-900 text-sm">{currencySymbol}{item.price}</span>
                        )}
                      </div>
                      {item.average_rating > 0 && (
                        <div className="flex items-center gap-1 text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                          <Star className="h-3 w-3 fill-current" />
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
                <Button size="lg" className="rounded-full gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-10 h-14 text-base font-bold shadow-xl shadow-orange-200/50 hover:shadow-orange-300/50 transition-all duration-300 hover:scale-105">
                  See Full Menu <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </section>
        )}

        {featuredItems && featuredItems.length > 0 && <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>}

        {/* Empty State */}
        {(!categories || categories.length === 0) && (!featuredItems || featuredItems.length === 0) && (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
            <div className="h-28 w-28 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center shadow-lg">
              <Utensils className="h-14 w-14 text-orange-500" />
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Menu Coming Soon</h3>
            <p className="text-gray-500 max-w-sm">
              We are currently updating our menu with delicious items. Please check back shortly!
            </p>
          </div>
        )}

        {/* Reviews Section - Enhanced */}
        {reviews && reviews.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                  What People Say
                </h2>
                <p className="text-gray-500 mt-1">Reviews from our valued customers</p>
              </div>
            </div>

            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0">
              {reviews.map((review: any, i: number) => (
                <div key={i} className="min-w-[300px] max-w-[320px] bg-gradient-to-br from-white to-orange-50/50 rounded-2xl border border-orange-100/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col gap-4 relative card-lift">
                  {/* Quote decoration */}
                  <div className="absolute top-4 right-4 text-orange-200">
                    <Quote className="h-10 w-10" />
                  </div>

                  {/* Avatar and name */}
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-lg shadow-md ring-2 ring-orange-200">
                      {review.customer_name?.[0] || 'G'}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-800">{review.customer_name || 'Guest'}</div>
                      <div className="flex text-amber-400 mt-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={cn("w-4 h-4", i < review.rating ? "fill-current" : "text-gray-200")} />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Review text */}
                  <p className="text-gray-600 leading-relaxed line-clamp-4 italic">
                    "{review.comment}"
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Gallery Section */}
        {(shop.gallery_images?.length > 0 || shop.cover_image) && (
          <GallerySection images={shop.gallery_images} coverImage={shop.cover_image} />
        )}

        {/* About Us Section - Enhanced */}
        <section className="space-y-6 pb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                Visit Us
              </h2>
              <p className="text-gray-500 mt-1">We'd love to see you</p>
            </div>
          </div>

          <div className="relative">
            <div className="relative glass-card rounded-3xl p-8 border border-orange-100/50 shadow-lg overflow-hidden space-y-8">
              {/* Decorative background - inside the card to respect overflow */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-orange-200 to-red-200 rounded-full blur-3xl opacity-30 pointer-events-none"></div>
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full blur-3xl opacity-30 pointer-events-none"></div>
              {shop?.description && (
                <p className="text-gray-600 leading-relaxed text-lg max-w-2xl">
                  {shop.description}
                </p>
              )}

              <div className="grid gap-8 md:grid-cols-2">
                {/* Location */}
                <div className="space-y-3">
                  <h3 className="font-bold text-gray-900 flex items-center gap-3 text-lg">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-md">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    Location
                  </h3>
                  <p className="text-gray-600 pl-13 ml-13">
                    {shop?.address || 'Address not available'}
                  </p>
                </div>

                {/* Opening Hours */}
                <div className="space-y-3">
                  <h3 className="font-bold text-gray-900 flex items-center gap-3 text-lg">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-md">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    Opening Hours
                  </h3>
                  <div className="text-gray-600">
                    <div className="space-y-1.5">
                      {shop.opening_hours && typeof shop.opening_hours === 'object' ? (
                        Object.entries(shop.opening_hours).map(([day, hours]) => (
                          <div key={day} className="flex justify-between text-sm bg-white/50 rounded-lg px-3 py-1.5">
                            <span className="capitalize font-medium text-gray-700">{day}</span>
                            <span className="text-gray-600">{hours as string}</span>
                          </div>
                        ))
                      ) : (
                        <p>{typeof shop.opening_hours === 'string' ? shop.opening_hours : 'Hours not available'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div className="space-y-3">
                  <h3 className="font-bold text-gray-900 flex items-center gap-3 text-lg">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-md">
                      <Phone className="h-5 w-5 text-white" />
                    </div>
                    Contact
                  </h3>
                  <div className="space-y-2">
                    {shop?.contact_phone && (
                      <div className="flex items-center gap-3 text-gray-600 bg-white/50 rounded-lg px-3 py-2">
                        <Phone className="h-4 w-4 text-orange-500" />
                        <span>{shop.contact_phone}</span>
                      </div>
                    )}
                    {shop?.contact_email && (
                      <div className="flex items-center gap-3 text-gray-600 bg-white/50 rounded-lg px-3 py-2">
                        <Mail className="h-4 w-4 text-orange-500" />
                        <span>{shop.contact_email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Licenses */}
                {(shop?.gstin || shop?.fssai_license) && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-gray-900 flex items-center gap-3 text-lg">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-md">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      Licenses
                    </h3>
                    <div className="space-y-2 text-sm text-gray-500">
                      {shop?.gstin && (
                        <div className="bg-white/50 rounded-lg px-3 py-2">
                          <span className="font-medium text-gray-700">GSTIN:</span> {shop.gstin}
                        </div>
                      )}
                      {shop?.fssai_license && (
                        <div className="bg-white/50 rounded-lg px-3 py-2">
                          <span className="font-medium text-gray-700">FSSAI:</span> {shop.fssai_license}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Social Links */}
                {socialLinks && (socialLinks.instagram || socialLinks.facebook || socialLinks.website || socialLinks.youtube) && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-gray-900 flex items-center gap-3 text-lg">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-md">
                        <Globe className="h-5 w-5 text-white" />
                      </div>
                      Follow Us
                    </h3>
                    <div className="flex gap-3">
                      {socialLinks.instagram && (
                        <a
                          href={socialLinks.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-11 w-11 bg-[#E1306C] text-white rounded-full flex items-center justify-center hover:opacity-90 transition-opacity"
                          aria-label="Instagram"
                        >
                          <Instagram className="h-5 w-5" />
                        </a>
                      )}
                      {socialLinks.facebook && (
                        <a
                          href={socialLinks.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-11 w-11 bg-[#1877F2] text-white rounded-full flex items-center justify-center hover:opacity-90 transition-opacity"
                          aria-label="Facebook"
                        >
                          <Facebook className="h-5 w-5" />
                        </a>
                      )}
                      {socialLinks.youtube && (
                        <a
                          href={socialLinks.youtube}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-11 w-11 bg-[#FF0000] text-white rounded-full flex items-center justify-center hover:opacity-90 transition-opacity"
                          aria-label="YouTube"
                        >
                          <Youtube className="h-5 w-5" />
                        </a>
                      )}
                      {socialLinks.website && (
                        <a
                          href={socialLinks.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-11 w-11 bg-gray-700 text-white rounded-full flex items-center justify-center hover:opacity-90 transition-opacity"
                          aria-label="Website"
                        >
                          <Globe className="h-5 w-5" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <QuickActionsBar slug={slug} activePage="home" />
    </div>
  );
}

