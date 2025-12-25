
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generateImpersonationLink, banShop } from '@/app/actions';
import { Search } from 'lucide-react';
import ShopActions from './shop-actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
        return <div className="text-destructive">Error loading shops: {error.message}</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Shops</h2>
                    <p className="text-muted-foreground">Manage all registered merchants.</p>
                </div>
                {/* Simple Search Form */}
                <form className="flex w-full max-w-sm gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            name="q"
                            placeholder="Search shops..."
                            defaultValue={query}
                            className="pl-9"
                        />
                    </div>
                    <Button type="submit" size="icon" variant="secondary">
                        <Search className="h-4 w-4" />
                        <span className="sr-only">Search</span>
                    </Button>
                </form>
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {shops?.map((shop) => (
                            <TableRow key={shop.id}>
                                <TableCell className="font-medium">{shop.name}</TableCell>
                                <TableCell className="text-muted-foreground">{shop.slug}</TableCell>
                                <TableCell className="text-muted-foreground">{shop.contact_email || '-'}</TableCell>
                                <TableCell>
                                    <div className="flex gap-2">
                                        {shop.is_banned ? (
                                            <Badge variant="destructive">Banned</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-green-600 border-green-600/20 bg-green-100/10 hover:bg-green-100/20">Active</Badge>
                                        )}
                                        {!shop.is_live && !shop.is_banned && (
                                            <Badge variant="secondary" className="text-yellow-600 bg-yellow-100/10 hover:bg-yellow-100/20">Draft</Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <ShopActions
                                        shopId={shop.id}
                                        ownerId={shop.owner_id}
                                        isBanned={shop.is_banned}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    )
}
