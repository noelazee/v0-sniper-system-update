'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import BinanceChart from './components/BinanceChart'

const PAIRS = {
  BTC: { symbol:'BTC/USDT', binance:'BTCUSDT', base:67420, color:'#f7931a', icon:'₿', logo:'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png' },
  ETH: { symbol:'ETH/USDT', binance:'ETHUSDT', base:3541,  color:'#627eea', icon:'Ξ', logo:'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png' },
  SOL: { symbol:'SOL/USDT', binance:'SOLUSDT', base:182,   color:'#9945ff', icon:'◎', logo:'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png' },
  BNB: { symbol:'BNB/USDT', binance:'BNBUSDT', base:598,   color:'#f3ba2f', icon:'⬡', logo:'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png' },
}
const EXCHANGES  = [{ name:'Binance', color:'#f3ba2f', on:true }, { name:'Bybit', color:'#f7a600', on:true }, { name:'OKX', color:'#00b4d8', on:false }]
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

function useIsMobile() {
  const [m, setM] = useState(false)
  useEffect(() => {
    const check = () => setM(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return m
}

function parseSignal(content) {
  const get = key => { const m = content.match(new RegExp(`${key}\\s*:\\s*(.+)`)); return m ? m[1].trim() : null }
  return { action:get('ACTION'), entry:get('ENTRY'), sl:get('STOP LOSS'), tp:get('TAKE PROFIT'), rr:get('R:R'), lev:get('LEVERAGE'), quality:get('SETUP QUALITY') }
}

function usePrices() {
  const [prices, setPrices] = useState(
    Object.fromEntries(Object.entries(PAIRS).map(([k,v]) => [k, { price:v.base, change:0, history:Array.from({length:30},()=>v.base*(1+(Math.random()-0.5)*0.015)), live:false }]))
  )
  useEffect(() => {
    const load = async () => {
      try {
        const symbols = JSON.stringify(Object.values(PAIRS).map(p => p.binance))
        const res = await fetch(`/api/binance/ticker?symbols=${encodeURIComponent(symbols)}`)
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setPrices(prev => {
            const next = { ...prev }
            data.forEach(t => {
              const entry = Object.entries(PAIRS).find(([,v]) => v.binance === t.symbol)
              if (entry) {
                const [id] = entry
                next[id] = { ...prev[id], price:parseFloat(t.lastPrice), change:parseFloat(t.priceChangePercent), live:true, history:[...prev[id].history.slice(1), parseFloat(t.lastPrice)] }
              }
            })
            return next
          })
          return
        }
      } catch {}
      try {
        const res = await fetch('/api/cmc?symbols=BTC,ETH,SOL,BNB')
        const data = await res.json()
        if (data && !data.error) {
          setPrices(prev => {
            const next = { ...prev }
            Object.entries(data).forEach(([sym, info]) => {
              if (next[sym]) next[sym] = { ...prev[sym], price:parseFloat(info.price), change:parseFloat(info.change24h), live:true, history:[...prev[sym].history.slice(1), parseFloat(info.price)] }
            })
            return next
          })
        }
      } catch {}
    }
    load()
    const iv = setInterval(load, 5000)
    return () => clearInterval(iv)
  }, [])
  return prices
}

function TokenLogo({ id, size=20 }) {
  const [err, setErr] = useState(false)
  const d = PAIRS[id]
  if (err) return <span style={{ fontSize:size*0.8, color:d.color }}>{d.icon}</span>
  return <img src={d.logo} alt={id} width={size} height={size} onError={()=>setErr(true)} style={{ borderRadius:'50%', display:'block', flexShrink:0 }}/>
}

function SparkLine({ history, positive }) {
  const min=Math.min(...history), max=Math.max(...history), r=max-min||1
  const W=52, H=18
  const pts = history.map((v,i)=>`${(i/(history.length-1))*W},${H-((v-min)/r)*H}`).join(' ')
  return <svg width={W} height={H}><polyline points={pts} fill="none" stroke={positive?'#00f5a0':'#ff3b5c'} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/></svg>
}

function TypingDots() {
  return (
    <div style={{ display:'flex', gap:4, padding:'8px 12px' }}>
      {[0,1,2].map(i=><div key={i} style={{ width:6,height:6,borderRadius:'50%',background:'#00f5a0',animation:`bounce 1s ${i*0.15}s infinite` }}/>)}
    </div>
  )
}

function BankrPanel({ signal, pair, mode, onClose }) {
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState('')
  const [amount, setAmount] = useState('50')
  const isAuto = mode==='Auto Agent'
  const isLong = signal.action?.includes('LONG')
  const color  = isLong ? '#00f5a0' : '#ff3b5c'
  const execute = useCallback(async () => {
    setStatus('executing')
    const dir = isLong ? 'buy' : 'sell'
    const tp1 = signal.tp?.split('/')[0]?.replace('TP1','').trim() || ''
    try {
      const res  = await fetch('/api/bankr', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ prompt:`${dir} $${amount} of ${pair} at market. SL: ${signal.sl}. TP: ${tp1}.`, readOnly:false }) })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data.response || 'Order submitted.')
      setStatus('success')
    } catch (err) { setResult(err.message||'Failed.'); setStatus('error') }
  }, [signal, pair, amount, isLong])
  useEffect(() => { if (isAuto && signal.quality?.includes('A+')) { const t=setTimeout(execute,1500); return ()=>clearTimeout(t) } }, [])
  return (
    <div style={{ background:'#0d0d1a', border:`1px solid ${color}30`, borderRadius:10, padding:'12px', position:'relative', marginTop:6 }}>
      <button onClick={onClose} style={{ position:'absolute',top:6,right:8,background:'transparent',border:'none',color:'#4a5568',cursor:'pointer',fontSize:13 }}>✕</button>
      <div style={{ display:'flex',alignItems:'center',gap:7,marginBottom:8 }}>
        <div style={{ width:22,height:22,borderRadius:5,background:'linear-gradient(135deg,#00f5a0,#0072ff)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11 }}>⚡</div>
        <span style={{ fontSize:11,fontWeight:800,color:'#fff' }}>Bankr Execute</span>
        <span style={{ marginLeft:'auto',fontSize:11,fontWeight:700,color }}>{signal.action}</span>
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'3px 8px',marginBottom:8 }}>
        {[['Entry',signal.entry],['SL',signal.sl],['TP',signal.tp?.split('/')[0]?.replace('TP1','').trim()],['R:R',signal.rr],['Lev',signal.lev],['Quality',signal.quality]].map(([l,v])=>v&&(
          <div key={l} style={{ display:'flex',justifyContent:'space-between',padding:'2px 0',borderBottom:'1px solid #1c1c2a' }}>
            <span style={{ fontSize:9,color:'#4a5568' }}>{l}</span>
            <span style={{ fontSize:9,color:'#e2e8f0',fontWeight:700 }}>{v}</span>
          </div>
        ))}
      </div>
      {status==='idle' && (
        <div style={{ display:'flex',gap:6,alignItems:'center' }}>
          <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="USDC" style={{ flex:1,background:'#07070d',border:'1px solid #1c1c2a',borderRadius:5,padding:'5px 8px',color:'#fff',fontSize:12,outline:'none' }}/>
          <button onClick={execute} style={{ padding:'5px 14px',borderRadius:6,border:'none',cursor:'pointer',background:`linear-gradient(135deg,${color},#0072ff)`,color:'#050508',fontSize:11,fontWeight:700 }}>{isLong?'BUY':'SELL'}</button>
        </div>
      )}
      {status==='executing' && <div style={{ fontSize:11,color:'#4a5568',display:'flex',alignItems:'center',gap:5 }}><span style={{ width:5,height:5,borderRadius:'50%',background:'#00f5a0',display:'inline-block',animation:'pulse 1s infinite' }}/>Sending...</div>}
      {status==='success'   && <div style={{ fontSize:11,color:'#00f5a0',padding:'4px 8px',background:'#00f5a010',borderRadius:5 }}>✓ {result}</div>}
      {status==='error'     && <div style={{ fontSize:11,color:'#ff3b5c',padding:'4px 8px',background:'#ff3b5c10',borderRadius:5 }}>✕ {result}</div>}
    </div>
  )
}

