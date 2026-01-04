"use client";

import { useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface QRScannerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function QRScannerDialog({ open, onOpenChange }: QRScannerDialogProps) {
    const router = useRouter();

    const handleScan = (url: string) => {
        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname;

            // Strict Validation:
            // 1. Must match "foodcafeshop.in" (or subdomains like "www.foodcafeshop.in")
            // 2. OR match localhost/127.0.0.1 for development testing
            const isValidDomain =
                hostname.endsWith("foodcafeshop.in") ||
                hostname === "localhost" ||
                hostname === "127.0.0.1" ||
                hostname === window.location.hostname;

            if (isValidDomain) {
                toast.success("Table found! Redirecting...");
                // Internal navigation using Next.js router for speed and SPA feel
                router.push(urlObj.pathname + urlObj.search);
            } else {
                toast.error("Invalid QR Code: Must be a Food Cafe URL");
                console.warn("Blocked external QR:", url);
            }
        } catch (e) {
            toast.error("Invalid QR Code content");
        }
    };

    useEffect(() => {
        let html5QrCode: Html5Qrcode | null = null;

        if (open) {
            // Small delay to ensure DOM is ready
            const timer = setTimeout(async () => {
                if (!document.getElementById("reader")) return;

                try {
                    html5QrCode = new Html5Qrcode("reader");
                    await html5QrCode.start(
                        { facingMode: "environment" }, // Prefer back camera
                        {
                            fps: 10,
                            qrbox: { width: 250, height: 250 },
                            aspectRatio: 1.0,
                        },
                        (decodedText) => {
                            // Success callback
                            console.log("Scanned:", decodedText);
                            handleScan(decodedText);
                            // Stop scanning immediately after success
                            html5QrCode?.stop().then(() => {
                                html5QrCode?.clear();
                                onOpenChange(false);
                            }).catch(err => console.error("Failed to stop scanner", err));
                        },
                        (errorMessage) => {
                            // parse error, ignore it.
                        }
                    );
                } catch (err) {
                    console.error("Error starting scanner", err);
                    toast.error("Could not start camera. Please check permissions.");
                }
            }, 300); // 300ms delay for dialog animation to finish

            return () => {
                clearTimeout(timer);
                if (html5QrCode && html5QrCode.isScanning) {
                    html5QrCode.stop().then(() => {
                        html5QrCode?.clear();
                    }).catch(err => console.error("Failed to stop/clear scanner", err));
                }
            };
        }
    }, [open, onOpenChange]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Scan Table QR</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center p-4">
                    <div id="reader" className="w-full max-w-[300px] overflow-hidden rounded-xl border border-zinc-200 h-[300px] bg-zinc-100 relative">
                        {/* Placeholder/Loader while camera loads */}
                        <div className="absolute inset-0 flex items-center justify-center text-zinc-400 text-sm">
                            Starting Camera...
                        </div>
                    </div>
                    <p className="text-sm text-zinc-500 mt-4 text-center">
                        Point your camera at the QR code on your table to view the menu.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
