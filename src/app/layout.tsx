import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { CelebrationSystem } from "@/components/engagement/CelebrationSystem";
import { SmartUpgradeTrigger } from "@/components/upgrade/SmartUpgradeTrigger";
import { PWAProvider } from "@/components/pwa/PWAProvider";
import { BottomNav } from "@/components/navigation/BottomNav";
import { NotificationProvider } from "@/components/notifications/NotificationProvider";
import { RealtimeNotificationProvider } from "@/components/notifications/RealtimeNotificationProvider";
import { ProfileLoader } from "@/components/providers/ProfileLoader";
import { NavigationGuard } from "@/components/navigation/NavigationGuard";
import { AIAssistantProvider } from "@/components/providers/AIAssistantProvider";
import { PerformanceProvider } from "@/components/providers/PerformanceProvider";
import { InstallPrompt, UpdateNotification, OfflineIndicator } from "@/components/pwa/InstallPrompt";
import { Toaster } from "@/components/ui/sonner";
// Error boundary handled at page level since root layout is server component

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Creators AI Compass - Your Personalized Creator Roadmap",
  description: "Build your audience and grow your brand with personalized 90-day roadmaps for YouTube, TikTok, and Twitch. Get proven strategies, templates, and analytics.",
  keywords: ["content creation", "youtube growth", "tiktok strategy", "twitch streaming", "creator tools", "social media"],
  authors: [{ name: "Creators AI Compass Team" }],
  creator: "Creators AI Compass",
  publisher: "Creators AI Compass",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://creatorsaicompass.com"),
  
  // PWA Configuration
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Creators AI Compass",
    startupImage: [
      {
        url: "/icon-512x512.png",
        media: "(device-width: 768px) and (device-height: 1024px)",
      },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "msapplication-TileColor": "#8b5cf6",
    "msapplication-config": "/browserconfig.xml",
    "theme-color": "#8b5cf6",
  },
  
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://creatorsaicompass.com",
    title: "Creators AI Compass - Your Personalized Creator Roadmap",
    description: "Build your audience and grow your brand with personalized 90-day roadmaps for YouTube, TikTok, and Twitch.",
    siteName: "Creators AI Compass",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Creators AI Compass - Your Personalized Creator Roadmap",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Creators AI Compass - Your Personalized Creator Roadmap",
    description: "Build your audience and grow your brand with personalized 90-day roadmaps for YouTube, TikTok, and Twitch.",
    creator: "@creatorsaicompass",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Creators AI Compass',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: 'Build your audience and grow your brand with personalized 90-day roadmaps for YouTube, TikTok, and Twitch.',
    offers: {
      '@type': 'Offer',
      price: '9.99',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150'
    },
    author: {
      '@type': 'Organization',
      name: 'Creators AI Compass',
      url: 'https://creatorsaicompass.com'
    }
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6b46c1" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.className} antialiased min-h-screen flex flex-col`}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50">
          Skip to main content
        </a>
        <SessionProvider>
          <ThemeProvider>
            <ProfileLoader>
              <NavigationGuard>
                <PWAProvider>
                  <PerformanceProvider>
                    <NotificationProvider>
                      <RealtimeNotificationProvider>
                        <div className="flex flex-col min-h-screen">
                          <Header />
                          <main id="main-content" className="flex-1 pb-20 md:pb-0" tabIndex={-1}>
                            {children}
                          </main>
                          <Footer className="hidden md:block" />
                        </div>
                        <BottomNav />
                        <CelebrationSystem />
                        <SmartUpgradeTrigger />
                        <AIAssistantProvider />
                        <InstallPrompt />
                        <UpdateNotification />
                        <OfflineIndicator />
                        <Toaster />
                      </RealtimeNotificationProvider>
                    </NotificationProvider>
                  </PerformanceProvider>
                </PWAProvider>
              </NavigationGuard>
            </ProfileLoader>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
