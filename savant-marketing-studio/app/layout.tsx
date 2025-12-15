import type { Metadata } from "next";
import { Roboto, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/lib/theme-provider";
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

export const metadata: Metadata = {
  title: "DRSS Marketing Studio",
  description: "Internal marketing agency management",
  manifest: "/manifest.json",
  themeColor: "#fb7185",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DRSS",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
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
        {/* PWA meta tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="DRSS" />
        <meta name="theme-color" content="#fb7185" />
        
        {/* Viewport - SIMPLE VERSION */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        
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
      <body className={`${roboto.variable} ${geistMono.variable} antialiased font-sans`}>
        <ThemeProvider>
        {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
