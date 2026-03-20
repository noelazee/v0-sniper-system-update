'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import BinanceChart from './components/BinanceChart';

const SNIPER_SYSTEM = `You are a sniper-level crypto trading assistant focused on BTCUSDT and major crypto pairs (ETH, SOL, BNB).

Your objective is NOT to trade frequently.
Your objective is to execute ONLY high-probability, precision trades.

You must prioritize patience, liquidity, confirmation, and risk control.

================================
SNIPER CORE RULES
================================

1. If setup is not perfect → WAIT
2. If price is in mid-range → WAIT
3. If liquidity is unclear → WAIT
4. If market already moved strongly → WAIT
5. No confirmation = no trade
6. Minimum 3 confluences required

================================
MARKET PHILOSOPHY
================================

- Market moves toward liquidity
- Stop losses are targets
- Price sweeps liquidity before real move
- Entry must occur AFTER manipulation

================================
SESSION MODEL (WIB)
================================

Asia (07:00 – 15:00) → Range building (no aggressive trading)
London (14:00 – 22:00) → Manipulation phase (liquidity sweeps, fake moves)
New York (20:30 onward) → Expansion phase (real move)

Rule: "Asia builds, London traps, New York delivers."

================================
TIMEFRAME STRUCTURE
================================

Analyze in this order:
1. HTF (4H / Daily): Determine bias, identify major liquidity zones
2. Mid TF (1H): Identify structure (HH/HL or LH/LL)
3. LTF (5m / 15m): Execute entries, look for MSS / BOS and retest

================================
ENTRY REQUIREMENTS (STRICT)
================================

ALL conditions MUST be met:
1. Liquidity sweep (stop hunt)
2. Market structure shift (MSS / BOS)
3. Strong reclaim (long) or rejection (short)
4. Retest confirmation

If ANY condition is missing → OUTPUT: WAIT

================================
ENTRY MODEL
================================

LONG: Sweep below lows → Strong reclaim → Higher low forms → Enter on retest
SHORT: Sweep above highs → Strong rejection → Lower high forms → Enter on retest

================================
ANTI-FOMO FILTER
================================

- If price already moved strongly → DO NOT ENTER
- Never chase candles

================================
RISK MANAGEMENT
================================

- Minimum R:R = 1:3
- No trade if R:R < 1:2
- Always define Stop Loss
- Move SL to breakeven after favorable move
- Take partial profits at key levels

================================
LEVERAGE RULE
================================

- A+ setup: X30–X50 allowed (tight SL + confirmation)
- Normal setup: X20–X30
- Weak setup: NO TRADE

================================
OUTPUT FORMAT (MANDATORY)
================================

Always respond in this exact format when analyzing a pair:

MARKET BIAS   : Bullish / Bearish / Neutral
PHASE         : Accumulation / Manipulation / Expansion
LIQUIDITY     : [above / below levels]
CONFLUENCES   : [list confluences]
SETUP QUALITY : A+ / A / B / NO TRADE
ENTRY         : Long @ _ / Short @ _
STOP LOSS     : ___
TAKE PROFIT   : TP1 _ / TP2 _ / Runner ___
R:R           : 1:__
LEVERAGE      : X__ (based on setup quality)
INVALIDATION  : ___
ACTION        : WAIT / LONG / SHORT / PARTIAL CLOSE

================================
FINAL RULE
================================

Less trades = better trades. You are a sniper. You wait. You execute only when the setup is perfect.

When user asks general questions, answer concisely. When asked to analyze a pair, always use the mandatory output format above.`;

const PAIRS = {
  BTC: { symbol: "BTC/USDT", base: 67420, color: "#f7931a", icon: "₿", change: 2.34 },
  ETH: { symbol: "ETH/USDT", base: 3541, color: "#627eea", icon: "Ξ", change: -0.87 },
  SOL: { symbol: "SOL/USDT", base: 182, color: "#9945ff", icon: "◎", change: 4.12 },
  BNB: { symbol: "BNB/USDT", base: 598, color: "#f3ba2f", icon: "⬡", change: 1.05 },
};

