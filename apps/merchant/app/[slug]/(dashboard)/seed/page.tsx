"use client";

import { Button } from "@/components/ui/button";
import { seedData } from "@/lib/seed";
import { useState } from "react";
import { toast } from "sonner";

export default function SeedPage() {
    const [loading, setLoading] = useState(false);

    const handleSeed = async () => {
        setLoading(true);
        try {
            await seedData();
            toast.success("Data seeded successfully!");
        } catch (e: any) {
            console.error(e);
            toast.error("Failed to seed data: " + (e.message || "Unknown error"));
        }
        setLoading(false);
    };

    return (
        <div className="p-10 flex flex-col items-center justify-center gap-4">
            <h1 className="text-2xl font-bold">Development Tools</h1>
            <p className="text-muted-foreground">Click below to populate the database with dummy data.</p>
            <Button onClick={handleSeed} disabled={loading}>
                {loading ? "Seeding..." : "Seed Database"}
            </Button>
        </div>
    );
}
