import { getFullMenuData } from "@/lib/api";
import { MenuContent } from "@/components/features/menu/menu-content";

export const revalidate = 0; // Disable static caching for now

export default async function MenuPage() {
    const { categories, settings } = await getFullMenuData() || { categories: [], settings: null };

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

    return <MenuContent categories={categories} settings={settings} />;
}
