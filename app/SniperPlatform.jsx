'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import BinanceChart from './components/BinanceChart'

const PAIRS = {
  BTC: { symbol:'BTC/USDT', binance:'BTCUSDT', base:67420, color:'#f7931a', icon:'₿' },
  ETH: { symbol:'ETH/USDT', binance:'ETHUSDT', base:3541,  color:'#627eea', icon:'Ξ' },
  SOL: { symbol:'SOL/USDT', binance:'SOLUSDT', base:182,   color:'#9945ff', icon:'◎' },
  BNB: { symbol:'BNB/USDT', binance:'BNBUSDT', base:598,   color:'#f3ba2f', icon:'⬡' },
}
const EXCHANGES  = [
  { name:'Binance', color:'#f3ba2f', on:true  },
  { name:'Bybit',   color:'#f7a600', on:true  },
  { name:'OKX',     color:'#00b4d8', on:false },
]
const STRATEGIES = ['Sniper','Grid Bot','Swing','Scalping','DCA']
const MODES      = ['Auto Agent','Semi-Auto','Manual']

function getSession() {
  const h = new Date().getHours()
  if (h >= 20) return { name:'New York', color:'#4d9fff', desc:'Expansion',    range:'20:30+' }
  if (h >= 14) return { name:'London',   color:'#f5a623', desc:'Manipulation', range:'14:00–22:00' }
  if (h >= 7)  return { name:'Asia',     color:'#9b5de5', desc:'Accumulation', range:'07:00–15:00' }
  return               { name:'Off',     color:'#4a5568', desc:'Range',        range:'—' }
}

function now() {
  return new Date().toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' })
}

function parseSignal(content) {
  const get = key => {
    const m = content.match(new RegExp(`${key}\\s*:\\s*(.+)`))
    return m ? m[1].trim() : null
  }
  return {
    action:  get('ACTION'),
    entry:   get('ENTRY'),
    sl:      get('STOP LOSS'),
    tp:      get('TAKE PROFIT'),
    rr:      get('R:R'),
    lev:     get('LEVERAGE'),
    quality: get('SETUP QUALITY'),
  }
}

function usePrices() {
  const [prices, setPrices] = useState(
    Object.fromEntries(Object.entries(PAIRS).map(([k,v]) => [k, {
      price:   v.base,
      change:  (Math.random()-0.5)*4,
      history: Array.from({ length:30 }, () => v.base*(1+(Math.random()-0.5)*0.015)),
    }]))
  )
  useEffect(() => {
    const load = async () => {
      try {
        const symbols = JSON.stringify(Object.values(PAIRS).map(p => p.binance))
        const res  = await fetch(`/api/binance/ticker?symbols=${encodeURIComponent(symbols)}`)
        const data = await res.json()
        if (!Array.isArray(data)) return
        setPrices(prev => {
          const next = { ...prev }
          data.forEach(t => {
            const entry = Object.entries(PAIRS).find(([,v]) => v.binance === t.symbol)
            if (entry) {
              const [id] = entry
              const price = parseFloat(t.lastPrice), change = parseFloat(t.priceChangePercent)
              next[id] = { ...prev[id], price, change, history:[...prev[id].history.slice(1), price] }
            }
          })
          return next
        })
      } catch {}
    }
    load()
    const iv = setInterval(load, 5000)
    return () => clearInterval(iv)
  }, [])
  return prices
}

function SparkLine({ history, positive }) {
  const min = Math.min(...history), max = Math.max(...history), r = max-min||1
  const W=64, H=22
  const pts = history.map((v,i) => `${(i/(history.length-1))*W},${H-((v-min)/r)*H}`).join(' ')
  return <svg width={W} height={H} style={{ display:'block' }}><polyline points={pts} fill="none" stroke={positive?'#00f5a0':'#ff3b5c'} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/></svg>
}

function TypingDots() {
  return (
    <div style={{ display:'flex',gap:4,padding:'12px 14px' }}>
      {[0,1,2].map(i => <div key={i} style={{ width:6,height:6,borderRadius:'50%',background:'#00f5a0',animation:`bounce 1s ${i*0.15}s infinite` }}/>)}
    </div>
  )
}

