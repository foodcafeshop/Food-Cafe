"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCartStore } from "@/lib/store";
import { ChefHat } from "lucide-react";

import { usePathname } from "next/navigation";

export function WelcomeDialog() {
    const pathname = usePathname();
    const { customerName, setCustomerName, setCustomerPhone } = useCartStore();
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");

    if (pathname?.startsWith('/admin')) return null;

    useEffect(() => {
        // Show dialog if no customer name is set
        // Small delay to avoid hydration mismatch and let store rehydrate
        const timer = setTimeout(() => {
            if (!customerName) {
                setIsOpen(true);
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [customerName]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            setCustomerName(name.trim());
            if (phone.trim()) {
                setCustomerPhone(phone.trim());
            }
            setIsOpen(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            // Prevent closing if name is not set (force capture)
            if (customerName) setIsOpen(open);
        }}>
            <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                <DialogHeader className="flex flex-col items-center text-center space-y-4">
                    <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center">
                        <ChefHat className="h-8 w-8 text-orange-600" />
                    </div>
                    <div>
                        <DialogTitle className="text-2xl font-bold">Welcome to Food Cafe!</DialogTitle>
                        <DialogDescription className="text-base mt-2">
                            Please enter your details to start ordering.
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Your Name <span className="text-red-500">*</span></Label>
                        <Input
                            id="name"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="h-11"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number (Optional)</Label>
                        <Input
                            id="phone"
                            placeholder="+91 98765 43210"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="h-11"
                            type="tel"
                        />
                    </div>
                    <Button type="submit" className="w-full h-11 text-base font-bold bg-orange-600 hover:bg-orange-700">
                        Start Ordering
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
