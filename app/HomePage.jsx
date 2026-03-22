'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const SOCIALS = [
  { icon: '𝕏', label: 'X / Twitter', url: 'https://x.com/xnoelasn', color: '#fff' },
  { icon: '⬡', label: 'Zora', url: 'https://zora.co/@noela_zee', color: '#7c3aed' },
  { icon: '◎', label: 'CMC Community', url: 'https://coinmarketcap.com/community/profile/noelazee', color: '#f0b90b' },
  { icon: '✈', label: 'Telegram', url: 'https://t.me/Noela_zee', color: '#29b6f6' },
]

const FEATURES = [
  {
    icon: '🎯',
    title: 'Sniper Trading',
    desc: 'AI-powered precision entries. BTC · ETH · SOL · BNB. Min 3 confluences. R:R 1:3. Zero FOMO.',
    color: '#7c3aed',
    badge: 'LIVE',
  },
  {
    icon: '🌊',
    title: 'Swing Hunter',
    desc: 'DEX token screening. Filter bad devs. Detect rug pulls before they happen. Auto trade on Base.',
    color: '#3b82f6',
    badge: 'BETA',
  },
  {
    icon: '📢',
    title: 'Telegram Alerts',
    desc: 'Real-time signal notifications. Order filled, TP hit, SL hit, dev alerts, influencer buys.',
    color: '#29b6f6',
    badge: 'LIVE',
  },
  {
    icon: '🗺️',
    title: 'Roadmap 2031',
    desc: 'Phase 1 complete. TikTok live trading, institutional API, autonomous agent funding — coming.',
    color: '#f5a623',
    badge: '2025–2031',
  },
]

const STATS = [
  { label: 'Pairs Monitored', value: '4+' },
  { label: 'Exchanges', value: '3' },
  { label: 'Min R:R', value: '1:3' },
  { label: 'Max Leverage', value: '×50' },
]

function FloatingParticle({ style }) {
  return <div style={{ position: 'absolute', borderRadius: '50%', background: 'radial-gradient(circle,#7c3aed40,transparent)', filter: 'blur(20px)', pointerEvents: 'none', ...style }}/>
}