function BankrPanel({ signal, pair, mode, onClose }) {
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState('')
  const [amount, setAmount] = useState('50')
  const isAuto = mode === 'Auto Agent'
  const isLong = signal.action?.includes('LONG')
  const color  = isLong ? '#00f5a0' : '#ff3b5c'

  const execute = useCallback(async () => {
    setStatus('executing')
    const dir    = isLong ? 'buy' : 'sell'
    const tp1    = signal.tp?.split('/')[0]?.replace('TP1','').trim() || ''
    const prompt = `${dir} $${amount} of ${pair} at market. SL: ${signal.sl}. TP: ${tp1}.`
    try {
      const res  = await fetch('/api/bankr', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ prompt, readOnly:false }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data.response || 'Order submitted.')
      setStatus('success')
    } catch (err) {
      setResult(err.message || 'Execution failed.')
      setStatus('error')
    }
  }, [signal, pair, amount, isLong])

  useEffect(() => {
    if (isAuto && signal.quality?.includes('A+')) {
      const t = setTimeout(execute, 1500)
      return () => clearTimeout(t)
    }
  }, [])

  return (
    <div style={{ marginTop:8,background:'#0c0c14',border:`1px solid ${color}25`,borderRadius:10,padding:'12px 14px',position:'relative' }}>
      <button onClick={onClose} style={{ position:'absolute',top:8,right:10,background:'transparent',border:'none',color:'#4a5568',cursor:'pointer',fontSize:13 }}>✕</button>

      <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:10 }}>
        <div style={{ width:26,height:26,borderRadius:6,background:'linear-gradient(135deg,#00f5a0,#0072ff)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12 }}>⚡</div>
        <div>
          <div style={{ fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:12,color:'#fff' }}>Execute via Bankr</div>
          <div style={{ fontFamily:"'Space Mono',monospace",fontSize:9,color:'#4a5568' }}>
            {isAuto&&signal.quality?.includes('A+') ? 'AUTO EXECUTING...' : 'Confirm to execute'}
          </div>
        </div>
        <span style={{ marginLeft:'auto',fontFamily:"'Space Mono',monospace",fontSize:11,fontWeight:700,color }}>{signal.action}</span>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px 10px',marginBottom:10 }}>
        {[['Entry',signal.entry],['SL',signal.sl],['TP',signal.tp?.split('/')[0]?.replace('TP1','').trim()],['R:R',signal.rr],['Lev',signal.lev],['Quality',signal.quality]].map(([l,v]) => v && (
          <div key={l} style={{ display:'flex',justifyContent:'space-between',padding:'2px 0',borderBottom:'1px solid #1c1c2a' }}>
            <span style={{ fontFamily:"'Space Mono',monospace",fontSize:9,color:'#4a5568' }}>{l}</span>
            <span style={{ fontFamily:"'Space Mono',monospace",fontSize:9,color:'#e2e8f0',fontWeight:700 }}>{v}</span>
          </div>
        ))}
      </div>

      {status==='idle' && (
        <div style={{ display:'flex',gap:8,alignItems:'center' }}>
          <span style={{ fontFamily:"'Space Mono',monospace",fontSize:11,color:'#6b7280' }}>$</span>
          <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} style={{ flex:1,background:'#07070d',border:'1px solid #1c1c2a',borderRadius:5,padding:'4px 8px',color:'#fff',fontFamily:"'Space Mono',monospace",fontSize:11,outline:'none' }}/>
          <button onClick={execute} style={{ padding:'5px 14px',borderRadius:6,border:'none',cursor:'pointer',background:`linear-gradient(135deg,${color},#0072ff)`,color:'#050508',fontFamily:"'Space Mono',monospace",fontSize:11,fontWeight:700 }}>
            {isLong?'BUY':'SELL'} →
          </button>
        </div>
      )}
      {status==='executing' && <div style={{ fontFamily:"'Space Mono',monospace",fontSize:11,color:'#4a5568',display:'flex',alignItems:'center',gap:6 }}><span style={{ width:5,height:5,borderRadius:'50%',background:'#00f5a0',display:'inline-block',animation:'pulse 1s infinite' }}/>Sending to Bankr...</div>}
      {status==='success'   && <div style={{ fontFamily:"'Space Mono',monospace",fontSize:11,color:'#00f5a0',padding:'5px 8px',background:'#00f5a010',borderRadius:5 }}>✓ {result}</div>}
      {status==='error'     && <div style={{ fontFamily:"'Space Mono',monospace",fontSize:11,color:'#ff3b5c',padding:'5px 8px',background:'#ff3b5c10',borderRadius:5 }}>✕ {result}</div>}
      <div style={{ fontFamily:"'Space Mono',monospace",fontSize:9,color:'#2d3748',marginTop:8,textAlign:'center' }}>Powered by Bankr · USDC on Base</div>
    </div>
  )
}

