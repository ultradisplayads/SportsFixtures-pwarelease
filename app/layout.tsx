import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { NotificationProvider } from "@/components/notification-provider"
import { LocationProvider } from "@/components/location-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { OfflineIndicator } from "@/components/offline-indicator"
import { ServiceWorkerRegistration } from "@/components/service-worker-registration"
import { UpdatePrompt } from "@/components/platform/UpdatePrompt"
import { AdminPanel } from "@/components/admin-panel"
import { OfflineBanner } from "@/components/offline-banner"
import { AppShellGuard } from "@/components/pwa/app-shell-guard"
import { AuthProvider } from "@/lib/auth-context"
import { ComplianceProvider } from "@/lib/compliance-context"
import { Toaster } from "@/components/ui/toaster"
import { FeedbackWidget } from "@/components/feedback-widget"
import { OpenFullSiteButton } from "@/components/open-full-site-button"
import { DiscoModeOverlay } from "@/components/disco-mode-overlay"
import { QuirkPopIn } from "@/components/quirk-pop-in"
import "./globals.css"

const geistSans = Geist({ subsets: ["latin"] })

const showDevPanel = process.env.NEXT_PUBLIC_ENABLE_DEV_PANEL === "true"
const CANONICAL_SITE_URL = "https://sportsfixtures.net"

export const metadata: Metadata = {
  metadataBase: new URL(CANONICAL_SITE_URL),
  title: {
    default: "SportsFixtures | Live Fixtures, Results, TV Guide & Venues",
    template: "%s | SportsFixtures",
  },
  description:
    "Live sports fixtures, results, TV schedules, venues, breaking news, and places to watch near you.",
  manifest: "/manifest.webmanifest",
  applicationName: "SportsFixtures",
  authors: [{ name: "SportsFixtures", url: CANONICAL_SITE_URL }],
  creator: "SportsFixtures",
  publisher: "SportsFixtures",
  alternates: { canonical: CANONICAL_SITE_URL },
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
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SportsFixtures",
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/icon-192x192.png"],
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: CANONICAL_SITE_URL,
    siteName: "SportsFixtures",
    title: "SportsFixtures | Live Fixtures, Results, TV Guide & Venues",
    description:
      "Live sports fixtures, results, TV schedules, venues, breaking news, and places to watch near you.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "SportsFixtures" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SportsFixtures | Live Fixtures, Results, TV Guide & Venues",
    description: "Live sports fixtures, results, TV schedules, venues, breaking news, and places to watch near you.",
    creator: "@sportsfixtures",
    images: ["/og-image.png"],
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  viewportFit: "cover",
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#5cb827" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1f0a" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "SportsFixtures",
                alternateName: "SF",
                url: "https://sportsfixtures.net",
                potentialAction: {
                  "@type": "SearchAction",
                  target: "https://sportsfixtures.net/search?q={search_term_string}",
                  "query-input": "required name=search_term_string",
                },
              },
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "SportsFixtures",
                url: "https://sportsfixtures.net",
                logo: {
                  "@type": "ImageObject",
                  url: "https://sportsfixtures.net/logo.png",
                },
                sameAs: [
                  "https://twitter.com/sportsfixtures",
                  "https://www.facebook.com/sportsfixtures",
                ],
              },
            ]),
          }}
        />
      </head>
      <body className={`${geistSans.className} min-h-dvh bg-background antialiased`}>
        <ThemeProvider>
          <ComplianceProvider>
          <LocationProvider>
            <AuthProvider>
              <NotificationProvider>
                <OfflineBanner />
                <OfflineIndicator />
                <ServiceWorkerRegistration />
                <UpdatePrompt />
                <OpenFullSiteButton />
                <DiscoModeOverlay />
                <QuirkPopIn />
                <AppShellGuard>
                  <div className="mx-auto min-h-dvh w-full max-w-screen-sm bg-background md:max-w-screen-md">
                    {children}
                  </div>
                </AppShellGuard>
                {showDevPanel ? <AdminPanel /> : null}
                <FeedbackWidget />
                <Toaster />
              </NotificationProvider>
            </AuthProvider>
          </LocationProvider>
          </ComplianceProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
