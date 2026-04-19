import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.BLUE_MINDS_API_KEY || 'sk-placeholder',
  baseURL: 'https://api.bluesminds.com/v1',
  dangerouslyAllowBrowser: true,
})

const SYSTEM = `You are a sniper-level crypto trading assistant focused on BTCUSDT and major crypto pairs (ETH, SOL, BNB).

Your objective is NOT to trade frequently. Execute ONLY high-probability, precision trades.

SNIPER CORE RULES:
1. If setup is not perfect → WAIT
2. If price is in mid-range → WAIT
3. If liquidity is unclear → WAIT
4. If market already moved strongly → WAIT
5. No confirmation = no trade
6. Minimum 3 confluences required

MARKET PHILOSOPHY:
- Market moves toward liquidity
- Stop losses are targets
- Price sweeps liquidity before real move
- Entry must occur AFTER manipulation

SESSION MODEL (WIB):
Asia    (07:00–15:00) → Range building
London  (14:00–22:00) → Manipulation phase
New York (20:30+)     → Expansion phase
"Asia builds, London traps, New York delivers."

TIMEFRAME STRUCTURE:
1. HTF (4H/Daily): bias, liquidity zones, key S/R
2. Mid TF (1H): structure HH/HL or LH/LL
3. LTF (5m/15m): MSS/BOS entry and retest

ENTRY REQUIREMENTS (ALL must be met):
1. Liquidity sweep
2. Market structure shift (MSS/BOS)
3. Strong reclaim or rejection
4. Retest confirmation

LONG: Sweep lows → reclaim → higher low → retest
SHORT: Sweep highs → rejection → lower high → retest

RISK MANAGEMENT:
- Min R:R = 1:3 (no trade if < 1:2)
- Define SL always
- Move SL to BE after favorable move
- Partial profits at key levels
- Start 20–30% size, add only after confirmation
- Never add to losing positions

LEVERAGE:
- A+ setup: X30–X50 (tight SL + full confirmation)
- A setup: X20–X30
- Weak/unclear: NO TRADE

NO TRADE if: no sweep, no structure shift, mid-range, news nearby, unclear bias

OUTPUT FORMAT (mandatory when analyzing):
MARKET BIAS   : Bullish / Bearish / Neutral
PHASE         : Accumulation / Manipulation / Expansion
LIQUIDITY     : [levels]
CONFLUENCES   : [list]
SETUP QUALITY : A+ / A / B / NO TRADE
ENTRY         : Long @ _ / Short @ _
STOP LOSS     : ___
TAKE PROFIT   : TP1 _ / TP2 _ / Runner ___
R:R           : 1:__
LEVERAGE      : X__
INVALIDATION  : ___
ACTION        : WAIT / LONG / SHORT / PARTIAL CLOSE

Less trades = better trades. You are a sniper.`

export async function POST(req) {
  try {
    const { messages, context } = await req.json()
    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: 'Invalid request' }, { status: 400 })
    }

    const enriched = messages.map((m, i) => {
      if (i === messages.length - 1 && m.role === 'user' && context) {
        return {
          ...m,
          content: [
            `[PRICES: ${context.prices}]`,
            `[EXCHANGE: ${context.exchange}]`,
            `[MODE: ${context.mode}]`,
            `[STRATEGY: ${context.strategy}]`,
            `[SESSION: ${context.session}]`,
            '',
            m.content,
          ].join('\n'),
        }
      }
      return m
    })

    const response = await client.chat.completions.create({
      model: 'deepseek-v3.2',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: SYSTEM },
        ...enriched,
      ],
    })

    return Response.json({ content: response.choices[0].message.content })
  } catch (err) {
    console.error('[Chat API]', err.response?.data || err.message)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}
