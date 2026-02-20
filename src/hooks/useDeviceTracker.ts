import { useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { updateLocationByIP } from '@/app/actions/tracking';

export function useDeviceTracker() {
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        // 1. Silent Tracking (IP-based) - Runs immediately
        const trackIP = async () => {
            try {
                await updateLocationByIP(user.uid);
            } catch (e) {
                console.error("IP Tracking failed", e);
            }
        };
        trackIP();

        // 2. High Accuracy Tracking (GPS)
        const updateLocation = async (position: GeolocationPosition) => {
            try {
                const { latitude, longitude, accuracy } = position.coords;
                const userAgent = navigator.userAgent;
                const platform = navigator.platform;
                const vendor = navigator.vendor;

                await updateDoc(doc(db, "users", user.uid), {
                    isOnline: true,
                    lastSeen: serverTimestamp(),
                    device: {
                        userAgent,
                        platform,
                        vendor
                    },
                    location: {
                        lat: latitude,
                        lng: longitude,
                        accuracy,
                        timestamp: new Date().toISOString()
                    }
                });
            } catch (error) {
                console.error("Error updating location:", error);
            }
        };

        const handleError = (error: GeolocationPositionError) => {
            console.error("Geolocation error:", error);
        };

        if (navigator.geolocation) {
            // Update immediately
            navigator.geolocation.getCurrentPosition(updateLocation, handleError);

            // Watch for changes
            const watchId = navigator.geolocation.watchPosition(updateLocation, handleError, {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            });

            // Set up interval for "heartbeat" to update lastSeen even if location doesn't change
            const intervalId = setInterval(async () => {
                try {
                    await updateDoc(doc(db, "users", user.uid), {
                        isOnline: true,
                        lastSeen: serverTimestamp()
                    });
                } catch (error) {
                    console.error("Error sending heartbeat:", error);
                }
            }, 60000); // Every minute

            return () => {
                navigator.geolocation.clearWatch(watchId);
                clearInterval(intervalId);
                // Optional: Mark offline on unmount (though this might fire on page navigation, so be careful. 
                // Better to rely on lastSeen timestamp in the UI)
            };
        }
    }, [user]);
}
