import { openDB, DBSchema } from 'idb';

interface DailyConditionDB extends DBSchema {
    reports: {
        key: string;
        value: any;
    };
    submissions: {
        key: string;
        value: any;
    };
}

const DB_NAME = 'daily-condition-db';
const DB_VERSION = 1;

export const initDB = async () => {
    return openDB<DailyConditionDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('reports')) {
                db.createObjectStore('reports', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('submissions')) {
                db.createObjectStore('submissions', { keyPath: 'id' });
            }
        },
    });
};

export const offlineDB = {
    async addReport(report: any) {
        const db = await initDB();
        return db.put('reports', report);
    },

    async getReports() {
        const db = await initDB();
        return db.getAll('reports');
    },

    async deleteReport(id: string) {
        const db = await initDB();
        return db.delete('reports', id);
    },

    async addSubmission(submission: any) {
        const db = await initDB();
        return db.put('submissions', submission);
    },

    async getSubmissions() {
        const db = await initDB();
        return db.getAll('submissions');
    },

    async deleteSubmission(id: string) {
        const db = await initDB();
        return db.delete('submissions', id);
    },
};
