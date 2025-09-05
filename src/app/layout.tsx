import './globals.css'
import type { Metadata } from 'next'
import { RootProviders } from '../providers/RootProviders'

export const metadata: Metadata = {
  title: 'KonBase',
  description: 'Inventory and convention management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="contrast-default text-size-default">
      <body>
        <RootProviders>
          {children}
        </RootProviders>
      </body>
    </html>
  )
}
