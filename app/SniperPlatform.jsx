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

const LOADING_SCREENS = [
  {
    id: 0,
    video: '/noela-lazy.mp4',
    emoji: '😴',
    title: 'Noela lagi rebahan...',
    subtitle: 'Nawarin chart sambil ngokang santai ✨',
    tip: 'Precision over frequency. Patience over impulse.',
  },
  {
    id: 1,
    video: '/noela-chill.mp4',
    emoji: '😏',
    title: 'Noela lagi chill mode...',
    subtitle: 'Digital smoke forming market signals 🔵',
    tip: 'Liquidity over indicators. We wait for the setup.',
  },
  {
    id: 2,
    video: '/noela-hacker.mp4',
    emoji: '⚡',
    title: 'Noela lagi hack market...',
    subtitle: 'Scanning DEX, reading chains, finding alpha 🎯',
    tip: 'Less trades = better trades. Execute. Disappear.',
  },
]

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

function useEthBasePrice() {
  const [eth, setEth] = useState({ price: 0, change: 0 })
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true')
        const data = await res.json()
        if (data?.ethereum) {
          setEth({ price: data.ethereum.usd, change: data.ethereum.usd_24h_change })
        }
      } catch {}
    }
    load()
    const iv = setInterval(load, 30000)
    return () => clearInterval(iv)
  }, [])
  return eth
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
  return <svg width={W} height={H}><polyline points={pts} fill="none" stroke={positive?'#7c3aed':'#ff3b5c'} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/></svg>
}

function TypingDots() {
  return (
    <div style={{ display:'flex', gap:4, padding:'8px 12px' }}>
      {[0,1,2].map(i=><div key={i} style={{ width:6,height:6,borderRadius:'50%',background:'#7c3aed',animation:`bounce 1s ${i*0.15}s infinite` }}/>)}
    </div>
  )
}

