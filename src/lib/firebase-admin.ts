import { initializeApp, getApps, cert, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

function formatPrivateKey(key: string) {
    return key.replace(/\\n/g, "\n");
}

export function initAdmin() {
    if (getApps().length) {
        return {
            adminDb: getFirestore(getApp()),
            adminAuth: getAuth(getApp()),
            adminStorage: getStorage(getApp())
        };
    }

    const serviceAccount = {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY
            ? formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY)
            : undefined,
    };

    // Only initialize if we have the keys (to avoid build errors if env vars aren't set)
    if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
        initializeApp({
            credential: cert(serviceAccount),
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
    }

    const app = getApp();
    const adminDb = getFirestore(app);
    const adminAuth = getAuth(app);
    const adminStorage = getStorage(app);

    return { adminDb, adminAuth, adminStorage };
}
