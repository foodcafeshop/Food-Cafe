"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { submitReview } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/store";

interface RatingDialogProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
    shopId: string;
    items: any[];
}

export function RatingDialog({ isOpen, onClose, orderId, shopId, items }: RatingDialogProps) {
    const [step, setStep] = useState<'general' | 'items'>('general');
    const [generalRating, setGeneralRating] = useState(0);
    const [generalComment, setGeneralComment] = useState("");
    const [itemRatings, setItemRatings] = useState<Record<string, number>>({});
    const [submitting, setSubmitting] = useState(false);
    const { customerName, customerId } = useCartStore();

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
            // 1. Submit General Review
            if (generalRating > 0) {
                await submitReview({
                    shop_id: shopId,
                    order_id: orderId,
                    rating: generalRating,
                    comment: generalComment,
                    customer_name: customerName || 'Guest Customer',
                    customer_id: customerId || null
                });
            }

            // 2. Submit Item Reviews
            const itemPromises = Object.entries(itemRatings).map(([itemId, rating]) => {
                if (rating > 0) {
                    return submitReview({
                        shop_id: shopId,
                        order_id: orderId,
                        menu_item_id: itemId,
                        rating: rating,
                        customer_name: customerName || 'Guest Customer',
                        customer_id: customerId || null
                    });
                }
            });

            await Promise.all(itemPromises);

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
            </DialogContent>
        </Dialog>
    );
}
