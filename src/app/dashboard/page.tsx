"use client";

import { useAuth } from "@/context/AuthContext";
import { Plus, CheckCircle, Clock, AlertTriangle, LogOut, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { reportService, Report } from "@/services/reportService";
import BottomNav from "@/components/BottomNav";

const REQUIRED_CATEGORIES = [
    { id: "penyaluran", title: "Area Penyaluran" },
    { id: "tangki", title: "Area Tangki" },
    { id: "jetty", title: "Area Jetty" },
    { id: "sarfas", title: "Kondisi Sarfas" },
    { id: "office", title: "Kondisi Office" },
    { id: "hse", title: "HSE" },
];

export default function DashboardPage() {
    const { user, logout, loading: authLoading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState({ total: 0, good: 0, issues: 0 });
    const [todayReports, setTodayReports] = useState<Report[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submittedToday, setSubmittedToday] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/");
        } else if (!authLoading && user?.role === 'admin') {
            router.push("/admin");
        } else if (!authLoading && user?.role === 'manager') {
            router.push("/manager");
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!user) return;

        const loadData = async () => {
            setDataLoading(true);
            const [s, reports, submissions] = await Promise.all([
                reportService.getStats(),
                reportService.getTodayReports(user?.branchId || "branch-001"),
                reportService.getSubmissions()
            ]);

            setStats(s);
            setTodayReports(reports);

            // Check if already submitted today
            const todayString = new Date().toLocaleDateString();
            const isSubmitted = submissions.some(sub =>
                sub.branchId === (user?.branchId || "branch-001") &&
                sub.date === todayString &&
                sub.userId === user?.uid
            );
            setSubmittedToday(isSubmitted);

            setDataLoading(false);
        };

        if (user) loadData();
    }, [router, user]);

    const handleFinalSubmit = async () => {
        if (!user) return;
        setSubmitting(true);
        await reportService.submitDailyReport(user, todayReports);
        setSubmittedToday(true);
        setSubmitting(false);
        alert("Laporan hari ini berhasil dikirim ke Manager!");
    };

    if (authLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-500">
                <p>Loading...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-500">
                <p>Redirecting to login...</p>
            </div>
        );
    }

    // Calculate progress
    const completedCategoryIds = new Set(todayReports.map(r => r.category));
    const isAllCompleted = REQUIRED_CATEGORIES.every(cat => completedCategoryIds.has(cat.id));
    const progressPercent = Math.round((completedCategoryIds.size / REQUIRED_CATEGORIES.length) * 100);

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-24">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                    <div>
                        <h1 className="text-lg font-bold text-white">Branch Dashboard</h1>
                        <p className="text-xs text-zinc-400">Welcome, {user.email}</p>
                        <p className="text-[10px] text-amber-500 font-mono">Role: {user.role} | Branch: {user.branchId}</p>
                    </div>
                    <button
                        onClick={() => logout()}
                        className="rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                    >
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

                {/* Status Card */}
                <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900/50 to-purple-900/50 p-6 shadow-xl ring-1 ring-white/10">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <p className="text-indigo-200 text-sm">Daily Progress</p>
                            <h2 className="text-3xl font-bold text-white">{progressPercent}%</h2>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-white">{completedCategoryIds.size}/{REQUIRED_CATEGORIES.length}</p>
                            <p className="text-xs text-indigo-300">Categories</p>
                        </div>
                    </div>

                    <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-500 transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>


                {isAllCompleted && !submittedToday && (
                    <div className="mb-8">
                        <button
                            onClick={async () => {
                                if (!user) return;
                                setSubmitting(true);
                                try {
                                    let location = undefined;
                                    if ("geolocation" in navigator) {
                                        try {
                                            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                                                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
                                            });
                                            location = {
                                                lat: position.coords.latitude,
                                                lng: position.coords.longitude
                                            };
                                        } catch (e) {
                                            console.warn("Location permission denied or timeout");
                                            alert("Warning: Location could not be retrieved. Submitting without location.");
                                        }
                                    }

                                    // Deadline Check
                                    const currentHour = new Date().getHours();
                                    const isLate = currentHour >= 10;

                                    if (isLate) {
                                        const proceed = confirm("It is past 10:00 AM local time. This report will be marked as LATE. Do you want to proceed?");
                                        if (!proceed) {
                                            setSubmitting(false);
                                            return;
                                        }
                                    }

                                    await reportService.submitDailyReport(user, todayReports, location, isLate);
                                    setSubmittedToday(true);
                                    alert(isLate ? "Daily report submitted successfully (LATE)." : "Daily report submitted successfully!");
                                } catch (error) {
                                    console.error("Submission failed:", error);
                                    alert("Failed to submit report. Please try again.");
                                } finally {
                                    setSubmitting(false);
                                }
                            }}
                            disabled={submitting}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 active:scale-95 transition-all animate-pulse"
                        >
                            {submitting ? "Sending..." : (
                                <>
                                    <Send className="h-6 w-6" />
                                    Submit Daily Report
                                </>
                            )}
                        </button>
                        <p className="text-center text-xs text-zinc-500 mt-2">Click to send final report to Manager</p>
                    </div>
                )}

                {submittedToday && (
                    <div className="mb-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center">
                        <div className="flex justify-center mb-2">
                            <CheckCircle className="h-8 w-8 text-emerald-500" />
                        </div>
                        <h3 className="text-emerald-500 font-bold">Good Job!</h3>
                        <p className="text-sm text-emerald-400/80">Daily report has been submitted to manager.</p>
                    </div>
                )}

                {/* Action Button (Disable if submitted) */}
                {!submittedToday && (
                    <div className="mb-8">
                        <button
                            onClick={() => router.push("/report/new")}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-4 text-lg font-bold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 active:scale-95 transition-all"
                        >
                            <Plus className="h-6 w-6" />
                            New Report
                        </button>
                    </div>
                )}

                {/* Required List */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Required Reports</h3>

                    {REQUIRED_CATEGORIES.map((cat, i) => {
                        const isDone = completedCategoryIds.has(cat.id);
                        // Find specific report time if done
                        const report = todayReports.find(r => r.category === cat.id);

                        return (
                            <div key={i} className={cn(
                                "flex items-center justify-between rounded-xl p-5 ring-1 ring-white/5 transition-all active:scale-[0.99]",
                                isDone ? "bg-zinc-900/30" : "bg-zinc-900/80"
                            )}>
                                <div className="flex items-center gap-4">
                                    <div className={cn("h-12 w-12 flex items-center justify-center rounded-lg",
                                        isDone ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-800 text-zinc-500"
                                    )}>
                                        {isDone ? <CheckCircle className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                                    </div>
                                    <div>
                                        <p className={cn("font-medium", isDone ? "text-zinc-400" : "text-white")}>{cat.title}</p>
                                        <p className="text-xs text-zinc-500">
                                            {isDone ? `Submitted at ${new Date(report!.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : "Pending"}
                                        </p>
                                        {/* Photos Preview */}
                                        {isDone && (report as any).photoUrls && (
                                            <div className="flex gap-2 mt-2">
                                                {(report as any).photoUrls.map((url: string, idx: number) => (
                                                    <img
                                                        key={idx}
                                                        src={url}
                                                        alt="Evidence"
                                                        className="h-12 w-12 rounded-lg object-cover ring-1 ring-white/10"
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className={cn("rounded-full px-3 py-1 text-xs font-medium self-start",
                                    isDone ? "bg-emerald-500/10 text-emerald-500" : "bg-yellow-500/10 text-yellow-500"
                                )}>
                                    {isDone ? "Done" : "Pending"}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>
            <BottomNav />
        </div>
    );
}
