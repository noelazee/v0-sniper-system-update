import './globals.css'
import { SpeedInsights } from '@vercel/speed-insights/next'

export const metadata = {
  metadataBase: new URL('https://v0-gbot.vercel.app'),
  title: 'NOELA — Sniper Trading',
  description: 'AI sniper trading with live charts. BTC ETH SOL BNB. Precision over frequency.',
  keywords: ['crypto', 'trading', 'sniper', 'bitcoin', 'ethereum', 'solana'],
  openGraph: {
    title: 'NOELA Sniper Trading',
    description: 'AI sniper trading with live charts.',
    url: 'https://v0-gbot.vercel.app',
    siteName: 'NOELA',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NOELA Sniper Trading',
    description: 'AI sniper trading with live charts.',
    images: ['/opengraph-image.png'],
  },
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#050508',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin:0, padding:0, background:'#050508', overflowX:'hidden' }}>
        {children}
        <SpeedInsights />
      </body>
    </html>
  )
}
