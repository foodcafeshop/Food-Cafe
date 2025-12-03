import { getSettings, getShopDetails } from "@/lib/api";
import { CartContent } from "@/components/features/cart/cart-content";
import { notFound } from "next/navigation";

export const revalidate = 0; // Disable static caching

export default async function CartPage({ params }: { params: { slug: string } }) {
    const { slug } = params;
    const shop = await getShopDetails(slug);

    if (!shop) return notFound();

    const settings = await getSettings(shop.id);

    return <CartContent initialSettings={settings} shopId={shop.id} shop={shop} />;
}
