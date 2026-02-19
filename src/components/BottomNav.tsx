"use client";

import { Home, FileClock, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function BottomNav() {
    const pathname = usePathname();

    const navItems = [
        { label: "Dashboard", href: "/dashboard", icon: Home },
        { label: "History", href: "/history", icon: FileClock },
        { label: "Profile", href: "/profile", icon: User },
    ];

    if (pathname === "/" || pathname.startsWith("/report/new")) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950 px-6 pb-6 pt-4">
            <div className="mx-auto flex max-w-md justify-between">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center gap-1 transition-colors",
                                isActive ? "text-indigo-500" : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            <item.icon className={cn("h-6 w-6", isActive && "fill-current/20")} />
                            <span className="text-xs font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
