"use client";
// Force Vercel Rebuild

import { Camera, Mail, Lock, User, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function LoginPage() {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [siteLocation, setSiteLocation] = useState("");
  const [jobTitle, setJobTitle] = useState("Staff");
  const [formLoading, setFormLoading] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "branches"));
        const branchesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBranches(branchesData);
      } catch (error) {
        console.error("Error fetching branches:", error);
      }
    };
    fetchBranches();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setFormLoading(true);
    try {
      if (isLogin) {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, siteLocation, jobTitle);
      }
    } catch (error: any) {
      // Error is logged in AuthContext
      const msg = error.code === 'auth/invalid-credential'
        ? "Invalid email or password."
        : error.message;
      alert(msg);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-4 text-zinc-100">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl shadow-indigo-500/20">
            <Camera className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-white">
            Daily Condition
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            {isLogin ? "Sign in to report branch status" : "Create a new account"}
          </p>
        </div>

        <div className="mt-8 rounded-2xl bg-zinc-900/50 p-8 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium leading-6 text-zinc-200">
                    Lokasi Site
                  </label>
                  <div className="mt-2">
                    {branches.length > 0 ? (
                      <select
                        className="block w-full rounded-lg border-0 bg-zinc-800/50 py-3 px-4 text-white shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                        value={siteLocation}
                        onChange={(e) => setSiteLocation(e.target.value)}
                        required={!isLogin}
                      >
                        <option value="">Pilih Lokasi Site</option>
                        {branches.map((branch) => (
                          <option key={branch.id} value={branch.name}>{branch.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        className="block w-full rounded-lg border-0 bg-zinc-800/50 py-3 px-4 text-white shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                        placeholder="Contoh: Jakarta Pusat"
                        value={siteLocation}
                        onChange={(e) => setSiteLocation(e.target.value)}
                        required={!isLogin}
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium leading-6 text-zinc-200">
                    Jabatan
                  </label>
                  <div className="mt-2">
                    <select
                      className="block w-full rounded-lg border-0 bg-zinc-800/50 py-3 px-4 text-white shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                    >
                      <option value="Staff">Staff</option>
                      <option value="Manager">Manager</option>
                      <option value="Supervisor">Supervisor</option>
                    </select>
                  </div>
                </div>
              </>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium leading-6 text-zinc-200">
                Corporate Email
              </label>
              <div className="relative mt-2 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-zinc-500" aria-hidden="true" />
                </div>
                <input
                  type="email"
                  name="email"
                  id="email"
                  className="block w-full rounded-lg border-0 bg-zinc-800/50 py-3 pl-10 text-white shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium leading-6 text-zinc-200">
                Password
              </label>
              <div className="relative mt-2 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-zinc-500" aria-hidden="true" />
                </div>
                <input
                  type="password"
                  name="password"
                  id="password"
                  className="block w-full rounded-lg border-0 bg-zinc-800/50 py-3 pl-10 text-white shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || formLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
            >
              {formLoading ? "Processing..." : (
                <>
                  {isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-zinc-900 px-2 text-xs text-zinc-500 uppercase tracking-widest">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            disabled={loading || formLoading}
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-white px-3 py-3 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-100 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            onClick={loginWithGoogle}
          >
            <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </button>

          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-400">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {isLogin ? "Register here" : "Sign in here"}
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
