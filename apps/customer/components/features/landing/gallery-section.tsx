"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    // Initial limit
    const LIMIT = 8;

    // Determine which images to show
    const allImages = images && images.length > 0 ? images : (coverImage ? [coverImage] : []);
    const displayedImages = showAll ? allImages : allImages.slice(0, LIMIT);
    const hasMore = allImages.length > LIMIT;

    const handleNext = useCallback(() => {
        if (selectedImageIndex === null) return;
        setSelectedImageIndex((prev) => (prev === null ? null : (prev + 1) % allImages.length));
    }, [selectedImageIndex, allImages.length]);

    const handlePrev = useCallback(() => {
        if (selectedImageIndex === null) return;
        setSelectedImageIndex((prev) => (prev === null ? null : (prev - 1 + allImages.length) % allImages.length));
    }, [selectedImageIndex, allImages.length]);

    const handleClose = useCallback(() => {
        setSelectedImageIndex(null);
    }, []);

    // Keyboard navigation
    useEffect(() => {
        if (selectedImageIndex === null) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowRight':
                    e.preventDefault();
                    handleNext();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    handlePrev();
                    break;
                case 'Escape':
                    e.preventDefault();
                    handleClose();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedImageIndex, handleNext, handlePrev, handleClose]);

    // Focus management - focus close button when dialog opens
    useEffect(() => {
        if (selectedImageIndex !== null && closeButtonRef.current) {
            closeButtonRef.current.focus();
        }
    }, [selectedImageIndex]);

    // Touch swipe detection - minimum swipe distance
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            handleNext();
        } else if (isRightSwipe) {
            handlePrev();
        }

        setTouchStart(null);
        setTouchEnd(null);
    };

    if (allImages.length === 0) return null;

    return (
        <section className="space-y-6" aria-labelledby="gallery-heading">
            <div className="flex items-center justify-between">
                <div>
                    <h2 id="gallery-heading" className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                        Our Ambiance
                    </h2>
                    <p className="text-gray-500 mt-1">A glimpse into our space</p>
                </div>
                {hasMore && !showAll && (
                    <Button
                        variant="ghost"
                        onClick={() => setShowAll(true)}
                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 font-semibold"
                        aria-label={`Show ${allImages.length - LIMIT} more photos`}
                    >
                        See More ({allImages.length - LIMIT})
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4" role="list" aria-label="Gallery images">
                {displayedImages.map((img, i) => (
                    <div
                        key={i}
                        role="listitem"
                        className={cn(
                            "relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 group cursor-pointer card-lift focus-within:ring-2 focus-within:ring-orange-500 focus-within:ring-offset-2",
                            i === 0 && displayedImages.length > 4 ? "md:col-span-2 md:row-span-2 rounded-2xl" : "aspect-square rounded-xl"
                        )}
                    >
                        <button
                            onClick={() => setSelectedImageIndex(i)}
                            className="w-full h-full focus:outline-none"
                            aria-label={`View image ${i + 1} of ${displayedImages.length} in fullscreen`}
                        >
                            <img
                                src={img}
                                alt={`Restaurant ambiance photo ${i + 1}`}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                loading="lazy"
                            />
                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            {/* Icon */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="bg-white/40 p-3 rounded-full">
                                    <Maximize2 className="text-white w-6 h-6 drop-shadow-lg" aria-hidden="true" />
                                </div>
                            </div>
                            {/* Decorative border on hover */}
                            <div className="absolute inset-0 border-4 border-transparent group-hover:border-orange-400/50 rounded-xl md:rounded-2xl transition-colors duration-300"></div>
                        </button>
                    </div>
                ))}
            </div>

            {hasMore && !showAll && (
                <div className="flex justify-center pt-4">
                    <Button
                        variant="outline"
                        onClick={() => setShowAll(true)}
                        className="rounded-full px-8 h-12 border-2 border-orange-200 hover:border-orange-400 hover:bg-orange-50 font-semibold transition-all duration-300 hover:scale-105"
                        aria-label={`View all ${allImages.length} photos`}
                    >
                        View All Photos
                    </Button>
                </div>
            )}

            {/* Lightbox Dialog */}
            <Dialog open={selectedImageIndex !== null} onOpenChange={(open) => !open && handleClose()}>
                <DialogContent
                    className="max-w-4xl w-full p-0 bg-transparent border-none shadow-none h-[80vh] flex flex-col items-center justify-center z-[100]"
                    aria-describedby="lightbox-description"
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >
                    {/* Accessibility Title */}
                    <DialogTitle className="sr-only">Image Gallery Preview</DialogTitle>
                    <p id="lightbox-description" className="sr-only">
                        Use left and right arrow keys to navigate. Press Escape to close. Swipe left or right on touch devices.
                    </p>

                    <div className="relative w-full h-full flex items-center justify-center">
                        {/* Close Button */}
                        <button
                            ref={closeButtonRef}
                            onClick={handleClose}
                            className="absolute -top-10 right-0 md:-right-10 text-white hover:text-gray-300 p-3 z-[110] bg-black/50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
                            aria-label="Close image preview"
                        >
                            <X className="w-6 h-6" aria-hidden="true" />
                        </button>

                        {/* Prev Button */}
                        {allImages.length > 1 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                                className="absolute left-2 md:-left-12 p-3 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors z-[110] focus:outline-none focus:ring-2 focus:ring-white min-w-[44px] min-h-[44px] flex items-center justify-center"
                                aria-label="Previous image"
                            >
                                <ChevronLeft className="w-8 h-8" aria-hidden="true" />
                            </button>
                        )}

                        {/* Image */}
                        {selectedImageIndex !== null && (
                            <div className="relative w-full h-full flex items-center justify-center px-12 md:px-0">
                                <img
                                    src={allImages[selectedImageIndex]}
                                    alt={`Gallery photo ${selectedImageIndex + 1} of ${allImages.length}`}
                                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                                />
                                <div
                                    className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm"
                                    aria-live="polite"
                                    aria-atomic="true"
                                >
                                    {selectedImageIndex + 1} / {allImages.length}
                                </div>
                            </div>
                        )}

                        {/* Next Button */}
                        {allImages.length > 1 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                                className="absolute right-2 md:-right-12 p-3 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors z-[110] focus:outline-none focus:ring-2 focus:ring-white min-w-[44px] min-h-[44px] flex items-center justify-center"
                                aria-label="Next image"
                            >
                                <ChevronRight className="w-8 h-8" aria-hidden="true" />
                            </button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </section>
    );
}

