"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { reportService, Report } from "@/services/reportService";
import { cn } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";

export default function HistoryPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/");
            return;
        }

        if (user) {
            const loadData = async () => {
                setLoading(true);
                const data = await reportService.getReports();
                setReports(data);
                setLoading(false);
            };
            loadData();
        }
    }, [user, loading, router]);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-24">
            <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md px-4 py-4">
                <h1 className="text-lg font-bold text-white">Report History</h1>
            </header>

            <main className="p-4 space-y-4">
                {loading ? (
                    <div className="text-center py-8 text-zinc-500">Loading history...</div>
                ) : reports.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-zinc-500">No reports found.</p>
                    </div>
                ) : (
                    reports.map((report) => (
                        <div key={report.id} className="overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800">
                            <div className="relative h-48 w-full">
                                <img src={report.photoUrls?.[0] || (report as any).photoUrl} alt="" className="h-full w-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                                    <div>
                                        <p className="font-bold text-white text-lg">{report.categoryName}</p>
                                        <p className="text-sm text-zinc-300">{new Date(report.timestamp).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className={cn("px-2 py-1 rounded text-xs font-medium uppercase",
                                        report.status === 'good' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                                    )}>
                                        Status: {report.status}
                                    </span>
                                </div>
                                {report.note && (
                                    <p className="text-sm text-zinc-400 border-t border-zinc-800 pt-2 mt-2">
                                        "{report.note}"
                                    </p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </main>
            <BottomNav />
        </div>
    );
}
