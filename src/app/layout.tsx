import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import PwaRegister from "@/components/layout/PwaRegister";

export const metadata: Metadata = {
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
  title: "VYORA — Move Smarter. Live Stronger.",
  description: "VYORA is an AI-powered fitness and nutrition platform: workouts, animated exercise demos, calorie & macro tracking, meal planning and an AI coach.",
};
export const viewport: Viewport = { themeColor: "#090B0A", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <style>{`:root{--font-jakarta:"Plus Jakarta Sans"}`}</style>
      </head>
      <body className="font-sans antialiased">
        <PwaRegister />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