function ChatMsg({ m, mode, pair }) {
  const [showBankr, setShowBankr] = useState(false)
  const signal = m.role==='assistant' && m.fmt ? parseSignal(m.content) : null
  const isActionable = signal?.action && (signal.action.includes('LONG')||signal.action.includes('SHORT'))
  const isGood = signal?.quality?.includes('A+')||signal?.quality==='A'
  useEffect(() => { if (isActionable && isGood) setShowBankr(true) }, [])
  if (m.role==='system') return <div style={{ textAlign:'center',padding:'4px 0',color:'#4a5568',fontSize:9 }}>— {m.content} —</div>
  const bot = m.role==='assistant'
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:'flex', justifyContent:bot?'flex-start':'flex-end' }}>
        {bot && <div style={{ width:22,height:22,borderRadius:'50%',background:'linear-gradient(135deg,#00f5a0,#0072ff)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,marginRight:6,flexShrink:0,marginTop:2 }}>🎯</div>}
        <div style={{ maxWidth:'85%',background:bot?'#12121e':'#00f5a015',border:`1px solid ${bot?'#1e1e30':'#00f5a030'}`,borderRadius:bot?'4px 10px 10px 10px':'10px 4px 10px 10px',padding:'8px 10px' }}>
          <pre style={{ margin:0,fontFamily:m.fmt?'monospace':"sans-serif",fontSize:m.fmt?10.5:12,color:'#d4dae4',lineHeight:1.55,whiteSpace:'pre-wrap',wordBreak:'break-word' }}>{m.content}</pre>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:4 }}>
            <span style={{ fontSize:8,color:'#2d3748' }}>{m.time}</span>
            {isActionable && !showBankr && <button onClick={()=>setShowBankr(true)} style={{ fontSize:9,padding:'2px 7px',borderRadius:4,border:'1px solid #00f5a030',background:'#00f5a010',color:'#00f5a0',cursor:'pointer' }}>⚡ Execute</button>}
          </div>
        </div>
      </div>
      {showBankr && isActionable && signal && (
        <div style={{ marginLeft: bot ? 28 : 0 }}>
          <BankrPanel signal={signal} pair={pair} mode={mode} onClose={()=>setShowBankr(false)}/>
        </div>
      )}
    </div>
  )
  }
