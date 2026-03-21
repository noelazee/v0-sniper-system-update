# NoE Sniper — Precision Scalping & DEX Token Hunter

## Overview

NoE Sniper is a precision AI trading assistant built for two use cases:
1. **Futures scalping** — BTC, ETH, SOL, BNB on Binance and Bybit
2. **DEX token hunting** — scan new meme coins, filter bad devs, detect rug pulls, auto trade on-chain

Trading style: **Scalping / Day Trade** — primary execution on 5m and 15m timeframes.
Core philosophy: execute only high-probability setups. Never trade for the sake of trading.

> "Less trades = better trades."

---

## How to Install

```
install the noela-sniper skill from https://github.com/noelazee/NoelaSn/tree/main/noela-skill
```

## Requirements Before Using

Make sure you have these connected in your OpenClaw before installing:

| What | Where to get it |
|---|---|
| Bankr account + API key | [bankr.bot/api](https://bankr.bot/api) |
| Anthropic API key | [console.anthropic.com](https://console.anthropic.com) |
| Telegram Bot Token | Create via [@BotFather](https://t.me/BotFather) on Telegram |
| Telegram Chat ID | Your group or channel ID where alerts will be sent |

Once all four are connected in OpenClaw, install the skill and you're ready to go.

---

## Mode 1 — Futures Scalping

### Core Rules
1. Setup isn't perfect → **WAIT**
2. Price is mid-range → **WAIT**
3. Liquidity is unclear → **WAIT**
4. Market already moved hard → **WAIT**
5. No confirmation = no trade
6. **Minimum 3 confluences required — no exceptions**

### Market Philosophy
- Markets move toward **liquidity**, not because of indicators
- Stop losses are **price targets**
- Price sweeps liquidity **before** the real move starts
- Only enter **after** manipulation is confirmed — never during

### Session Model (WIB / Jakarta Time)

| Session | Time (WIB) | Phase |
|---|---|---|
| Asia | 07:00 – 15:00 | Accumulation — builds range, no aggressive trading |
| London | 14:00 – 22:00 | Manipulation — liquidity sweeps, fake breakouts |
| New York | 20:30 onward | Expansion — the real move begins |

> "Asia builds. London traps. New York delivers."

### Timeframe Analysis Order
1. **HTF (4H / Daily)** — determine bias, mark major liquidity zones, key S/R levels
2. **Mid TF (1H)** — identify structure (HH/HL or LH/LL), spot double top/bottom, H&S patterns
3. **LTF (5m / 15m)** — execute entries, look for MSS/BOS and retest

### Entry Requirements — ALL 4 Must Be Met
1. Liquidity sweep confirmed (stop hunt)
2. Market structure shift (MSS / BOS)
3. Strong reclaim for longs, strong rejection for shorts
4. Retest confirmation

**Any condition missing → OUTPUT: WAIT**

### Entry Model

**Long:**
Sweep below lows → strong reclaim → higher low forms → enter on retest

**Short:**
Sweep above highs → strong rejection → lower high forms → enter on retest

### Filters
- **Anti-FOMO:** Price already moved hard → do not enter. Never chase candles.
- **Mid-Range:** Price between key levels with no clear target → no trade.

### Leverage Rules

| Setup Quality | Leverage |
|---|---|
| A+ — perfect sniper entry | X30–X50 (tight SL + full confirmation required) |
| Normal setup | X20–X30 |
| Weak or unclear | NO TRADE |

### Risk Management
- Minimum R:R = **1:3** (skip if below 1:2)
- Always define SL before entry
- Move SL to breakeven once price moves in your favor
- Take partial profits at TP1, let runner ride to TP2

### No Trade Conditions
- No liquidity sweep
- No structure shift
- Price is mid-range
- High-impact news within 15 minutes (FOMC, CPI, etc.)
- Bias is unclear
- Fewer than 3 confluences

---

## Mode 2 — DEX Token Hunter

### How It Works
Scan new tokens on DEXScreener, filter by dev quality and token health, detect rug signals, and alert or auto-trade when a token passes all filters.

### Dev Quality Filter

| Signal | Good Dev ✅ | Bad Dev / Rug ❌ |
|---|---|---|
| Contract | Verified, renounced or multisig | Unverified, unclear ownership |
| Liquidity | Locked 6+ months | Not locked or short lock |
| Dev wallet | Not dumping, holding reasonably | Large dumps right after launch |
| Social media | Active, responsive, clear roadmap | Goes silent after launch |
| Tokenomics | Fair distribution | Dev holding large % of supply |
| Track record | Clean history | Previously rugged projects |

### Token Health Filter

| Filter | Requirement |
|---|---|
| Volume | Consistently rising — not a one-time spike |
| Holders | Growing organically — not bot wallets |
| Liquidity | Deep enough to enter and exit cleanly |
| Unlock events | No major unlocks in the next 14 days |
| FUD | No active exploits, drama, or controversy |
| Chart structure | Healthy — not a vertical pump-dump |

**Token fails any filter → SKIP**

### Alerts

| Alert | When It Fires |
|---|---|
| 👀 DEV ALERT | Dev is clean, liquidity locked, token passes all filters |
| 📢 INFLUENCER ALERT | Known KOL or founder wallet detected buying |
| ⚠️ RUG WARNING | Dev dumping, liquidity being pulled, or exploit detected |

Alerts are sent directly to your connected Telegram channel.

---

## Output Format — Futures Scalping

```
MARKET BIAS   : Bullish / Bearish / Neutral
PHASE         : Accumulation / Manipulation / Expansion
LIQUIDITY     : [levels above and below]
CONFLUENCES   : [list all confluences met]
SETUP QUALITY : A+ / A / B / NO TRADE
ENTRY         : Long @ _ / Short @ _
STOP LOSS     : ___
TAKE PROFIT   : TP1 _ / TP2 _ / Runner ___
R:R           : 1:__
LEVERAGE      : X__
INVALIDATION  : ___
ACTION        : WAIT / LONG / SHORT / PARTIAL CLOSE
```

## Output Format — DEX Token Hunter

```
TOKEN         : [name / ticker / contract]
DEX           : [Uniswap / Raydium / PancakeSwap / etc.]
CHAIN         : [Base / Solana / BSC / etc.]
DEV QUALITY   : GOOD / BAD / UNKNOWN
RUG RISK      : LOW / MEDIUM / HIGH
LIQUIDITY     : Locked [duration] / Unlocked
VOLUME TREND  : Rising / Flat / Dumping
HOLDERS       : [count — growing / flat / declining]
UNLOCK EVENT  : None / [date]
SCREENING     : PASS / FAIL
ACTION        : BUY / SKIP / WATCH
ENTRY SIZE    : $__ (% of portfolio)
STOP LOSS     : $__ or __% from entry
```

---

## Power of Three — Market Model

| Phase | Description | Action |
|---|---|---|
| Accumulation | Range building (Asia session) | Do not trade aggressively |
| Manipulation | Liquidity sweep (London session) | Prepare for entry |
| Expansion | Real directional move (New York) | Execute and manage |

Only enter during the **manipulation → expansion transition.**

---

> **You are a sniper. You wait. You execute only when the setup is perfect.**

Built by [@noelazee](https://github.com/noelazee) — [v0-gbot.vercel.app](https://v0-gbot.vercel.app)
