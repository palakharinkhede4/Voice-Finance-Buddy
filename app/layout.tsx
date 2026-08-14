import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Voice Finance Buddy — Intelligent Personal Finance",
  description:
    "Autonomous voice-enabled personal finance assistant with real-time analytics, tax planning, and portfolio intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('theme');
                  if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen antialiased selection:bg-indigo-500/20 selection:text-indigo-600 dark:selection:text-indigo-300">
        {children}
      </body>
    </html>
  );
}
