import { getSettings } from "@/lib/api";
import { CartContent } from "@/components/features/cart/cart-content";

export const revalidate = 0; // Disable static caching

export default async function CartPage() {
    const settings = await getSettings();

    return <CartContent initialSettings={settings} />;
}
