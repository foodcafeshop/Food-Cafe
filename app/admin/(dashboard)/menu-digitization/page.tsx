"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Loader2, X, AlertCircle, Wand2, Timer, Lock } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useMenuDigitization } from "../../context/MenuDigitizationContext";

export default function MenuDigitizationPage() {
    const { isUploading, elapsedTime, downloadUrl, startUpload, resetUpload } = useMenuDigitization();
    const [files, setFiles] = useState<File[]>([]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles((prev) => [...prev, ...Array.from(e.target.files as FileList)]);
            // If previously finished, reset
            if (downloadUrl) resetUpload();
        }
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (files.length === 0) {
            toast.error("Please select at least one file.");
            return;
        }
        await startUpload(files);
    };

    // Format seconds to mm:ss
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">AI Menu Digitization</h1>
                <p className="text-muted-foreground">
                    Upload photos of your physical menu and let our AI automatically generate a structured CSV for import.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Upload Menu Photos</CardTitle>
                    <CardDescription>
                        Supported formats: JPEG, PNG, WEBP.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!process.env.NEXT_PUBLIC_GEMINI_API_KEY && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Missing API Key</AlertTitle>
                            <AlertDescription>
                                The <code>NEXT_PUBLIC_GEMINI_API_KEY</code> environment variable is not set. This feature requires a Gemini API Key to function.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Timer and Status Banner */}
                    {isUploading && (
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex flex-col items-center justify-center gap-3 animate-pulse">
                            <div className="flex items-center gap-2 text-primary font-semibold text-lg">
                                <Wand2 className="h-6 w-6 animate-bounce" />
                                <span>AI is processing your menu...</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                <Timer className="h-4 w-4" />
                                <span>Elapsed Time: <span className="font-mono font-medium text-foreground">{formatTime(elapsedTime)}</span></span>
                            </div>
                            <p className="text-xs text-muted-foreground text-center max-w-md">
                                This process uses advanced AI vision and may take <strong>up to 5 minutes</strong> depending on the number of images.
                                <br />You can navigate away; the process will continue in the background.
                            </p>
                        </div>
                    )}

                    {/* Upload Area - Hidden when uploading */}
                    {!isUploading && (
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <label
                                htmlFor="menu-photos"
                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-900 border-gray-300 dark:border-gray-700 relative"
                            >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        <span className="font-semibold">Click to upload</span> or drag and drop
                                    </p>
                                </div>
                                <input
                                    id="menu-photos"
                                    type="file"
                                    className="hidden"
                                    multiple
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </label>
                        </div>
                    )}

                    {files.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            {files.map((file, index) => (
                                <div key={index} className="relative group border rounded-md p-2 flex flex-col items-center gap-2">
                                    <div className="relative w-full aspect-square overflow-hidden rounded-md bg-muted">
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt={`Preview ${index}`}
                                            className="object-cover w-full h-full"
                                        />
                                    </div>
                                    <span className="text-xs truncate w-full text-center">{file.name}</span>

                                    {!isUploading && (
                                        <button
                                            onClick={() => removeFile(index)}
                                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-end pt-4">
                        {downloadUrl ? (
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={resetUpload}>
                                    Start Over
                                </Button>
                                <a href={downloadUrl} download="digitized_menu.zip">
                                    <Button className="gap-2" variant="default">
                                        <FileText className="h-4 w-4" /> Download ZIP
                                    </Button>
                                </a>
                            </div>
                        ) : (
                            <Button onClick={handleUpload} disabled={files.length === 0 || isUploading}>
                                {isUploading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    "Generate CSV"
                                )}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
