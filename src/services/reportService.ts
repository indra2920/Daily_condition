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
        try {
            const newReportData = {
                ...report,
                timestamp: new Date().toISOString() // Store as ISO string for simplicity in frontend
            };

            const docRef = await addDoc(collection(db, REPORTS_COL), newReportData);
            return { id: docRef.id, ...newReportData } as Report;
        } catch (error) {
            console.error("Error creating report:", error);
            throw error;
        }
    },

    // Check if a specific category is done for today (for a branch)
    getTodayReports: async (branchId: string): Promise<Report[]> => {
        try {
            // In a real app with many records, you'd want to query by date range
            // For MVP, we'll fetch sufficient recent records or filter client-side if dataset is small
            // OR better: add a 'date' field to reports YYYY-MM-DD for simpler querying

            // Let's assume we filter client side for now to avoid complex composite indexes setup immediately
            // But we filter by branchId at least
            const q = query(collection(db, REPORTS_COL), where("branchId", "==", branchId), orderBy("timestamp", "desc"));
            const querySnapshot = await getDocs(q);

            const today = new Date().toDateString();
            const reports: Report[] = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data() as Omit<Report, 'id'>;
                const isToday = new Date(data.timestamp).toDateString() === today;

                if (isToday) {
                    reports.push({ id: doc.id, ...data });
                }
            });

            return reports;
        } catch (error) {
            console.error("Error fetching today reports:", error);
            return [];
        }
    },

    submitDailyReport: async (user: any, reports: Report[], location?: { lat: number; lng: number }, isLate: boolean = false) => {
        try {
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

            const docRef = await addDoc(collection(db, SUBMISSIONS_COL), submission);
            return { id: docRef.id, ...submission };
        } catch (error) {
            console.error("Error submitting daily report:", error);
            throw error;
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
            const reports = await reportService.getReports();
            const today = new Date().toDateString();
            const todayReports = reports.filter(r => new Date(r.timestamp).toDateString() === today);
            return {
                total: todayReports.length,
                good: todayReports.filter(r => r.status === 'good').length,
                issues: todayReports.filter(r => r.status !== 'good').length
            };
        } catch (error) {
            return { total: 0, good: 0, issues: 0 };
        }
    }
};
