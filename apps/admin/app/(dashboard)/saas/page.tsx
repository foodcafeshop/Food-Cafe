
import { supabaseAdmin } from '@/lib/supabase-admin';
import Link from 'next/link';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { deletePlan, deleteCoupon } from '@/app/actions';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function SaasPage() {
    const [plansResult, couponsResult] = await Promise.all([
        supabaseAdmin.from('plans').select('*'),
        supabaseAdmin.from('coupons').select('*')
    ]);

    const plans = plansResult.data;
    const coupons = couponsResult.data;

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">SaaS Operations</h2>
                <p className="text-slate-400">Manage subscription plans and discounts.</p>
            </div>

            {/* Plans Section */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Subscription Plans</h3>
                    <div className="flex gap-2">
                        {/* 
                          To make this functional, you need to create the /new pages.
                          For now, I'll add the button.
                        */}
                        <Link href="/saas/plans/new" className="flex items-center gap-2 bg-orange-600 px-3 py-2 rounded text-sm font-medium hover:bg-orange-700">
                            <Plus className="h-4 w-4" /> New Plan
                        </Link>
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    {(!plans || plans.length === 0) && (
                        <div className="col-span-3 text-center py-12 text-slate-500">
                            No plans found.
                        </div>
                    )}
                    {plans?.map((plan) => (
                        <div key={plan.id} className="rounded-lg border border-slate-800 bg-slate-900 p-6 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start">
                                    <h4 className="text-lg font-bold">{plan.name}</h4>
                                    {plan.is_active ? <span className="text-green-500 text-xs bg-green-900/20 px-2 py-1 rounded-full">Active</span> : <span className="text-slate-500 text-xs bg-slate-800 px-2 py-1 rounded-full">Inactive</span>}
                                </div>
                                <div className="text-2xl font-bold mt-2">
                                    {plan.offer_price ? (
                                        <div className="flex items-baseline gap-2">
                                            <span>₹{plan.offer_price}</span>
                                            <span className="text-sm font-normal text-slate-500 line-through">₹{plan.price}</span>
                                            <span className="text-sm font-normal text-slate-400">/{plan.interval}</span>
                                        </div>
                                    ) : (
                                        <span>₹{plan.price}<span className="text-sm font-normal text-slate-400">/{plan.interval}</span></span>
                                    )}
                                </div>
                                {plan.description && <p className="text-sm text-slate-400 mt-2">{plan.description}</p>}
                                <ul className="mt-4 space-y-2 text-sm text-slate-400">
                                    {plan.features?.slice(0, 3).map((f: string, i: number) => (
                                        <li key={i}>• {f}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end gap-2">
                                <Link href={`/saas/plans/${plan.id}`} className="text-blue-500 hover:text-blue-400 p-2"><Pencil className="h-4 w-4" /></Link>
                                <form action={async () => {
                                    'use server';
                                    await deletePlan(plan.id);
                                }}>
                                    <button className="text-red-500 hover:text-red-400 p-2"><Trash2 className="h-4 w-4" /></button>
                                </form>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Coupons Section */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Platform Coupons</h3>
                    <Link href="/saas/coupons/new" className="flex items-center gap-2 bg-blue-600 px-3 py-2 rounded text-sm font-medium hover:bg-blue-700">
                        <Plus className="h-4 w-4" /> New Coupon
                    </Link>
                </div>
                <div className="rounded-md border border-slate-800 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-900 text-slate-400">
                            <tr>
                                <th className="p-4 font-medium">Code</th>
                                <th className="p-4 font-medium">Discount</th>
                                <th className="p-4 font-medium">Usage</th>
                                <th className="p-4 font-medium">Validity</th>
                                <th className="p-4 font-medium text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {(!coupons || coupons.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">
                                        No platform coupons found.
                                    </td>
                                </tr>
                            )}
                            {coupons?.map((coupon: any) => {
                                const isExpired = coupon.valid_until && new Date(coupon.valid_until) < new Date();
                                return (
                                    <tr key={coupon.id} className="hover:bg-slate-900/50">
                                        <td className="p-4">
                                            <div className="font-mono text-white font-bold">{coupon.code}</div>
                                            {isExpired && <span className="text-xs text-red-500 bg-red-900/20 px-1 rounded">Expired</span>}
                                        </td>
                                        <td className="p-4 text-slate-400">
                                            {coupon.discount_type === 'percentage' ? `${coupon.discount_amount}%` : `₹${coupon.discount_amount}`} Off
                                        </td>
                                        <td className="p-4 text-slate-400">
                                            {coupon.current_uses} / {coupon.max_uses || '∞'}
                                        </td>
                                        <td className="p-4 text-slate-400 text-sm">
                                            {coupon.valid_until ? format(new Date(coupon.valid_until), 'PP p') : 'No Expiry'}
                                        </td>
                                        <td className="p-4 text-right flex justify-end gap-2">
                                            <Link href={`/saas/coupons/${coupon.id}`} className="text-blue-500 hover:text-blue-400 p-2"><Pencil className="h-4 w-4" /></Link>
                                            <form action={async () => {
                                                'use server';
                                                await deleteCoupon(coupon.id);
                                            }}>
                                                <button className="text-red-500 hover:text-red-400 p-2"><Trash2 className="h-4 w-4" /></button>
                                            </form>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