const EXCHANGES = [
  { name: "Binance", color: "#f3ba2f", status: "connected" },
  { name: "Bybit", color: "#f7a600", status: "connected" },
  { name: "OKX", color: "#00b4d8", status: "disconnected" },
];

const STRATEGIES = ["Sniper", "Grid Bot", "Swing", "Scalping", "DCA"];
const MODES = ["Auto Agent", "Semi-Auto", "Manual"];

function usePriceFeed() {
  const [prices, setPrices] = useState(
    Object.fromEntries(
      Object.entries(PAIRS).map(([k, v]) => [
        k,
        {
          price: v.base,
          change: v.change,
          history: Array.from({ length: 40 }, (_, i) =>
            v.base * (1 + (Math.random() - 0.5) * 0.02)
          ),
        },
      ])
    )
  );

  useEffect(() => {
    const iv = setInterval(() => {
      setPrices((prev) => {
        const next = { ...prev };
        Object.keys(PAIRS).forEach((k) => {
          const drift = (Math.random() - 0.488) * PAIRS[k].base * 0.0012;
          const newPrice = Math.max(prev[k].price + drift, PAIRS[k].base * 0.6);
          const hist = [...prev[k].history.slice(1), newPrice];
          const change = ((newPrice - PAIRS[k].base) / PAIRS[k].base) * 100;
          next[k] = { price: newPrice, change, history: hist };
        });
        return next;
      });
    }, 900);
    return () => clearInterval(iv);
  }, []);

  return prices;
}

function SparkLine({ history, color, positive }) {
  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min || 1;
  const W = 72, H = 24;
  const pts = history
    .map((v, i) => `${(i / (history.length - 1)) * W},${H - ((v - min) / range) * H}`)
    .join(" ");
  const stroke = positive ? "#00f5a0" : "#ff3b5c";
  return (
    <svg width={W} height={H} style={{ display: "block" }}>
      <defs>
        <linearGradient id={`g${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.3" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={pts}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PairCard({ id, data, prices, selected, onClick }) {
  const p = prices[id];
  const pos = p.change >= 0;
  return (
    <div
      onClick={onClick}
      style={{
        background: selected ? `${data.color}12` : "#0c0c14",
        border: `1px solid ${selected ? data.color + "50" : "#1c1c2a"}`,
        borderRadius: 10,
        padding: "10px 12px",
        cursor: "pointer",
        transition: "all 0.2s",
        marginBottom: 6,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 16, color: data.color }}>{data.icon}</span>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, color: "#e2e8f0" }}>{id}</span>
        </div>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: pos ? "#00f5a0" : "#ff3b5c" }}>
          {pos ? "+" : ""}{p.change.toFixed(2)}%
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700, color: "#fff" }}>
          ${p.price.toFixed(id === "BTC" ? 0 : id === "BNB" || id === "SOL" ? 2 : 1)}
        </span>
        <SparkLine history={p.history} color={data.color} positive={pos} />
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: 4, padding: "12px 14px", alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#00f5a0",
            animation: `bounce 1s ${i * 0.15}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function MessageBubble({ msg }) {
  const isBot = msg.role === "assistant";
  const isSystem = msg.role === "system";

  if (isSystem) {
    return (
      <div style={{
        textAlign: "center",
        padding: "6px 0",
        color: "#4a5568",
        fontFamily: "'Space Mono', monospace",
        fontSize: 11,
      }}>
        — {msg.content} —
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      justifyContent: isBot ? "flex-start" : "flex-end",
      marginBottom: 12,
    }}>
      {isBot && (
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "linear-gradient(135deg, #00f5a0, #0072ff)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, marginRight: 8, flexShrink: 0, marginTop: 2,
        }}>
          🎯
        </div>
      )}
      <div style={{
        maxWidth: "78%",
        background: isBot ? "#12121e" : "#00f5a015",
        border: `1px solid ${isBot ? "#1e1e30" : "#00f5a030"}`,
        borderRadius: isBot ? "4px 12px 12px 12px" : "12px 4px 12px 12px",
        padding: "10px 14px",
      }}>
        <pre style={{
          margin: 0,
          fontFamily: msg.formatted ? "'Space Mono', monospace" : "'Syne', sans-serif",
          fontSize: msg.formatted ? 11.5 : 13,
          color: "#d4dae4",
          lineHeight: 1.6,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}>
          {msg.content}
        </pre>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#2d3748", marginTop: 6 }}>
          {msg.time}
        </div>
      </div>
    </div>
  );
}

function ActiveTrade({ pair, data }) {
  const [pnl] = useState((Math.random() - 0.4) * 8);
  const pos = pnl >= 0;
  return (
    <div style={{
      background: "#0c0c14",
      border: `1px solid ${pos ? "#00f5a030" : "#ff3b5c30"}`,
      borderRadius: 8,
      padding: "8px 10px",
      marginBottom: 6,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 14, color: data.color }}>{data.icon}</span>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: "#e2e8f0" }}>{pair}</span>
          <span style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 9,
            padding: "1px 5px",
            borderRadius: 3,
            background: pos ? "#00f5a020" : "#ff3b5c20",
            color: pos ? "#00f5a0" : "#ff3b5c",
          }}>
            {pos ? "LONG" : "SHORT"}
          </span>
        </div>
        <span style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 12,
          fontWeight: 700,
          color: pos ? "#00f5a0" : "#ff3b5c",
        }}>
          {pos ? "+" : ""}{pnl.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}

