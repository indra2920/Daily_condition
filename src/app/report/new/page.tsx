"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Check, ChevronRight, X, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import CameraCapture from "@/components/CameraCapture";
import { reportService } from "@/services/reportService";
import { imageService } from "@/services/imageService";
import { useAuth } from "@/context/AuthContext";

const CATEGORIES = [
    { id: "penyaluran", name: "Area Penyaluran", icon: "⛽" },
    { id: "tangki", name: "Area Tangki", icon: "🛢️" },
    { id: "jetty", name: "Area Jetty", icon: "⚓" },
    { id: "sarfas", name: "Kondisi Sarfas", icon: "🏢" },
    { id: "office", name: "Kondisi Office", icon: "🖥️" },
    { id: "hse", name: "HSE", icon: "⛑️" },
];

export default function NewReportPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Category, 2: Camera, 3: Review
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [photos, setPhotos] = useState<{ url: string; description: string }[]>([]);
    const [note, setNote] = useState("");
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Step 1: Select Category
    const handleCategorySelect = (id: string) => {
        setSelectedCategory(id);
        setStep(2);
        setIsCameraOpen(true);
    };

    // Step 2: Capture Photo
    const handleCapture = (imageData: string) => {
        setPhotos(prev => [...prev, { url: imageData, description: "" }]);
        setIsCameraOpen(false);
        setStep(3); // Go to review after each photo
    };

    const removePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const updatePhotoDescription = (index: number, desc: string) => {
        setPhotos(prev => prev.map((p, i) => i === index ? { ...p, description: desc } : p));
    };

    // Step 3: Review & Submit
    const handleSubmit = async () => {
        if (!user || photos.length < 3) return;

        setSubmitting(true);

        try {
            // 1. Upload Photos to Firebase Storage
            const uploadPromises = photos.map(async (photo, index) => {
                const timestamp = Date.now();
                const imagePath = `reports/${user.branchId}/${user.uid}/${timestamp}_${index}.jpg`;
                const uploadedUrl = await imageService.uploadImage(photo.url, imagePath);
                return { url: uploadedUrl, description: photo.description };
            });

            const uploadedPhotos = await Promise.all(uploadPromises);

            // 2. Create Report in Firestore
            await reportService.createReport({
                userId: user.uid,
                userName: user.email || "Unknown User",
                branchId: user.branchId,
                category: selectedCategory,
                categoryName: CATEGORIES.find(c => c.id === selectedCategory)?.name || "Unknown",
                photoUrls: uploadedPhotos.map(p => p.url), // For backward compatibility
                photos: uploadedPhotos, // New structure with descriptions
                note: note,
                status: 'good'
            });

            setSubmitting(false);
            router.push("/dashboard");
        } catch (error) {
            console.error("Failed to submit report:", error);
            alert("Failed to submit report. Please try again.");
            setSubmitting(false);
        }
    };

    if (isCameraOpen) {
        return <CameraCapture onCapture={handleCapture} onClose={() => setIsCameraOpen(false)} />;
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950 px-4 py-4 flex items-center gap-4">
                <button
                    onClick={() => {
                        if (step === 3 && photos.length > 0) {
                            if (confirm("Discard report?")) router.back();
                        } else if (step > 1) {
                            setStep(prev => (prev - 1) as any);
                        } else {
                            router.back();
                        }
                    }}
                    className="p-2 -ml-2 text-zinc-400 hover:text-white"
                >
                    <ArrowLeft className="h-6 w-6" />
                </button>
                <h1 className="text-lg font-bold">
                    {step === 1 && "Select Category"}
                    {step === 2 && "Take Photo"}
                    {step === 3 && "Review Report"}
                </h1>
            </header>

            <main className="flex-1 p-4">
                {step === 1 && (
                    <div className="grid gap-4">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => handleCategorySelect(cat.id)}
                                className="flex items-center justify-between rounded-xl bg-zinc-900/50 p-6 ring-1 ring-white/10 hover:bg-zinc-800 active:bg-zinc-800 transition-all text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <span className="text-2xl">{cat.icon}</span>
                                    <span className="font-medium">{cat.name}</span>
                                </div>
                                <ChevronRight className="h-5 w-5 text-zinc-500" />
                            </button>
                        ))}
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6">
                        {/* Photo Gallery Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {photos.map((p, i) => (
                                <div key={i} className="relative rounded-xl overflow-hidden bg-zinc-900 ring-1 ring-white/10 group">
                                    <div className="aspect-square relative">
                                        <img src={p.url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => removePhoto(i)}
                                            className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full text-white backdrop-blur-sm opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="h-4 w-4 text-red-400" />
                                        </button>
                                        <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-white backdrop-blur-sm">
                                            #{i + 1}
                                        </div>
                                    </div>
                                    <div className="p-2">
                                        <input
                                            type="text"
                                            value={p.description}
                                            onChange={(e) => updatePhotoDescription(i, e.target.value)}
                                            placeholder="Add description..."
                                            className="w-full bg-zinc-950/50 border border-zinc-800 rounded px-2 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                                        />
                                    </div>
                                </div>
                            ))}

                            {/* Add Photo Button */}
                            {photos.length < 5 && (
                                <button
                                    onClick={() => setIsCameraOpen(true)}
                                    className="aspect-square rounded-xl border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center gap-2 text-zinc-500 hover:text-white hover:border-zinc-600 hover:bg-zinc-900 transition-all"
                                >
                                    <Camera className="h-8 w-8" />
                                    <span className="text-xs font-medium">Add Photo</span>
                                </button>
                            )}
                        </div>

                        {/* Validation Message */}
                        <div className={cn(
                            "text-sm text-center py-2 px-4 rounded-lg",
                            photos.length < 3 ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"
                        )}>
                            {photos.length < 3
                                ? `Please take at least 3 photos (Current: ${photos.length})`
                                : `Photos ready: ${photos.length}/5`
                            }
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400">Selected Category</label>
                            <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200">
                                {CATEGORIES.find(c => c.id === selectedCategory)?.name}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400">Notes (Optional)</label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="w-full rounded-lg bg-zinc-900 border-zinc-800 p-3 text-white focus:ring-indigo-500 focus:border-indigo-500 h-32 resize-none"
                                placeholder="Describe the condition..."
                            />
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={submitting || photos.length < 3}
                            className={cn(
                                "w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all",
                                (submitting || photos.length < 3)
                                    ? "bg-zinc-800 cursor-not-allowed text-zinc-500"
                                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20"
                            )}
                        >
                            {submitting ? "Submitting..." : (
                                <>
                                    <Check className="h-5 w-5" />
                                    Submit Report ({photos.length} Photos)
                                </>
                            )}
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
