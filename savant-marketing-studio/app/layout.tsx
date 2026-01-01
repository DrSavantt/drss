import type { Metadata, Viewport } from "next";
import { Roboto, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/lib/theme-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-inter",
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
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "DRSS Marketing Studio",
  description: "Internal marketing agency management",
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`dark ${roboto.variable} ${geistMono.variable}`}>
      <head>
        {/* Prevent FOUC - set dark mode immediately */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || 'dark';
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add(theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${roboto.variable} ${geistMono.variable} antialiased font-sans min-h-screen min-h-[100dvh]`}>
        <ErrorBoundary>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
