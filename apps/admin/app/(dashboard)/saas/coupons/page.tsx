
import { supabaseAdmin } from '@/lib/supabase-admin';
import Link from 'next/link';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { deleteCoupon } from '@/app/actions';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ListToolbar } from '@/components/ListToolbar';

export const dynamic = 'force-dynamic';

export default async function CouponsPage({ searchParams }: { searchParams: { q?: string, status?: string } }) {
    const query = searchParams.q || '';
    const status = searchParams.status || 'all';

    let dbQuery = supabaseAdmin
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

    if (query) {
        dbQuery = dbQuery.ilike('code', `%${query}%`);
    }

    // Client-side filtering for expiry date might be easier if we don't have a status column, 
    // but we can query `valid_until`. `status` param logic:
    // 'active' -> valid_until > now OR valid_until is null
    // 'expired' -> valid_until < now

    // Supabase filtering for this is a bit tricky with OR, so we might fetch and filter or define logic.
    // For simplicity, let's fetch and filter in JS if list is small, or try to use db filter.
    // Given the scale likely isn't huge yet, JS filter is safer for logic correctness right now.

    const { data: allCoupons } = await dbQuery;

    const coupons = allCoupons?.filter(coupon => {
        if (status === 'all') return true;
        const isExpired = coupon.valid_until && new Date(coupon.valid_until) < new Date();
        if (status === 'active') return !isExpired;
        if (status === 'expired') return isExpired;
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Platform Coupons</h2>
                    <p className="text-muted-foreground">Manage discount codes and promotions.</p>
                </div>
                <div className="flex gap-2">
                    <ListToolbar
                        placeholder="Search codes..."
                        statusOptions={[
                            { label: 'Active', value: 'active' },
                            { label: 'Expired', value: 'expired' }
                        ]}
                    />
                    <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Link href="/saas/coupons/new">
                            <Plus className="mr-2 h-4 w-4" /> New Coupon
                        </Link>
                    </Button>
                </div>
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Discount</TableHead>
                            <TableHead>Usage</TableHead>
                            <TableHead>Validity</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(!coupons || coupons.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No coupons found matching your criteria.
                                </TableCell>
                            </TableRow>
                        )}
                        {coupons?.map((coupon: any) => {
                            const isExpired = coupon.valid_until && new Date(coupon.valid_until) < new Date();
                            return (
                                <TableRow key={coupon.id}>
                                    <TableCell>
                                        <div className="font-mono font-bold flex items-center gap-2">
                                            {coupon.code}
                                            {isExpired && <Badge variant="destructive" className="text-[10px] h-5 px-1 py-0">Expired</Badge>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {coupon.discount_type === 'percentage' ? `${coupon.discount_amount}%` : `₹${coupon.discount_amount}`} Off
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {coupon.current_uses} / {coupon.max_uses || '∞'}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {coupon.valid_until ? format(new Date(coupon.valid_until), 'PP p') : 'No Expiry'}
                                    </TableCell>
                                    <TableCell className="text-right flex justify-end gap-2">
                                        <Button asChild variant="ghost" size="icon">
                                            <Link href={`/saas/coupons/${coupon.id}`}>
                                                <Pencil className="h-4 w-4 text-primary" />
                                            </Link>
                                        </Button>
                                        <form action={async () => {
                                            'use server';
                                            await deleteCoupon(coupon.id);
                                        }}>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </form>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </Card>
        </div>
    )
}
