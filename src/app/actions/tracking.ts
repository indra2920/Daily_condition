"use server";

import { initAdmin } from "@/lib/firebase-admin";
import { headers } from "next/headers";

export async function updateLocationByIP(uid: string) {
    const { adminDb } = initAdmin();
    if (!uid) return;

    try {
        const headerList = await headers();
        const ip = headerList.get("x-forwarded-for") || "unknown";

        // Vercel provided headers
        const city = headerList.get("x-vercel-ip-city");
        const country = headerList.get("x-vercel-ip-country");
        const region = headerList.get("x-vercel-ip-country-region");
        const latStr = headerList.get("x-vercel-ip-latitude");
        const lngStr = headerList.get("x-vercel-ip-longitude");

        const updates: any = {
            ipAddress: ip,
            lastSeen: new Date().toISOString(), // Use ISO string for admin SDK compatibility if needed, or Firestore Timestamp
            isOnline: true
        };

        // If Vercel provides Lat/Lng, use it as a fallback location
        if (latStr && lngStr) {
            updates.ipLocation = {
                city,
                country,
                region,
                lat: parseFloat(latStr),
                lng: parseFloat(lngStr),
                timestamp: new Date().toISOString()
            };

            // Start with IP location, client can override with GPS later
            // We use a specific field 'ipLocation' to distinguish source, 
            // but we can also set 'location' if it's missing to ensure map visibility immediately
            updates['location.lat'] = parseFloat(latStr);
            updates['location.lng'] = parseFloat(lngStr);
            updates['location.accuracy'] = 5000; // Low accuracy for IP
            updates['location.timestamp'] = new Date().toISOString();
        }

        await adminDb.collection("users").doc(uid).set(updates, { merge: true });
        return { success: true, city, region };
    } catch (error) {
        console.error("Error updating IP location:", error);
        return { success: false };
    }
}
