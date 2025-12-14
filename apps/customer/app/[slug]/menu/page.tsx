import { getFullMenuData } from "@/lib/api";
import { MenuContent } from "@/components/features/menu/menu-content";

export const revalidate = 0; // Disable static caching for now

export default async function MenuPage({ params }: { params: { slug: string } }) {
    const { slug } = params;
    const data = await getFullMenuData(slug);

    if (!data || !data.shop) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">Shop Not Found</h1>
                </div>
            </div>
        );
    }

    const { categories, settings, shop } = data;

    if (!shop.is_live) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">{shop.name}</h1>
                    <p className="text-muted-foreground">Coming Soon</p>
                </div>
            </div>
        );
    }

    if (!categories || categories.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">No Active Menu</h1>
                    <p className="text-muted-foreground">Please ask the staff to activate a menu.</p>
                </div>
            </div>
        );
    }

    return <MenuContent categories={categories} settings={settings} shop={shop} />;
}
