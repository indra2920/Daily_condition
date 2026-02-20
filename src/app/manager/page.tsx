"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { reportService, DailySubmission } from "@/services/reportService";
import { LogOut, Calendar, MapPin, ChevronRight, CheckCircle, Clock, AlertTriangle, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import UserMonitoring from "@/components/UserMonitoring";

export default function ManagerDashboard() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [dailySubmissions, setDailySubmissions] = useState<DailySubmission[]>([]);
    const [recentSubmissions, setRecentSubmissions] = useState<DailySubmission[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/");
                return;
            }
            if (user.role !== 'manager') {
                alert("Access denied. Manager only.");
                router.push("/dashboard");
                return;
            }
        }

        if (loading) return;

        const loadData = async () => {
            setLoading(true);
            try {
                const today = new Date().toLocaleDateString();

                // Parallel fetch
                const [daily, recent, branchesSnap] = await Promise.all([
                    reportService.getDailySubmissions(today),
                    reportService.getSubmissions(20), // Fetch only last 20 for feed
                    getDocs(collection(db, "branches"))
                ]);

                const branchesData = branchesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                setDailySubmissions(daily);
                setRecentSubmissions(recent);
                setBranches(branchesData);
            } catch (error) {
                console.error("Error loading data:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [router]);

    // Calculate today's status
    // Calculate today's status
    const today = new Date().toLocaleDateString();
    const submittedBranchIds = new Set(dailySubmissions.map(s => s.branchId));

    const branchStatusList = branches.map(branch => {
        const isSubmitted = submittedBranchIds.has(branch.name); // utilizing branch.name as ID based on current registration flow
        // Find submission if exists
        // Find submission if exists
        const submission = dailySubmissions.find(s => s.branchId === branch.name);
        return {
            ...branch,
            isSubmitted,
            submission
        };
    });

    const pendingCount = branches.length - submittedBranchIds.size;

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100">
            <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
                    <div>
                        <h1 className="text-lg font-bold text-white">Manager Dashboard</h1>
                        <p className="text-xs text-zinc-400">Monitoring {branches.length} Branches</p>
                    </div>
                    <button onClick={() => logout()} className="rounded-full p-2 text-zinc-400 hover:text-white">
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-4 space-y-8">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
                        <p className="text-zinc-400 text-sm">Submitted Today</p>
                        <p className="text-2xl font-bold text-emerald-500 mt-1">{submittedBranchIds.size} <span className="text-sm text-zinc-500 font-normal">/ {branches.length}</span></p>
                    </div>
                    <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
                        <p className="text-zinc-400 text-sm">Pending</p>
                        <p className={`text-2xl font-bold mt-1 ${pendingCount > 0 ? 'text-amber-500' : 'text-zinc-500'}`}>{pendingCount}</p>
                    </div>
                </div>

                {/* Branch Status List */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-indigo-400" />
                        Branch Status ({today})
                    </h2>

                    {loading ? (
                        <div className="text-center py-8 text-zinc-500">Loading data...</div>
                    ) : (
                        <div className="grid gap-3">
                            {branchStatusList.map((item) => (
                                <div key={item.id} className={cn(
                                    "flex items-center justify-between p-4 rounded-xl border transition-all",
                                    item.isSubmitted
                                        ? "bg-zinc-900/50 border-zinc-800"
                                        : "bg-red-950/10 border-red-900/20"
                                )}>
                                    <div className="flex items-center gap-4">
                                        <div className={cn("h-10 w-10 rounded-full flex items-center justify-center",
                                            item.isSubmitted ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                                        )}>
                                            {item.isSubmitted ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <p className={cn("font-medium", item.isSubmitted ? "text-white" : "text-red-200")}>{item.name}</p>
                                            <p className="text-xs text-zinc-500">
                                                {item.isSubmitted
                                                    ? `Reported by ${item.submission?.userName}`
                                                    : "Not submitted yet"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {item.isSubmitted ? (
                                            <div className="flex flex-col items-end gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-medium bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded">Submitted</span>
                                                    {item.submission?.isLate && (
                                                        <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded">LATE</span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-zinc-500">
                                                    {new Date(item.submission!.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {item.submission?.location && (
                                                    <a
                                                        href={`https://www.google.com/maps?q=${item.submission.location.lat},${item.submission.location.lng}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[10px] flex items-center gap-1 text-indigo-400 hover:text-indigo-300 hover:underline"
                                                    >
                                                        <MapPin className="h-3 w-3" />
                                                        View Map
                                                    </a>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-xs font-medium bg-red-500/10 text-red-500 px-2 py-0.5 rounded">Pending</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {branches.length === 0 && (
                                <p className="text-center text-zinc-500 py-4">No branches found. Please add branches in Admin Dashboard.</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Charts */}
                <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
                    <h2 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wider">Submission Time Distribution</h2>
                    <div className="h-64 flex items-end justify-between gap-1 px-4 pb-2 border-b border-zinc-700">
                        {/* Simple Bar Chart Visualization using CSS */}
                        {Array.from({ length: 24 }).map((_, hour) => {
                            const count = dailySubmissions.filter(s => {
                                const h = new Date(s.submittedAt).getHours();
                                return h === hour;
                            }).length;
                            const height = count > 0 ? `${(count / branches.length) * 100}%` : '4px';

                            return (
                                <div key={hour} className="flex-1 flex flex-col justify-end group relative">
                                    <div
                                        className={cn("w-full rounded-t bg-indigo-500/50 hover:bg-indigo-400 transition-all", count === 0 && "bg-zinc-800")}
                                        style={{ height }}
                                    ></div>
                                    <span className="text-[10px] text-zinc-600 text-center mt-1 group-hover:text-white">{hour}</span>
                                    {count > 0 && (
                                        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                                            {count} submissions
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-zinc-500">
                        <span>00:00</span>
                        <span>12:00</span>
                        <span>23:59</span>
                    </div>
                </div>

                {/* Recent Submissions Feed (Optional/Secondary) */}
                {recentSubmissions.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-zinc-800">
                        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Latest Activity Feed</h2>
                        {recentSubmissions.map((sub) => (
                            <div key={sub.id} className="bg-zinc-900 rounded-lg p-3 flex items-center justify-between border border-zinc-800">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded bg-zinc-800 flex items-center justify-center text-zinc-500">
                                        <Calendar className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{sub.branchId}</p>
                                        <p className="text-xs text-zinc-500">{new Date(sub.submittedAt).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex -space-x-2">
                                    {sub.reports.slice(0, 3).map((r, i) => (
                                        <img key={i} src={r.photoUrls?.[0] || (r as any).photoUrl} className="h-8 w-8 rounded-full border-2 border-zinc-900 object-cover" />
                                    ))}
                                    {sub.reports.length > 3 && (
                                        <div className="h-8 w-8 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-[10px] text-white">
                                            +{sub.reports.length - 3}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Live Monitoring Section */}
                <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
                    <UserMonitoring />
                </div>
            </main>
        </div>
    );
}
