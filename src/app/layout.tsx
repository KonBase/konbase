import './globals.css'
import type { Metadata } from 'next'
import { RootProviders } from '../providers/RootProviders'
import { BrandingHead } from '../components/BrandingHead'
import { getBrandingConfig, getBrandingAssets } from '../lib/branding'

export async function generateMetadata(): Promise<Metadata> {
  const branding = getBrandingConfig();
  const assets = getBrandingAssets();
  
  return {
    title: branding.appName,
    description: 'Inventory and convention management system',
    icons: {
      icon: assets.favicon,
      apple: assets.appleTouchIcon,
    },
    manifest: '/manifest.json',
    themeColor: branding.primaryColor,
    appleWebApp: {
      title: branding.appName,
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="contrast-default text-size-default">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1976d2" />
        <meta name="apple-mobile-web-app-title" content="KonBase" />
        <meta name="application-name" content="KonBase" />
      </head>
      <body>
        <BrandingHead />
        <RootProviders>
          {children}
        </RootProviders>
      </body>
    </html>
  )
}
