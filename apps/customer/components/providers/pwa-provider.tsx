"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface PWAContextType {
    isInstallable: boolean;
    isStandalone: boolean;
    handleInstallClick: () => Promise<void>;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export function PWAProvider({ children }: { children: React.ReactNode }) {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            setIsInstallable(true);
            console.log("PWA install prompt captured");
        };

        window.addEventListener("beforeinstallprompt", handler);

        // Check if already installed
        if (window.matchMedia("(display-mode: standalone)").matches) {
            setIsInstallable(false);
            setIsStandalone(true);
        }

        window.matchMedia("(display-mode: standalone)").addEventListener("change", (evt) => {
            setIsStandalone(evt.matches);
        });

        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            console.log("No install prompt available");
            return;
        }

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setIsInstallable(false);
    };

    return (
        <PWAContext.Provider value={{ isInstallable, isStandalone, handleInstallClick }}>
            {children}
        </PWAContext.Provider>
    );
}

export function usePWA() {
    const context = useContext(PWAContext);
    if (!context) {
        // Return dummy implementation if used outside provider (e.g. server components during SSR if incorrectly called, though usePWA implies client)
        // Or better, just console warning and return default
        console.warn("usePWA must be used within a PWAProvider");
        return { isInstallable: false, isStandalone: false, handleInstallClick: async () => { } };
    }
    return context;
}
