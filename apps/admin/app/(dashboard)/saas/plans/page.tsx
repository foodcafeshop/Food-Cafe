
import { supabaseAdmin } from '@/lib/supabase-admin';
import Link from 'next/link';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { deletePlan } from '@/app/actions';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ListToolbar } from '@/components/ListToolbar';

export const dynamic = 'force-dynamic';

export default async function PlansPage({ searchParams }: { searchParams: { q?: string, status?: string } }) {
    const query = searchParams.q || '';
    const status = searchParams?.status ?? 'all';

    let queryBuilder = supabaseAdmin.from('plans').select('*');

    if (query) {
        queryBuilder = queryBuilder.ilike('name', `%${query}%`);
    }

    if (status === 'active') {
        queryBuilder = queryBuilder.eq('is_active', true);
    } else if (status === 'inactive') {
        queryBuilder = queryBuilder.eq('is_active', false);
    }

    // queryBuilder = queryBuilder.order('price', { ascending: true });

    const { data: plans, error } = await queryBuilder;

    if (error) {
        return <div className="p-4 text-destructive">Error loading plans: {error.message}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Subscription Plans</h2>
                    <p className="text-muted-foreground">Manage pricing tiers and feature sets.</p>
                </div>
                <div className="flex gap-2">
                    <ListToolbar
                        placeholder="Search plans..."
                        statusOptions={[
                            { label: 'Active', value: 'active' },
                            { label: 'Inactive', value: 'inactive' }
                        ]}
                    />
                    <Button asChild className="bg-orange-600 hover:bg-orange-700 text-white">
                        <Link href="/saas/plans/new">
                            <Plus className="mr-2 h-4 w-4" /> New Plan
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {(!plans || plans.length === 0) && (
                    <div className="col-span-3 text-center py-12 text-muted-foreground">
                        No plans found matching your criteria.
                    </div>
                )}
                {plans?.map((plan) => (
                    <Card key={plan.id} className="flex flex-col justify-between">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle>{plan.name}</CardTitle>
                                <Badge variant={plan.is_active ? "default" : "secondary"} className={plan.is_active ? "bg-green-600 hover:bg-green-700" : ""}>
                                    {plan.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-2xl font-bold">
                                {plan.offer_price ? (
                                    <div className="flex items-baseline gap-2">
                                        <span>₹{plan.offer_price}</span>
                                        <span className="text-sm font-normal text-muted-foreground line-through decoration-destructive">₹{plan.price}</span>
                                        <span className="text-base font-normal text-muted-foreground">/{plan.interval}</span>
                                    </div>
                                ) : (
                                    <span>₹{plan.price}<span className="text-base font-normal text-muted-foreground">/{plan.interval}</span></span>
                                )}
                            </div>

                            {plan.description && (
                                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2" title={plan.description}>
                                    {plan.description}
                                </p>
                            )}

                            <div className="space-y-2 pt-2 border-t">
                                <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Features</p>
                                <ul className="space-y-1.5 text-sm">
                                    {plan.features?.slice(0, 8).map((f: string, i: number) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="text-primary mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                                            <span className="text-muted-foreground leading-tight">{f}</span>
                                        </li>
                                    ))}
                                    {plan.features && plan.features.length > 8 && (
                                        <li className="text-xs text-muted-foreground pl-4 pt-1">+{plan.features.length - 8} more features</li>
                                    )}
                                </ul>
                            </div>
                        </CardContent>
                        <CardFooter className="flex items-center justify-between pt-3 pb-3 mt-auto border-t bg-muted/20 px-4">
                            <div className="text-[10px] text-muted-foreground font-mono flex-1 min-w-0 truncate mr-2" title={plan.gateway_metadata?.razorpay?.plan_id || plan.id}>
                                {plan.gateway_metadata?.razorpay?.plan_id || 'ID: ' + plan.id}
                            </div>
                            <div className="flex gap-1 shrink-0">
                                <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                                    <Link href={`/saas/plans/${plan.id}`}>
                                        <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                                    </Link>
                                </Button>
                                <form action={async () => {
                                    'use server';
                                    await deletePlan(plan.id);
                                }}>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </form>
                            </div>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}
