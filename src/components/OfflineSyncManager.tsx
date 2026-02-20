"use client";

import { useEffect, useState } from "react";
import { reportService } from "@/services/reportService";
import { Wifi, WifiOff, CheckCircle } from "lucide-react";

export default function OfflineSyncManager() {
    const [isOnline, setIsOnline] = useState(true);
    const [showSyncSuccess, setShowSyncSuccess] = useState(false);
    const [syncStats, setSyncStats] = useState({ reports: 0, submissions: 0 });

    useEffect(() => {
        // Initial check
        setIsOnline(navigator.onLine);

        const handleOnline = async () => {
            setIsOnline(true);
            console.log("Back online! Syncing...");

            // Trigger sync
            const stats = await reportService.syncPendingItems();

            if (stats.syncedReports > 0 || stats.syncedSubmissions > 0) {
                setSyncStats({ reports: stats.syncedReports, submissions: stats.syncedSubmissions });
                setShowSyncSuccess(true);

                // Hide success message after 3 seconds
                setTimeout(() => setShowSyncSuccess(false), 5000);
            }
        };

        const handleOffline = () => {
            setIsOnline(false);
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    if (showSyncSuccess) {
        return (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-bounce-in">
                <div className="bg-emerald-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
                    <CheckCircle className="h-6 w-6" />
                    <div>
                        <p className="font-bold text-sm">Upload Berhasil!</p>
                        <p className="text-xs text-emerald-100">
                            {syncStats.reports} laporan & {syncStats.submissions} submit tersinkronisasi.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (!isOnline) {
        return (
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100]">
                <div className="bg-zinc-800 text-zinc-400 px-4 py-2 rounded-full shadow-xl flex items-center gap-2 border border-zinc-700">
                    <WifiOff className="h-4 w-4" />
                    <span className="text-xs font-medium">Offline Mode</span>
                </div>
            </div>
        );
    }

    return null;
}
