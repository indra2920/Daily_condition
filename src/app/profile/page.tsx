"use client";

import { useAuth } from "@/context/AuthContext";
import BottomNav from "@/components/BottomNav";
import { LogOut, User, MapPin } from "lucide-react";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const { user, logout, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/");
        }
    }, [user, loading, router]);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-24">
            <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md px-4 py-4">
                <h1 className="text-lg font-bold text-white">My Profile</h1>
            </header>

            <main className="p-4 space-y-6">
                <div className="flex flex-col items-center py-8">
                    <div className="h-24 w-24 rounded-full bg-zinc-800 flex items-center justify-center mb-4 ring-4 ring-zinc-800">
                        <User className="h-12 w-12 text-zinc-500" />
                    </div>
                    <h2 className="text-xl font-bold">{user.email}</h2>
                    <p className="text-zinc-500">Branch Staff</p>
                </div>

                <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
                    <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-indigo-500" />
                        <div>
                            <p className="text-sm text-zinc-400">Branch Location</p>
                            <p className="font-medium">Jakarta Pusat (Branch 001)</p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => logout()}
                    className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-red-500/10 text-red-500 font-medium hover:bg-red-500/20 transition-colors"
                >
                    <LogOut className="h-5 w-5" />
                    Log Out
                </button>
            </main>
            <BottomNav />
        </div>
    );
}
