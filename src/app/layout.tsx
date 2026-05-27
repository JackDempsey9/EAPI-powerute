import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Grid Intelligence Dashboard',
  description: 'Real-time emergency incident monitoring for electricity infrastructure',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="h-screen w-screen overflow-hidden bg-navy-950">
        {children}
      </body>
    </html>
  )
}
