import './globals.css'

export const metadata = {
  title: 'NOELA — Sniper Trading & News Curation',
  description: 'AI sniper trading with multi-exchange, live charts, and news curation. Earn NEWS tokens. Precision over frequency.',
  keywords: ['crypto', 'trading', 'sniper', 'news', 'curation', 'agents', 'world-chain'],
  openGraph: {
    title: 'NOELA — Sniper Trading & News Curation',
    description: 'AI sniper trading with multi-exchange, live charts, and news curation.',
    url: 'https://noela.vercel.app', 
    siteName: 'NOELA',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'NOELA Sniper Trading Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NOELA — Sniper Trading & News Curation',
    description: 'AI sniper trading with live charts and news curation.',
    images: ['/opengraph-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/Icon.png', 
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
.
