"use client";

import { useEffect, useState } from "react";
import { getReviews } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useShopId } from "@/lib/hooks/use-shop-id";

export default function ReviewsPage() {
    const { shopId } = useShopId();
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (shopId) {
            loadReviews();
        }
    }, [shopId]);

    const loadReviews = async () => {
        if (!shopId) return;
        setLoading(true);
        const data = await getReviews(shopId);
        setReviews(data || []);
        setLoading(false);
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">Customer Reviews</h1>

            {loading ? (
                <div className="text-center py-10 text-muted-foreground">Loading reviews...</div>
            ) : reviews.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">No reviews yet.</div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {reviews.map((review) => (
                        <Card key={review.id} className="overflow-hidden">
                            <CardHeader className="bg-muted/30 pb-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback>{review.customer_name?.[0] || 'C'}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-semibold text-sm">{review.customer_name || 'Anonymous'}</div>
                                            <div className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-bold border border-yellow-200">
                                        <Star className="w-3 h-3 fill-yellow-700 mr-1" />
                                        {review.rating}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-3">
                                {review.comment && (
                                    <p className="text-sm text-gray-600 italic mb-3">"{review.comment}"</p>
                                )}

                                {review.review_items && review.review_items.length > 0 && (
                                    <div className="space-y-2 mt-2">
                                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rated Items</div>
                                        {review.review_items.map((item: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between text-sm bg-muted/20 p-2 rounded-md">
                                                <div className="flex items-center gap-2">
                                                    {item.menu_items?.images?.[0] && (
                                                        <img src={item.menu_items.images[0]} alt={item.menu_items.name} className="w-8 h-8 rounded-md object-cover" />
                                                    )}
                                                    <span className="font-medium">{item.menu_items?.name}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                                    <span className="font-bold text-xs">{item.rating}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {!review.comment && (!review.review_items || review.review_items.length === 0) && (
                                    <p className="text-sm text-muted-foreground italic">No detailed feedback provided.</p>
                                )}
                                <div className="text-xs text-muted-foreground pt-2">
                                    Bill #{review.bills?.bill_number || review.bill_id?.slice(0, 8)}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
