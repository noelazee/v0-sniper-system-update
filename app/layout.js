import './globals.css'

export const metadata = {
  title: 'NOESN Sniper Trading & News Curation',
  description: 'AI sniper trading with multi-exchange, live charts, and news curation. Earn NEWS tokens. Precision over frequency.',
  keywords: ['crypto', 'trading', 'sniper', 'news', 'curation', 'agents', 'world-chain'],
  openGraph: {
    title: 'NOESN Sniper Trading & News Curation',
    description: 'AI sniper trading with multi-exchange, live charts, and news curation.',
    url: 'https://v0-gbot.vercel.app',
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
    title: 'NOESN Sniper Trading & News Curation',
    description: 'AI sniper trading with live charts and news curation.',
    images: ['/opengraph-image.png'],
  },
  icons: {
        icon: "/icon.png",
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
