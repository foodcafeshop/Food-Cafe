
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generateImpersonationLink, banShop } from '@/app/actions';
import { ExternalLink, Ban, CheckCircle, Search } from 'lucide-react';
import { redirect } from 'next/navigation';
import ShopActions from './shop-actions'; // Client component for buttons

export default async function ShopsPage({ searchParams }: { searchParams: { q?: string } }) {
    const query = searchParams.q || '';

    let dbQuery = supabaseAdmin
        .from('shops')
        .select('*')
        .order('created_at', { ascending: false });

    if (query) {
        dbQuery = dbQuery.ilike('name', `%${query}%`);
    }

    const { data: shops, error } = await dbQuery;

    if (error) {
        return <div className="text-red-500">Error loading shops: {error.message}</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Shops</h2>
                    <p className="text-slate-400">Manage all registered merchants.</p>
                </div>
                {/* Simple Search Form */}
                <form className="flex gap-2">
                    <input
                        name="q"
                        placeholder="Search shops..."
                        defaultValue={query}
                        className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                    />
                    <button type="submit" className="bg-slate-800 p-2 rounded hover:bg-slate-700">
                        <Search className="h-4 w-4" />
                    </button>
                </form>
            </div>

            <div className="rounded-md border border-slate-800">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-900 text-slate-400">
                        <tr>
                            <th className="p-4 font-medium">Name</th>
                            <th className="p-4 font-medium">Slug</th>
                            <th className="p-4 font-medium">Contact</th>
                            <th className="p-4 font-medium">Status</th>
                            <th className="p-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {shops?.map((shop) => (
                            <tr key={shop.id} className="hover:bg-slate-900/50">
                                <td className="p-4 font-medium text-white">{shop.name}</td>
                                <td className="p-4 text-slate-400">{shop.slug}</td>
                                <td className="p-4 text-slate-400">{shop.contact_email || '-'}</td>
                                <td className="p-4">
                                    <div className="flex gap-2">
                                        {shop.is_banned ? (
                                            <span className="inline-flex items-center rounded-full bg-red-400/10 px-2 py-1 text-xs font-medium text-red-500 ring-1 ring-inset ring-red-400/20">Banned</span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full bg-green-400/10 px-2 py-1 text-xs font-medium text-green-500 ring-1 ring-inset ring-green-400/20">Active</span>
                                        )}
                                        {!shop.is_live && !shop.is_banned && (
                                            <span className="inline-flex items-center rounded-full bg-yellow-400/10 px-2 py-1 text-xs font-medium text-yellow-500 ring-1 ring-inset ring-yellow-400/20">Draft</span>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <ShopActions
                                        shopId={shop.id}
                                        ownerId={shop.owner_id} // We pass owner ID mostly
                                        isBanned={shop.is_banned}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
