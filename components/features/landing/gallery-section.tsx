"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GallerySectionProps {
    images: string[] | undefined;
    coverImage: string | null;
}

export function GallerySection({ images, coverImage }: GallerySectionProps) {
    const [showAll, setShowAll] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

    // Initial limit
    const LIMIT = 8;

    // Determine which images to show
    const allImages = images && images.length > 0 ? images : (coverImage ? [coverImage] : []);
    const displayedImages = showAll ? allImages : allImages.slice(0, LIMIT);
    const hasMore = allImages.length > LIMIT;

    const handleNext = () => {
        if (selectedImageIndex === null) return;
        setSelectedImageIndex((prev) => (prev === null ? null : (prev + 1) % allImages.length));
    };

    const handlePrev = () => {
        if (selectedImageIndex === null) return;
        setSelectedImageIndex((prev) => (prev === null ? null : (prev - 1 + allImages.length) % allImages.length));
    };

    if (allImages.length === 0) return null;

    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h2 className="text-2xl font-extrabold tracking-tight text-gray-800">Our Ambiance</h2>
                {hasMore && !showAll && (
                    <Button
                        variant="ghost"
                        onClick={() => setShowAll(true)}
                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    >
                        See More ({allImages.length - LIMIT})
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {displayedImages.map((img, i) => (
                    <div
                        key={i}
                        className="relative aspect-square rounded-xl overflow-hidden shadow-sm group cursor-pointer"
                        onClick={() => setSelectedImageIndex(i)}
                    >
                        <img
                            src={img}
                            alt={`Gallery ${i}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <Maximize2 className="text-white w-6 h-6 drop-shadow-md" />
                        </div>
                    </div>
                ))}
            </div>

            {hasMore && !showAll && (
                <div className="flex justify-center pt-4">
                    <Button
                        variant="outline"
                        onClick={() => setShowAll(true)}
                        className="rounded-full px-8"
                    >
                        View All Photos
                    </Button>
                </div>
            )}

            {/* Lightbox Dialog */}
            <Dialog open={selectedImageIndex !== null} onOpenChange={(open) => !open && setSelectedImageIndex(null)}>
                <DialogContent className="max-w-4xl w-full p-0 bg-transparent border-none shadow-none h-[80vh] flex flex-col items-center justify-center z-[100]" aria-describedby={undefined}>
                    {/* Accessibility Title */}
                    <DialogTitle className="sr-only">Image Gallery Preview</DialogTitle>

                    <div className="relative w-full h-full flex items-center justify-center">
                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedImageIndex(null)}
                            className="absolute -top-10 right-0 md:-right-10 text-white hover:text-gray-300 p-2 z-[110] bg-black/50 rounded-full"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {/* Prev Button */}
                        {allImages.length > 1 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                                className="absolute left-0 md:-left-12 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors z-[110]"
                            >
                                <ChevronLeft className="w-8 h-8" />
                            </button>
                        )}

                        {/* Image */}
                        {selectedImageIndex !== null && (
                            <div className="relative w-full h-full flex items-center justify-center">
                                <img
                                    src={allImages[selectedImageIndex]}
                                    alt={`Gallery Full ${selectedImageIndex}`}
                                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                                />
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                                    {selectedImageIndex + 1} / {allImages.length}
                                </div>
                            </div>
                        )}

                        {/* Next Button */}
                        {allImages.length > 1 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                                className="absolute right-0 md:-right-12 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors z-[110]"
                            >
                                <ChevronRight className="w-8 h-8" />
                            </button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </section>
    );
}