function Msg({ m, mode, pair }) {
  const [showBankr, setShowBankr] = useState(false)
  const signal = m.role==='assistant' && m.fmt ? parseSignal(m.content) : null
  const isActionable = signal?.action && (signal.action.includes('LONG')||signal.action.includes('SHORT'))
  const isGood = signal?.quality?.includes('A+')||signal?.quality==='A'

  useEffect(() => { if (isActionable && isGood) setShowBankr(true) }, [])

  if (m.role==='system') return (
    <div style={{ textAlign:'center',padding:'6px 0',color:'#4a5568',fontFamily:"'Space Mono',monospace",fontSize:11 }}>— {m.content} —</div>
  )
  const bot = m.role==='assistant'
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:'flex', justifyContent:bot?'flex-start':'flex-end' }}>
        {bot && <div style={{ width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#00f5a0,#0072ff)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,marginRight:8,flexShrink:0,marginTop:2 }}>🎯</div>}
        <div style={{ maxWidth:'78%',background:bot?'#12121e':'#00f5a015',border:`1px solid ${bot?'#1e1e30':'#00f5a030'}`,borderRadius:bot?'4px 12px 12px 12px':'12px 4px 12px 12px',padding:'10px 14px' }}>
          <pre style={{ margin:0,fontFamily:m.fmt?"'Space Mono',monospace":"'Syne',sans-serif",fontSize:m.fmt?11.5:13,color:'#d4dae4',lineHeight:1.65,whiteSpace:'pre-wrap',wordBreak:'break-word' }}>{m.content}</pre>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:6 }}>
            <span style={{ fontFamily:"'Space Mono',monospace",fontSize:10,color:'#2d3748' }}>{m.time}</span>
            {isActionable && !showBankr && (
              <button onClick={()=>setShowBankr(true)} style={{ fontFamily:"'Space Mono',monospace",fontSize:9,padding:'2px 8px',borderRadius:4,border:'1px solid #00f5a030',background:'#00f5a010',color:'#00f5a0',cursor:'pointer' }}>
                ⚡ Execute
              </button>
            )}
          </div>
        </div>
      </div>
      {showBankr && isActionable && signal && (
        <div style={{ marginLeft:36 }}>
          <BankrPanel signal={signal} pair={pair} mode={mode} onClose={()=>setShowBankr(false)} />
        </div>
      )}
    </div>
  )
}

