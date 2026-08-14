import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Voice Finance Buddy — Intelligent Personal Finance",
  description:
    "Production-grade voice-enabled personal finance assistant with real-time analytics, automated multi-agent reasoning, tax planning, and portfolio intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        {children}
      </body>
    </html>
  );
}