function LoadingScreen({ onDone }) {
  const [progress, setProgress] = useState(0)
  const [dots, setDots] = useState('.')
  const screen = LOADING_SCREENS[Math.floor(Math.random() * LOADING_SCREENS.length)]

  useEffect(() => {
    const iv = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(iv); setTimeout(onDone, 400); return 100 }
        return p + Math.random() * 8 + 2
      })
    }, 120)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    const iv = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 500)
    return () => clearInterval(iv)
  }, [])

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:9999,
      background:'radial-gradient(ellipse at 30% 20%, #1a0533 0%, #0a0015 40%, #000008 100%)',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      fontFamily:"'Syne',sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&display=swap');
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes glow  { 0%,100%{box-shadow:0 0 20px #7c3aed60} 50%{box-shadow:0 0 50px #7c3aed,0 0 80px #3b82f640} }
        @keyframes scan  { 0%{transform:translateY(-100%)} 100%{transform:translateY(400%)} }
        @keyframes pulse2{ 0%,100%{opacity:1}50%{opacity:0.4} }
        @keyframes spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes hologram { 0%{opacity:0.6;transform:scaleX(1)} 50%{opacity:1;transform:scaleX(1.01)} 100%{opacity:0.6;transform:scaleX(1)} }
      `}</style>

      
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(#7c3aed08 1px,transparent 1px),linear-gradient(90deg,#7c3aed08 1px,transparent 1px)', backgroundSize:'40px 40px', pointerEvents:'none' }}/>

      
      <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle,#7c3aed20,transparent)', top:'10%', left:'5%', filter:'blur(40px)', animation:'float 6s ease-in-out infinite' }}/>
      <div style={{ position:'absolute', width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle,#3b82f615,transparent)', bottom:'15%', right:'10%', filter:'blur(30px)', animation:'float 8s ease-in-out infinite reverse' }}/>

      
      <div style={{ position:'relative', marginBottom:24, animation:'float 4s ease-in-out infinite' }}>
        <div style={{ width:160, height:160, borderRadius:'50%', border:'2px solid #7c3aed60', display:'flex', alignItems:'center', justifyContent:'center', background:'radial-gradient(circle,#1a053380,#0a001580)', animation:'glow 3s ease-in-out infinite', overflow:'hidden' }}>
          
          <div style={{ position:'absolute', width:'100%', height:'4px', background:'linear-gradient(90deg,transparent,#7c3aed80,transparent)', animation:'scan 2s linear infinite', zIndex:2 }}/>
          
          <video
            key={screen.video}
            autoPlay
            muted
            loop
            playsInline
            style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%', animation:'hologram 3s ease-in-out infinite' }}
            onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }}
          >
            <source src={screen.video} type="video/mp4"/>
          </video>
          <div style={{ display:'none', width:'100%', height:'100%', alignItems:'center', justifyContent:'center', fontSize:64, flexDirection:'column', gap:4 }}>
            <span>{screen.emoji}</span>
          </div>
        </div>
        
        <div style={{ position:'absolute', inset:-8, borderRadius:'50%', border:'1px solid #7c3aed40', borderTopColor:'#7c3aed', animation:'spin 3s linear infinite' }}/>
        <div style={{ position:'absolute', inset:-16, borderRadius:'50%', border:'1px solid #3b82f620', borderBottomColor:'#3b82f6', animation:'spin 5s linear infinite reverse' }}/>
      </div>

      
      <div style={{ fontSize:32, fontWeight:800, color:'#fff', letterSpacing:6, marginBottom:4, textShadow:'0 0 30px #7c3aed' }}>
        N O E L A
      </div>
      <div style={{ fontSize:11, color:'#7c3aed', letterSpacing:3, marginBottom:20, textTransform:'uppercase' }}>
        SNIPER TRADING SYSTEM
      </div>

      
      <div style={{ fontSize:13, color:'#a78bfa', marginBottom:6, minHeight:20 }}>
        {screen.title}{dots}
      </div>
      <div style={{ fontSize:10, color:'#6b7280', marginBottom:24, textAlign:'center', maxWidth:280, lineHeight:1.5 }}>
        {screen.subtitle}
      </div>

      
      <div style={{ width:280, height:3, background:'#1c1c2a', borderRadius:2, overflow:'hidden', marginBottom:12 }}>
        <div style={{ height:'100%', width:`${Math.min(progress,100)}%`, background:'linear-gradient(90deg,#7c3aed,#3b82f6)', borderRadius:2, transition:'width 0.1s', boxShadow:'0 0 10px #7c3aed' }}/>
      </div>

      <div style={{ fontSize:9, color:'#4a5568', letterSpacing:2, marginBottom:20 }}>
        {Math.round(Math.min(progress,100))}% INITIALIZING
      </div>

      
      <div style={{ fontSize:10, color:'#7c3aed80', fontStyle:'italic', textAlign:'center', maxWidth:260 }}>
        "{screen.tip}"
      </div>

      
      <div style={{ position:'absolute', bottom:24, display:'flex', alignItems:'center', gap:6, padding:'4px 12px', borderRadius:20, border:'1px solid #3b82f630', background:'#3b82f610' }}>
        <div style={{ width:8, height:8, borderRadius:'50%', background:'#3b82f6', animation:'pulse2 2s infinite' }}/>
        <span style={{ fontSize:9, color:'#3b82f6', letterSpacing:1 }}>BUILT ON BASE</span>
      </div>
    </div>
  )
      }

function MusicPlayer() {
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(0.3)
  const audioRef = useRef(null)

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
      audioRef.current.loop = true
    }
  }, [volume])

  const toggle = () => {
    if (!audioRef.current) return
    if (playing) { audioRef.current.pause(); setPlaying(false) }
    else { audioRef.current.play().catch(()=>{}); setPlaying(true) }
  }

  return (
    <>
      <audio ref={audioRef} src="/music/noela-lofi.mp3" preload="none"/>
      <button onClick={toggle} title={playing ? 'Pause music' : 'Play lofi music'} style={{
        width:32, height:32, borderRadius:'50%', border:`1px solid ${playing?'#7c3aed':'#2d2d45'}`,
        background:playing?'#7c3aed20':'transparent', cursor:'pointer',
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:14,
        color:playing?'#a78bfa':'#4a5568', transition:'all 0.2s',
      }}>
        {playing ? '🔊' : '🔇'}
      </button>
    </>
  )
}

function EthBaseTicker({ eth }) {
  const pos = eth.change >= 0
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 500,
      height: 28,
      background: '#08080f',
      borderTop: '1px solid #1c1c2a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
      padding: '0 16px',
      paddingBottom: 'env(safe-area-inset-bottom)', 
      overflow: 'hidden',
    }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#627eea', flexShrink: 0 }}/>
        <span style={{ fontSize: 9, color: '#6b7280', letterSpacing: 1 }}>ETH/USD</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>
          ${eth.price ? eth.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
        </span>
        {eth.change !== 0 && (
          <span style={{ fontSize: 9, color: pos ? '#7c3aed' : '#ff3b5c', fontWeight: 700 }}>
            {pos ? '▲' : '▼'} {Math.abs(eth.change).toFixed(2)}%
          </span>
        )}
      </div>
      <div style={{ width: 1, height: 14, background: '#1c1c2a' }}/>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', animation: 'pulse2 2s infinite', flexShrink: 0 }}/>
        <span style={{ fontSize: 9, color: '#3b82f6', letterSpacing: 1 }}>BASE NETWORK · LIVE</span>
      </div>
      <div style={{ width: 1, height: 14, background: '#1c1c2a' }}/>
      <span style={{ fontSize: 9, color: '#4a5568' }}>Built on Base · Powered by NOELA_ZEE · 2025–2031</span>
    </div>
  )
}

function BankrPanel({ signal, pair, mode, onClose }) {
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState('')
  const [amount, setAmount] = useState('50')
  const isAuto = mode==='Auto Agent'
  const isLong = signal.action?.includes('LONG')
  const color  = isLong ? '#7c3aed' : '#ff3b5c'
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
    <div style={{ background:'#0d0d1f', border:`1px solid ${color}40`, borderRadius:10, padding:'12px', position:'relative', marginTop:6 }}>
      <button onClick={onClose} style={{ position:'absolute',top:6,right:8,background:'transparent',border:'none',color:'#4a5568',cursor:'pointer',fontSize:13 }}>✕</button>
      <div style={{ display:'flex',alignItems:'center',gap:7,marginBottom:8 }}>
        <div style={{ width:22,height:22,borderRadius:5,background:'linear-gradient(135deg,#7c3aed,#3b82f6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11 }}>⚡</div>
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
          <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="USDC" style={{ flex:1,background:'#07070d',border:'1px solid #2d2d45',borderRadius:5,padding:'5px 8px',color:'#fff',fontSize:12,outline:'none' }}/>
          <button onClick={execute} style={{ padding:'5px 14px',borderRadius:6,border:'none',cursor:'pointer',background:`linear-gradient(135deg,${color},#3b82f6)`,color:'#fff',fontSize:11,fontWeight:700 }}>{isLong?'BUY':'SELL'}</button>
        </div>
      )}
      {status==='executing' && <div style={{ fontSize:11,color:'#a78bfa',display:'flex',alignItems:'center',gap:5 }}><span style={{ width:5,height:5,borderRadius:'50%',background:'#7c3aed',display:'inline-block',animation:'pulse2 1s infinite' }}/>Sending...</div>}
      {status==='success'   && <div style={{ fontSize:11,color:'#7c3aed',padding:'4px 8px',background:'#7c3aed10',borderRadius:5 }}>✓ {result}</div>}
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
        {bot && <div style={{ width:22,height:22,borderRadius:'50%',background:'linear-gradient(135deg,#7c3aed,#3b82f6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,marginRight:6,flexShrink:0,marginTop:2 }}>🎯</div>}
        <div style={{ maxWidth:'85%',background:bot?'#12121e':'#7c3aed15',border:`1px solid ${bot?'#2d2d45':'#7c3aed40'}`,borderRadius:bot?'4px 10px 10px 10px':'10px 4px 10px 10px',padding:'8px 10px' }}>
          <pre style={{ margin:0,fontFamily:m.fmt?'monospace':"sans-serif",fontSize:m.fmt?10.5:12,color:'#d4dae4',lineHeight:1.55,whiteSpace:'pre-wrap',wordBreak:'break-word' }}>{m.content}</pre>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:4 }}>
            <span style={{ fontSize:8,color:'#2d3748' }}>{m.time}</span>
            {isActionable && !showBankr && <button onClick={()=>setShowBankr(true)} style={{ fontSize:9,padding:'2px 7px',borderRadius:4,border:'1px solid #7c3aed40',background:'#7c3aed10',color:'#a78bfa',cursor:'pointer' }}>⚡ Execute</button>}
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
  const inputRef = useRef(null)
  const sess    = getSession()

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, [msgs, loading])
  useEffect(() => { if (!open && msgs.length > 1) setUnread(u => u + 1) }, [msgs])
  useEffect(() => { if (open) { setUnread(0); setTimeout(()=>inputRef.current?.focus(), 300) } }, [open])

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
        position:'fixed', bottom:48, right:20, zIndex:1000,
        width:54, height:54, borderRadius:'50%',
        background:open?'#1c1c2a':'linear-gradient(135deg,#7c3aed,#3b82f6)',
        border:`2px solid ${open?'#4a5568':'#7c3aed60'}`,
        cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:22, boxShadow:'0 4px 24px rgba(124,58,237,0.5)',
        transition:'all 0.2s',
      }}>
        <span>{open ? '✕' : '🎯'}</span>
        {!open && unread > 0 && (
          <span style={{ position:'absolute',top:-3,right:-3,background:'#ff3b5c',color:'#fff',fontSize:9,fontWeight:700,width:17,height:17,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',border:'2px solid #050508' }}>{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {open && (
        <div style={{
          position:'fixed', bottom:112, right:16, zIndex:999,
          width: typeof window !== 'undefined' && window.innerWidth <= 768 ? 'calc(100vw - 32px)' : 360,
          height: typeof window !== 'undefined' && window.innerWidth <= 768 ? '68vh' : 500,
          background:'#0a0a15', border:'1px solid #2d2d45',
          borderRadius:16, display:'flex', flexDirection:'column',
          boxShadow:'0 8px 40px rgba(124,58,237,0.3)',
          overflow:'hidden', animation:'slideUp 0.2s ease',
        }}>
          <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

          <div style={{ padding:'10px 14px', background:'#0d0d1f', borderBottom:'1px solid #2d2d45', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
            <div style={{ width:26,height:26,borderRadius:'50%',background:'linear-gradient(135deg,#7c3aed,#3b82f6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13 }}>🎯</div>
            <div>
              <div style={{ fontWeight:800, fontSize:12, color:'#fff' }}>NOELA Sniper</div>
              <div style={{ fontSize:8, color:'#a78bfa', display:'flex', alignItems:'center', gap:4 }}>
                <span style={{ width:4,height:4,borderRadius:'50%',background:'#7c3aed',display:'inline-block',animation:'pulse2 2s infinite' }}/>
                {sess.name} · {mode}
              </div>
            </div>
            <button onClick={()=>setOpen(false)} style={{ marginLeft:'auto',background:'transparent',border:'none',color:'#4a5568',cursor:'pointer',fontSize:16,lineHeight:1 }}>✕</button>
          </div>

          <div ref={chatRef} style={{ flex:1, overflowY:'auto', padding:'10px 12px 4px' }}>
            {msgs.map((m,i)=><ChatMsg key={i} m={m} mode={mode} pair={pair}/>)}
            {loading && (
              <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                <div style={{ width:20,height:20,borderRadius:'50%',background:'linear-gradient(135deg,#7c3aed,#3b82f6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,flexShrink:0 }}>🎯</div>
                <div style={{ background:'#12121e',border:'1px solid #2d2d45',borderRadius:'4px 10px 10px 10px' }}><TypingDots/></div>
              </div>
            )}
          </div>

          <div style={{ padding:'5px 10px', display:'flex', gap:4, flexWrap:'wrap', flexShrink:0 }}>
            {quick.map((q,i)=>(
              <button key={i} onClick={()=>{ setInput(q); inputRef.current?.focus() }} style={{ fontSize:10,padding:'3px 9px',borderRadius:14,border:'1px solid #2d2d45',background:'transparent',color:'#6b7280',cursor:'pointer' }}>{q}</button>
            ))}
          </div>

          <div style={{ padding:'5px 10px 10px', borderTop:'1px solid #2d2d45', flexShrink:0 }}>
            <div style={{ display:'flex', gap:6, background:'#0d0d1f', border:'1px solid #2d2d45', borderRadius:10, padding:'6px 10px', alignItems:'flex-end' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()} }}
                placeholder="Tanya NOELA..."
                rows={1}
                style={{ flex:1,background:'transparent',border:'none',color:'#e2e8f0',fontSize:13,resize:'none',lineHeight:1.5,maxHeight:70,overflow:'auto',outline:'none',fontFamily:'inherit' }}
              />
              <button onClick={send} disabled={loading||!input.trim()} style={{ width:30,height:30,borderRadius:7,border:'none',flexShrink:0,cursor:loading||!input.trim()?'not-allowed':'pointer',background:loading||!input.trim()?'#1c1c2a':'linear-gradient(135deg,#7c3aed,#3b82f6)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13 }}>{loading?'⏳':'↑'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
        }

export default function SniperPlatform() {
  const isMobile    = useIsMobile()
  const prices      = usePrices()
  const eth         = useEthBasePrice()
  const [loading,      setLoading]     = useState(true)
  const [pair,         setPair]        = useState('BTC')
  const [mode,         setMode]        = useState('Semi-Auto')
  const [strategy,     setStrategy]    = useState('Sniper')
  const [exchange,     setExchange]    = useState('Binance')
  const [tab,          setTab]         = useState('pairs')
  const [mobileTab,    setMobileTab]   = useState('chart')
  const [showRoadmap,  setShowRoadmap] = useState(false)
  const sess = getSession()

  const PHASES = [
    { icon:'✅', label:'Phase 1', name:'GENESIS',   period:'2025 – Early 2026', color:'#7c3aed', items:['Open source repo live','Dashboard v1 deployed','Bankr + Claude integrated','NoE Sniper & Swing skill published','DEX Token Hunter live','Telegram real-time alerts'] },
    { icon:'🔜', label:'Phase 2', name:'GROWTH',    period:'Q2–Q3 2026',        color:'#3b82f6', items:['TikTok live trading','X Spaces weekly recap','Telegram signal group','API access for early backers','NoE Sniper v2'] },
    { icon:'🚀', label:'Phase 3', name:'SCALE',     period:'Q4 2026–2027',      color:'#f5a623', items:['Multi-user subscriptions','Institutional API tier','Autonomous agent funding pool','Base ecosystem grant','Cross-chain expansion','NOELA mobile app'] },
    { icon:'🌐', label:'Phase 4', name:'DOMINANCE', period:'2028–2029',         color:'#9b5de5', items:['10,000+ active users','NOELA DAO governance','DEX protocol partnerships','Verified on Bankr marketplace','First institutional fund using NOELA'] },
    { icon:'🏆', label:'Phase 5', name:'ENDGAME',   period:'2030–2031',         color:'#ff6b6b', items:['Fully autonomous agent','Self-funded via token fees','Multi-agent ecosystem','NOELA on every major chain','Mission complete'] },
  ]

  const PairCard = ({ id, compact=false }) => {
    const d=PAIRS[id], p=prices[id], pos=p.change>=0
    return (
      <div onClick={()=>{ setPair(id); setMobileTab('chart') }} style={{ background:pair===id?`${d.color}15`:'#0c0c18', border:`1px solid ${pair===id?d.color+'60':'#2d2d45'}`, borderRadius:compact?7:10, padding:compact?'8px 10px':'12px', cursor:'pointer', marginBottom:compact?4:7, transition:'all 0.2s' }}>
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
            <div style={{ fontSize:compact?8:10,color:pos?'#7c3aed':'#ff3b5c' }}>{pos?'+':''}{p.change.toFixed(2)}%</div>
          </div>
        </div>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          <div style={{ display:'flex',alignItems:'center',gap:3 }}>
            {p.live ? <><span style={{ width:4,height:4,borderRadius:'50%',background:'#7c3aed',display:'inline-block',animation:'pulse2 2s infinite' }}/><span style={{ fontSize:8,color:'#a78bfa' }}>LIVE</span></> : <span style={{ fontSize:8,color:'#f5a623' }}>syncing</span>}
          </div>
          <SparkLine history={p.history} positive={pos}/>
        </div>
      </div>
    )
  }

  if (loading) return <LoadingScreen onDone={() => setLoading(false)} />

  const globalStyle = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#2d2d45;border-radius:3px}
    @keyframes bounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-5px);opacity:1}}
    @keyframes pulse2{0%,100%{opacity:1}50%{opacity:.3}}
    @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
    @keyframes hologram{0%{opacity:0.8}50%{opacity:1}100%{opacity:0.8}}
    textarea,input{outline:none}
  `

  if (isMobile) {
    return (
      <>
        <style>{globalStyle}</style>
        <div style={{ height:'100vh',background:'radial-gradient(ellipse at top,#0f0020 0%,#050508 60%)',display:'flex',flexDirection:'column',fontFamily:"'Syne',sans-serif",color:'#e2e8f0',overflow:'hidden' }}>

          <header style={{ height:50,borderBottom:'1px solid #2d2d45',padding:'0 12px',display:'flex',alignItems:'center',justifyContent:'space-between',background:'#08080f',flexShrink:0 }}>
            <div style={{ display:'flex',alignItems:'center',gap:7 }}>
              <div style={{ width:28,height:28,borderRadius:7,background:'linear-gradient(135deg,#7c3aed,#3b82f6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,boxShadow:'0 0 12px #7c3aed60' }}>🎯</div>
              <span style={{ fontWeight:800,fontSize:16,color:'#fff',letterSpacing:1 }}>NOELA</span>
              <span style={{ fontSize:9,padding:'2px 6px',borderRadius:4,background:'#7c3aed20',color:'#a78bfa',border:'1px solid #7c3aed30' }}>LIVE</span>
            </div>
            <div style={{ display:'flex',gap:4,alignItems:'center' }}>
              <MusicPlayer/>
              {Object.entries(PAIRS).map(([id,d])=>(
                <button key={id} onClick={()=>{ setPair(id); setMobileTab('chart') }} style={{ width:32,height:28,borderRadius:6,border:`1px solid ${pair===id?d.color+'60':'#2d2d45'}`,background:pair===id?d.color+'20':'#0c0c18',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.2s' }}>
                  <TokenLogo id={id} size={15}/>
                </button>
              ))}
            </div>
          </header>

          <div style={{ flex:1,overflow:'hidden',display:'flex',flexDirection:'column' }}>

            {mobileTab==='chart' && (
              <div style={{ flex:1,display:'flex',flexDirection:'column',overflowY:'auto' }}>
                <div style={{ padding:'8px 12px',background:'#08080f',borderBottom:'1px solid #2d2d45',flexShrink:0 }}>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8 }}>
                    <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                      <TokenLogo id={pair} size={22}/>
                      <div>
                        <div style={{ fontWeight:800,fontSize:15 }}>{PAIRS[pair].symbol}</div>
                        <div style={{ fontSize:9,color:'#6b7280' }}>{exchange} · {strategy}</div>
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontWeight:700,fontSize:20,color:'#fff' }}>${prices[pair].price.toFixed(pair==='BTC'?0:2)}</div>
                      <div style={{ fontSize:11,color:prices[pair].change>=0?'#a78bfa':'#ff3b5c' }}>{prices[pair].change>=0?'▲':'▼'} {Math.abs(prices[pair].change).toFixed(2)}%</div>
                    </div>
                  </div>
                  <BinanceChart symbol={PAIRS[pair].binance} pairColor={PAIRS[pair].color} height={200}/>
                </div>

                <div style={{ padding:'10px 12px',display:'flex',gap:8,flexShrink:0 }}>
                  <div style={{ flex:1,background:sess.color+'15',border:`1px solid ${sess.color}30`,borderRadius:8,padding:'8px 10px' }}>
                    <div style={{ fontWeight:700,fontSize:11,color:sess.color }}>{sess.name}</div>
                    <div style={{ fontSize:9,color:'#6b7280' }}>{sess.desc}</div>
                  </div>
                  <div style={{ flex:1,background:'#7c3aed10',border:'1px solid #7c3aed30',borderRadius:8,padding:'8px 10px',textAlign:'center' }}>
                    <div style={{ fontSize:16 }}>⚡</div>
                    <div style={{ fontSize:10,fontWeight:800,color:'#a78bfa' }}>Bankr</div>
                    <div style={{ fontSize:9,color:'#4a5568' }}>Auto A+</div>
                  </div>
                </div>

                <div style={{ padding:'10px 12px 14px',flexShrink:0 }}>
                  <div style={{ fontSize:9,color:'#6b7280',letterSpacing:1,marginBottom:8,textTransform:'uppercase' }}>Strategy</div>
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:6 }}>
                    {STRATEGIES.map(s=>(
                      <button key={s} onClick={()=>setStrategy(s)} style={{
                        fontSize:11,padding:'10px 8px',borderRadius:8,
                        border:`1px solid ${strategy===s?'#7c3aed60':'#2d2d45'}`,
                        background:strategy===s?'#7c3aed15':'#0c0c18',
                        color:strategy===s?'#a78bfa':'#6b7280',
                        cursor:'pointer',textAlign:'left',fontFamily:"'Syne',sans-serif",
                        display:'flex',alignItems:'center',gap:5,transition:'all 0.2s'
                      }}>
                        <span style={{ color:strategy===s?'#7c3aed':'#2d3748',fontSize:9 }}>{strategy===s?'▶':'○'}</span>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {mobileTab==='pairs' && (
              <div style={{ flex:1,overflowY:'auto',padding:'12px' }}>
                {Object.keys(PAIRS).map(id=><PairCard key={id} id={id}/>)}
              </div>
            )}

            {mobileTab==='roadmap' && (
              <div style={{ flex:1,overflowY:'auto',padding:'14px' }}>
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontWeight:800,fontSize:15,color:'#fff' }}>🗺️ NOELA Roadmap</div>
                  <div style={{ fontSize:9,color:'#6b7280',marginTop:2 }}>by @noela_zee · 2025 – 2031</div>
                </div>
                <div style={{ background:'#0c0c18',border:'1px solid #2d2d45',borderRadius:8,padding:'10px 12px',marginBottom:14 }}>
                  <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6 }}>
                    <span style={{ fontSize:8,color:'#4a5568' }}>2025</span>
                    <span style={{ fontSize:8,color:'#4a5568' }}>2031</span>
                  </div>
                  <div style={{ height:6,borderRadius:3,background:'#1c1c2a',overflow:'hidden' }}>
                    <div style={{ width:'20%',height:'100%',background:'linear-gradient(90deg,#7c3aed,#3b82f6)',borderRadius:3,boxShadow:'0 0 8px #7c3aed' }}/>
                  </div>
                  <div style={{ display:'flex',justifyContent:'space-between',marginTop:6 }}>
                    {['✅ P1','🔜 P2','🚀 P3','🌐 P4','🏆 P5'].map((p,i)=>(
                      <span key={i} style={{ fontSize:8,color:i===0?'#a78bfa':'#4a5568' }}>{p}</span>
                    ))}
                  </div>
                </div>
                {PHASES.map((p,i)=>(
                  <div key={i} style={{ marginBottom:10,background:'#0c0c18',border:`1px solid ${p.color}30`,borderRadius:10,overflow:'hidden',borderLeft:`3px solid ${p.color}` }}>
                    <div style={{ padding:'10px 12px',borderBottom:`1px solid ${p.color}15`,display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                      <span style={{ fontSize:11,fontWeight:800,color:p.color }}>{p.icon} {p.label} — {p.name}</span>
                      <span style={{ fontSize:8,color:'#4a5568',background:'#1c1c2a',padding:'2px 7px',borderRadius:4 }}>{p.period}</span>
                    </div>
                    <div style={{ padding:'8px 12px' }}>
                      {p.items.map((item,j)=>(
                        <div key={j} style={{ display:'flex',alignItems:'center',gap:7,padding:'4px 0',borderBottom:'1px solid #1c1c2a' }}>
                          <span style={{ fontSize:9,color:p.color,flexShrink:0 }}>{i===0?'✅':'›'}</span>
                          <span style={{ fontSize:10,color:i===0?'#d4dae4':'#6b7280' }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div style={{ textAlign:'center',padding:'14px 0',borderTop:'1px solid #2d2d45' }}>
                  <div style={{ fontSize:11,color:'#a78bfa',fontWeight:800,marginBottom:4 }}>🏆 Mission Complete — 2031</div>
                  <div style={{ fontSize:9,color:'#4a5568',fontStyle:'italic' }}>"We are not building a bot. We are building a standard."</div>
                </div>
              </div>
            )}

            {mobileTab==='settings' && (
              <div style={{ flex:1,overflowY:'auto',padding:'14px' }}>
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:9,color:'#6b7280',letterSpacing:1,marginBottom:8,textTransform:'uppercase' }}>Mode</div>
                  <div style={{ display:'flex',gap:6 }}>
                    {MODES.map(m=><button key={m} onClick={()=>setMode(m)} style={{ flex:1,fontSize:10,padding:'10px 4px',borderRadius:8,border:`1px solid ${mode===m?'#7c3aed60':'#2d2d45'}`,cursor:'pointer',background:mode===m?'#7c3aed20':'#0c0c18',color:mode===m?'#a78bfa':'#6b7280',fontWeight:mode===m?700:400,transition:'all 0.2s' }}>{m}</button>)}
                  </div>
                </div>
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:9,color:'#6b7280',letterSpacing:1,marginBottom:8,textTransform:'uppercase' }}>Exchange</div>
                  <div style={{ display:'flex',gap:6 }}>
                    {EXCHANGES.map(ex=><button key={ex.name} onClick={()=>setExchange(ex.name)} style={{ flex:1,fontSize:10,padding:'10px 4px',borderRadius:8,cursor:'pointer',border:`1px solid ${exchange===ex.name?ex.color+'60':'#2d2d45'}`,background:exchange===ex.name?ex.color+'15':'#0c0c18',color:exchange===ex.name?ex.color:'#6b7280',display:'flex',alignItems:'center',justifyContent:'center',gap:4,transition:'all 0.2s' }}><span style={{ width:5,height:5,borderRadius:'50%',background:ex.on?'#7c3aed':'#ff3b5c',display:'inline-block' }}/>{ex.name}</button>)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:9,color:'#6b7280',letterSpacing:1,marginBottom:8,textTransform:'uppercase' }}>Strategy</div>
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:6 }}>
                    {STRATEGIES.map(s=><button key={s} onClick={()=>setStrategy(s)} style={{ fontSize:11,padding:'10px 8px',borderRadius:8,border:`1px solid ${strategy===s?'#7c3aed60':'#2d2d45'}`,background:strategy===s?'#7c3aed15':'#0c0c18',color:strategy===s?'#a78bfa':'#6b7280',cursor:'pointer',textAlign:'left',transition:'all 0.2s' }}>{strategy===s?'▶ ':''}{s}</button>)}
                  </div>
                </div>
              </div>
            )}
          </div>

          <nav style={{ height:54,borderTop:'1px solid #2d2d45',background:'#08080f',display:'flex',flexShrink:0 }}>
            {[{id:'chart',icon:'📊',label:'Chart'},{id:'pairs',icon:'💹',label:'Pairs'},{id:'roadmap',icon:'🗺️',label:'Roadmap'},{id:'settings',icon:'⚙️',label:'Settings'}].map(t=>(
              <button key={t.id} onClick={()=>setMobileTab(t.id)} style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:2,border:'none',background:mobileTab===t.id?'#0c0c18':'transparent',cursor:'pointer',color:mobileTab===t.id?'#a78bfa':'#4a5568',borderTop:`2px solid ${mobileTab===t.id?'#7c3aed':'transparent'}`,transition:'all 0.2s' }}>
                <span style={{ fontSize:18 }}>{t.icon}</span>
                <span style={{ fontSize:9 }}>{t.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <ChatWidget prices={prices} pair={pair} mode={mode} strategy={strategy} exchange={exchange}/>
        <EthBaseTicker eth={eth}/>
      </>
    )
  }

  
  return (
    <>
      <style>{globalStyle}</style>
      <div style={{ height:'100vh',background:'radial-gradient(ellipse at 20% 10%,#0f0020 0%,#050508 50%)',display:'flex',flexDirection:'column',fontFamily:"'Syne',sans-serif",color:'#e2e8f0',overflow:'hidden',paddingBottom:28 }}>

        <header style={{ height:50,borderBottom:'1px solid #2d2d45',padding:'0 16px',display:'flex',alignItems:'center',justifyContent:'space-between',background:'#08080f',flexShrink:0 }}>
          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
            <div style={{ width:28,height:28,borderRadius:7,background:'linear-gradient(135deg,#7c3aed,#3b82f6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,boxShadow:'0 0 12px #7c3aed60' }}>🎯</div>
            <span style={{ fontWeight:800,fontSize:16,color:'#fff',letterSpacing:1 }}>NOELA</span>
            <span style={{ fontSize:9,padding:'2px 6px',borderRadius:4,background:'#7c3aed20',color:'#a78bfa',border:'1px solid #7c3aed30' }}>LIVE</span>
          </div>
          <div style={{ display:'flex',gap:3,background:'#0c0c18',borderRadius:7,padding:3,border:'1px solid #2d2d45' }}>
            {MODES.map(m=><button key={m} onClick={()=>setMode(m)} style={{ fontSize:9,padding:'3px 10px',borderRadius:4,border:'none',cursor:'pointer',background:mode===m?'#7c3aed':'transparent',color:mode===m?'#fff':'#6b7280',fontWeight:mode===m?700:400,transition:'all 0.2s' }}>{m}</button>)}
          </div>
          <div style={{ display:'flex',gap:6,alignItems:'center' }}>
            <MusicPlayer/>
            {EXCHANGES.map(ex=><button key={ex.name} onClick={()=>setExchange(ex.name)} style={{ fontSize:9,padding:'3px 10px',borderRadius:5,cursor:'pointer',border:`1px solid ${exchange===ex.name?ex.color+'60':'#2d2d45'}`,background:exchange===ex.name?ex.color+'15':'transparent',color:exchange===ex.name?ex.color:'#4a5568',display:'flex',alignItems:'center',gap:4,transition:'all 0.2s' }}><span style={{ width:4,height:4,borderRadius:'50%',background:ex.on?'#7c3aed':'#ff3b5c',display:'inline-block',animation:ex.on?'pulse2 2s infinite':'none' }}/>{ex.name}</button>)}
          </div>
        </header>

        <div style={{ display:'flex',flex:1,overflow:'hidden' }}>
          <aside style={{ width:190,borderRight:'1px solid #2d2d45',display:'flex',flexDirection:'column',background:'#08080f',flexShrink:0 }}>
            <div style={{ display:'flex',borderBottom:'1px solid #2d2d45',padding:'0 6px' }}>
              {['pairs','active'].map(t=><button key={t} onClick={()=>setTab(t)} style={{ flex:1,fontSize:9,padding:'9px 4px',border:'none',background:'transparent',cursor:'pointer',textTransform:'uppercase',letterSpacing:1,color:tab===t?'#a78bfa':'#4a5568',borderBottom:`2px solid ${tab===t?'#7c3aed':'transparent'}`,transition:'all 0.2s' }}>{t==='pairs'?'Pairs':'Active'}</button>)}
            </div>
            <div style={{ flex:1,overflowY:'auto',padding:'8px 6px' }}>
              {Object.keys(PAIRS).map(id=><PairCard key={id} id={id} compact={true}/>)}
            </div>
            <div style={{ padding:'8px 6px',borderTop:'1px solid #2d2d45' }}>
              <div style={{ fontSize:8,color:'#6b7280',letterSpacing:1,marginBottom:5,textTransform:'uppercase' }}>Strategy</div>
              {STRATEGIES.map(s=><button key={s} onClick={()=>setStrategy(s)} style={{ display:'block',width:'100%',textAlign:'left',fontSize:10,padding:'5px 7px',borderRadius:5,border:'none',cursor:'pointer',marginBottom:2,background:strategy===s?'#7c3aed15':'transparent',color:strategy===s?'#a78bfa':'#6b7280',transition:'all 0.2s' }}>{strategy===s?'▶ ':'  '}{s}</button>)}
            </div>
   </aside>

          <main style={{ flex:1,display:'flex',flexDirection:'column',overflow:'hidden' }}>
            <div style={{ padding:'7px 14px',borderBottom:'1px solid #2d2d45',display:'flex',alignItems:'center',gap:10,background:'#08080f',flexShrink:0 }}>
              <TokenLogo id={pair} size={24}/>
              <div>
                <div style={{ fontWeight:800,fontSize:15 }}>{PAIRS[pair].symbol}</div>
                <div style={{ fontSize:9,color:'#6b7280' }}>{exchange} · {strategy} · {mode}</div>
              </div>
              <div style={{ marginLeft:'auto',textAlign:'right' }}>
                <div style={{ fontWeight:700,fontSize:20,color:'#fff' }}>${prices[pair].price.toFixed(pair==='BTC'?0:2)}</div>
                <div style={{ fontSize:10,color:prices[pair].change>=0?'#a78bfa':'#ff3b5c' }}>{prices[pair].change>=0?'▲':'▼'} {Math.abs(prices[pair].change).toFixed(2)}%</div>
              </div>
            </div>
            <div style={{ flex:1,padding:'10px 14px',background:'#08080f',overflow:'hidden' }}>
              <BinanceChart symbol={PAIRS[pair].binance} pairColor={PAIRS[pair].color} height={'100%'}/>
            </div>
          </main>

          <aside style={{ width:165,borderLeft:'1px solid #2d2d45',background:'#08080f',display:'flex',flexDirection:'column',flexShrink:0,overflowY:'auto',padding:'10px 8px' }}>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:8,color:'#6b7280',letterSpacing:1,marginBottom:7,textTransform:'uppercase' }}>Session</div>
              <div style={{ background:sess.color+'15',border:`1px solid ${sess.color}30`,borderRadius:7,padding:'8px 10px' }}>
                <div style={{ fontWeight:700,fontSize:11,color:sess.color }}>{sess.name}</div>
                <div style={{ fontSize:9,color:'#6b7280',marginTop:1 }}>{sess.desc}</div>
                <div style={{ fontSize:8,color:'#4a5568',marginTop:1 }}>{sess.range}</div>
              </div>
            </div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:8,color:'#6b7280',letterSpacing:1,marginBottom:7,textTransform:'uppercase' }}>Rules</div>
              {[['Min R:R','1:3'],['MTF','4TF'],['Max Lev','×50'],['FOMO','OFF'],['Avg Down','OFF']].map(([l,v])=>(
                <div key={l} style={{ display:'flex',justifyContent:'space-between',padding:'3px 0',borderBottom:'1px solid #2d2d45' }}>
                  <span style={{ fontSize:9,color:'#4a5568' }}>{l}</span>
                  <span style={{ fontSize:9,color:'#a78bfa',fontWeight:700 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:8,color:'#6b7280',letterSpacing:1,marginBottom:7,textTransform:'uppercase' }}>Bias</div>
              {Object.entries(PAIRS).map(([id])=>{ const ch=prices[id].change, bias=ch>1?'Bull':ch<-1?'Bear':'Neutral', col=ch>1?'#7c3aed':ch<-1?'#ff3b5c':'#f5a623'; return (
                <div key={id} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'3px 0',borderBottom:'1px solid #2d2d45' }}>
                  <div style={{ display:'flex',alignItems:'center',gap:4 }}><TokenLogo id={id} size={12}/><span style={{ fontSize:9,color:'#6b7280' }}>{id}</span></div>
                  <span style={{ fontSize:9,color:col,fontWeight:700 }}>{bias}</span>
                </div>
              )})}
            </div>
            <div style={{ background:'#0c0c18',border:'1px solid #7c3aed30',borderRadius:7,padding:'9px',textAlign:'center',marginBottom:8,boxShadow:'0 0 12px #7c3aed20' }}>
              <div style={{ fontSize:16,marginBottom:3 }}>⚡</div>
              <div style={{ fontWeight:800,fontSize:10,color:'#a78bfa' }}>Bankr Ready</div>
              <div style={{ fontSize:8,color:'#4a5568',marginTop:2 }}>Auto A+</div>
            </div>
            <button onClick={()=>setShowRoadmap(r=>!r)} style={{ width:'100%',padding:'7px',borderRadius:7,border:`1px solid ${showRoadmap?'#7c3aed60':'#2d2d45'}`,background:showRoadmap?'#7c3aed15':'#0c0c18',color:showRoadmap?'#a78bfa':'#4a5568',cursor:'pointer',fontSize:9,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:5,transition:'all 0.2s' }}>
              🗺️ ROADMAP
            </button>
            {showRoadmap && (
              <div style={{ marginTop:8 }}>
                {PHASES.map((p,i)=>(
                  <div key={i} style={{ marginBottom:8,background:'#08080f',border:`1px solid ${p.color}25`,borderRadius:7,padding:'8px',borderLeft:`2px solid ${p.color}` }}>
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
                <div style={{ textAlign:'center',padding:'6px 0',fontSize:8,color:'#a78bfa',fontWeight:700 }}>🏆 Mission 2031</div>
              </div>
            )}
          </aside>
        </div>
      </div>

      <ChatWidget prices={prices} pair={pair} mode={mode} strategy={strategy} exchange={exchange}/>
      <EthBaseTicker eth={eth}/>
    </>
  )
}
