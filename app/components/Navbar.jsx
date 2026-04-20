'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { useState } from 'react'
import Link from 'next/link'

export default function Navbar({ onTradingClick, showTrading = false }) {
  const { address, isConnected } = useAccount()
  const [showMenu, setShowMenu] = useState(false)

  function shortenAddr(addr) {
    return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : ''
  }

  const navStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 20px',
    background: '#050508',
    borderBottom: '1px solid #1c1c2a',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  }

  const logoStyle = {
    fontSize: 18,
    fontWeight: 700,
    fontFamily: "'Space Mono', monospace",
    color: '#fff',
    letterSpacing: '0.1em',
  }

  const menuStyle = {
    display: 'flex',
    gap: 16,
    alignItems: 'center',
  }

  const walletButtonStyle = {
    padding: '8px 14px',
    borderRadius: 8,
    border: '1px solid #00f5a030',
    background: 'linear-gradient(135deg, #00f5a015, #0072ff10)',
    color: '#00f5a0',
    fontFamily: "'Space Mono', monospace",
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  }

  const statusDotStyle = {
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#00f5a0',
    marginRight: 6,
    animation: 'pulse 2s infinite',
  }

  return (
    <>
      <nav style={navStyle}>
        <div style={logoStyle}>
          ⚡ NOELA SNIPER
        </div>

        <div style={menuStyle}>
          {isConnected && (
            <button 
              onClick={onTradingClick}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid #7c3aed30',
                background: showTrading ? 'linear-gradient(135deg, #7c3aed30, #7c3aed15)' : 'linear-gradient(135deg, #7c3aed15, #0072ff10)',
                color: showTrading ? '#a78bfa' : '#7c3aed',
                fontFamily: "'Space Mono', monospace",
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {showTrading ? '⚙️ Dashboard' : '📊 Trading'}
            </button>
          )}

          {isConnected && address && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid #1c1c2a',
              background: '#0c0c14',
              fontFamily: "'Space Mono', monospace",
              fontSize: 11,
            }}>
              <span style={statusDotStyle} />
              <span style={{ color: '#4a5568' }}>Connected:</span>
              <span style={{ color: '#00f5a0', fontWeight: 700 }}>
                {shortenAddr(address)}
              </span>
            </div>
          )}

          <ConnectButton.Custom>
            {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
              const ready = mounted
              const connected = ready && account && chain

              return (
                <div style={{ display: 'flex', gap: 8 }}>
                  {!connected ? (
                    <button onClick={openConnectModal} style={walletButtonStyle}>
                      🔗 Connect Wallet
                    </button>
                  ) : (
                    <>
                      <button onClick={openChainModal} style={{
                        ...walletButtonStyle,
                        border: '1px solid #0072ff30',
                        color: '#60a5fa',
                      }}>
                        {chain?.name || 'Chain'}
                      </button>
                      <button onClick={openAccountModal} style={{
                        ...walletButtonStyle,
                        border: '1px solid #ff3b5c30',
                        color: '#ff3b5c',
                      }}>
                        Account
                      </button>
                    </>
                  )}
                </div>
              )
            }}
          </ConnectButton.Custom>
        </div>
      </nav>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </>
  )
}
