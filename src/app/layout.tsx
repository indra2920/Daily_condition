import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Daily Condition App",
  description: "Real-time branch condition reporting",
};

import { AuthProvider } from "@/context/AuthContext";
import OfflineSyncManager from "@/components/OfflineSyncManager";
import DeviceTracker from "@/components/DeviceTracker";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <OfflineSyncManager />
          <DeviceTracker />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
