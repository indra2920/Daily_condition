import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { MapPin, Globe, Monitor, Smartphone, Clock } from 'lucide-react';

interface UserData {
    id: string;
    email: string;
    role: string;
    jobTitle: string;
    isOnline?: boolean;
    lastSeen?: any; // Firestore Timestamp
    device?: {
        userAgent: string;
        platform: string;
        vendor: string;
    };
    location?: {
        lat: number;
        lng: number;
        accuracy: number;
        timestamp: string;
    };
}

export default function UserMonitoring() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "users"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as UserData[];

            // Sort client-side to ensure all users are shown even if they don't have lastSeen
            usersData.sort((a, b) => {
                const timeA = a.lastSeen?.toMillis ? a.lastSeen.toMillis() : (a.lastSeen ? new Date(a.lastSeen).getTime() : 0);
                const timeB = b.lastSeen?.toMillis ? b.lastSeen.toMillis() : (b.lastSeen ? new Date(b.lastSeen).getTime() : 0);
                return timeB - timeA;
            });

            setUsers(usersData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const isOnline = (lastSeen: any) => {
        if (!lastSeen) return false;
        const now = new Date();
        const seen = lastSeen.toDate ? lastSeen.toDate() : new Date(lastSeen);
        const diff = (now.getTime() - seen.getTime()) / 1000 / 60; // minutes
        return diff < 5; // Consider online if seen within last 5 minutes
    };

    const getDeviceIcon = (userAgent: string = "") => {
        const ua = userAgent.toLowerCase();
        if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
            return <Smartphone className="h-4 w-4 text-zinc-400" />;
        }
        return <Monitor className="h-4 w-4 text-zinc-400" />;
    };

    const getBrowserName = (userAgent: string = "") => {
        const ua = userAgent.toLowerCase();
        if (ua.includes("firefox")) return "Firefox";
        if (ua.includes("chrome")) return "Chrome";
        if (ua.includes("safari")) return "Safari";
        if (ua.includes("edge")) return "Edge";
        return "Unknown Browser";
    };

    if (loading) return <div className="text-zinc-500 text-center py-8">Loading monitoring data...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Globe className="h-5 w-5 text-indigo-400" />
                Live User Monitoring
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map((user) => {
                    const online = isOnline(user.lastSeen);
                    return (
                        <div key={user.id} className={`bg-zinc-900/50 rounded-xl p-4 border transition-all ${online ? 'border-emerald-500/30' : 'border-zinc-800'}`}>
                            {/* Header */}
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-medium text-white truncate max-w-[200px]" title={user.email}>{user.email}</h3>
                                    <p className="text-xs text-zinc-500">{user.jobTitle || user.role}</p>
                                </div>
                                <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${online ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                                    {online ? 'Online' : 'Offline'}
                                </div>
                            </div>

                            {/* Device Info */}
                            {user.device && (
                                <div className="flex items-center gap-2 mb-3 text-xs text-zinc-400 bg-zinc-800/50 p-2 rounded">
                                    {getDeviceIcon(user.device.userAgent)}
                                    <span>
                                        {user.device.platform} • {getBrowserName(user.device.userAgent)}
                                    </span>
                                </div>
                            )}

                            {/* Location Info */}
                            {user.location ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                                        <MapPin className="h-3 w-3" />
                                        <span>
                                            Lat: {user.location.lat.toFixed(4)}, Lng: {user.location.lng.toFixed(4)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                                        <Clock className="h-3 w-3" />
                                        <span>Updated: {new Date(user.location.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                    <a
                                        href={`https://www.google.com/maps?q=${user.location.lat},${user.location.lng}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full text-center mt-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 text-xs py-1.5 rounded transition-colors"
                                    >
                                        View on Map
                                    </a>
                                </div>
                            ) : (
                                <div className="text-xs text-zinc-600 italic py-2 text-center">
                                    No location data available
                                </div>
                            )}

                            {/* Last Seen */}
                            {!online && user.lastSeen && (
                                <p className="text-[10px] text-zinc-600 mt-2 text-right">
                                    Last seen: {user.lastSeen?.toDate ? user.lastSeen.toDate().toLocaleString() : new Date(user.lastSeen).toLocaleString()}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
