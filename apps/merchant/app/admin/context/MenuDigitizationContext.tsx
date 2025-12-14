"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { toast } from "sonner";

interface MenuDigitizationContextType {
    isUploading: boolean;
    startTime: number | null;
    elapsedTime: number; // in seconds
    downloadUrl: string | null;
    startUpload: (files: File[]) => Promise<void>;
    resetUpload: () => void;
}

const MenuDigitizationContext = createContext<MenuDigitizationContextType | undefined>(undefined);

export function MenuDigitizationProvider({ children }: { children: React.ReactNode }) {
    const [isUploading, setIsUploading] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize state from localStorage on mount (for persistence across refresh)
    useEffect(() => {
        const storedStart = localStorage.getItem("menu_digitization_start");
        const storedUrl = localStorage.getItem("menu_digitization_url");

        if (storedUrl) {
            setDownloadUrl(storedUrl);
        }

        if (storedStart) {
            const start = parseInt(storedStart, 10);
            if (!isNaN(start)) {
                setStartTime(start);
                setIsUploading(true);
            }
        }
    }, []);

    // Timer Logic
    useEffect(() => {
        if (isUploading && startTime) {
            timerRef.current = setInterval(() => {
                const now = Date.now();
                setElapsedTime(Math.floor((now - startTime) / 1000));
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isUploading, startTime]);

    const startUpload = async (files: File[]) => {
        if (files.length === 0) return;

        const start = Date.now();
        setIsUploading(true);
        setStartTime(start);
        setDownloadUrl(null);
        setElapsedTime(0);

        // Persist start time
        localStorage.setItem("menu_digitization_start", start.toString());
        localStorage.removeItem("menu_digitization_url");

        const formData = new FormData();
        files.forEach((file) => {
            formData.append("files", file);
        });

        try {
            // Note: We use fetch here, but if the user navigates away, 
            // the component context remains mounted as it's in the layout.
            const response = await fetch("/api/digitize-menu", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to digitize menu");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            setDownloadUrl(url);
            localStorage.setItem("menu_digitization_url", url); // We can't persist blob URL across sessions easily, but within same session it works. 
            // Actually, Blob URLs are revoked on page unload usually. 
            // For true persistence across RELOAD, we'd need to store the blob in IndexedDB or re-download.
            // For now, simpler approach: we rely on memory for navigation persistence. 
            // LocalStorage here is just for state recovery logic if we implemented advanced blob storage.

            toast.success("Menu digitized successfully!");
        } catch (error: any) {
            console.error("Upload error:", error);
            toast.error(error.message || "Something went wrong.");
        } finally {
            setIsUploading(false);
            setStartTime(null);
            localStorage.removeItem("menu_digitization_start");
        }
    };

    const resetUpload = () => {
        setDownloadUrl(null);
        setIsUploading(false);
        setStartTime(null);
        setElapsedTime(0);
        localStorage.removeItem("menu_digitization_start");
        localStorage.removeItem("menu_digitization_url");
    };

    return (
        <MenuDigitizationContext.Provider value={{ isUploading, startTime, elapsedTime, downloadUrl, startUpload, resetUpload }}>
            {children}
        </MenuDigitizationContext.Provider>
    );
}

export function useMenuDigitization() {
    const context = useContext(MenuDigitizationContext);
    if (context === undefined) {
        throw new Error("useMenuDigitization must be used within a MenuDigitizationProvider");
    }
    return context;
}
