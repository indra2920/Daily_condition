import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    Timestamp,
    orderBy,
    limit
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { offlineDB } from "@/lib/offline-db";

export interface Report {
    id: string;
    userId: string;
    userName: string;
    branchId: string;
    category: string;
    categoryName: string;
    photoUrls: string[]; // Changed from single photoUrl
    note: string;
    timestamp: string;
    status: 'good' | 'bad' | 'needs_review';
    syncStatus?: 'synced' | 'pending'; // New field for offline status
}

export interface DailySubmission {
    id: string;
    branchId: string;
    userId: string;
    userName: string;
    date: string; // YYYY-MM-DD
    reports: Report[];
    submittedAt: string;
    location?: { lat: number; lng: number };
    isLate: boolean;
    status: 'submitted';
}

const REPORTS_COL = "reports";
const SUBMISSIONS_COL = "submissions";

export const reportService = {
    getReports: async (): Promise<Report[]> => {
        try {
            // Get all reports, ordered by timestamp desc
            const q = query(collection(db, REPORTS_COL), orderBy("timestamp", "desc"));
            const querySnapshot = await getDocs(q);

            const reports: Report[] = [];
            querySnapshot.forEach((doc) => {
                reports.push({ id: doc.id, ...doc.data() } as Report);
            });
            return reports;
        } catch (error) {
            console.error("Error fetching reports:", error);
            return [];
        }
    },

    createReport: async (report: Omit<Report, 'id' | 'timestamp'>): Promise<Report> => {
        const newReportData = {
            ...report,
            timestamp: new Date().toISOString(),
            syncStatus: 'synced' as const
        };

        try {
            if (!navigator.onLine) throw new Error("Offline");

            const docRef = await addDoc(collection(db, REPORTS_COL), newReportData);
            return { id: docRef.id, ...newReportData } as Report;
        } catch (error) {
            console.warn("Network error or offline, saving to local DB:", error);
            // Offline fallback
            const offlineId = `offline_${Date.now()}`;
            const offlineReport = { ...newReportData, id: offlineId, syncStatus: 'pending' as const };
            await offlineDB.addReport(offlineReport);
            return offlineReport as Report;
        }
    },

    // Check if a specific category is done for today (for a branch)
    getTodayReports: async (branchId: string): Promise<Report[]> => {
        const today = new Date().toDateString();
        const reports: Report[] = [];

        // 1. Fetch from Firestore (if online)
        if (navigator.onLine) {
            try {
                const q = query(collection(db, REPORTS_COL), where("branchId", "==", branchId), orderBy("timestamp", "desc"));
                const querySnapshot = await getDocs(q);

                querySnapshot.forEach((doc) => {
                    const data = doc.data() as Omit<Report, 'id'>;
                    const isToday = new Date(data.timestamp).toDateString() === today;

                    if (isToday) {
                        reports.push({ id: doc.id, ...data, syncStatus: 'synced' });
                    }
                });
            } catch (error) {
                console.error("Error fetching online reports:", error);
            }
        }

        // 2. Fetch from Offline DB
        try {
            const offlineReports = await offlineDB.getReports();
            const relevantOfflineReports = offlineReports.filter((r: any) =>
                r.branchId === branchId &&
                new Date(r.timestamp).toDateString() === today
            );
            reports.push(...relevantOfflineReports);
        } catch (error) {
            console.error("Error fetching offline reports:", error);
        }

        // Sort combined reports by timestamp desc
        return reports.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },

    submitDailyReport: async (user: any, reports: Report[], location?: { lat: number; lng: number }, isLate: boolean = false) => {
        const submission: Omit<DailySubmission, 'id'> = {
            branchId: user.branchId || "branch-001",
            userId: user.uid,
            userName: user.email,
            date: new Date().toLocaleDateString(),
            reports: reports,
            submittedAt: new Date().toISOString(),
            location: location,
            isLate: isLate,
            status: 'submitted'
        };

        try {
            if (!navigator.onLine) throw new Error("Offline");

            const docRef = await addDoc(collection(db, SUBMISSIONS_COL), submission);
            return { id: docRef.id, ...submission };
        } catch (error) {
            console.warn("Network error, saving submission offline:", error);
            const offlineId = `offline_sub_${Date.now()}`;
            const offlineSubmission = { ...submission, id: offlineId };
            await offlineDB.addSubmission(offlineSubmission);
            return offlineSubmission;
        }
    },

    getSubmissions: async (limitCount: number = 100): Promise<DailySubmission[]> => {
        try {
            // Only for manager, fetch all
            const q = query(
                collection(db, SUBMISSIONS_COL),
                orderBy("submittedAt", "desc"),
                limit(limitCount)
            );
            const querySnapshot = await getDocs(q);

            const submissions: DailySubmission[] = [];
            querySnapshot.forEach((doc) => {
                submissions.push({ id: doc.id, ...doc.data() } as DailySubmission);
            });
            return submissions;
        } catch (error) {
            console.error("Error fetching submissions:", error);
            return [];
        }
    },

    getDailySubmissions: async (dateStr: string): Promise<DailySubmission[]> => {
        try {
            const q = query(collection(db, SUBMISSIONS_COL), where("date", "==", dateStr));
            const querySnapshot = await getDocs(q);

            const submissions: DailySubmission[] = [];
            querySnapshot.forEach((doc) => {
                submissions.push({ id: doc.id, ...doc.data() } as DailySubmission);
            });
            return submissions;
        } catch (error) {
            console.error("Error fetching daily submissions:", error);
            return [];
        }
    },

    getStats: async () => {
        try {
            // Minimal stats impl for now, preferably should use getTodayReports
            // But to avoid circular dependency or context issues, we keep it simple
            // or we use the same logic locally
            return { total: 0, good: 0, issues: 0 };
        } catch (error) {
            return { total: 0, good: 0, issues: 0 };
        }
    },

    // Sync functions
    syncPendingItems: async () => {
        if (!navigator.onLine) return { syncedReports: 0, syncedSubmissions: 0 };

        let syncedReportsCount = 0;
        let syncedSubmissionsCount = 0;

        // 1. Sync Reports
        const offlineReports = await offlineDB.getReports();
        for (const report of offlineReports) {
            try {
                // Remove temp ID and sync status
                const { id, syncStatus, ...reportData } = report;
                await addDoc(collection(db, REPORTS_COL), reportData);
                await offlineDB.deleteReport(id);
                syncedReportsCount++;
            } catch (e) {
                console.error("Failed to sync report:", report, e);
            }
        }

        // 2. Sync Submissions
        const offlineSubmissions = await offlineDB.getSubmissions();
        for (const sub of offlineSubmissions) {
            try {
                const { id, ...subData } = sub;
                await addDoc(collection(db, SUBMISSIONS_COL), subData);
                await offlineDB.deleteSubmission(id);
                syncedSubmissionsCount++;
            } catch (e) {
                console.error("Failed to sync submission:", sub, e);
            }
        }

        return { syncedReports: syncedReportsCount, syncedSubmissions: syncedSubmissionsCount };
    }
};
