"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    signOut as firebaseSignOut,
    User as FirebaseUser
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

// Extend Firebase User with local role logic
// Extend Firebase User with local role logic
interface AppUser extends FirebaseUser {
    role: "admin" | "manager" | "user";
    branchId: string;
    jobTitle?: string;
}

interface AuthContextType {
    user: AppUser | null;
    loading: boolean;
    loginWithGoogle: () => Promise<void>;
    loginWithEmail: (email: string, password: string) => Promise<void>;
    registerWithEmail: (email: string, password: string, siteLocation: string, jobTitle: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    loginWithGoogle: async () => { },
    loginWithEmail: async () => { },
    registerWithEmail: async () => { },
    logout: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Fetch user profile from Firestore
                const userDocRef = doc(db, "users", firebaseUser.uid);
                const userDoc = await getDoc(userDocRef);

                let role: "admin" | "manager" | "user" = "user";
                let branchId = "branch-001";

                if (userDoc.exists()) {
                    const data = userDoc.data();
                    console.log("Firestore User Data:", data); // Debugging

                    const job = data.jobTitle?.toLowerCase() || "";

                    // Priority check for Admin
                    if (job.includes("admin") || firebaseUser.email?.toLowerCase().includes("admin")) {
                        role = "admin";
                    } else if (job.includes("manager")) {
                        role = "manager";
                    } else {
                        role = data.role || "user";
                    }
                    branchId = data.branchId || "branch-001";
                } else {
                    // Fallback for old/google users without profile doc
                    // Fallback for old/google users without profile doc
                    if (firebaseUser.email?.toLowerCase().includes("admin")) {
                        role = "admin";
                    } else if (firebaseUser.email?.toLowerCase().includes("manager")) {
                        role = "manager";
                    } else {
                        role = "user";
                    }
                    branchId = role === "manager" ? "HQ" : "branch-001";
                }

                const appUser: AppUser = {
                    ...firebaseUser,
                    role,
                    branchId
                };
                setUser(appUser);
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const loginWithGoogle = async () => {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            router.push("/dashboard");
        } catch (error) {
            console.error("Login failed:", error);
            alert("Login failed. Please make sure Google Sign-In is enabled in Firebase Console.");
        }
    };

    const loginWithEmail = async (email: string, password: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push("/dashboard");
        } catch (error: any) {
            console.error("Email login failed:", error);
            throw error; // Re-throw to handle in UI
        }
    };

    const registerWithEmail = async (email: string, password: string, siteLocation: string, jobTitle: string) => {
        try {
            console.log("Registering:", { email, siteLocation, jobTitle });

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // Optional: Set default display name to part of email
            await updateProfile(userCredential.user, {
                displayName: email.split('@')[0]
            });

            // Create User Profile in Firestore
            await setDoc(doc(db, "users", userCredential.user.uid), {
                uid: userCredential.user.uid,
                email: email,
                siteLocation: siteLocation || "", // Prevent undefined error
                branchId: siteLocation || "unknown", // Using Site Location as Branch ID for now
                jobTitle: jobTitle || "Staff",
                role: (jobTitle === 'Admin') ? 'admin' : (jobTitle === 'Manager') ? 'manager' : 'user',
                createdAt: new Date().toISOString()
            });

            router.push("/dashboard");
        } catch (error: any) {
            console.error("Registration failed:", error);
            throw error;
        }
    };

    const logout = async () => {
        await firebaseSignOut(auth);
        setUser(null);
        router.push("/");
    };

    return (
        <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithEmail, registerWithEmail, logout }}>
            {loading ? (
                <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
                    Loading Auth...
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
