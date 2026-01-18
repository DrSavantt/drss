import type { Metadata, Viewport } from "next";
import { Roboto, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/lib/theme-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  display: "swap",
  weight: ['400', '700'], // Regular and Bold
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Separate viewport export (required in Next.js 14+)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover", // CRITICAL: extends content to edges, enables safe-area-inset
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0A" },
  ],
};

export const metadata: Metadata = {
  title: "DRSS Marketing Studio",
  description: "Internal marketing agency management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to Supabase for faster first API call */}
        <link 
          rel="preconnect" 
          href={process.env.NEXT_PUBLIC_SUPABASE_URL || ''} 
          crossOrigin="anonymous"
        />
        <link 
          rel="dns-prefetch" 
          href={process.env.NEXT_PUBLIC_SUPABASE_URL || ''} 
        />
        {/* Prevent FOUC - set theme immediately before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || 'dark';
                  // Handle if it's JSON wrapped (legacy)
                  if (theme.startsWith('"')) {
                    try { theme = JSON.parse(theme); } catch(e) {}
                  }
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add(theme);
                } catch (e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${roboto.variable} ${geistMono.variable} antialiased font-sans min-h-screen`}>
        <ErrorBoundary>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