export default function SniperPlatform() {
  const prices = usePriceFeed();
  const [selectedPair, setSelectedPair] = useState("BTC");
  const [mode, setMode] = useState("Semi-Auto");
  const [strategy, setStrategy] = useState("Sniper");
  const [exchange, setExchange] = useState("Binance");
  const [messages, setMessages] = useState([
    {
      role: "system",
      content: "NOELA SNIPER SYSTEM — Precision over frequency. Liquidity over indicators. Patience over impulse.",
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      formatted: false,
    },
    {
      role: "assistant",
      content: "Gue siap. Sniper mode aktif 🎯\n\nKasih tau gue pair yang mau lu analisa, atau minta gue buat scan setup sekarang.\n\nGue cuma masuk kalau setup A+ atau A — sisanya gue waiting.\nLess trades = Better trades.",
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      formatted: false,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [sidebarTab, setSidebarTab] = useState("pairs");
  const chatRef = useRef(null);

  const activeTrades = Object.entries(PAIRS).slice(0, 2);

  const now = () => new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = {
      role: "user",
      content: text,
      time: now(),
      formatted: false,
    };

    const newHistory = [...history, { role: "user", content: text }];

    setMessages((prev) => [...prev, userMsg]);
    setHistory(newHistory);
    setInput("");
    setLoading(true);

    const priceCtx = Object.entries(prices)
      .map(([k, v]) => `${k}: $${v.price.toFixed(2)} (${v.change >= 0 ? "+" : ""}${v.change.toFixed(2)}%)`)
      .join(", ");

    const contextualPrompt = `[LIVE PRICES: ${priceCtx}]\n[EXCHANGE: ${exchange}]\n[MODE: ${mode}]\n[STRATEGY: ${strategy}]\n\nUser: ${text}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SNIPER_SYSTEM,
          messages: [
            ...newHistory.slice(0, -1),
            { role: "user", content: contextualPrompt },
          ],
        }),
      });

      const data = await res.json();
      const reply = data.content?.[0]?.text || "Error: no response.";
      const isFormatted = reply.includes("MARKET BIAS") || reply.includes("ACTION") || reply.includes("SETUP QUALITY");

      const botMsg = {
        role: "assistant",
        content: reply,
        time: now(),
        formatted: isFormatted,
      };

      setMessages((prev) => [...prev, botMsg]);
      setHistory((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Connection error. Reconnecting...",
          time: now(),
          formatted: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, history, prices, exchange, mode, strategy]);

  const quickPrompts = [
    `Analisa ${selectedPair} sekarang`,
    "Scan semua pair, ada setup?",
    "Session WIB sekarang apa?",
    "BTC liquidity zone mana?",
  ];

  const pnlColor = (v) => (v >= 0 ? "#00f5a0" : "#ff3b5c");

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #050508; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0c0c14; }
        ::-webkit-scrollbar-thumb { background: #1e1e30; border-radius: 4px; }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        .input-field:focus { outline: none; }
        .chip:hover { background: #1e1e30 !important; }
        .quick-btn:hover { background: #00f5a015 !important; border-color: #00f5a040 !important; }
        .mode-btn:hover { opacity: 0.8; }
        .pair-card:hover { transform: translateX(2px); }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "#050508",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Syne', sans-serif",
        color: "#e2e8f0",
      }}>
        {/* TOP NAV */}
        <header style={{
          borderBottom: "1px solid #1c1c2a",
          padding: "0 20px",
          height: 52,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#050508",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 7,
              background: "linear-gradient(135deg, #00f5a0, #0072ff)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18,
              position: "relative",
              overflow: "hidden",
            }}>
              <img src="/sniper-mascot.jpg" alt="NOELA Sniper" style={{ width: 28, height: 28, borderRadius: 4, objectFit: "cover" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 15, letterSpacing: "-0.5px" }}>
                NOELA
              </span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#00f5a0", fontWeight: 600 }}>
                SNIPER SYSTEM
              </span>
            </div>
            <span style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 9,
              padding: "2px 7px",
              borderRadius: 4,
              background: "#00f5a020",
              color: "#00f5a0",
              border: "1px solid #00f5a030",
              marginLeft: 8,
            }}>
              LIVE
            </span>
          </div>

          {/* MODE SELECTOR */}
          <div style={{ display: "flex", gap: 4, background: "#0c0c14", borderRadius: 8, padding: 3, border: "1px solid #1c1c2a" }}>
            {MODES.map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="mode-btn"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 10,
                  padding: "4px 10px",
                  borderRadius: 5,
                  border: "none",
                  cursor: "pointer",
                  background: mode === m ? (m === "Auto Agent" ? "#00f5a0" : m === "Manual" ? "#4d9fff" : "#f5a623") : "transparent",
                  color: mode === m ? "#050508" : "#6b7280",
                  fontWeight: mode === m ? 700 : 400,
                  transition: "all 0.15s",
                }}
              >
                {m}
              </button>
            ))}
          </div>

          {/* EXCHANGE */}
          <div style={{ display: "flex", gap: 6 }}>
            {EXCHANGES.map((ex) => (
              <button
                key={ex.name}
                onClick={() => setExchange(ex.name)}
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 10,
                  padding: "4px 10px",
                  borderRadius: 6,
                  border: `1px solid ${exchange === ex.name ? ex.color + "60" : "#1c1c2a"}`,
                  background: exchange === ex.name ? ex.color + "15" : "transparent",
                  color: exchange === ex.name ? ex.color : "#4a5568",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <span style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: ex.status === "connected" ? "#00f5a0" : "#ff3b5c",
                  display: "inline-block",
                  animation: ex.status === "connected" ? "pulse 2s infinite" : "none",
                }}/>
                {ex.name}
              </button>
            ))}
          </div>
        </header>

        {/* MAIN BODY */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden", height: "calc(100vh - 52px)" }}>
          {/* LEFT SIDEBAR */}
          <aside style={{
            width: 200,
            borderRight: "1px solid #1c1c2a",
            display: "flex",
            flexDirection: "column",
            background: "#07070d",
            flexShrink: 0,
          }}>
            {/* Sidebar Tabs */}
            <div style={{
              display: "flex",
              borderBottom: "1px solid #1c1c2a",
              padding: "0 8px",
            }}>
              {["pairs", "trades"].map((t) => (
                <button
                  key={t}
                  onClick={() => setSidebarTab(t)}
                  style={{
                    flex: 1,
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 10,
                    padding: "10px 4px",
                    border: "none",
                    background: "transparent",
                    color: sidebarTab === t ? "#00f5a0" : "#4a5568",
                    borderBottom: `2px solid ${sidebarTab === t ? "#00f5a0" : "transparent"}`,
                    cursor: "pointer",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  {t === "pairs" ? "Pairs" : "Active"}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "10px 8px" }}>
              {sidebarTab === "pairs" ? (
                Object.entries(PAIRS).map(([id, data]) => (
                  <PairCard
                    key={id}
                    id={id}
                    data={data}
                    prices={prices}
                    selected={selectedPair === id}
                    onClick={() => setSelectedPair(id)}
                  />
                ))
              ) : (
                <>
                  {activeTrades.map(([pair, data]) => (
                    <ActiveTrade key={pair} pair={pair} data={data} />
                  ))}
                  <div style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 10,
                    color: "#4a5568",
                    textAlign: "center",
                    padding: "12px 0",
                  }}>
                    No more positions
                  </div>
                </>
              )}
            </div>

            {/* Strategy Picker */}
            <div style={{ padding: "10px 8px", borderTop: "1px solid #1c1c2a" }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#4a5568", marginBottom: 6, letterSpacing: 1 }}>
                STRATEGY
              </div>
              {STRATEGIES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStrategy(s)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 11,
                    padding: "5px 8px",
                    borderRadius: 6,
                    border: "none",
                    background: strategy === s ? "#00f5a015" : "transparent",
                    color: strategy === s ? "#00f5a0" : "#6b7280",
                    cursor: "pointer",
                    marginBottom: 2,
                    transition: "all 0.1s",
                  }}
                >
                  {strategy === s ? "▶ " : "  "}{s}
                </button>
              ))}
            </div>
          </aside>

          {/* CHAT MAIN */}
          <main style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}>
            {/* Selected Pair Header */}
            <div style={{
              padding: "10px 20px",
              borderBottom: "1px solid #1c1c2a",
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "#07070d",
            }}>
              <span style={{ fontSize: 20, color: PAIRS[selectedPair].color }}>
                {PAIRS[selectedPair].icon}
              </span>
              <div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 15 }}>
                  {PAIRS[selectedPair].symbol}
                </div>
                <div style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 10,
                  color: "#4a5568",
                }}>
                  {exchange} · {strategy} · {mode}
                </div>
              </div>
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <div style={{
                  fontFamily: "'Space Mono', monospace",
                  fontWeight: 700,
                  fontSize: 18,
                  color: "#fff",
                }}>
                  ${prices[selectedPair].price.toFixed(selectedPair === "BTC" ? 0 : 2)}
                </div>
                <div style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 11,
                  color: prices[selectedPair].change >= 0 ? "#00f5a0" : "#ff3b5c",
                }}>
                  {prices[selectedPair].change >= 0 ? "▲" : "▼"} {Math.abs(prices[selectedPair].change).toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Live Chart */}
            <div style={{
              padding: "16px 20px",
              borderBottom: "1px solid #1c1c2a",
              background: "#0c0c14",
            }}>
              <BinanceChart
                symbol={`${selectedPair}USDT`}
                interval="15m"
                height={350}
              />
            </div>

            {/* Messages */}
            <div
              ref={chatRef}
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px",
              }}
            >
              {messages.map((msg, i) => (
                <MessageBubble key={i} msg={msg} />
              ))}
              {loading && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: "linear-gradient(135deg, #00f5a0, #0072ff)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, flexShrink: 0,
                  }}>
                    🎯
                  </div>
                  <div style={{
                    background: "#12121e",
                    border: "1px solid #1e1e30",
                    borderRadius: "4px 12px 12px 12px",
                  }}>
                    <TypingIndicator />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Prompts */}
            <div style={{
              padding: "0 20px 10px",
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
            }}>
              {quickPrompts.map((q, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(q); }}
                  className="quick-btn"
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 10,
                    padding: "5px 10px",
                    borderRadius: 20,
                    border: "1px solid #1c1c2a",
                    background: "transparent",
                    color: "#6b7280",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div style={{
              padding: "10px 20px 16px",
              borderTop: "1px solid #1c1c2a",
            }}>
              <div style={{
                display: "flex",
                gap: 10,
                background: "#0c0c14",
                border: "1px solid #1c1c2a",
                borderRadius: 12,
                padding: "8px 12px",
                alignItems: "flex-end",
              }}
                onFocus={(e) => e.currentTarget.style.borderColor = "#00f5a040"}
                onBlur={(e) => e.currentTarget.style.borderColor = "#1c1c2a"}
              >
                <textarea
                  className="input-field"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={`Analisa ${selectedPair}, tanya setup, atau minta scan semua pair...`}
                  rows={1}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    color: "#e2e8f0",
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 13,
                    resize: "none",
                    lineHeight: 1.5,
                    maxHeight: 120,
                    overflow: "auto",
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  style={{
                    width: 34, height: 34,
                    borderRadius: 8,
                    border: "none",
                    background: loading || !input.trim()
                      ? "#1c1c2a"
                      : "linear-gradient(135deg, #00f5a0, #0072ff)",
                    color: loading || !input.trim() ? "#4a5568" : "#050508",
                    cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    transition: "all 0.15s",
                    flexShrink: 0,
                  }}
                >
                  {loading ? "⏳" : "↑"}
                </button>
              </div>
              <div style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 9,
                color: "#2d3748",
                marginTop: 6,
                textAlign: "center",
              }}>
                Enter to send · Shift+Enter for new line · Sniper rules always apply
              </div>
            </div>
          </main>

          {/* RIGHT PANEL */}
          <aside style={{
            width: 180,
            borderLeft: "1px solid #1c1c2a",
            background: "#07070d",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            overflowY: "auto",
            padding: "12px 10px",
          }}>
            {/* Session indicator */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#4a5568", letterSpacing: 1, marginBottom: 8 }}>
                SESSION
              </div>
              {(() => {
                const h = new Date().getHours();
                const session = h >= 20 ? { name: "New York", color: "#4d9fff", desc: "Expansion" }
                  : h >= 14 ? { name: "London", color: "#f5a623", desc: "Manipulation" }
                  : h >= 7 ? { name: "Asia", color: "#9b5de5", desc: "Accumulation" }
                  : { name: "Off-hours", color: "#4a5568", desc: "Range" };
                return (
                  <div style={{
                    background: session.color + "15",
                    border: `1px solid ${session.color}30`,
                    borderRadius: 8,
                    padding: "8px 10px",
                  }}>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: session.color }}>
                      {session.name}
                    </div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#6b7280", marginTop: 2 }}>
                      {session.desc}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Risk stats */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#4a5568", letterSpacing: 1, marginBottom: 8 }}>
                RISK RULES
              </div>
              {[
                { label: "Min R:R", value: "1:3", ok: true },
                { label: "Min Conf.", value: "3x", ok: true },
                { label: "Max Lev.", value: "x50", ok: true },
                { label: "FOMO", value: "OFF", ok: true },
              ].map((r) => (
                <div key={r.label} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "4px 0",
                  borderBottom: "1px solid #1c1c2a",
                }}>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#4a5568" }}>{r.label}</span>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: r.ok ? "#00f5a0" : "#ff3b5c", fontWeight: 700 }}>
                    {r.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Market bias live */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#4a5568", letterSpacing: 1, marginBottom: 8 }}>
                BIAS LIVE
              </div>
              {Object.entries(PAIRS).map(([id, data]) => {
                const ch = prices[id].change;
                const bias = ch > 1 ? "Bull" : ch < -1 ? "Bear" : "Neutral";
                const col = ch > 1 ? "#00f5a0" : ch < -1 ? "#ff3b5c" : "#f5a623";
                return (
                  <div key={id} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "4px 0",
                    borderBottom: "1px solid #1c1c2a",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 12, color: data.color }}>{data.icon}</span>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#6b7280" }}>{id}</span>
                    </div>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: col, fontWeight: 700 }}>
                      {bias}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Sniper score */}
            <div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#4a5568", letterSpacing: 1, marginBottom: 8 }}>
                SNIPER STATUS
              </div>
              <div style={{
                background: "#0c0c14",
                border: "1px solid #1c1c2a",
                borderRadius: 8,
                padding: "10px",
                textAlign: "center",
              }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>🎯</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 12, color: "#00f5a0" }}>
                  WAITING
                </div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#4a5568", marginTop: 3 }}>
                  Scanning for A+ setup
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