export default function HomePage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [hoveredFeature, setHoveredFeature] = useState(null)
  const [scrollY, setScrollY] = useState(0)
  const heroRef = useRef(null)

  useEffect(() => {
    setMounted(true)
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!mounted) return null

  return (
    <div style={{
      minHeight: '100vh',
      background: '#050508',
      fontFamily: "'Syne', sans-serif",
      color: '#e2e8f0',
      overflowX: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: #7c3aed40; border-radius: 3px; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-16px)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes glow { 0%,100%{box-shadow:0 0 20px #7c3aed40} 50%{box-shadow:0 0 60px #7c3aed80,0 0 100px #3b82f640} }
        @keyframes scan { 0%{transform:translateY(-100%)} 100%{transform:translateY(600%)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .launch-btn:hover { transform: scale(1.04) !important; box-shadow: 0 0 40px #7c3aed80 !important; }
        .feature-card:hover { border-color: var(--card-color) !important; transform: translateY(-4px) !important; }
        .social-btn:hover { transform: translateY(-2px) !important; opacity: 1 !important; }
      `}</style>

      
      <div style={{ position:'fixed', inset:0, backgroundImage:'linear-gradient(#7c3aed06 1px,transparent 1px),linear-gradient(90deg,#7c3aed06 1px,transparent 1px)', backgroundSize:'48px 48px', pointerEvents:'none', zIndex:0 }}/>

      
      <FloatingParticle style={{ width:400, height:400, top:'-10%', left:'-5%', animation:'float 8s ease-in-out infinite' }}/>
      <FloatingParticle style={{ width:300, height:300, top:'30%', right:'-8%', background:'radial-gradient(circle,#3b82f620,transparent)', animation:'float 10s ease-in-out infinite reverse' }}/>
      <FloatingParticle style={{ width:500, height:500, bottom:'10%', left:'20%', animation:'float 12s ease-in-out infinite' }}/>

      
      <header style={{ position:'sticky', top:0, zIndex:100, height:56, borderBottom:'1px solid #2d2d4540', background:'#05050890', backdropFilter:'blur(20px)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,#7c3aed,#3b82f6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, boxShadow:'0 0 16px #7c3aed60', animation:'glow 3s ease-in-out infinite' }}>🎯</div>
          <span style={{ fontWeight:800, fontSize:18, color:'#fff', letterSpacing:1 }}>NOELA</span>
          <span style={{ fontSize:8, padding:'2px 7px', borderRadius:4, background:'#7c3aed20', color:'#a78bfa', border:'1px solid #7c3aed30', letterSpacing:1 }}>SNIPER</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <a href="https://x.com/xnoelasn" target="_blank" rel="noreferrer" style={{ color:'#6b7280', fontSize:12, textDecoration:'none', transition:'color 0.2s' }} onMouseEnter={e=>e.target.style.color='#fff'} onMouseLeave={e=>e.target.style.color='#6b7280'}>@xnoelasn</a>
          <button onClick={()=>router.push('/app')} style={{ padding:'7px 18px', borderRadius:8, border:'1px solid #7c3aed60', background:'#7c3aed20', color:'#a78bfa', cursor:'pointer', fontSize:11, fontWeight:700, letterSpacing:1, transition:'all 0.2s' }} onMouseEnter={e=>{e.target.style.background='#7c3aed';e.target.style.color='#fff'}} onMouseLeave={e=>{e.target.style.background='#7c3aed20';e.target.style.color='#a78bfa'}}>
            LAUNCH APP →
          </button>
        </div>
      </header>

      
      <section ref={heroRef} style={{ position:'relative', zIndex:1, minHeight:'88vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'60px 24px 40px' }}>

        
        <div style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'5px 14px', borderRadius:20, border:'1px solid #7c3aed40', background:'#7c3aed10', marginBottom:28, animation:'fadeUp 0.6s ease both' }}>
          <span style={{ width:7, height:7, borderRadius:'50%', background:'#7c3aed', display:'inline-block', animation:'pulse 2s infinite', boxShadow:'0 0 8px #7c3aed' }}/>
          <span style={{ fontSize:10, color:'#a78bfa', letterSpacing:2, fontWeight:700 }}>LIVE ON BASE · POWERED BY BANKR + CLAUDE</span>
        </div>

        
        <div style={{ position:'relative', marginBottom:32, animation:'float 5s ease-in-out infinite' }}>
          <div style={{ width:140, height:140, borderRadius:'50%', border:'2px solid #7c3aed50', display:'flex', alignItems:'center', justifyContent:'center', background:'radial-gradient(circle,#1a053380,#05050880)', animation:'glow 3s ease-in-out infinite', overflow:'hidden', margin:'0 auto' }}>
            <div style={{ position:'absolute', width:'100%', height:'3px', background:'linear-gradient(90deg,transparent,#7c3aed60,transparent)', animation:'scan 2.5s linear infinite' }}/>
            <img src="/noela-logo.png" alt="NOELA" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} onError={e=>{ e.target.style.display='none'; e.target.nextSibling.style.display='flex' }}/>
            <div style={{ display:'none', width:'100%', height:'100%', alignItems:'center', justifyContent:'center', fontSize:56 }}>🎯</div>
          </div>
          <div style={{ position:'absolute', inset:-10, borderRadius:'50%', border:'1px solid #7c3aed30', borderTopColor:'#7c3aed', animation:'spin 4s linear infinite' }}/>
          <div style={{ position:'absolute', inset:-20, borderRadius:'50%', border:'1px solid #3b82f620', borderBottomColor:'#3b82f6', animation:'spin 7s linear infinite reverse' }}/>
        </div>

        
        <h1 style={{ fontSize:'clamp(40px,8vw,80px)', fontWeight:800, lineHeight:1.1, marginBottom:16, animation:'fadeUp 0.7s 0.1s ease both', opacity:0 }}>
          <span style={{ background:'linear-gradient(135deg,#fff 30%,#a78bfa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>NOELA</span>
          <br/>
          <span style={{ fontSize:'0.55em', fontWeight:700, letterSpacing:6, color:'#6b7280', WebkitTextFillColor:'#6b7280' }}>SNIPER SYSTEM</span>
        </h1>

        
        <p style={{ fontSize:'clamp(14px,2.5vw,18px)', color:'#9ca3af', maxWidth:520, lineHeight:1.7, marginBottom:12, animation:'fadeUp 0.7s 0.2s ease both', opacity:0 }}>
          AI-powered precision trading agent on Base.<br/>
          <span style={{ color:'#a78bfa' }}>Precision</span> over frequency. <span style={{ color:'#60a5fa' }}>Liquidity</span> over indicators. <span style={{ color:'#f472b6' }}>Patience</span> over impulse.
        </p>

        <p style={{ fontSize:12, color:'#4a5568', fontStyle:'italic', marginBottom:40, animation:'fadeUp 0.7s 0.25s ease both', opacity:0 }}>
          "We don't chase the market. We wait. We execute. We disappear."
        </p>

        
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center', marginBottom:56, animation:'fadeUp 0.7s 0.3s ease both', opacity:0 }}>
          <button onClick={()=>router.push('/app')} className="launch-btn" style={{ padding:'14px 36px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#7c3aed,#3b82f6)', color:'#fff', fontSize:14, fontWeight:800, cursor:'pointer', letterSpacing:1, transition:'all 0.3s', boxShadow:'0 4px 24px #7c3aed60' }}>
            🚀 LAUNCH APP
          </button>
          <a href="https://github.com/noelazee/NoelaSn" target="_blank" rel="noreferrer" style={{ padding:'14px 28px', borderRadius:10, border:'1px solid #2d2d45', background:'transparent', color:'#9ca3af', fontSize:14, fontWeight:700, cursor:'pointer', letterSpacing:1, textDecoration:'none', transition:'all 0.3s', display:'inline-flex', alignItems:'center', gap:8 }} onMouseEnter={e=>{e.target.style.borderColor='#7c3aed60';e.target.style.color='#a78bfa'}} onMouseLeave={e=>{e.target.style.borderColor='#2d2d45';e.target.style.color='#9ca3af'}}>
            ★ GitHub
          </a>
        </div>

        
        <div style={{ display:'flex', gap:0, border:'1px solid #2d2d45', borderRadius:12, overflow:'hidden', background:'#0c0c18', animation:'fadeUp 0.7s 0.4s ease both', opacity:0 }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ padding:'14px 28px', textAlign:'center', borderRight: i < STATS.length-1 ? '1px solid #2d2d45' : 'none' }}>
              <div style={{ fontSize:22, fontWeight:800, color:'#fff', lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:9, color:'#4a5568', marginTop:4, letterSpacing:1, textTransform:'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      
      <div style={{ position:'relative', zIndex:1, borderTop:'1px solid #2d2d45', borderBottom:'1px solid #2d2d45', background:'#08080f', height:36, display:'flex', alignItems:'center', overflow:'hidden' }}>
        <div style={{ display:'flex', gap:48, animation:'marquee 20s linear infinite', whiteSpace:'nowrap' }}>
          {[...Array(2)].map((_, ri) => (
            ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', '🎯 NOELA SNIPER', 'PRECISION OVER FREQUENCY', 'BUILT ON BASE', 'POWERED BY BANKR + CLAUDE', 'LESS TRADES = BETTER TRADES'].map((t, i) => (
              <span key={`${ri}-${i}`} style={{ fontSize:10, color: t.startsWith('🎯') || t === 'PRECISION OVER FREQUENCY' || t === 'LESS TRADES = BETTER TRADES' ? '#a78bfa' : '#4a5568', letterSpacing:2, fontWeight:700 }}>{t}</span>
            ))
          ))}
        </div>
      </div>

      
      <section style={{ position:'relative', zIndex:1, padding:'80px 24px', maxWidth:1100, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <div style={{ fontSize:10, color:'#7c3aed', letterSpacing:3, fontWeight:700, marginBottom:12, textTransform:'uppercase' }}>What NOELA Does</div>
          <h2 style={{ fontSize:'clamp(28px,5vw,48px)', fontWeight:800, color:'#fff' }}>Built for Smart Money Traders</h2>
          <p style={{ fontSize:14, color:'#6b7280', marginTop:12 }}>Not for gamblers. For those who think like institutions.</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:16 }}>
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="feature-card"
              onMouseEnter={()=>setHoveredFeature(i)}
              onMouseLeave={()=>setHoveredFeature(null)}
              style={{
                '--card-color': f.color,
                padding:'24px',
                borderRadius:12,
                border:`1px solid ${hoveredFeature===i ? f.color+'60' : '#2d2d45'}`,
                background: hoveredFeature===i ? `${f.color}08` : '#0c0c18',
                cursor:'pointer',
                transition:'all 0.3s',
                position:'relative',
                overflow:'hidden',
              }}
            >
              <div style={{ position:'absolute', top:12, right:12, fontSize:9, padding:'2px 8px', borderRadius:20, background:`${f.color}20`, color:f.color, fontWeight:700, letterSpacing:1 }}>{f.badge}</div>
              <div style={{ fontSize:32, marginBottom:14 }}>{f.icon}</div>
              <div style={{ fontWeight:800, fontSize:16, color:'#fff', marginBottom:8 }}>{f.title}</div>
              <div style={{ fontSize:12, color:'#6b7280', lineHeight:1.7 }}>{f.desc}</div>
              {hoveredFeature===i && <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'2px', background:`linear-gradient(90deg,transparent,${f.color},transparent)` }}/>}
            </div>
          ))}
        </div>
      </section>

      
      <section style={{ position:'relative', zIndex:1, padding:'40px 24px 80px', maxWidth:1100, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ fontSize:10, color:'#7c3aed', letterSpacing:3, fontWeight:700, marginBottom:12, textTransform:'uppercase' }}>Session Model</div>
          <h2 style={{ fontSize:'clamp(24px,4vw,40px)', fontWeight:800, color:'#fff' }}>Asia builds. London traps. New York delivers.</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:12 }}>
          {[
            { name:'Asia', time:'07:00–15:00 WIB', phase:'Accumulation', color:'#9b5de5', emoji:'🌏' },
            { name:'London', time:'14:00–22:00 WIB', phase:'Manipulation', color:'#f5a623', emoji:'🇬🇧' },
            { name:'New York', time:'20:30+ WIB', phase:'Expansion', color:'#4d9fff', emoji:'🗽' },
          ].map((s,i) => (
            <div key={i} style={{ padding:'20px', borderRadius:10, border:`1px solid ${s.color}30`, background:`${s.color}08`, textAlign:'center' }}>
              <div style={{ fontSize:28, marginBottom:8 }}>{s.emoji}</div>
              <div style={{ fontWeight:800, fontSize:14, color:s.color, marginBottom:4 }}>{s.name}</div>
              <div style={{ fontSize:10, color:'#4a5568', marginBottom:6, letterSpacing:1 }}>{s.time}</div>
              <div style={{ fontSize:11, color:'#6b7280', padding:'3px 10px', borderRadius:20, background:`${s.color}15`, display:'inline-block' }}>{s.phase}</div>
            </div>
          ))}
        </div>
      </section>

      
      <section style={{ position:'relative', zIndex:1, padding:'20px 24px 80px', maxWidth:1100, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ fontSize:10, color:'#7c3aed', letterSpacing:3, fontWeight:700, marginBottom:12, textTransform:'uppercase' }}>Roadmap</div>
          <h2 style={{ fontSize:'clamp(24px,4vw,40px)', fontWeight:800, color:'#fff' }}>2025 → 2031</h2>
          <p style={{ fontSize:13, color:'#6b7280', marginTop:8 }}>We are not building a bot. We are building a standard.</p>
        </div>
        <div style={{ position:'relative', padding:'0 12px' }}>
          <div style={{ position:'absolute', top:20, left:0, right:0, height:2, background:'#2d2d45' }}/>
          <div style={{ position:'absolute', top:20, left:0, width:'20%', height:2, background:'linear-gradient(90deg,#7c3aed,#3b82f6)', boxShadow:'0 0 8px #7c3aed' }}/>
          <div style={{ display:'flex', justifyContent:'space-between', gap:8 }}>
            {[
              { icon:'✅', name:'GENESIS', color:'#7c3aed', done:true },
              { icon:'🔜', name:'GROWTH', color:'#3b82f6', done:false },
              { icon:'🚀', name:'SCALE', color:'#f5a623', done:false },
              { icon:'🌐', name:'DOMINANCE', color:'#9b5de5', done:false },
              { icon:'🏆', name:'ENDGAME', color:'#ff6b6b', done:false },
            ].map((p,i) => (
              <div key={i} style={{ flex:1, textAlign:'center', paddingTop:36 }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background:p.done?`linear-gradient(135deg,${p.color},#3b82f6)`:'#1c1c2a', border:`2px solid ${p.color}60`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, margin:'0 auto 8px', position:'relative', top:-36+16 }}>{p.icon}</div>
                <div style={{ fontSize:9, fontWeight:800, color:p.done?p.color:'#4a5568', letterSpacing:1 }}>{p.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      
      <footer style={{ position:'relative', zIndex:1, borderTop:'1px solid #2d2d45', background:'#08080f', padding:'48px 24px 32px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>

          
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:40, marginBottom:48 }}>
            
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                <div style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,#7c3aed,#3b82f6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🎯</div>
                <span style={{ fontWeight:800, fontSize:18, color:'#fff', letterSpacing:1 }}>NOELA</span>
              </div>
              <p style={{ fontSize:12, color:'#4a5568', lineHeight:1.8, maxWidth:220 }}>
                AI-powered sniper trading agent. Built on Base. Powered by Bankr + Claude. MIT License.
              </p>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:14 }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:'#7c3aed', animation:'pulse 2s infinite' }}/>
                <span style={{ fontSize:10, color:'#7c3aed', letterSpacing:1 }}>LIVE · v0-gbot.vercel.app</span>
              </div>
            </div>

            
            <div>
              <div style={{ fontSize:10, color:'#4a5568', letterSpacing:2, marginBottom:16, textTransform:'uppercase', fontWeight:700 }}>Resources</div>
              {[
                { label:'Launch App', url:'/app' },
                { label:'GitHub Repo', url:'https://github.com/noelazee/NoelaSn' },
                { label:'NoE Sniper Skill', url:'https://github.com/noelazee/NoelaSn/tree/main/noela-skill' },
                { label:'NoE Swing Skill', url:'https://github.com/noelazee/NoelaSn/tree/main/noela-swing-skill' },
                { label:'Roadmap 2031', url:'https://github.com/noelazee/NoelaSn/blob/main/ROADMAP.md' },
              ].map((l,i) => (
                <a key={i} href={l.url} target={l.url.startsWith('http')?'_blank':'_self'} rel="noreferrer" style={{ display:'block', fontSize:12, color:'#6b7280', textDecoration:'none', marginBottom:8, transition:'color 0.2s' }} onMouseEnter={e=>e.target.style.color='#a78bfa'} onMouseLeave={e=>e.target.style.color='#6b7280'}>{l.label}</a>
              ))}
            </div>

            
            <div>
              <div style={{ fontSize:10, color:'#4a5568', letterSpacing:2, marginBottom:16, textTransform:'uppercase', fontWeight:700 }}>Community</div>
              {SOCIALS.map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noreferrer" className="social-btn" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none', marginBottom:12, opacity:0.7, transition:'all 0.2s' }} onMouseEnter={e=>e.currentTarget.style.opacity='1'} onMouseLeave={e=>e.currentTarget.style.opacity='0.7'}>
                  <div style={{ width:28, height:28, borderRadius:8, background:`${s.color}20`, border:`1px solid ${s.color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:s.color, flexShrink:0 }}>{s.icon}</div>
                  <span style={{ fontSize:12, color:'#9ca3af' }}>{s.label}</span>
                </a>
              ))}
            </div>

            
            <div>
              <div style={{ fontSize:10, color:'#4a5568', letterSpacing:2, marginBottom:16, textTransform:'uppercase', fontWeight:700 }}>Built With</div>
              {[
                { name:'Base Chain', color:'#3b82f6', icon:'🔵' },
                { name:'Bankr Agent API', color:'#f5a623', icon:'⚡' },
                { name:'Anthropic Claude', color:'#7c3aed', icon:'🤖' },
                { name:'Binance WebSocket', color:'#f3ba2f', icon:'📊' },
                { name:'Next.js + Vercel', color:'#fff', icon:'▲' },
              ].map((t,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                  <span style={{ fontSize:12 }}>{t.icon}</span>
                  <span style={{ fontSize:11, color:'#6b7280' }}>{t.name}</span>
                </div>
              ))}
            </div>
          </div>

          
          <div style={{ borderTop:'1px solid #2d2d45', paddingTop:24, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
            <div style={{ fontSize:11, color:'#2d3748' }}>
              © 2025–2031 NOELA by <a href="https://x.com/xnoelasn" target="_blank" rel="noreferrer" style={{ color:'#7c3aed', textDecoration:'none' }}>@noela_zee</a> · MIT License · Built on Base
            </div>
            <div style={{ display:'flex', gap:16 }}>
              {SOCIALS.map((s,i) => (
                <a key={i} href={s.url} target="_blank" rel="noreferrer" style={{ width:30, height:30, borderRadius:8, border:'1px solid #2d2d45', background:'transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'#4a5568', textDecoration:'none', transition:'all 0.2s' }} onMouseEnter={e=>{e.currentTarget.style.borderColor=s.color+'60';e.currentTarget.style.color=s.color}} onMouseLeave={e=>{e.currentTarget.style.borderColor='#2d2d45';e.currentTarget.style.color='#4a5568'}}>
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div style={{ marginTop:20, padding:'12px 16px', borderRadius:8, background:'#0c0c18', border:'1px solid #2d2d45' }}>
            <p style={{ fontSize:10, color:'#2d3748', lineHeight:1.7 }}>
              ⚠️ For educational purposes only. NOELA is an AI assistant and does not provide financial advice. Always DYOR. Never risk more than you can afford to lose. Trading crypto involves significant risk of loss.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
                  }
