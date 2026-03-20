<img width="1536" height="1024" alt="file_0000000071bc720ba7dbd7c37c0c9368" src="https://github.com/user-attachments/assets/cd59f70e-0c61-4bb3-a5d6-bdd26deb39a7" />


🎯 NOELA — Sniper Trading Platform
AI-powered sniper trading assistant. Less trades. Better trades.
BTC · ETH · SOL · BNB — Multi-exchange · Multi-strategy · Live charts
�
✨ Features
🎯 AI Sniper Bot — Claude-powered with strict entry rules (min 3 confluences, R:R 1:3, no FOMO)
📊 Live Candlestick Chart — Real-time data from Binance WebSocket
💹 Multi-pair — BTC, ETH, SOL, BNB with live price feed
🏦 Multi-exchange — Binance, Bybit, OKX
📈 Multi-strategy — Sniper, Grid Bot, Swing, Scalping, DCA
🤖 3 Modes — Auto Agent, Semi-Auto, Manual
🕐 Session Detector — Asia / London / New York (WIB)
🔒 Secure — API key server-side only, never exposed to client
🚀 Deploy
One-click deploy to Vercel
�
Add this environment variable in Vercel:
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxx
Get your key at → https://console.anthropic.com/settings/keys
💻 Run Locally
# Clone
git clone https://github.com/noelazee/v0-sniper-system-update.git
cd v0-sniper-system-update

# Install
npm install

# Setup env
cp .env.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY

# Run
npm run dev
Open http://localhost:3000
📁 Structure
├── app/
│   ├── api/
│   │   ├── chat/route.js           ← AI sniper bot (secure)
│   │   └── binance/
│   │       ├── klines/route.js     ← Chart data proxy (fixes CORS)
│   │       └── ticker/route.js     ← Price feed proxy
│   ├── LiveChart.jsx               ← Real-time candlestick chart
│   ├── page.tsx                    ← Main trading UI
│   └── globals.css
├── .env.example
└── package.json
🎯 Sniper Rules
Rule
Value
Min confluences
3
Min R:R
1:3
Max leverage (A+)
×50
FOMO filter
OFF
Averaging down
OFF
Sessions (WIB)
Session
Time
Phase
Asia
07:00–15:00
Accumulation
London
14:00–22:00
Manipulation
New York
20:30+
Expansion
"Asia builds, London traps, New York delivers."
⚠️ Disclaimer
For educational purposes only. Always DYOR. Never risk more than you can afford to lose.
License
MIT © noela_zee
