"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingBag, Utensils, Bike } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface NewOrderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tables: { id: string; label: string; status: string }[];
    shopSlug: string;
    trigger?: React.ReactNode;
    onOrderConfirmed?: (type: "dine_in" | "takeaway" | "delivery", tableId?: string) => void;
}

export function NewOrderDialog({ open, onOpenChange, tables, shopSlug, onOrderConfirmed }: NewOrderDialogProps) {
    const router = useRouter();
    const [orderType, setOrderType] = useState<"dine_in" | "takeaway" | "delivery">("takeaway");
    const [selectedTableId, setSelectedTableId] = useState<string>("");

    const handleConfirm = () => {
        if (orderType === 'dine_in' && !selectedTableId) {
            toast.error("Please select a table");
            return;
        }

        if (onOrderConfirmed) {
            onOrderConfirmed(orderType, selectedTableId);
            onOpenChange(false);
            // Optionally update URL for history but don't rely on it for navigation if callback exists
            if (orderType === 'dine_in') {
                const table = tables.find(t => t.id === selectedTableId);
                const hash = table ? `#${table.label}` : '';
                window.history.pushState(null, '', `/${shopSlug}/take-order${hash}`);
            } else {
                window.history.pushState(null, '', `/${shopSlug}/take-order#${orderType}`);
            }
            return;
        }

        if (orderType === 'dine_in') {
            const table = tables.find(t => t.id === selectedTableId);
            if (table) {
                router.push(`/${shopSlug}/take-order#${table.label}`);
            } else {
                router.push(`/${shopSlug}/take-order`);
            }
        } else {
            // For Takeaway/Delivery, push hash
            router.push(`/${shopSlug}/take-order#${orderType}`);
        }
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Start New Order</DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="flex flex-col gap-2">
                        <Label>Order Type</Label>
                        <div className="grid grid-cols-3 gap-2">
                            <div
                                className={cn("flex flex-col items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors", orderType === 'dine_in' && "border-primary bg-primary/5")}
                                onClick={() => setOrderType('dine_in')}
                            >
                                <Utensils className="h-6 w-6" />
                                <span className="text-sm font-medium">Dine In</span>
                            </div>
                            <div
                                className={cn("flex flex-col items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors", orderType === 'takeaway' && "border-primary bg-primary/5")}
                                onClick={() => setOrderType('takeaway')}
                            >
                                <ShoppingBag className="h-6 w-6" />
                                <span className="text-sm font-medium">Takeaway</span>
                            </div>
                            <div
                                className={cn("flex flex-col items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors", orderType === 'delivery' && "border-primary bg-primary/5")}
                                onClick={() => setOrderType('delivery')}
                            >
                                <Bike className="h-6 w-6" />
                                <span className="text-sm font-medium">Delivery</span>
                            </div>
                        </div>
                    </div>

                    {orderType === 'dine_in' && (
                        <div className="flex flex-col gap-2">
                            <Label>Select Table</Label>
                            <Select value={selectedTableId} onValueChange={setSelectedTableId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a table..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {tables.filter(t => t.status === 'empty' || t.status === 'occupied').map(t => (
                                        <SelectItem key={t.id} value={t.id}>
                                            {t.label} ({t.status})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {(orderType === 'takeaway' || orderType === 'delivery') && (
                        <div className="p-3 text-sm text-blue-800 bg-blue-50 border border-blue-200 rounded-md">
                            <span className="font-semibold">Note:</span> Proceed to take order items internally.
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleConfirm}>
                        Take Order
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