function ChatWidget({ prices, pair, mode, strategy, exchange }) {
  const [open,    setOpen]    = useState(false)
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const [msgs,    setMsgs]    = useState([{ role:'assistant', content:'Sniper mode aktif 🎯\n\nMTF: 15m/30m/1H/4H real-time.\nSetup A+ → ⚡ Execute via Bankr.', time:now(), fmt:false }])
  const [unread,  setUnread]  = useState(0)
  const chatRef = useRef(null)
  const sess    = getSession()

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, [msgs, loading])
  useEffect(() => { if (!open && msgs.length > 1) setUnread(u => u + 1) }, [msgs])
  useEffect(() => { if (open) setUnread(0) }, [open])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return
    const uMsg = { role:'user', content:text, time:now(), fmt:false }
    const newH = [...history, { role:'user', content:text }]
    setMsgs(p=>[...p, uMsg]); setHistory(newH); setInput(''); setLoading(true)
    const px = Object.entries(prices).map(([k,v])=>`${k}: $${v.price.toFixed(v.price>100?2:3)} (${v.change>=0?'+':''}${v.change.toFixed(2)}%)`).join(', ')
    try {
      const res  = await fetch('/api/chat', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ messages:newH, context:{ prices:px, exchange, mode, strategy, session:`${sess.name} - ${sess.desc}` } }) })
      const data = await res.json()
      const reply = data.content || data.error || 'No response.'
      const fmt   = reply.includes('MARKET BIAS')||reply.includes('ACTION')||reply.includes('SETUP QUALITY')
      setMsgs(p=>[...p,{ role:'assistant', content:reply, time:now(), fmt }])
      setHistory(p=>[...p,{ role:'assistant', content:reply }])
    } catch { setMsgs(p=>[...p,{ role:'assistant', content:'Connection error.', time:now(), fmt:false }]) }
    finally { setLoading(false) }
  }, [input, loading, history, prices, exchange, mode, strategy, sess])

  const quick = [`Analisa ${pair}`, 'Scan pair', `${pair} setup?`, 'Session WIB?']

  return (
    <>
      
      <button onClick={()=>setOpen(o=>!o)} style={{
        position:'fixed', bottom:20, right:20, zIndex:1000,
        width:52, height:52, borderRadius:'50%',
        background:'linear-gradient(135deg,#00f5a0,#0072ff)',
        border:'none', cursor:'pointer',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:22, boxShadow:'0 4px 20px rgba(0,245,160,0.4)',
        transition:'transform 0.2s',
      }}>
        {open ? '✕' : '🎯'}
        {!open && unread > 0 && (
          <span style={{ position:'absolute',top:-4,right:-4,background:'#ff3b5c',color:'#fff',fontSize:9,fontWeight:700,width:16,height:16,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center' }}>{unread}</span>
        )}
      </button>

      
      {open && (
        <div style={{
          position:'fixed', bottom:82, right:16, zIndex:999,
          width: window.innerWidth <= 768 ? 'calc(100vw - 32px)' : 360,
          height: window.innerWidth <= 768 ? '65vh' : 480,
          background:'#0a0a12', border:'1px solid #1e1e30',
          borderRadius:16, display:'flex', flexDirection:'column',
          boxShadow:'0 8px 40px rgba(0,0,0,0.6)',
          overflow:'hidden',
        }}>
          
          <div style={{ padding:'12px 14px', background:'#0d0d1a', borderBottom:'1px solid #1c1c2a', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
            <div style={{ width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#00f5a0,#0072ff)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14 }}>🎯</div>
            <div>
              <div style={{ fontWeight:800, fontSize:13, color:'#fff' }}>NOELA Sniper</div>
              <div style={{ fontSize:9, color:'#00f5a0', display:'flex', alignItems:'center', gap:4 }}>
                <span style={{ width:5,height:5,borderRadius:'50%',background:'#00f5a0',display:'inline-block',animation:'pulse 2s infinite' }}/>
                {sess.name} · {mode}
              </div>
            </div>
            <button onClick={()=>setOpen(false)} style={{ marginLeft:'auto',background:'transparent',border:'none',color:'#4a5568',cursor:'pointer',fontSize:16 }}>✕</button>
          </div>

          
          <div ref={chatRef} style={{ flex:1, overflowY:'auto', padding:'12px 12px 6px' }}>
            {msgs.map((m,i)=><ChatMsg key={i} m={m} mode={mode} pair={pair}/>)}
            {loading && (
              <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                <div style={{ width:22,height:22,borderRadius:'50%',background:'linear-gradient(135deg,#00f5a0,#0072ff)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,flexShrink:0 }}>🎯</div>
                <div style={{ background:'#12121e',border:'1px solid #1e1e30',borderRadius:'4px 10px 10px 10px' }}><TypingDots/></div>
              </div>
            )}
          </div>

          
          <div style={{ padding:'6px 10px', display:'flex', gap:4, flexWrap:'wrap', flexShrink:0 }}>
            {quick.map((q,i)=>(
              <button key={i} onClick={()=>setInput(q)} style={{ fontSize:10,padding:'4px 9px',borderRadius:14,border:'1px solid #1c1c2a',background:'transparent',color:'#6b7280',cursor:'pointer' }}>{q}</button>
            ))}
          </div>

          
          <div style={{ padding:'6px 10px 10px', borderTop:'1px solid #1c1c2a', flexShrink:0 }}>
            <div style={{ display:'flex', gap:7, background:'#0d0d1a', border:'1px solid #1c1c2a', borderRadius:10, padding:'7px 10px', alignItems:'flex-end' }}>
              <textarea
                value={input}
                onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()} }}
                placeholder={`Tanya NOELA...`}
                rows={1}
                style={{ flex:1,background:'transparent',border:'none',color:'#e2e8f0',fontFamily:'sans-serif',fontSize:13,resize:'none',lineHeight:1.5,maxHeight:70,overflow:'auto',outline:'none' }}
              />
              <button
                onClick={send}
                disabled={loading||!input.trim()}
                style={{ width:32,height:32,borderRadius:8,border:'none',flexShrink:0,cursor:loading||!input.trim()?'not-allowed':'pointer',background:loading||!input.trim()?'#1c1c2a':'linear-gradient(135deg,#00f5a0,#0072ff)',color:loading||!input.trim()?'#4a5568':'#050508',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14 }}
              >{loading?'⏳':'↑'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function SniperPlatform() {
  const isMobile = useIsMobile()
  const prices   = usePrices()
  const [pair,      setPair]      = useState('BTC')
  const [mode,      setMode]      = useState('Semi-Auto')
  const [strategy,  setStrategy]  = useState('Sniper')
  const [exchange,  setExchange]  = useState('Binance')
  const [tab,          setTab]        = useState('pairs')
  const [mobileTab,    setMobileTab]  = useState('chart')
  const [showRoadmap,  setShowRoadmap]= useState(false)
  const sess = getSession()

  const PHASES = [
    { icon:'✅', label:'Phase 1', name:'GENESIS',   period:'2025 – Early 2026', color:'#00f5a0', items:['Open source repo live','Dashboard v1 deployed','Bankr + Claude integrated','NoE Sniper & Swing skill published','DEX Token Hunter live','Telegram real-time alerts'] },
    { icon:'🔜', label:'Phase 2', name:'GROWTH',    period:'Q2–Q3 2026',        color:'#4d9fff', items:['TikTok live trading','X Spaces weekly recap','Telegram signal group','API access for early backers','NoE Sniper v2'] },
    { icon:'🚀', label:'Phase 3', name:'SCALE',     period:'Q4 2026–2027',      color:'#f5a623', items:['Multi-user subscriptions','Institutional API tier','Autonomous agent funding pool','Base ecosystem grant','Cross-chain expansion','NOELA mobile app'] },
    { icon:'🌐', label:'Phase 4', name:'DOMINANCE', period:'2028–2029',         color:'#9b5de5', items:['10,000+ active users','NOELA DAO governance','DEX protocol partnerships','Verified on Bankr marketplace','First institutional fund using NOELA'] },
    { icon:'🏆', label:'Phase 5', name:'ENDGAME',   period:'2030–2031',         color:'#ff6b6b', items:['Fully autonomous agent','Self-funded via token fees','Multi-agent ecosystem','NOELA on every major chain','Mission complete'] },
  ]

  const PairCard = ({ id, compact=false }) => {
    const d=PAIRS[id], p=prices[id], pos=p.change>=0
    return (
      <div onClick={()=>{ setPair(id); setMobileTab('chart') }} style={{ background:pair===id?`${d.color}12`:'#0c0c14', border:`1px solid ${pair===id?d.color+'50':'#1c1c2a'}`, borderRadius:compact?7:10, padding:compact?'8px 10px':'12px', cursor:'pointer', marginBottom:compact?4:7 }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:compact?2:6 }}>
          <div style={{ display:'flex',alignItems:'center',gap:compact?5:8 }}>
            <TokenLogo id={id} size={compact?16:20}/>
            <div>
              <div style={{ fontWeight:700,fontSize:compact?11:14 }}>{id}</div>
              {!compact && <div style={{ fontSize:9,color:'#4a5568' }}>{d.symbol}</div>}
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontWeight:700,fontSize:compact?11:15,color:'#fff' }}>${p.price.toFixed(id==='BTC'?0:2)}</div>
            <div style={{ fontSize:compact?8:10,color:pos?'#00f5a0':'#ff3b5c' }}>{pos?'+':''}{p.change.toFixed(2)}%</div>
          </div>
        </div>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          <div style={{ display:'flex',alignItems:'center',gap:3 }}>
            {p.live ? <><span style={{ width:4,height:4,borderRadius:'50%',background:'#00f5a0',display:'inline-block',animation:'pulse 2s infinite' }}/><span style={{ fontSize:8,color:'#00f5a0' }}>LIVE</span></> : <span style={{ fontSize:8,color:'#f5a623' }}>syncing</span>}
          </div>
          <SparkLine history={p.history} positive={pos}/>
        </div>
      </div>
    )
  }

  
  if (isMobile) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&display=swap');
          *{box-sizing:border-box;margin:0;padding:0}
          ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#1e1e30;border-radius:3px}
          @keyframes bounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-5px);opacity:1}}
          @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
          textarea,input{outline:none}
        `}</style>
        <div style={{ height:'100vh',background:'#050508',display:'flex',flexDirection:'column',fontFamily:"'Syne',sans-serif",color:'#e2e8f0',overflow:'hidden' }}>

          
          <header style={{ height:48,borderBottom:'1px solid #1c1c2a',padding:'0 12px',display:'flex',alignItems:'center',justifyContent:'space-between',background:'#050508',flexShrink:0 }}>
            <div style={{ display:'flex',alignItems:'center',gap:7 }}>
              <a href="/" style={{ display:'flex',alignItems:'center',gap:7,textDecoration:'none' }}>
                <div style={{ width:28,height:28,borderRadius:7,background:'linear-gradient(135deg,#00f5a0,#0072ff)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14 }}>🎯</div>
                <span style={{ fontWeight:800,fontSize:16,color:'#fff' }}>NOELA</span>
              </a>
              <span style={{ fontSize:9,padding:'2px 6px',borderRadius:4,background:'#00f5a020',color:'#00f5a0',border:'1px solid #00f5a030' }}>LIVE</span>
            </div>
            <div style={{ display:'flex',gap:4 }}>
              {Object.entries(PAIRS).map(([id,d])=>(
                <button key={id} onClick={()=>{ setPair(id); setMobileTab('chart') }} style={{ width:34,height:28,borderRadius:7,border:`1px solid ${pair===id?d.color+'60':'#1c1c2a'}`,background:pair===id?d.color+'20':'#0c0c14',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <TokenLogo id={id} size={16}/>
                </button>
              ))}
            </div>
          </header>

          
          <div style={{ flex:1,overflow:'hidden',display:'flex',flexDirection:'column' }}>
            {mobileTab==='chart' && (
              <div style={{ flex:1,display:'flex',flexDirection:'column',overflow:'hidden' }}>
                
                <div style={{ padding:'8px 12px',background:'#07070d',borderBottom:'1px solid #1c1c2a',flexShrink:0 }}>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8 }}>
                    <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                      <TokenLogo id={pair} size={22}/>
                      <div>
                        <div style={{ fontWeight:800,fontSize:15 }}>{PAIRS[pair].symbol}</div>
                        <div style={{ fontSize:9,color:'#4a5568' }}>{exchange} · {strategy}</div>
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontWeight:700,fontSize:20,color:'#fff' }}>${prices[pair].price.toFixed(pair==='BTC'?0:2)}</div>
                      <div style={{ fontSize:11,color:prices[pair].change>=0?'#00f5a0':'#ff3b5c' }}>{prices[pair].change>=0?'▲':'▼'} {Math.abs(prices[pair].change).toFixed(2)}%</div>
                    </div>
                  </div>
                  <BinanceChart symbol={PAIRS[pair].binance} pairColor={PAIRS[pair].color} height={200}/>
                </div>
                
                <div style={{ padding:'10px 12px',display:'flex',gap:8,flexShrink:0 }}>
                  <div style={{ flex:1,background:sess.color+'15',border:`1px solid ${sess.color}30`,borderRadius:8,padding:'8px 10px' }}>
                    <div style={{ fontWeight:700,fontSize:11,color:sess.color }}>{sess.name}</div>
                    <div style={{ fontSize:9,color:'#6b7280' }}>{sess.desc}</div>
                  </div>
                  <div style={{ flex:1,background:'#0c0c14',border:'1px solid #1c1c2a',borderRadius:8,padding:'8px 10px',textAlign:'center' }}>
                    <div style={{ fontSize:16 }}>⚡</div>
                    <div style={{ fontSize:10,fontWeight:800,color:'#00f5a0' }}>Bankr</div>
                    <div style={{ fontSize:9,color:'#4a5568' }}>Auto A+</div>
                  </div>
                </div>
                <div style={{ padding:'10px 12px 14px',flexShrink:0 }}>
                  <div style={{ fontSize:9,color:'#4a5568',letterSpacing:1,marginBottom:8,textTransform:'uppercase' }}>Strategy</div>
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:6 }}>
                    {STRATEGIES.map(s=>(
                      <button key={s} onClick={()=>setStrategy(s)} style={{
                        fontSize:11,padding:'10px 8px',borderRadius:8,
                        border:`1px solid ${strategy===s?'#00f5a050':'#1c1c2a'}`,
                        background:strategy===s?'#00f5a015':'#0c0c14',
                        color:strategy===s?'#00f5a0':'#6b7280',
                        cursor:'pointer',textAlign:'left',fontFamily:"'Syne',sans-serif",
                        display:'flex',alignItems:'center',gap:5
                      }}>
                        <span style={{ color:strategy===s?'#00f5a0':'#2d3748',fontSize:9 }}>{strategy===s?'▶':'○'}</span>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ flex:1 }}/>
              </div>
            )}

            {mobileTab==='roadmap' && (
              <div style={{ flex:1,overflowY:'auto',padding:'14px' }}>
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontWeight:800,fontSize:15,color:'#fff' }}>🗺️ NOELA Roadmap</div>
                  <div style={{ fontSize:9,color:'#4a5568',marginTop:2 }}>by @noela_zee · 2025 – 2031</div>
                </div>

                {/* Timeline bar */}
                <div style={{ background:'#0c0c14',border:'1px solid #1c1c2a',borderRadius:8,padding:'10px 12px',marginBottom:14 }}>
                  <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6 }}>
                    <span style={{ fontSize:8,color:'#4a5568' }}>2025</span>
                    <span style={{ fontSize:8,color:'#4a5568' }}>2031</span>
                  </div>
                  <div style={{ height:6,borderRadius:3,background:'#1c1c2a',overflow:'hidden' }}>
                    <div style={{ width:'20%',height:'100%',background:'linear-gradient(90deg,#00f5a0,#0072ff)',borderRadius:3 }}/>
                  </div>
                  <div style={{ display:'flex',justifyContent:'space-between',marginTop:6 }}>
                    {['✅ P1','🔜 P2','🚀 P3','🌐 P4','🏆 P5'].map((p,i)=>(
                      <span key={i} style={{ fontSize:8,color:i===0?'#00f5a0':'#4a5568' }}>{p}</span>
                    ))}
                  </div>
                </div>

                {/* Phase cards */}
                {PHASES.map((p,i)=>(
                  <div key={i} style={{ marginBottom:10,background:'#0c0c14',border:`1px solid ${p.color}30`,borderRadius:10,overflow:'hidden',borderLeft:`3px solid ${p.color}` }}>
                    <div style={{ padding:'10px 12px',borderBottom:`1px solid ${p.color}20`,display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                      <span style={{ fontSize:11,fontWeight:800,color:p.color }}>{p.icon} {p.label} — {p.name}</span>
                      <span style={{ fontSize:8,color:'#4a5568',background:'#1c1c2a',padding:'2px 7px',borderRadius:4 }}>{p.period}</span>
                    </div>
                    <div style={{ padding:'8px 12px' }}>
                      {p.items.map((item,j)=>(
                        <div key={j} style={{ display:'flex',alignItems:'center',gap:7,padding:'4px 0',borderBottom:'1px solid #1c1c2a' }}>
                          <span style={{ fontSize:9,color:i===0?'#00f5a0':p.color,flexShrink:0 }}>{i===0?'✅':'›'}</span>
                          <span style={{ fontSize:10,color:i===0?'#d4dae4':'#6b7280' }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div style={{ textAlign:'center',padding:'14px 0',borderTop:'1px solid #1c1c2a',marginTop:4 }}>
                  <div style={{ fontSize:11,color:'#00f5a0',fontWeight:800,marginBottom:4 }}>🏆 Mission Complete — 2031</div>
                  <div style={{ fontSize:9,color:'#4a5568',fontStyle:'italic' }}>"We are not building a bot.<br/>We are building a standard."</div>
                </div>
              </div>
            )}

            {mobileTab==='pairs' && (
              <div style={{ flex:1,overflowY:'auto',padding:'12px' }}>
                {Object.keys(PAIRS).map(id=><PairCard key={id} id={id}/>)}
              </div>
            )}

            {mobileTab==='settings' && (
              <div style={{ flex:1,overflowY:'auto',padding:'14px' }}>
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:9,color:'#4a5568',letterSpacing:1,marginBottom:8,textTransform:'uppercase' }}>Mode</div>
                  <div style={{ display:'flex',gap:6 }}>
                    {MODES.map(m=><button key={m} onClick={()=>setMode(m)} style={{ flex:1,fontSize:10,padding:'10px 4px',borderRadius:8,border:'none',cursor:'pointer',background:mode===m?(m==='Auto Agent'?'#00f5a0':m==='Manual'?'#4d9fff':'#f5a623'):'#0c0c14',color:mode===m?'#050508':'#6b7280',fontWeight:mode===m?700:400 }}>{m}</button>)}
                  </div>
                </div>
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:9,color:'#4a5568',letterSpacing:1,marginBottom:8,textTransform:'uppercase' }}>Exchange</div>
                  <div style={{ display:'flex',gap:6 }}>
                    {EXCHANGES.map(ex=><button key={ex.name} onClick={()=>setExchange(ex.name)} style={{ flex:1,fontSize:10,padding:'10px 4px',borderRadius:8,cursor:'pointer',border:`1px solid ${exchange===ex.name?ex.color+'60':'#1c1c2a'}`,background:exchange===ex.name?ex.color+'15':'#0c0c14',color:exchange===ex.name?ex.color:'#6b7280',display:'flex',alignItems:'center',justifyContent:'center',gap:4 }}><span style={{ width:5,height:5,borderRadius:'50%',background:ex.on?'#00f5a0':'#ff3b5c',display:'inline-block' }}/>{ex.name}</button>)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:9,color:'#4a5568',letterSpacing:1,marginBottom:8,textTransform:'uppercase' }}>Strategy</div>
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:6 }}>
                    {STRATEGIES.map(s=><button key={s} onClick={()=>setStrategy(s)} style={{ fontSize:11,padding:'10px 8px',borderRadius:8,border:`1px solid ${strategy===s?'#00f5a050':'#1c1c2a'}`,background:strategy===s?'#00f5a015':'#0c0c14',color:strategy===s?'#00f5a0':'#6b7280',cursor:'pointer',textAlign:'left' }}>{strategy===s?'▶ ':'  '}{s}</button>)}
                  </div>
                </div>
              </div>
            )}
          </div>

          
          <nav style={{ height:54,borderTop:'1px solid #1c1c2a',background:'#050508',display:'flex',flexShrink:0 }}>
            {[{id:'chart',icon:'📊',label:'Chart'},{id:'pairs',icon:'💹',label:'Pairs'},{id:'roadmap',icon:'🗺️',label:'Roadmap'},{id:'settings',icon:'⚙️',label:'Settings'}].map(t=>(
              <button key={t.id} onClick={()=>setMobileTab(t.id)} style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:2,border:'none',background:mobileTab===t.id?'#0c0c14':'transparent',cursor:'pointer',color:mobileTab===t.id?'#00f5a0':'#4a5568',borderTop:`2px solid ${mobileTab===t.id?'#00f5a0':'transparent'}` }}>
                <span style={{ fontSize:18 }}>{t.icon}</span>
                <span style={{ fontSize:9 }}>{t.label}</span>
              </button>
            ))}
          </nav>
        </div>

        
        <ChatWidget prices={prices} pair={pair} mode={mode} strategy={strategy} exchange={exchange}/>
      </>
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#1e1e30;border-radius:3px}
        @keyframes bounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-5px);opacity:1}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        textarea,input{outline:none}
      `}</style>
      <div style={{ height:'100vh',background:'#050508',display:'flex',flexDirection:'column',fontFamily:"'Syne',sans-serif",color:'#e2e8f0',overflow:'hidden' }}>

        
        <header style={{ height:50,borderBottom:'1px solid #1c1c2a',padding:'0 16px',display:'flex',alignItems:'center',justifyContent:'space-between',background:'#050508',flexShrink:0 }}>
          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
            <a href="/" style={{ display:'flex',alignItems:'center',gap:8,textDecoration:'none' }}>
              <div style={{ width:28,height:28,borderRadius:7,background:'linear-gradient(135deg,#00f5a0,#0072ff)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14 }}>🎯</div>
              <span style={{ fontWeight:800,fontSize:16,color:'#fff' }}>NOELA</span>
            </a>
            <span style={{ fontSize:9,padding:'2px 6px',borderRadius:4,background:'#00f5a020',color:'#00f5a0',border:'1px solid #00f5a030' }}>LIVE</span>
          </div>
          <div style={{ display:'flex',gap:3,background:'#0c0c14',borderRadius:7,padding:3,border:'1px solid #1c1c2a' }}>
            {MODES.map(m=><button key={m} onClick={()=>setMode(m)} style={{ fontSize:9,padding:'3px 10px',borderRadius:4,border:'none',cursor:'pointer',background:mode===m?(m==='Auto Agent'?'#00f5a0':m==='Manual'?'#4d9fff':'#f5a623'):'transparent',color:mode===m?'#050508':'#6b7280',fontWeight:mode===m?700:400 }}>{m}</button>)}
          </div>
          <div style={{ display:'flex',gap:5 }}>
            {EXCHANGES.map(ex=><button key={ex.name} onClick={()=>setExchange(ex.name)} style={{ fontSize:9,padding:'3px 10px',borderRadius:5,cursor:'pointer',border:`1px solid ${exchange===ex.name?ex.color+'60':'#1c1c2a'}`,background:exchange===ex.name?ex.color+'15':'transparent',color:exchange===ex.name?ex.color:'#4a5568',display:'flex',alignItems:'center',gap:4 }}><span style={{ width:4,height:4,borderRadius:'50%',background:ex.on?'#00f5a0':'#ff3b5c',display:'inline-block',animation:ex.on?'pulse 2s infinite':'none' }}/>{ex.name}</button>)}
          </div>
        </header>

        <div style={{ display:'flex',flex:1,overflow:'hidden' }}>

          
          <aside style={{ width:190,borderRight:'1px solid #1c1c2a',display:'flex',flexDirection:'column',background:'#07070d',flexShrink:0 }}>
            <div style={{ display:'flex',borderBottom:'1px solid #1c1c2a',padding:'0 6px' }}>
              {['pairs','active'].map(t=><button key={t} onClick={()=>setTab(t)} style={{ flex:1,fontSize:9,padding:'9px 4px',border:'none',background:'transparent',cursor:'pointer',textTransform:'uppercase',letterSpacing:1,color:tab===t?'#00f5a0':'#4a5568',borderBottom:`2px solid ${tab===t?'#00f5a0':'transparent'}` }}>{t==='pairs'?'Pairs':'Active'}</button>)}
            </div>
            <div style={{ flex:1,overflowY:'auto',padding:'8px 6px' }}>
              {Object.keys(PAIRS).map(id=><PairCard key={id} id={id} compact={true}/>)}
            </div>
            <div style={{ padding:'8px 6px',borderTop:'1px solid #1c1c2a' }}>
              <div style={{ fontSize:8,color:'#4a5568',letterSpacing:1,marginBottom:5,textTransform:'uppercase' }}>Strategy</div>
              {STRATEGIES.map(s=><button key={s} onClick={()=>setStrategy(s)} style={{ display:'block',width:'100%',textAlign:'left',fontSize:10,padding:'5px 7px',borderRadius:5,border:'none',cursor:'pointer',marginBottom:2,background:strategy===s?'#00f5a015':'transparent',color:strategy===s?'#00f5a0':'#6b7280' }}>{strategy===s?'▶ ':'  '}{s}</button>)}
            </div>
          </aside>

          
          <main style={{ flex:1,display:'flex',flexDirection:'column',overflow:'hidden' }}>
            <div style={{ padding:'7px 14px',borderBottom:'1px solid #1c1c2a',display:'flex',alignItems:'center',gap:10,background:'#07070d',flexShrink:0 }}>
              <TokenLogo id={pair} size={24}/>
              <div>
                <div style={{ fontWeight:800,fontSize:15 }}>{PAIRS[pair].symbol}</div>
                <div style={{ fontSize:9,color:'#4a5568' }}>{exchange} · {strategy} · {mode}</div>
              </div>
              <div style={{ marginLeft:'auto',textAlign:'right' }}>
                <div style={{ fontWeight:700,fontSize:20,color:'#fff' }}>${prices[pair].price.toFixed(pair==='BTC'?0:2)}</div>
                <div style={{ fontSize:10,color:prices[pair].change>=0?'#00f5a0':'#ff3b5c' }}>{prices[pair].change>=0?'▲':'▼'} {Math.abs(prices[pair].change).toFixed(2)}%</div>
              </div>
            </div>

            
            <div style={{ flex:1,padding:'10px 14px',background:'#07070d',overflow:'hidden' }}>
              <BinanceChart symbol={PAIRS[pair].binance} pairColor={PAIRS[pair].color} height={'100%'}/>
            </div>
          </main>

          
          <aside style={{ width:160,borderLeft:'1px solid #1c1c2a',background:'#07070d',display:'flex',flexDirection:'column',flexShrink:0,overflowY:'auto',padding:'10px 8px' }}>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:8,color:'#4a5568',letterSpacing:1,marginBottom:7,textTransform:'uppercase' }}>Session</div>
              <div style={{ background:sess.color+'15',border:`1px solid ${sess.color}30`,borderRadius:7,padding:'8px 10px' }}>
                <div style={{ fontWeight:700,fontSize:11,color:sess.color }}>{sess.name}</div>
                <div style={{ fontSize:9,color:'#6b7280',marginTop:1 }}>{sess.desc}</div>
                <div style={{ fontSize:8,color:'#4a5568',marginTop:1 }}>{sess.range}</div>
              </div>
            </div>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:8,color:'#4a5568',letterSpacing:1,marginBottom:7,textTransform:'uppercase' }}>Rules</div>
              {[['Min R:R','1:3'],['MTF','4TF'],['Max Lev','×50'],['FOMO','OFF'],['Avg Down','OFF']].map(([l,v])=>(
                <div key={l} style={{ display:'flex',justifyContent:'space-between',padding:'3px 0',borderBottom:'1px solid #1c1c2a' }}>
                  <span style={{ fontSize:9,color:'#4a5568' }}>{l}</span>
                  <span style={{ fontSize:9,color:'#00f5a0',fontWeight:700 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:8,color:'#4a5568',letterSpacing:1,marginBottom:7,textTransform:'uppercase' }}>Bias</div>
              {Object.entries(PAIRS).map(([id,d])=>{ const ch=prices[id].change, bias=ch>1?'Bull':ch<-1?'Bear':'Neutral', col=ch>1?'#00f5a0':ch<-1?'#ff3b5c':'#f5a623'; return (
                <div key={id} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'3px 0',borderBottom:'1px solid #1c1c2a' }}>
                  <div style={{ display:'flex',alignItems:'center',gap:4 }}><TokenLogo id={id} size={12}/><span style={{ fontSize:9,color:'#6b7280' }}>{id}</span></div>
                  <span style={{ fontSize:9,color:col,fontWeight:700 }}>{bias}</span>
                </div>
              )})}
            </div>
            <div style={{ background:'#0c0c14',border:'1px solid #1c1c2a',borderRadius:7,padding:'9px',textAlign:'center',marginBottom:8 }}>
              <div style={{ fontSize:16,marginBottom:3 }}>⚡</div>
              <div style={{ fontWeight:800,fontSize:10,color:'#00f5a0' }}>Bankr Ready</div>
              <div style={{ fontSize:8,color:'#4a5568',marginTop:2 }}>Auto A+</div>
            </div>
            <button onClick={()=>setShowRoadmap(r=>!r)} style={{ width:'100%',padding:'7px',borderRadius:7,border:'1px solid #1c1c2a',background:showRoadmap?'#00f5a015':'#0c0c14',color:showRoadmap?'#00f5a0':'#4a5568',cursor:'pointer',fontSize:9,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:5 }}>
              🗺️ ROADMAP
            </button>
            {showRoadmap && (
              <div style={{ marginTop:8 }}>
                {PHASES.map((p,i)=>(
                  <div key={i} style={{ marginBottom:8,background:'#080810',border:`1px solid ${p.color}25`,borderRadius:7,padding:'8px',borderLeft:`2px solid ${p.color}` }}>
                    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5 }}>
                      <span style={{ fontSize:9,fontWeight:800,color:p.color }}>{p.icon} {p.name}</span>
                      <span style={{ fontSize:7,color:'#4a5568' }}>{p.period}</span>
                    </div>
                    {p.items.map((item,j)=>(
                      <div key={j} style={{ fontSize:8,color:i===0?'#6b7280':'#4a5568',padding:'1px 0',display:'flex',gap:4 }}>
                        <span style={{ color:p.color,flexShrink:0 }}>›</span>{item}
                      </div>
                    ))}
                  </div>
                ))}
                <div style={{ textAlign:'center',padding:'6px 0',fontSize:8,color:'#00f5a0',fontWeight:700 }}>🏆 Mission 2031</div>
              </div>
            )}
          </aside>
        </div>
      </div>

      
      <ChatWidget prices={prices} pair={pair} mode={mode} strategy={strategy} exchange={exchange}/>
    </>
  ) }
                                                                                                        }
