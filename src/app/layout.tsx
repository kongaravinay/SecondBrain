import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Second Brain — AI Knowledge Graph',
  description: 'Personal AI second brain powered by Claude. Vector-based knowledge management with force-directed graph visualization.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ height: '100vh', overflow: 'hidden' }}>
        {children}
      </body>
    </html>
  )
}
