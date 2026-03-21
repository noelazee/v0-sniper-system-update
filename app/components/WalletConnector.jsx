'use client'

import { useState, useCallback } from 'react'

const BASE_CHAIN_ID = '0x2105' // 8453
const USDC_BASE     = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

const WALLETS = [
  { id:'okx',      name:'OKX Wallet',    icon:'https://static.okx.com/cdn/assets/imgs/247/58E63FEA47A2D7D1.png', check: () => typeof window !== 'undefined' && !!window.okxwallet },
  { id:'metamask', name:'MetaMask',       icon:'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg', check: () => typeof window !== 'undefined' && !!window.ethereum?.isMetaMask },
  { id:'base',     name:'Coinbase Wallet',icon:'https://avatars.githubusercontent.com/u/18060234', check: () => typeof window !== 'undefined' && !!window.ethereum?.isCoinbaseWallet },
]

function shortenAddr(addr) {
  return addr ? `${addr.slice(0,6)}...${addr.slice(-4)}` : ''
}

export default function WalletConnector({ onConnect, onDisconnect, compact = false }) {
  const [address,     setAddress]     = useState(null)
  const [balance,     setBalance]     = useState(null)
  const [chainOk,     setChainOk]     = useState(false)
  const [connecting,  setConnecting]  = useState(false)
  const [error,       setError]       = useState('')
  const [showPicker,  setShowPicker]  = useState(false)
  const [activeWallet, setActiveWallet] = useState(null)

  const getProvider = (walletId) => {
    if (walletId === 'okx')      return window.okxwallet
    if (walletId === 'metamask') return window.ethereum
    if (walletId === 'base')     return window.ethereum
    return window.ethereum
  }

  const fetchBalance = useCallback(async (addr) => {
    try {
      const res  = await fetch(`/api/transaction/monitor?address=${addr}`)
      const data = await res.json()
      setBalance(data.usdcBalance)
    } catch {}
  }, [])

  const switchToBase = useCallback(async (provider) => {
    try {
      await provider.request({ method:'wallet_switchEthereumChain', params:[{ chainId: BASE_CHAIN_ID }] })
      return true
    } catch (e) {
      if (e.code === 4902) {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId:         BASE_CHAIN_ID,
            chainName:       'Base',
            nativeCurrency:  { name:'Ether', symbol:'ETH', decimals:18 },
            rpcUrls:         ['https://mainnet.base.org'],
            blockExplorerUrls: ['https://basescan.org'],
          }],
        })
        return true
      }
      return false
    }
  }, [])

  const connect = useCallback(async (walletId) => {
    setConnecting(true)
    setError('')
    try {
      const provider = getProvider(walletId)
      if (!provider) throw new Error(`${walletId} not installed`)

      const accounts = await provider.request({ method:'eth_requestAccounts' })
      if (!accounts?.length) throw new Error('No accounts')

      const addr = accounts[0]
      const ok   = await switchToBase(provider)
      setChainOk(ok)
      setAddress(addr)
      setActiveWallet(walletId)
      setShowPicker(false)
      await fetchBalance(addr)
      onConnect?.({ address:addr, walletId, provider })

      provider.on('accountsChanged', accs => {
        if (!accs.length) { disconnect(); return }
        setAddress(accs[0])
        fetchBalance(accs[0])
      })
      provider.on('chainChanged', chainId => setChainOk(chainId === BASE_CHAIN_ID))

    } catch (err) {
      setError(err.message)
    } finally {
      setConnecting(false)
    }
  }, [fetchBalance, switchToBase, onConnect])

  const disconnect = useCallback(() => {
    setAddress(null)
    setBalance(null)
    setChainOk(false)
    setActiveWallet(null)
    onDisconnect?.()
  }, [onDisconnect])

  const availableWallets = WALLETS.filter(w => w.check())

  if (address) {
    return (
      <div style={{ background:'#0c0c14', border:'1px solid #1c1c2a', borderRadius:10, padding: compact?'8px 12px':'12px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom: balance?8:0 }}>
          <div style={{ width:8,height:8,borderRadius:'50%',background:chainOk?'#00f5a0':'#f5a623',animation:'pulse 2s infinite' }}/>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'Space Mono',monospace", fontSize:11, color:'#fff', fontWeight:700 }}>{shortenAddr(address)}</div>
            <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:'#4a5568' }}>{chainOk?'Base Network':'Wrong Network'}</div>
          </div>
          <button onClick={disconnect} style={{ fontFamily:"'Space Mono',monospace", fontSize:9, padding:'3px 8px', borderRadius:5, border:'1px solid #ff3b5c30', background:'#ff3b5c10', color:'#ff3b5c', cursor:'pointer' }}>
            Disconnect
          </button>
        </div>
        {balance !== null && (
          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 0', borderTop:'1px solid #1c1c2a' }}>
            <span style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:'#4a5568' }}>USDC Balance:</span>
            <span style={{ fontFamily:"'Space Mono',monospace", fontSize:11, color:'#00f5a0', fontWeight:700 }}>${balance}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ position:'relative' }}>
      <button
        onClick={() => availableWallets.length === 1 ? connect(availableWallets[0].id) : setShowPicker(!showPicker)}
        disabled={connecting}
        style={{ width:'100%', padding:'10px 16px', borderRadius:10, border:'1px solid #00f5a030', background:'linear-gradient(135deg,#00f5a015,#0072ff10)', color:'#00f5a0', fontFamily:"'Space Mono',monospace", fontSize:12, fontWeight:700, cursor:connecting?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
      >
        {connecting ? '⏳ Connecting...' : '🔗 Connect Wallet'}
      </button>

      {showPicker && !connecting && (
        <div style={{ position:'absolute', top:'100%', left:0, right:0, marginTop:6, background:'#0c0c14', border:'1px solid #1c1c2a', borderRadius:10, overflow:'hidden', zIndex:100 }}>
          {availableWallets.length === 0 ? (
            <div style={{ padding:'12px 14px', fontFamily:"'Space Mono',monospace", fontSize:11, color:'#4a5568', textAlign:'center' }}>
              No wallets detected.<br/>Install OKX or MetaMask.
            </div>
          ) : availableWallets.map(w => (
            <button key={w.id} onClick={()=>connect(w.id)} style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'10px 14px', border:'none', background:'transparent', cursor:'pointer', borderBottom:'1px solid #1c1c2a' }}
              onMouseEnter={e=>e.currentTarget.style.background='#1c1c2a'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <img src={w.icon} width={20} height={20} style={{ borderRadius:4 }} alt={w.name}/>
              <span style={{ fontFamily:"'Space Mono',monospace", fontSize:11, color:'#e2e8f0' }}>{w.name}</span>
            </button>
          ))}
        </div>
      )}

      {error && <div style={{ marginTop:6, fontFamily:"'Space Mono',monospace", fontSize:10, color:'#ff3b5c' }}>⚠ {error}</div>}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  )
}
