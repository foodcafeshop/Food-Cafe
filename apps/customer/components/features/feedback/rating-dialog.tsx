"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { submitReview, getReviewByBill } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/store";

interface RatingDialogProps {
    isOpen: boolean;
    onClose: () => void;
    billId: string;
    shopId: string;
    items: any[];
}

export function RatingDialog({ isOpen, onClose, billId, shopId, items }: RatingDialogProps) {
    const [step, setStep] = useState<'general' | 'items'>('general');
    const [generalRating, setGeneralRating] = useState(0);
    const [generalComment, setGeneralComment] = useState("");
    const [itemRatings, setItemRatings] = useState<Record<string, number>>({});
    const [submitting, setSubmitting] = useState(false);
    const [loadingExisting, setLoadingExisting] = useState(false);
    const { customerName, customerId } = useCartStore();

    useEffect(() => {
        if (isOpen && billId && customerId) {
            loadExistingReview();
        }
    }, [isOpen, billId, customerId]);

    const loadExistingReview = async () => {
        setLoadingExisting(true);
        const existingReview = await getReviewByBill(billId, customerId!);
        if (existingReview) {
            setGeneralRating(existingReview.rating);
            setGeneralComment(existingReview.comment || "");

            if (existingReview.review_items) {
                const ratingsMap: Record<string, number> = {};
                existingReview.review_items.forEach((item: any) => {
                    ratingsMap[item.menu_item_id] = item.rating;
                });
                setItemRatings(ratingsMap);
            }
        }
        setLoadingExisting(false);
    };

    const handleStarClick = (rating: number, itemId?: string) => {
        if (itemId) {
            setItemRatings(prev => ({ ...prev, [itemId]: rating }));
        } else {
            setGeneralRating(rating);
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const itemsPayload = Object.entries(itemRatings)
                .filter(([_, rating]) => rating > 0)
                .map(([itemId, rating]) => ({
                    menu_item_id: itemId,
                    rating: rating
                }));

            await submitReview({
                shop_id: shopId,
                bill_id: billId,
                customer_id: customerId || null,
                rating: generalRating,
                comment: generalComment,
                customer_name: customerName || 'Guest Customer',
                items: itemsPayload
            });

            toast.success("Thank you for your feedback!");
            onClose();
        } catch (error) {
            console.error("Error submitting review:", error);
            toast.error("Failed to submit review. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                {loadingExisting ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>Rate your Experience</DialogTitle>
                            <DialogDescription>
                                {step === 'general' ? "How was your overall experience?" : "Rate the items you ordered"}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-4">
                            {step === 'general' ? (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => handleStarClick(star)}
                                                className="focus:outline-none transition-transform hover:scale-110"
                                            >
                                                <Star
                                                    className={cn(
                                                        "w-10 h-10",
                                                        star <= generalRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                                    )}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <Textarea
                                        placeholder="Any comments? (Optional)"
                                        value={generalComment}
                                        onChange={(e) => setGeneralComment(e.target.value)}
                                        className="w-full mt-2"
                                    />
                                </div>
                            ) : (
                                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                                    {items.map((item) => (
                                        <div key={item.menu_item_id} className="flex items-center justify-between border-b pb-3 last:border-0">
                                            <div className="font-medium text-sm w-1/3 truncate">{item.name}</div>
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        onClick={() => handleStarClick(star, item.menu_item_id)}
                                                        className="focus:outline-none"
                                                    >
                                                        <Star
                                                            className={cn(
                                                                "w-6 h-6",
                                                                star <= (itemRatings[item.menu_item_id] || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                                            )}
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <DialogFooter className="flex-col sm:flex-row gap-2">
                            {step === 'general' ? (
                                <Button onClick={() => setStep('items')} className="w-full">Next: Rate Items</Button>
                            ) : (
                                <div className="flex gap-2 w-full">
                                    <Button variant="outline" onClick={() => setStep('general')} className="flex-1">Back</Button>
                                    <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
                                        {submitting ? "Submitting..." : "Submit Feedback"}
                                    </Button>
                                </div>
                            )}
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