export default function SniperPlatform() {
  const prices = usePrices()
  const [pair,     setPair]     = useState('BTC')
  const [mode,     setMode]     = useState('Semi-Auto')
  const [strategy, setStrategy] = useState('Sniper')
  const [exchange, setExchange] = useState('Binance')
  const [tab,      setTab]      = useState('pairs')
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [history,  setHistory]  = useState([])
  const [msgs,     setMsgs]     = useState([{
    role:'assistant',
    content:'Gue siap. Sniper mode aktif.\n\nMTF analysis: 15m / 30m / 1H / 4H real-time.\nKalau ada setup A+ → tombol ⚡ Execute muncul otomatis via Bankr.',
    time:now(), fmt:false,
  }])
  const chatRef = useRef(null)
  const session = getSession()

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [msgs, loading])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return
    const uMsg = { role:'user', content:text, time:now(), fmt:false }
    const newH = [...history, { role:'user', content:text }]
    setMsgs(p => [...p, uMsg])
    setHistory(newH)
    setInput('')
    setLoading(true)

    const px = Object.entries(prices)
      .map(([k,v]) => `${k}: $${v.price.toFixed(v.price>100?2:3)} (${v.change>=0?'+':''}${v.change.toFixed(2)}%)`)
      .join(', ')

    try {
      const res  = await fetch('/api/chat', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ messages:newH, context:{ prices:px, exchange, mode, strategy, session:`${session.name} - ${session.desc}` } }),
      })
      const data  = await res.json()
      const reply = data.content || data.error || 'No response.'
      const fmt   = reply.includes('MARKET BIAS')||reply.includes('ACTION')||reply.includes('SETUP QUALITY')
      setMsgs(p  => [...p, { role:'assistant', content:reply, time:now(), fmt }])
      setHistory(p => [...p, { role:'assistant', content:reply }])
    } catch {
      setMsgs(p => [...p, { role:'assistant', content:'Connection error. Coba lagi.', time:now(), fmt:false }])
    } finally { setLoading(false) }
  }, [input, loading, history, prices, exchange, mode, strategy, session])

  const quick = [
    `Analisa ${pair} sekarang`,
    'Scan semua pair',
    'Session WIB sekarang?',
    `${pair} liquidity zone?`,
  ]

  const sess = getSession()

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');
        .qbtn:hover{background:#00f5a015!important;border-color:#00f5a040!important;color:#00f5a0!important}
        .mbtn:hover{opacity:.85} .sbtn:hover:not(:disabled){transform:scale(1.05)}
        textarea:focus,input:focus{outline:none}
        @keyframes bounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-5px);opacity:1}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
      `}</style>

      <div style={{ height:'100vh',background:'#050508',display:'flex',flexDirection:'column',fontFamily:"'Syne',sans-serif",color:'#e2e8f0',overflow:'hidden' }}>

        {/* HEADER */}
        <header style={{ borderBottom:'1px solid #1c1c2a',padding:'0 20px',height:52,display:'flex',alignItems:'center',justifyContent:'space-between',background:'#050508',flexShrink:0 }}>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <a href="/" style={{ display:'flex',alignItems:'center',gap:10,textDecoration:'none' }}>
              <div style={{ width:30,height:30,borderRadius:8,background:'linear-gradient(135deg,#00f5a0,#0072ff)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15 }}>🎯</div>
              <span style={{ fontWeight:800,fontSize:17,letterSpacing:'-0.5px',color:'#fff' }}>NOELA</span>
            </a>
            <span style={{ fontFamily:"'Space Mono',monospace",fontSize:9,padding:'2px 7px',borderRadius:4,background:'#00f5a020',color:'#00f5a0',border:'1px solid #00f5a030' }}>LIVE</span>
          </div>
          <div style={{ display:'flex',gap:3,background:'#0c0c14',borderRadius:8,padding:3,border:'1px solid #1c1c2a' }}>
            {MODES.map(m=>(
              <button key={m} onClick={()=>setMode(m)} className="mbtn" style={{ fontFamily:"'Space Mono',monospace",fontSize:10,padding:'4px 11px',borderRadius:5,border:'none',cursor:'pointer',transition:'all 0.15s',background:mode===m?(m==='Auto Agent'?'#00f5a0':m==='Manual'?'#4d9fff':'#f5a623'):'transparent',color:mode===m?'#050508':'#6b7280',fontWeight:mode===m?700:400 }}>
                {m}
              </button>
            ))}
          </div>
          <div style={{ display:'flex',gap:6 }}>
            {EXCHANGES.map(ex=>(
              <button key={ex.name} onClick={()=>setExchange(ex.name)} style={{ fontFamily:"'Space Mono',monospace",fontSize:10,padding:'4px 10px',borderRadius:6,cursor:'pointer',transition:'all 0.15s',border:`1px solid ${exchange===ex.name?ex.color+'60':'#1c1c2a'}`,background:exchange===ex.name?ex.color+'15':'transparent',color:exchange===ex.name?ex.color:'#4a5568',display:'flex',alignItems:'center',gap:5 }}>
                <span style={{ width:5,height:5,borderRadius:'50%',background:ex.on?'#00f5a0':'#ff3b5c',display:'inline-block',animation:ex.on?'pulse 2s infinite':'none' }}/>
                {ex.name}
              </button>
            ))}
          </div>
        </header>

        <div style={{ display:'flex',flex:1,overflow:'hidden' }}>

          {/* LEFT SIDEBAR */}
          <aside style={{ width:196,borderRight:'1px solid #1c1c2a',display:'flex',flexDirection:'column',background:'#07070d',flexShrink:0 }}>
            <div style={{ display:'flex',borderBottom:'1px solid #1c1c2a',padding:'0 8px' }}>
              {['pairs','trades'].map(t=>(
                <button key={t} onClick={()=>setTab(t)} style={{ flex:1,fontFamily:"'Space Mono',monospace",fontSize:10,padding:'10px 4px',border:'none',background:'transparent',cursor:'pointer',textTransform:'uppercase',letterSpacing:1,color:tab===t?'#00f5a0':'#4a5568',borderBottom:`2px solid ${tab===t?'#00f5a0':'transparent'}` }}>
                  {t==='pairs'?'Pairs':'Active'}
                </button>
              ))}
            </div>
            <div style={{ flex:1,overflowY:'auto',padding:'10px 8px' }}>
              {tab==='pairs'
                ? Object.entries(PAIRS).map(([id,data])=>{
                    const p=prices[id], pos=p.change>=0
                    return (
                      <div key={id} onClick={()=>setPair(id)} style={{ background:pair===id?`${data.color}12`:'#0c0c14',border:`1px solid ${pair===id?data.color+'50':'#1c1c2a'}`,borderRadius:10,padding:'10px 12px',cursor:'pointer',transition:'all 0.2s',marginBottom:6 }}>
                        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4 }}>
                          <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                            <span style={{ fontSize:14,color:data.color }}>{data.icon}</span>
                            <span style={{ fontWeight:700,fontSize:13 }}>{id}</span>
                          </div>
                          <span style={{ fontFamily:"'Space Mono',monospace",fontSize:10,color:pos?'#00f5a0':'#ff3b5c' }}>{pos?'+':''}{p.change.toFixed(2)}%</span>
                        </div>
                        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-end' }}>
                          <span style={{ fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:700,color:'#fff' }}>${p.price.toFixed(id==='BTC'?0:2)}</span>
                          <SparkLine history={p.history} positive={pos}/>
                        </div>
                      </div>
                    )
                  })
                : (<>
                    {Object.entries(PAIRS).slice(0,2).map(([id,data])=>{
                      const pnl=((Math.random()-.4)*8).toFixed(2), pos=Number(pnl)>=0
                      return (
                        <div key={id} style={{ background:'#0c0c14',border:`1px solid ${pos?'#00f5a030':'#ff3b5c30'}`,borderRadius:8,padding:'8px 10px',marginBottom:6 }}>
                          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                            <div style={{ display:'flex',alignItems:'center',gap:5 }}>
                              <span style={{ color:data.color }}>{data.icon}</span>
                              <span style={{ fontWeight:700,fontSize:12 }}>{id}</span>
                              <span style={{ fontFamily:"'Space Mono',monospace",fontSize:9,padding:'1px 5px',borderRadius:3,background:pos?'#00f5a020':'#ff3b5c20',color:pos?'#00f5a0':'#ff3b5c' }}>{pos?'LONG':'SHORT'}</span>
                            </div>
                            <span style={{ fontFamily:"'Space Mono',monospace",fontSize:12,fontWeight:700,color:pos?'#00f5a0':'#ff3b5c' }}>{pos?'+':''}{pnl}%</span>
                          </div>
                        </div>
                      )
                    })}
                    <div style={{ fontFamily:"'Space Mono',monospace",fontSize:10,color:'#4a5568',textAlign:'center',padding:'10px 0' }}>No more positions</div>
                  </>)
              }
            </div>
            <div style={{ padding:'10px 8px',borderTop:'1px solid #1c1c2a' }}>
              <div style={{ fontFamily:"'Space Mono',monospace",fontSize:9,color:'#4a5568',letterSpacing:1,marginBottom:6 }}>STRATEGY</div>
              {STRATEGIES.map(s=>(
                <button key={s} onClick={()=>setStrategy(s)} style={{ display:'block',width:'100%',textAlign:'left',fontFamily:"'Space Mono',monospace",fontSize:11,padding:'5px 8px',borderRadius:6,border:'none',cursor:'pointer',marginBottom:2,transition:'all 0.1s',background:strategy===s?'#00f5a015':'transparent',color:strategy===s?'#00f5a0':'#6b7280' }}>
                  {strategy===s?'▶ ':'  '}{s}
                </button>
              ))}
            </div>
          </aside>

          {/* MAIN */}
          <main style={{ flex:1,display:'flex',flexDirection:'column',overflow:'hidden' }}>
            <div style={{ padding:'8px 16px',borderBottom:'1px solid #1c1c2a',display:'flex',alignItems:'center',gap:12,background:'#07070d',flexShrink:0 }}>
              <span style={{ fontSize:20,color:PAIRS[pair].color }}>{PAIRS[pair].icon}</span>
              <div>
                <div style={{ fontWeight:800,fontSize:15 }}>{PAIRS[pair].symbol}</div>
                <div style={{ fontFamily:"'Space Mono',monospace",fontSize:10,color:'#4a5568' }}>{exchange} · {strategy} · {mode}</div>
              </div>
              <div style={{ marginLeft:'auto',textAlign:'right' }}>
                <div style={{ fontFamily:"'Space Mono',monospace",fontWeight:700,fontSize:20,color:'#fff' }}>
                  ${prices[pair].price.toFixed(pair==='BTC'?0:2)}
                </div>
                <div style={{ fontFamily:"'Space Mono',monospace",fontSize:11,color:prices[pair].change>=0?'#00f5a0':'#ff3b5c' }}>
                  {prices[pair].change>=0?'▲':'▼'} {Math.abs(prices[pair].change).toFixed(2)}%
                </div>
              </div>
            </div>

            <div style={{ padding:'10px 16px',borderBottom:'1px solid #1c1c2a',background:'#07070d',flexShrink:0 }}>
              <BinanceChart symbol={PAIRS[pair].binance} pairColor={PAIRS[pair].color} height={200}/>
            </div>

            <div ref={chatRef} style={{ flex:1,overflowY:'auto',padding:'16px 20px' }}>
              {msgs.map((m,i)=><Msg key={i} m={m} mode={mode} pair={pair}/>)}
              {loading && (
                <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:12 }}>
                  <div style={{ width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#00f5a0,#0072ff)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,flexShrink:0 }}>🎯</div>
                  <div style={{ background:'#12121e',border:'1px solid #1e1e30',borderRadius:'4px 12px 12px 12px' }}><TypingDots/></div>
                </div>
              )}
            </div>

            <div style={{ padding:'0 20px 10px',display:'flex',gap:6,flexWrap:'wrap',flexShrink:0 }}>
              {quick.map((q,i)=>(
                <button key={i} onClick={()=>setInput(q)} className="qbtn" style={{ fontFamily:"'Space Mono',monospace",fontSize:10,padding:'5px 12px',borderRadius:20,border:'1px solid #1c1c2a',background:'transparent',color:'#6b7280',cursor:'pointer',transition:'all 0.15s' }}>
                  {q}
                </button>
              ))}
            </div>

            <div style={{ padding:'0 20px 16px',borderTop:'1px solid #1c1c2a',paddingTop:10,flexShrink:0 }}>
              <div style={{ display:'flex',gap:10,background:'#0c0c14',border:'1px solid #1c1c2a',borderRadius:12,padding:'8px 12px',alignItems:'flex-end' }}>
                <textarea
                  value={input} onChange={e=>setInput(e.target.value)}
                  onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}}
                  placeholder={`Analisa ${pair}, tanya setup, atau scan semua pair...`}
                  rows={1}
                  style={{ flex:1,background:'transparent',border:'none',color:'#e2e8f0',fontFamily:"'Syne',sans-serif",fontSize:13,resize:'none',lineHeight:1.5,maxHeight:100,overflow:'auto' }}
                />
                <button onClick={send} disabled={loading||!input.trim()} className="sbtn" style={{ width:34,height:34,borderRadius:8,border:'none',flexShrink:0,cursor:loading||!input.trim()?'not-allowed':'pointer',background:loading||!input.trim()?'#1c1c2a':'linear-gradient(135deg,#00f5a0,#0072ff)',color:loading||!input.trim()?'#4a5568':'#050508',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,transition:'all 0.15s' }}>
                  {loading?'⏳':'↑'}
                </button>
              </div>
            </div>
          </main>

          {/* RIGHT PANEL */}
          <aside style={{ width:176,borderLeft:'1px solid #1c1c2a',background:'#07070d',display:'flex',flexDirection:'column',flexShrink:0,overflowY:'auto',padding:'12px 10px' }}>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontFamily:"'Space Mono',monospace",fontSize:9,color:'#4a5568',letterSpacing:1,marginBottom:8 }}>SESSION</div>
              <div style={{ background:sess.color+'15',border:`1px solid ${sess.color}30`,borderRadius:8,padding:'8px 10px' }}>
                <div style={{ fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:12,color:sess.color }}>{sess.name}</div>
                <div style={{ fontFamily:"'Space Mono',monospace",fontSize:10,color:'#6b7280',marginTop:2 }}>{sess.desc}</div>
                <div style={{ fontFamily:"'Space Mono',monospace",fontSize:9,color:'#4a5568',marginTop:2 }}>{sess.range}</div>
              </div>
            </div>

            <div style={{ marginBottom:16 }}>
              <div style={{ fontFamily:"'Space Mono',monospace",fontSize:9,color:'#4a5568',letterSpacing:1,marginBottom:8 }}>RULES</div>
              {[['Min R:R','1:3'],['MTF','4TF'],['Max Lev','×50'],['FOMO','OFF'],['Avg Down','OFF']].map(([l,v])=>(
                <div key={l} style={{ display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:'1px solid #1c1c2a' }}>
                  <span style={{ fontFamily:"'Space Mono',monospace",fontSize:10,color:'#4a5568' }}>{l}</span>
                  <span style={{ fontFamily:"'Space Mono',monospace",fontSize:10,color:'#00f5a0',fontWeight:700 }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ marginBottom:16 }}>
              <div style={{ fontFamily:"'Space Mono',monospace",fontSize:9,color:'#4a5568',letterSpacing:1,marginBottom:8 }}>BIAS</div>
              {Object.entries(PAIRS).map(([id,data])=>{
                const ch=prices[id].change, bias=ch>1?'Bull':ch<-1?'Bear':'Neutral', col=ch>1?'#00f5a0':ch<-1?'#ff3b5c':'#f5a623'
                return (
                  <div key={id} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'4px 0',borderBottom:'1px solid #1c1c2a' }}>
                    <div style={{ display:'flex',alignItems:'center',gap:4 }}>
                      <span style={{ color:data.color,fontSize:12 }}>{data.icon}</span>
                      <span style={{ fontFamily:"'Space Mono',monospace",fontSize:10,color:'#6b7280' }}>{id}</span>
                    </div>
                    <span style={{ fontFamily:"'Space Mono',monospace",fontSize:10,color:col,fontWeight:700 }}>{bias}</span>
                  </div>
                )
              })}
            </div>

            <div style={{ background:'#0c0c14',border:'1px solid #1c1c2a',borderRadius:8,padding:'10px',textAlign:'center' }}>
              <div style={{ fontSize:18,marginBottom:4 }}>⚡</div>
              <div style={{ fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:11,color:'#00f5a0' }}>Bankr Ready</div>
              <div style={{ fontFamily:"'Space Mono',monospace",fontSize:9,color:'#4a5568',marginTop:3 }}>Auto-exec on A+</div>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}
