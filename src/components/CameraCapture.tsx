"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, RefreshCw, X, Check, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface CameraCaptureProps {
    onCapture: (imageData: string) => void;
    onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
    const [flash, setFlash] = useState(false); // Note: Flash API is limited in web
    const [error, setError] = useState<string>("");

    const startCamera = useCallback(async () => {
        try {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            const constraints = {
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
            };

            const newStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(newStream);

            if (videoRef.current) {
                videoRef.current.srcObject = newStream;
            }
            setError("");
        } catch (err) {
            console.error("Camera Error:", err);
            setError("Unable to access camera. Please ensure permissions are granted.");
        }
    }, [facingMode]);

    useEffect(() => {
        startCamera();
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [startCamera]);

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            // Resize to max 800px width for Base64 storage optimization
            const MAX_WIDTH = 800;
            const scale = Math.min(1, MAX_WIDTH / video.videoWidth);

            canvas.width = video.videoWidth * scale;
            canvas.height = video.videoHeight * scale;

            const context = canvas.getContext("2d");
            if (context) {
                // Find existing scaling or mirroring if needed
                if (facingMode === "user") {
                    context.translate(canvas.width, 0);
                    context.scale(-1, 1);
                }

                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                // Add timestamp overlay (scaled font size)
                context.setTransform(1, 0, 0, 1, 0, 0); // Reset transform for text
                const fontSize = Math.floor(16 * scale);
                context.font = `${fontSize}px sans-serif`;

                const timeStr = new Date().toLocaleString();
                const textWidth = context.measureText(timeStr).width + 20;

                context.fillStyle = "rgba(0, 0, 0, 0.5)";
                // Adjust overlay position based on new height
                context.fillRect(10, canvas.height - (40 * scale), textWidth, 30 * scale);

                context.fillStyle = "white";
                context.fillText(timeStr, 20, canvas.height - (20 * scale));

                // Lower quality to 0.6 for smaller string size
                const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
                onCapture(dataUrl);
            }
        }
    };

    const switchCamera = () => {
        setFacingMode(prev => prev === "user" ? "environment" : "user");
    };

    return (
        <div className="fixed inset-0 h-[100dvh] z-50 flex flex-col bg-black">
            {/* Top Bar */}
            <div className="flex items-center justify-between bg-black/50 p-4 absolute top-0 w-full z-10">
                <button onClick={onClose} className="rounded-full bg-white/10 p-2 text-white backdrop-blur-md">
                    <X className="h-6 w-6" />
                </button>
                <div className="flex gap-4">
                    {/* Flash toggling is tricky in web, often not supported, keeping UI for now or could implement torch constraints if needed */}
                    <button onClick={() => setFlash(!flash)} className={cn("rounded-full p-2 backdrop-blur-md", flash ? "bg-yellow-500/80 text-white" : "bg-white/10 text-white")}>
                        <Zap className="h-6 w-6" />
                    </button>
                </div>
            </div>

            {/* Camera Viewport */}
            <div className="flex-1 relative bg-zinc-900 flex items-center justify-center overflow-hidden">
                {error ? (
                    <div className="text-center p-6 bg-red-500/10 text-red-500 rounded-xl mx-4">
                        <p>{error}</p>
                        <button onClick={startCamera} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg">Retry</button>
                    </div>
                ) : (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={cn(
                            "h-full w-full object-cover",
                            facingMode === "user" && "-scale-x-100"
                        )}
                    />
                )}
                <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Controls */}
            <div className="bg-black/80 pb-8 pt-4 px-6 flex items-center justify-between">
                <div className="w-12"></div> {/* Spacer */}

                <button
                    onClick={takePhoto}
                    className="h-20 w-20 rounded-full border-4 border-white bg-white/20 flex items-center justify-center active:scale-95 transition-all"
                >
                    <div className="h-16 w-16 rounded-full bg-white"></div>
                </button>

                <button onClick={switchCamera} className="rounded-full bg-white/10 p-3 text-white">
                    <RefreshCw className="h-6 w-6" />
                </button>
            </div>
        </div>
    );
}
